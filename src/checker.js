import { readFile, writeFile } from 'node:fs/promises';
import { AppleStore, productName } from './apple.js';
import { availabilityKeys, parseCatalog, parseFulfillment, parseProducts, selectProducts, shortPickupQuote } from './parse.js';
import { configuredNotifiers, notifyAll } from './notify.js';
import { loadState, saveState } from './state.js';

const SETTING_KEYS = ['product', 'model', 'colors', 'capacities', 'postalCode', 'maxDistanceKm', 'emailTo'];

export function defaultSettings(env) {
  return {
    product: env.PRODUCT || 'iphone-duo',
    model: env.MODELS || 'all',
    colors: [],
    capacities: [],
    postalCode: normalizePostalCode(env.POSTAL_CODE),
    maxDistanceKm: Number(env.MAX_DISTANCE_KM || 50),
    emailTo: env.EMAIL_TO || '',
  };
}

export function normalizePostalCode(value) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === 'string').slice(0, 20) : [];
}

export function filterVariants(products, variants, { colors = [], capacities = [] }) {
  if (!variants) return products;
  const byPart = new Map(variants.models.map((m) => [m.partNumber, m]));
  return products.filter((p) => {
    const v = byPart.get(p.partNumber);
    if (!v) return true;
    return (!colors.length || colors.includes(v.color)) && (!capacities.length || capacities.includes(v.capacity));
  });
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export class Checker {
  constructor({ env, settingsFile, stateFile, country, headless, dryRun, log }) {
    this.env = env;
    this.settingsFile = settingsFile;
    this.stateFile = stateFile;
    this.country = country;
    this.headless = headless;
    this.dryRun = dryRun;
    this.log = log;
    this.settings = defaultSettings(env);
    this.products = [];
    this.catalog = [];
    this.variants = null;
    this.productImages = {};
    this.models = [];
    this.lastChecked = null;
    this.error = null;
    this.checking = null;
  }

  async init() {
    if (this.settingsFile) {
      try {
        Object.assign(this.settings, pick(JSON.parse(await readFile(this.settingsFile, 'utf8'))));
      } catch (err) {
        if (err.code !== 'ENOENT') this.log(`ignoring ${this.settingsFile}: ${err.message}`);
      }
    }
    this.store = new AppleStore({ country: this.country, product: this.settings.product, headless: this.headless, log: this.log });
    [this.products] = await Promise.all([this.store.listProducts().catch(() => []), this.loadVariants()]);
  }

  async loadVariants(html) {
    html ??= await this.store.fetchPage().catch((err) => {
      this.log(`catalog: ${err.message}`);
      return null;
    });
    const variants = html ? parseCatalog(html) : null;
    if (!variants) return;
    this.variants = variants;
    Object.assign(this.productImages, variants.productImages);
  }

  async updateSettings(input) {
    const next = { ...this.settings, ...pick(input) };
    next.postalCode = normalizePostalCode(next.postalCode);
    next.maxDistanceKm = Number(next.maxDistanceKm) || this.settings.maxDistanceKm;
    next.emailTo = String(next.emailTo ?? '').trim();
    next.colors = stringList(next.colors);
    next.capacities = stringList(next.capacities);
    const productChanged = next.product !== this.settings.product;
    if (productChanged) {
      Object.assign(next, { model: 'all', colors: [], capacities: [] });
      this.catalog = [];
      this.variants = null;
      this.models = [];
    }
    const changed = SETTING_KEYS.some((k) => JSON.stringify(next[k]) !== JSON.stringify(this.settings[k]));
    this.settings = next;
    if (this.settingsFile) await writeFile(this.settingsFile, JSON.stringify(this.settings, null, 2) + '\n');
    if (productChanged && this.store) {
      this.store.product = next.product;
      await this.loadVariants();
    }
    return changed;
  }

  notifiers() {
    return configuredNotifiers({ ...this.env, EMAIL_TO: this.settings.emailTo });
  }

  snapshot() {
    const products = this.products.length ? [...this.products] : [];
    if (!products.some((p) => p.slug === this.settings.product)) {
      products.push({ slug: this.settings.product, name: productName(this.settings.product) });
    }
    return {
      settings: this.settings,
      products,
      catalog: this.catalog,
      variants: this.variants,
      productImages: this.productImages,
      models: this.models,
      checking: Boolean(this.checking),
      lastChecked: this.lastChecked,
      error: this.error,
      emailEnabled: Boolean(this.env.RESEND_API_KEY),
    };
  }

  check() {
    this.checking ??= this.runCheck().finally(() => {
      this.checking = null;
    });
    return this.checking;
  }

  async runCheck() {
    try {
      await this.checkOnce();
      this.error = null;
    } catch (err) {
      this.error = err.message;
      this.log(`check failed: ${err.message}`);
      await this.store?.close().catch(() => {});
      this.store.browser = undefined;
    }
  }

  async checkOnce() {
    const { product, model, postalCode, maxDistanceKm } = this.settings;
    if (!postalCode) throw new Error('set a postal code');
    const store = this.store;
    store.product = product;
    if (!store.browser) await store.open();

    await store.loadProductPage();
    const catalog = parseProducts(store.html);
    if (catalog.length === 0) throw new Error(`no models found on ${store.productUrl}`);
    this.catalog = catalog;
    await this.loadVariants(store.html);
    const selected = selectProducts(filterVariants(catalog, this.variants, this.settings), model);
    if (selected.length === 0) throw new Error(`no ${productName(product)} model matches`);

    const results = { pickup: [], delivery: [] };
    for (const batch of chunk(selected.map((p) => p.partNumber), 10)) {
      const parsed = parseFulfillment(await store.fetchFulfillment(batch, postalCode), { maxDistanceKm });
      results.pickup.push(...parsed.pickup);
      results.delivery.push(...parsed.delivery);
    }

    this.models = summarize(selected, results);
    this.lastChecked = new Date().toISOString();

    const names = new Map(catalog.map((p) => [p.partNumber, p.name]));
    const current = availabilityKeys(results);
    const previous = await loadState(this.stateFile);
    const fresh = [...current.keys()].filter((k) => !previous.has(k));
    const stores = new Set(results.pickup.map((p) => p.storeName));
    const sample = results.pickup[0]?.quote || results.delivery[0]?.courierText || '';
    this.log(
      `checked ${selected.length} model(s) at ${stores.size} store(s) within ${maxDistanceKm} km of ${postalCode}: ` +
        `${current.size} available, ${fresh.length} new${sample ? ` (e.g. "${sample}")` : ''}`,
    );

    let delivered = true;
    if (fresh.length > 0) {
      const message = buildMessage(fresh.map((k) => current.get(k)), names, store.productUrl);
      this.log(`${message.subject}\n${message.text}`);
      const notifiers = this.notifiers();
      if (!this.dryRun && notifiers.length > 0) delivered = await notifyAll(notifiers, message, this.log);
    }

    // If every notifier failed, leave the new keys out of the saved state so they are retried next check.
    const saved = delivered ? [...current.keys()] : [...current.keys()].filter((k) => previous.has(k));
    if (!this.dryRun) await saveState(this.stateFile, saved);
  }

  async close() {
    await this.store?.close();
  }
}

export function summarize(selected, { pickup, delivery }) {
  return selected.map((p) => {
    const stores = pickup.filter((s) => s.partNumber === p.partNumber && s.available);
    const courier = delivery.find((d) => d.partNumber === p.partNumber);
    const parts = [];
    if (stores.length) {
      parts.push(`Pickup ${stores[0].storeName} ${stores[0].distance}${stores.length > 1 ? ` +${stores.length - 1}` : ''}`);
    }
    if (courier?.courierAvailable) parts.push('2-hr courier');
    const hit = parts.length > 0;
    if (!hit) {
      const quote = shortPickupQuote(pickup.find((s) => s.partNumber === p.partNumber)?.quote);
      if (quote) parts.push(quote);
      if (courier?.shipText) parts.push(courier.shipText);
      if (parts.length === 0) parts.push('Unavailable');
    }
    return { partNumber: p.partNumber, name: p.name, status: parts.join(' · '), hit };
  });
}

export function buildMessage(items, names, url) {
  const lines = items.map((item) => {
    const name = names.get(item.partNumber) ?? item.title ?? item.partNumber;
    if ('storeNumber' in item) return `Pickup: ${name} at ${item.storeName} (${item.distance}) - ${item.quote}`;
    return `2-hr courier: ${name} - ${item.courierText || 'available'}`;
  });
  const first = items[0];
  const firstName = names.get(first.partNumber) ?? first.partNumber;
  const where = 'storeNumber' in first ? `pickup at ${first.storeName}` : '2-hr courier';
  const more = items.length > 1 ? ` (+${items.length - 1} more)` : '';
  return { subject: `In stock: ${firstName}, ${where}${more}`, text: lines.join('\n'), url };
}

function pick(obj) {
  return Object.fromEntries(Object.entries(obj ?? {}).filter(([k]) => SETTING_KEYS.includes(k)));
}
