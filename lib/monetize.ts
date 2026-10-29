const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG;

export const TIP_URL = process.env.NEXT_PUBLIC_TIP_URL || 'https://github.com/sponsors/freddyuniverse';
export const HAS_AMAZON_TAG = Boolean(AMAZON_TAG);

export type Retailer = { id: string; name: string; note: string; href: string; affiliate: boolean };

export function retailersFor(modelName: string): Retailer[] {
  const query = encodeURIComponent(modelName);
  const amazon = new URL(`https://www.amazon.ca/s?k=${query}`);
  if (AMAZON_TAG) amazon.searchParams.set('tag', AMAZON_TAG);

  return [
    {
      id: 'amazon',
      name: 'Amazon.ca',
      note: 'Often ships faster than Apple',
      href: amazon.toString(),
      affiliate: HAS_AMAZON_TAG,
    },
    {
      id: 'bestbuy',
      name: 'Best Buy',
      note: 'Check in-store pickup',
      href: `https://www.bestbuy.ca/en-ca/search?search=${query}`,
      affiliate: false,
    },
  ];
}
