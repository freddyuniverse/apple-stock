export type FinishId = 'starwhite' | 'nightsky';
export type CapacityId = '256gb' | '512gb' | '1tb' | '2tb';

export const FINISHES: { id: FinishId; name: string; swatch: string; image: string }[] = [
  { id: 'starwhite', name: 'Star White', swatch: '#e9e6e1', image: '/images/duo-star-white.png' },
  { id: 'nightsky', name: 'Night Sky', swatch: '#2b3444', image: '/images/duo-night-sky.png' },
];

export const CAPACITIES: { id: CapacityId; name: string; price: number }[] = [
  { id: '256gb', name: '256GB', price: 2999 },
  { id: '512gb', name: '512GB', price: 3299 },
  { id: '1tb', name: '1TB', price: 3899 },
  { id: '2tb', name: '2TB', price: 4799 },
];

const PART_NUMBERS: Record<FinishId, Record<CapacityId, string>> = {
  starwhite: { '256gb': 'MK244VC/A', '512gb': 'MK264VC/A', '1tb': 'MK284VC/A', '2tb': 'MK2A4VC/A' },
  nightsky: { '256gb': 'MK254VC/A', '512gb': 'MK274VC/A', '1tb': 'MK294VC/A', '2tb': 'MK2C4VC/A' },
};

export const APPLE_DUO_URL = 'https://www.apple.com/ca/shop/buy-iphone/iphone-duo';
export const TRACKER_REPO_URL = 'https://github.com/freddyuniverse/apple-stock';

export function findModel(finish: FinishId, capacity: CapacityId) {
  const f = FINISHES.find((x) => x.id === finish)!;
  const c = CAPACITIES.find((x) => x.id === capacity)!;
  return {
    partNumber: PART_NUMBERS[finish][capacity],
    name: `iPhone Duo ${c.name} ${f.name}`,
    price: c.price,
    image: f.image,
  };
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

const CA_POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export function normalizePostal(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (!CA_POSTAL.test(trimmed)) return null;
  return trimmed.replace(/\s/g, '');
}
