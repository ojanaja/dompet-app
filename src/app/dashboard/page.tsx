import { GlassCard } from '@/components/layout/GlassCard';
import { ExpenseDonutChart } from '@/components/charts/ExpenseDonutChart';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Summary Widget */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-1">Total Pengeluaran Bulan Ini</h2>
        <div className="text-3xl font-bold text-slate-800">Rp 5.300.000</div>
      </GlassCard>

      {/* Chart Widget */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-4">Distribusi Anggaran</h2>
        <ExpenseDonutChart />
        
        {/* Legend Custom */}
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs text-slate-600">Essential</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span className="text-xs text-slate-600">Lifestyle</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-xs text-slate-600">Project</span></div>
        </div>
      </GlassCard>
    </div>
  );
}
