const STORE_AVAILABLE = new Set(['available']);

export function parseProducts(html) {
  const match = html.match(/<script type=application\/json id=metrics>([\s\S]*?)<\/script>/)
    ?? html.match(/<script[^>]*id="?metrics"?[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }
  const products = data?.data?.products ?? [];
  return products
    .filter((p) => p.partNumber && p.name)
    .map((p) => ({ partNumber: p.partNumber, name: p.name, price: p.price?.fullPrice ?? null }))
    .sort((a, b) => storageGb(a.name) - storageGb(b.name) || a.name.localeCompare(b.name));
}

function storageGb(name) {
  const m = name.match(/(\d+)\s*(GB|TB)/i);
  if (!m) return 0;
  return Number(m[1]) * (m[2].toUpperCase() === 'TB' ? 1024 : 1);
}

export function shortPickupQuote(quote) {
  if (!quote) return '';
  const date = quote.match(/\b(\d{1,2}[./]\d{1,2})\b/);
  if (/check back/i.test(quote) && date) return `Pickup ${date[1]}`;
  if (/unavailable|not available/i.test(quote)) return 'No pickup';
  return quote;
}

export function selectProducts(products, filter) {
  const terms = (filter ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (terms.length === 0 || terms.includes('all')) return products;
  return products.filter((p) => {
    const haystack = `${p.partNumber} ${p.name}`.toLowerCase();
    return terms.some((term) => term.split(/\s+/).every((word) => haystack.includes(word)));
  });
}

export function parseFulfillment(json, { maxDistanceKm = Infinity } = {}) {
  const content = json?.body?.content;
  if (!content) throw new Error('Unexpected fulfillment response shape');

  const pickup = [];
  for (const store of content.pickupMessage?.stores ?? []) {
    const distanceKm = Number(store.storedistance);
    if (Number.isFinite(distanceKm) && distanceKm > maxDistanceKm) continue;
    for (const [partNumber, part] of Object.entries(store.partsAvailability ?? {})) {
      pickup.push({
        partNumber,
        storeNumber: store.storeNumber,
        storeName: store.storeName,
        city: store.city,
        distance: store.storeDistanceWithUnit ?? `${distanceKm} km`,
        available: STORE_AVAILABLE.has(part.pickupDisplay),
        quote: stripHtml(part.pickupSearchQuote ?? part.messageTypes?.regular?.storePickupQuote ?? ''),
        title: part.messageTypes?.regular?.storePickupProductTitle ?? null,
      });
    }
  }

  const delivery = [];
  for (const [partNumber, entry] of Object.entries(content.deliveryMessage ?? {})) {
    const msg = entry?.regular;
    if (!msg || typeof msg !== 'object') continue;
    const courierText = stripHtml(msg.stickyMessageIDL ?? '');
    delivery.push({
      partNumber,
      courierAvailable: msg.idl === true && !/unavailable/i.test(courierText),
      courierText,
      shipText: stripHtml(msg.stickyMessageSTH ?? msg.deliveryOptionMessages?.[0]?.displayName ?? ''),
      buyable: msg.buyability?.isBuyable ?? msg.isBuyable ?? null,
    });
  }

  return { pickup, delivery };
}

export function availabilityKeys({ pickup, delivery }) {
  const keys = new Map();
  for (const p of pickup) if (p.available) keys.set(`pickup:${p.storeNumber}:${p.partNumber}`, p);
  for (const d of delivery) if (d.courierAvailable) keys.set(`courier:${d.partNumber}`, d);
  return keys;
}

function stripHtml(s) {
  return String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function parseCatalog(html) {
  const data = productSelectionData(html);
  if (!data?.products) return null;
  const values = data.displayValues ?? {};
  const images = data.imageDictionary ?? {};
  const variants = (dimension, map) =>
    (values[dimension]?.variantOrder ?? []).map((key) => ({ key, ...map(values[dimension][key] ?? {}, key) }));
  return {
    colors: variants('dimensionColor', (v, key) => ({ name: stripHtml(v.value ?? key), swatch: imgSrc(v.image) })),
    capacities: variants('dimensionCapacity', (v, key) => ({ name: stripHtml(String(v.value ?? key).split('<as-footnote')[0]) })),
    models: data.products.map((p) => ({
      partNumber: p.partNumber,
      color: p.dimensionColor,
      capacity: p.dimensionCapacity,
      image: firstSrc(images[p.imageKey]?.sources?.[0]?.srcSet),
      price: values.prices?.[p.fullPrice]?.amountBeforeTradeIn ?? null,
    })),
    productImages: compareImages(html),
  };
}

function productSelectionData(html) {
  const start = html.indexOf('productSelectionData:', html.indexOf('PRODUCT_SELECTION_BOOTSTRAP'));
  if (start < 0) return null;
  const open = html.indexOf('{', start);
  let depth = 0;
  let inString = false;
  for (let i = open; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try {
        return JSON.parse(html.slice(open, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function compareImages(html) {
  const out = {};
  const re = /https:\/\/store\.storeimages\.cdn-apple\.com\/[^"\s\\]*?\/is\/iphone-compare-(iphone-[a-z0-9-]+?)-\d{6}\?wid=400&(?:amp;)?hei=512[^"\s\\]*/g;
  for (const m of html.matchAll(re)) out[m[1]] ??= m[0].replace(/&amp;/g, '&');
  return out;
}

function imgSrc(html) {
  return html?.match(/src="([^"]+)"/)?.[1].replace(/&amp;/g, '&') ?? null;
}

function firstSrc(srcSet) {
  return srcSet?.split(',')[0].trim().split(/\s+/)[0] ?? null;
}
