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

interface LocationOccupancyChartProps {
  data: Array<{ name: string; rate: number }> | undefined;
}

export default function LocationOccupancyChart({ data }: LocationOccupancyChartProps) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        Lokasyon kaydı bulunamadı
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" className="dark:stroke-zinc-800" />
        <XAxis type="number" stroke="#a1a1aa" domain={[0, 100]} tickLine={false} axisLine={false} />
        <YAxis dataKey="name" type="category" stroke="#a1a1aa" tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e4e4e7' }}
          itemStyle={{ fontSize: '11px' }}
        />
        <Bar dataKey="rate" name="Doluluk Oranı (%)" fill="#ec4899" radius={[0, 4, 4, 0]} maxBarSize={15} />
      </BarChart>
    </ResponsiveContainer>
  );
}
