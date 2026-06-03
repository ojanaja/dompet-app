import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { fetchDashboardDataAction } from '@/actions/dashboard.actions';

interface DashboardPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const month = searchParams.month ? parseInt(searchParams.month) : undefined;
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  
  const result = await fetchDashboardDataAction(month, year);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <DashboardContent 
        data={result.success ? result.data! : null} 
        currentMonth={month ?? new Date().getMonth() + 1}
        currentYear={year ?? new Date().getFullYear()}
      />
    </div>
  );
}
