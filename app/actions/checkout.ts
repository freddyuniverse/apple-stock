'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { alertSubscriptions } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { ALERT_PASS, ALERT_RADII, TIPS } from '@/lib/products';
import { modelByPartNumber, normalizeZip } from '@/lib/duo';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export async function startTipCheckout(tipId: string) {
  const tip = TIPS.find((t) => t.id === tipId);
  if (!tip) throw new Error('Unknown tip amount');

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    redirect_on_completion: 'never',
    mode: 'payment',
    submit_type: 'donate',
    metadata: { kind: 'tip' },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Tip for findmyduo', description: 'Thanks for keeping the alerts running.' },
          unit_amount: tip.cents,
        },
        quantity: 1,
      },
    ],
  });
  return session.client_secret as string;
}

export type AlertInput = { email: string; partNumber: string; zip: string; radiusMiles: number };

export async function startAlertCheckout(input: AlertInput) {
  const email = String(input.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) throw new Error('Enter a valid email address');
  const model = modelByPartNumber(String(input.partNumber ?? ''));
  if (!model) throw new Error('Unknown iPhone Duo model');
  const zip = normalizeZip(String(input.zip ?? ''));
  if (!zip) throw new Error('Enter a 5-digit US ZIP code');
  const radiusMiles = Number(input.radiusMiles);
  if (!ALERT_RADII.includes(radiusMiles as (typeof ALERT_RADII)[number])) throw new Error('Pick a distance');

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    customer_email: email,
    return_url: `${await origin()}/alerts/confirmed?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { kind: 'alert', partNumber: model.partNumber, zip, radiusMiles: String(radiusMiles) },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: ALERT_PASS.name, description: `${model.name} near ${zip}. ${ALERT_PASS.description}` },
          unit_amount: ALERT_PASS.cents,
        },
        quantity: 1,
      },
    ],
  });

  await db.insert(alertSubscriptions).values({
    email,
    partNumber: model.partNumber,
    modelName: model.name,
    zip,
    radiusMiles,
    stripeSessionId: session.id,
  });

  return session.client_secret as string;
}
