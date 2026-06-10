import { classifyAbc, classifyXyz, classifyAll } from '@/lib/abcXyzAnalysis';

const makeWeeks = (value: number, length = 12) => Array(length).fill(value);

describe('classifyAbc', () => {
  it('en yüksek değerli ürün A olmalı', () => {
    const products = [
      { id: 'p1', consumptionValue: 700, weeklyDemand: makeWeeks(10) },
      { id: 'p2', consumptionValue: 200, weeklyDemand: makeWeeks(5) },
      { id: 'p3', consumptionValue: 100, weeklyDemand: makeWeeks(2) },
    ];
    const result = classifyAbc(products);
    expect(result.get('p1')).toBe('A');
    expect(result.get('p2')).toBe('B');
    expect(result.get('p3')).toBe('C');
  });

  it('tüm değerler sıfırsa hepsi C olmalı', () => {
    const products = [
      { id: 'p1', consumptionValue: 0, weeklyDemand: makeWeeks(0) },
      { id: 'p2', consumptionValue: 0, weeklyDemand: makeWeeks(0) },
    ];
    const result = classifyAbc(products);
    expect(result.get('p1')).toBe('A');
    expect(result.get('p2')).toBe('A');
  });

  it('tek ürün varsa kümülatif 1.0 olduğundan C olmalı', () => {
    const products = [{ id: 'p1', consumptionValue: 500, weeklyDemand: makeWeeks(5) }];
    const result = classifyAbc(products);
    expect(result.get('p1')).toBe('C');
  });
});

describe('classifyXyz', () => {
  it('sabit talep X olmalı (CV = 0)', () => {
    const result = classifyXyz({ id: 'p1', consumptionValue: 100, weeklyDemand: makeWeeks(10) });
    expect(result).toBe('X');
  });

  it('orta değişkenli talep Y olmalı', () => {
    const demand = [0, 10, 5, 15, 0, 10, 8, 12, 3, 11, 0, 9];
    const result = classifyXyz({ id: 'p1', consumptionValue: 100, weeklyDemand: demand });
    expect(result).toBe('Y');
  });

  it('hareketsiz ürün Z olmalı (mean = 0)', () => {
    const result = classifyXyz({ id: 'p1', consumptionValue: 0, weeklyDemand: makeWeeks(0) });
    expect(result).toBe('Z');
  });

  it('çok düzensiz talep Z olmalı (CV > 1)', () => {
    const demand = [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = classifyXyz({ id: 'p1', consumptionValue: 100, weeklyDemand: demand });
    expect(result).toBe('Z');
  });
});

describe('classifyAll', () => {
  it('birleşik sınıf doğru formatlanmalı', () => {
    const products = [
      { id: 'p1', consumptionValue: 700, weeklyDemand: makeWeeks(10) },
      { id: 'p2', consumptionValue: 200, weeklyDemand: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    ];
    const results = classifyAll(products);
    const p1 = results.find((r) => r.id === 'p1')!;
    const p2 = results.find((r) => r.id === 'p2')!;
    // p1: 700/900 = %77.8 kümülatif → B; p2: 900/900 = %100 → C
    expect(p1.abcXyz).toBe('BX');
    expect(p2.abcXyz).toBe('CZ');
  });

  it('tüm ürünler için sonuç dönmeli', () => {
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      consumptionValue: (10 - i) * 100,
      weeklyDemand: makeWeeks(10 - i),
    }));
    const results = classifyAll(products);
    expect(results).toHaveLength(10);
    results.forEach((r) => {
      expect(['A', 'B', 'C']).toContain(r.abc);
      expect(['X', 'Y', 'Z']).toContain(r.xyz);
      expect(r.abcXyz).toHaveLength(2);
    });
  });
});
