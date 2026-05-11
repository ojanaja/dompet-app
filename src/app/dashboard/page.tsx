import { GlassCard } from '@/components/layout/GlassCard';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { fetchDashboardDataAction } from '@/actions/dashboard.actions';

export default async function DashboardPage() {
  const result = await fetchDashboardDataAction();

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <DashboardContent data={result.success ? result.data! : null} />
    </div>
  );
}
