'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CategoryDistributionChartProps {
  data: Array<{ name: string; value: number }> | undefined;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
        Ürün dağılımı yok
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip itemStyle={{ fontSize: '11px' }} />
        <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
