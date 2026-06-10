export type AbcClass = 'A' | 'B' | 'C';
export type XyzClass = 'X' | 'Y' | 'Z';

export interface ProductInput {
  id: string;
  consumptionValue: number;
  weeklyDemand: number[];
}

export interface ClassificationResult {
  id: string;
  abc: AbcClass;
  xyz: XyzClass;
  abcXyz: string;
}

export function classifyAbc(products: ProductInput[]): Map<string, AbcClass> {
  const grandTotal = products.reduce((s, p) => s + p.consumptionValue, 0);
  const sorted = [...products].sort((a, b) => b.consumptionValue - a.consumptionValue);

  let cumulative = 0;
  const result = new Map<string, AbcClass>();
  for (const p of sorted) {
    cumulative += grandTotal > 0 ? p.consumptionValue / grandTotal : 0;
    result.set(p.id, cumulative <= 0.7 ? 'A' : cumulative <= 0.9 ? 'B' : 'C');
  }
  return result;
}

export function classifyXyz(product: ProductInput): XyzClass {
  const weeks = product.weeklyDemand;
  const mean = weeks.reduce((s, v) => s + v, 0) / weeks.length;
  if (mean === 0) return 'Z';
  const variance = weeks.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / weeks.length;
  const cv = Math.sqrt(variance) / mean;
  return cv <= 0.5 ? 'X' : cv <= 1.0 ? 'Y' : 'Z';
}

export function classifyAll(products: ProductInput[]): ClassificationResult[] {
  const abcMap = classifyAbc(products);
  return products.map((p) => {
    const abc = abcMap.get(p.id) ?? 'C';
    const xyz = classifyXyz(p);
    return { id: p.id, abc, xyz, abcXyz: `${abc}${xyz}` };
  });
}
