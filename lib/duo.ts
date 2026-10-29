export type FinishId = 'starwhite' | 'nightsky';
export type CapacityId = '256gb' | '512gb' | '1tb' | '2tb';

export const FINISHES: { id: FinishId; name: string; swatch: string; image: string }[] = [
  { id: 'starwhite', name: 'Star White', swatch: '#e9e6e1', image: '/images/duo-star-white.png' },
  { id: 'nightsky', name: 'Night Sky', swatch: '#2b3444', image: '/images/duo-night-sky.png' },
];

export const CAPACITIES: { id: CapacityId; name: string; price: number }[] = [
  { id: '256gb', name: '256GB', price: 1999 },
  { id: '512gb', name: '512GB', price: 2199 },
  { id: '1tb', name: '1TB', price: 2599 },
  { id: '2tb', name: '2TB', price: 3299 },
];

const PART_NUMBERS: Record<FinishId, Record<CapacityId, string>> = {
  starwhite: { '256gb': 'MK244LL/A', '512gb': 'MK264LL/A', '1tb': 'MK284LL/A', '2tb': 'MK2A4LL/A' },
  nightsky: { '256gb': 'MK254LL/A', '512gb': 'MK274LL/A', '1tb': 'MK294LL/A', '2tb': 'MK2C4LL/A' },
};

export const APPLE_DUO_URL = 'https://www.apple.com/shop/buy-iphone/iphone-duo';
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const US_ZIP = /^(\d{5})(?:-\d{4})?$/;

export function normalizeZip(value: string) {
  return US_ZIP.exec(value.trim())?.[1] ?? null;
}

export function milesToKm(miles: number) {
  return Math.round(miles * 1.609344);
}

export function modelByPartNumber(partNumber: string) {
  for (const f of FINISHES) {
    for (const c of CAPACITIES) {
      if (PART_NUMBERS[f.id][c.id] === partNumber) return findModel(f.id, c.id);
    }
  }
  return null;
}
