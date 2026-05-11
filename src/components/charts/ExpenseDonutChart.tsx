'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type ChartDataItem = {
  name: string;
  value: number;
  color: string;
};

interface ExpenseDonutChartProps {
  data: ChartDataItem[];
}

export function ExpenseDonutChart({ data }: ExpenseDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-muted text-sm">
        <p>Belum ada data pengeluaran</p>
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => `Rp${Number(value).toLocaleString('id-ID')}`}
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
