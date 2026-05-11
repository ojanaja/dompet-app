'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Essential', value: 3000000, color: '#3b82f6' }, // blue-500
  { name: 'Lifestyle', value: 1500000, color: '#ec4899' }, // pink-500
  { name: 'Project', value: 800000, color: '#8b5cf6' },    // purple-500
];

export function ExpenseDonutChart() {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
