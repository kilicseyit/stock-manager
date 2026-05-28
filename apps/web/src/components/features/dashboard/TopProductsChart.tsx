'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TopProductsChartProps {
  data: Array<{ sku: string; movementCount: number }> | undefined;
}

export default function TopProductsChart({ data }: TopProductsChartProps) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        Veri bulunamadı
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-800" />
        <XAxis dataKey="sku" stroke="#a1a1aa" tickLine={false} axisLine={false} />
        <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e4e4e7' }}
          itemStyle={{ fontSize: '11px' }}
        />
        <Bar dataKey="movementCount" name="Hareket Sayısı" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
