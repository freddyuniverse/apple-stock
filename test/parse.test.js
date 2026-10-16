import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { availabilityKeys, parseCatalog, parseFulfillment, parseProducts, selectProducts, shortPickupQuote } from '../src/parse.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const catalog = [
  { partNumber: 'MK244VC/A', name: 'iPhone Duo 256GB Star White', price: 2999 },
  { partNumber: 'MK254VC/A', name: 'iPhone Duo 256GB Night Sky', price: 2999 },
  { partNumber: 'MK274VC/A', name: 'iPhone Duo 512GB Night Sky', price: 3299 },
];

test('parseProducts reads the metrics product list', () => {
  const html = `<script type=application/json id=metrics>${JSON.stringify({ data: { products: [{ sku: 'MK244', partNumber: 'MK244VC/A', price: { fullPrice: 2999 }, name: 'iPhone Duo 256GB Star White' }] } })}</script>`;
  assert.deepEqual(parseProducts(html), [{ partNumber: 'MK244VC/A', name: 'iPhone Duo 256GB Star White', price: 2999 }]);
  assert.deepEqual(parseProducts('<html></html>'), []);
  const many = { data: { products: ['iPhone Duo 1TB Star White', 'iPhone Duo 256GB Night Sky', 'iPhone Duo 2TB Night Sky', 'iPhone Duo 512GB Star White'].map((name, i) => ({ partNumber: `P${i}`, name })) } };
  assert.deepEqual(parseProducts(`<script type=application/json id=metrics>${JSON.stringify(many)}</script>`).map((p) => p.name.split(' ')[2]), ['256GB', '512GB', '1TB', '2TB']);
});

test('selectProducts matches all, part numbers and name words', () => {
  assert.equal(selectProducts(catalog, 'all').length, 3);
  assert.equal(selectProducts(catalog, '').length, 3);
  assert.deepEqual(selectProducts(catalog, 'mk244vc/a').map((p) => p.partNumber), ['MK244VC/A']);
  assert.deepEqual(selectProducts(catalog, 'night sky').map((p) => p.partNumber), ['MK254VC/A', 'MK274VC/A']);
  assert.deepEqual(selectProducts(catalog, '256GB Night Sky, 512GB').map((p) => p.partNumber), ['MK254VC/A', 'MK274VC/A']);
});

test('unavailable iPhone Duo response yields no availability', () => {
  const parsed = parseFulfillment(fixture('duo-unavailable.json'));
  assert.equal(parsed.pickup.length, 80);
  assert.equal(parsed.delivery.length, 8);
  assert.ok(parsed.pickup.every((p) => !p.available));
  assert.match(parsed.pickup[0].quote, /Check back for availability/);
  assert.ok(parsed.delivery.every((d) => !d.courierAvailable));
  assert.equal(parsed.delivery.find((d) => d.partNumber === 'MK294VC/A').shipText, 'Ships 22 Jan');
  assert.equal(availabilityKeys(parsed).size, 0);
});

test('in-stock pickup is detected per store and distance filter applies', () => {
  const parsed = parseFulfillment(fixture('iphone17-pickup-available.json'));
  const eaton = parsed.pickup.filter((p) => p.storeName === 'Eaton Centre');
  assert.ok(eaton.some((p) => p.available && p.quote === 'Available Today'));
  assert.ok(eaton.some((p) => !p.available && p.quote === 'Currently unavailable'));
  assert.ok(availabilityKeys(parsed).has('pickup:R121:MG6A4VC/A'));

  const near = parseFulfillment(fixture('iphone17-pickup-available.json'), { maxDistanceKm: 5 });
  assert.deepEqual([...new Set(near.pickup.map((p) => p.storeName))], ['Eaton Centre']);
});

test('2-hr courier availability is keyed per part', () => {
  const json = {
    body: {
      content: {
        pickupMessage: { stores: [] },
        deliveryMessage: {
          geoEnabled: false,
          'MK244VC/A': { regular: { idl: true, stickyMessageIDL: 'Get it in 2 hours', stickyMessageSTH: 'In stock' } },
          'MK254VC/A': { regular: { idl: false, stickyMessageIDL: 'Unavailable for 2-hr delivery' } },
        },
      },
    },
  };
  const keys = availabilityKeys(parseFulfillment(json));
  assert.deepEqual([...keys.keys()], ['courier:MK244VC/A']);
});

test('parseFulfillment rejects unexpected responses', () => {
  assert.throws(() => parseFulfillment({ head: {} }), /Unexpected/);
});

test('summarize reports nearest pickup store, courier and fallback text', async () => {
  const { summarize, buildMessage } = await import('../src/checker.js');
  const selected = [
    { partNumber: 'A', name: 'iPhone Duo 256GB Star White' },
    { partNumber: 'B', name: 'iPhone Duo 256GB Night Sky' },
  ];
  const results = {
    pickup: [
      { partNumber: 'A', storeName: 'Eaton Centre', distance: '1.23 km', available: true, quote: 'Available Today' },
      { partNumber: 'A', storeName: 'Yorkdale', distance: '10.62 km', available: true, quote: 'Available Today' },
      { partNumber: 'B', storeName: 'Eaton Centre', distance: '1.23 km', available: false, quote: 'Check back for availability on 10.24' },
    ],
    delivery: [
      { partNumber: 'A', courierAvailable: true, shipText: 'In stock' },
      { partNumber: 'B', courierAvailable: false, shipText: 'Ships 22 Jan' },
    ],
  };
  assert.deepEqual(summarize(selected, results).map((m) => [m.status, m.hit]), [
    ['Pickup Eaton Centre 1.23 km +1 · 2-hr courier', true],
    ['Pickup 10.24 · Ships 22 Jan', false],
  ]);
  const msg = buildMessage([{ ...results.pickup[0], storeNumber: 'R121' }], new Map([['A', selected[0].name]]), 'https://x');
  assert.equal(msg.subject, 'In stock: iPhone Duo 256GB Star White, pickup at Eaton Centre');
});

test('shortPickupQuote compresses Apple pickup messages', () => {
  assert.equal(shortPickupQuote('Check back for availability on 10.24'), 'Pickup 10.24');
  assert.equal(shortPickupQuote('Currently unavailable'), 'No pickup');
  assert.equal(shortPickupQuote('Available Today'), 'Available Today');
  assert.equal(shortPickupQuote(undefined), '');
});

test('parseCatalog reads colours, capacities, images and prices', async () => {
  const { filterVariants } = await import('../src/checker.js');
  const c = parseCatalog(readFileSync(new URL('./fixtures/duo-page.html', import.meta.url), 'utf8'));
  assert.deepEqual(c.colors.map((x) => [x.key, x.name]), [['starwhite', 'Star White'], ['nightsky', 'Night Sky']]);
  assert.match(c.colors[0].swatch, /^https:\/\/store\.storeimages\.cdn-apple\.com\/.*iphone-duo-finish-star-white.*&hei=/);
  assert.deepEqual(c.capacities.map((x) => x.name), ['256GB', '512GB', '1TB', '2TB']);
  assert.equal(c.models.length, 8);
  const m = c.models.find((x) => x.partNumber === 'MK244VC/A');
  assert.deepEqual([m.color, m.capacity, m.price], ['starwhite', '256gb', 2999]);
  assert.match(m.image, /iphone-duo-finish-select-star-white-202609\?wid=/);
  assert.match(c.productImages['iphone-17'], /iphone-compare-iphone-17-\d{6}\?wid=400&hei=512/);
  assert.equal(parseCatalog('<html></html>'), null);
  const all = c.models.map((x) => ({ partNumber: x.partNumber }));
  assert.equal(filterVariants(all, c, { colors: [], capacities: [] }).length, 8);
  assert.deepEqual(filterVariants(all, c, { colors: ['nightsky'], capacities: ['256gb', '1tb'] }).map((x) => x.partNumber).sort(), ['MK254VC/A', 'MK294VC/A']);
});
