'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MovementTrendChartProps {
  data: Array<{ date: string; IN: number; OUT: number }> | undefined;
}

export default function MovementTrendChart({ data }: MovementTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIN" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOUT" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-800" />
        <XAxis dataKey="date" stroke="#a1a1aa" tickLine={false} axisLine={false} />
        <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            borderColor: '#e4e4e7',
          }}
          itemStyle={{ fontSize: '11px' }}
        />
        <Legend iconType="circle" />
        <Area
          type="monotone"
          dataKey="IN"
          name="Giriş (IN)"
          stroke="#6366f1"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorIN)"
        />
        <Area
          type="monotone"
          dataKey="OUT"
          name="Çıkış (OUT)"
          stroke="#ef4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorOUT)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
