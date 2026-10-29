import pg from 'pg';
import { AppleStore } from './apple.js';
import { availabilityKeys, parseFulfillment } from './parse.js';

const env = process.env;
const log = (msg) => console.log(`[paid-alerts] ${msg}`);
const SITE_URL = env.SITE_URL || 'https://findmyduo.com';
const PICKUP_URL = 'https://www.apple.com/shop/buy-iphone/iphone-duo';

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM || 'findmyduo <onboarding@resend.dev>', to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function buildEmail(sub, items) {
  const stores = items.filter((i) => 'storeNumber' in i);
  const courier = items.find((i) => !('storeNumber' in i));
  const first = stores[0];
  const subject = first
    ? `Your ${sub.model_name} is in stock at ${first.storeName}`
    : `Your ${sub.model_name} is available for 2-hour delivery`;
  const rows = [
    ...stores.map((s) => `<li><strong>${escape(s.storeName)}</strong> (${escape(s.distance)}) &middot; ${escape(s.quote)}</li>`),
    ...(courier ? [`<li><strong>2-hour courier</strong> &middot; ${escape(courier.courierText || 'available')}</li>`] : []),
  ];
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1d1d1f">
      <h1 style="font-size:28px;letter-spacing:-0.02em;margin:0 0 12px">It&rsquo;s here.</h1>
      <p style="font-size:17px;line-height:1.5;color:#6e6e73;margin:0 0 20px">${escape(sub.model_name)} is available near ${escape(sub.zip)} right now. Stock moves fast.</p>
      <ul style="font-size:15px;line-height:1.6;padding-left:20px;margin:0 0 24px">${rows.join('')}</ul>
      <a href="${PICKUP_URL}" style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;font-size:17px;padding:12px 22px;border-radius:980px">Buy on apple.com</a>
      <p style="font-size:12px;color:#86868b;margin-top:32px">You&rsquo;re getting this because you bought findmyduo alerts. <a href="${SITE_URL}" style="color:#86868b">findmyduo</a></p>
    </div>`;
  return { subject, html };
}

async function main() {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  const db = new pg.Pool({ connectionString: env.DATABASE_URL });

  try {
    await db.query(`update alert_subscriptions set status = 'expired' where status = 'active' and expires_at < now()`);
    const { rows: subs } = await db.query(
      `select id, email, part_number, model_name, zip, radius_miles, notified_keys
         from alert_subscriptions where status = 'active' and expires_at > now()`,
    );
    if (subs.length === 0) return log('no active subscriptions');

    // One Apple lookup per ZIP + radius serves everyone who shares them.
    const groups = new Map();
    for (const s of subs) {
      const key = `${s.zip}|${s.radius_miles}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }

    const store = new AppleStore({ country: 'us', product: 'buy-iphone/iphone-duo', log });
    await store.open();
    await store.loadProductPage();

    let sent = 0;
    try {
      for (const group of groups.values()) {
        const { zip, radius_miles } = group[0];
        const results = { pickup: [], delivery: [] };
        try {
          for (const batch of chunk([...new Set(group.map((s) => s.part_number))], 10)) {
            const parsed = parseFulfillment(await store.fetchFulfillment(batch, zip), { maxDistanceKm: radius_miles * 1.609344 });
            results.pickup.push(...parsed.pickup);
            results.delivery.push(...parsed.delivery);
          }
        } catch (err) {
          log(`lookup failed for ${zip}: ${err.message}`);
          continue;
        }

        for (const sub of group) {
          const current = availabilityKeys({
            pickup: results.pickup.filter((p) => p.partNumber === sub.part_number),
            delivery: results.delivery.filter((d) => d.partNumber === sub.part_number),
          });
          const notified = new Set(sub.notified_keys);
          const fresh = [...current.keys()].filter((k) => !notified.has(k));

          if (fresh.length > 0) {
            try {
              const { subject, html } = buildEmail(sub, fresh.map((k) => current.get(k)));
              await sendEmail(sub.email, subject, html);
              sent++;
            } catch (err) {
              log(`email to subscription ${sub.id} failed: ${err.message}`);
              continue;
            }
          }
          // Remember only what's in stock now, so a restock after a sellout alerts again.
          await db.query('update alert_subscriptions set notified_keys = $1 where id = $2', [[...current.keys()], sub.id]);
        }
      }
    } finally {
      await store.close();
    }
    log(`checked ${subs.length} subscription(s) in ${groups.size} area(s), sent ${sent} email(s)`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
