import { chromium } from 'playwright';

const PLATFORM_UA = {
  darwin: 'Macintosh; Intel Mac OS X 10_15_7',
  win32: 'Windows NT 10.0; Win64; x64',
  linux: 'X11; Linux x86_64',
};

// Headless Chromium advertises "HeadlessChrome", which Apple's shield rejects.
function userAgentFor(browserVersion) {
  const major = browserVersion.split('.')[0];
  const platform = PLATFORM_UA[process.platform] ?? PLATFORM_UA.linux;
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;
}

export class AppleStore {
  constructor({ country, product, headless = true, log = () => {} } = {}) {
    this.country = country;
    this.product = product;
    this.headless = headless;
    this.log = log;
  }

  get origin() {
    return 'https://www.apple.com';
  }

  get shopPath() {
    return this.country === 'us' ? '/shop' : `/${this.country}/shop`;
  }

  get productUrl() {
    return `${this.origin}${this.shopPath}/buy-iphone/${this.product}`;
  }

  async open() {
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ['--disable-blink-features=AutomationControlled'],
      ignoreDefaultArgs: ['--enable-automation'],
    });
    await this.newSession();
  }

  async newSession() {
    await this.context?.close().catch(() => {});
    this.context = await this.browser.newContext({ userAgent: userAgentFor(this.browser.version()), locale: 'en-CA' });
    this.page = await this.context.newPage();
  }

  async loadProductPage() {
    const res = await this.page.goto(this.productUrl, { waitUntil: 'load', timeout: 60_000 });
    if (!res || res.status() >= 400) {
      throw new Error(`Product page ${this.productUrl} returned ${res?.status()}`);
    }
    this.html = await this.page.content();
  }

  async listProducts() {
    const res = await fetch(`${this.origin}${this.shopPath}/buy-iphone`, { headers: { 'User-Agent': userAgentFor('130') } });
    if (!res.ok) return [];
    const html = await res.text();
    const prefix = `${this.shopPath}/buy-iphone/`;
    const slugs = new Set();
    for (const m of html.matchAll(new RegExp(`${prefix.replace(/\//g, '\\/')}(iphone-[a-z0-9-]+)`, 'g'))) slugs.add(m[1]);
    return [...slugs].sort().map((slug) => ({ slug, name: productName(slug) }));
  }

  async close() {
    await this.browser?.close();
  }

  async fetchFulfillment(partNumbers, location) {
    const params = new URLSearchParams({ fae: 'true', pl: 'true', 'mts.0': 'regular', location });
    partNumbers.forEach((pn, i) => params.set(`parts.${i}`, pn));
    const path = `${this.shopPath}/fulfillment-messages?${params}`;

    // Apple's bot shield issues a proof-of-work challenge from the product page;
    // requests return 541 until the page script has solved it and set its cookie.
    const deadline = Date.now() + 75_000;
    let retries = 0;
    for (;;) {
      const { status, text } = await this.page.evaluate(async (url) => {
        const r = await fetch(url, { headers: { 'x-aos-ui-fetch-call-1': '1' } });
        return { status: r.status, text: await r.text() };
      }, path);
      if (status === 200) return JSON.parse(text);
      if (Date.now() > deadline) throw new Error(`fulfillment-messages kept returning ${status}`);
      if (Date.now() > deadline - (2 - retries) * 25_000) {
        // First retry reloads the page; second starts over with fresh cookies.
        this.log(`fulfillment-messages returned ${status}; ${retries === 0 ? 'reloading page' : 'starting a fresh session'}`);
        if (retries === 1) await this.newSession();
        await this.loadProductPage();
        retries++;
      }
      await this.page.waitForTimeout(2_000);
    }
  }
}

export function productName(slug) {
  return slug
    .split('-')
    .map((w) => (w === 'iphone' ? 'iPhone' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}
