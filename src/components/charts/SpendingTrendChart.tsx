'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type TrendDataItem = {
  date: string; // Misal: "01 Mei", "02 Mei"
  amount: number;
};

interface SpendingTrendChartProps {
  data: TrendDataItem[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center text-center">
        <p className="text-muted text-sm">Belum ada tren pengeluaran</p>
        <p className="text-muted-foreground text-xs mt-1">Grafik akan terisi setelah ada transaksi keluar.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 10 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 10 }}
            tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => `Rp${Number(value ?? 0).toLocaleString('id-ID')}`}
            labelStyle={{ color: '#888', marginBottom: '4px' }}
            contentStyle={{
              borderRadius: '0.5rem',
              border: '1px solid #333',
              background: '#111',
              color: '#ededed',
              fontSize: '0.75rem',
              padding: '6px 12px',
              boxShadow: 'none',
            }}
            itemStyle={{ color: '#ededed' }}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#ededed" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#111', stroke: '#ededed', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
