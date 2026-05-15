import { LogContent } from '@/components/log/LogContent';
import { fetchUserTransactionsAction } from '@/actions/transaction.actions';

interface LogPageProps {
  searchParams: Promise<{ 
    page?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function LogPage(props: LogPageProps) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const take = 20; // 20 item per halaman
  const skip = (page - 1) * take;

  const startDate = searchParams.start ? new Date(searchParams.start) : undefined;
  const endDate = searchParams.end ? new Date(searchParams.end) : undefined;
  if (endDate) {
    // Include the whole end day
    endDate.setHours(23, 59, 59, 999);
  }

  const result = await fetchUserTransactionsAction(take, skip, startDate, endDate);

  return (
    <LogContent 
      transactions={result.success ? result.data as any : []} 
      currentPage={page}
      hasMore={!!(result.success && result.data && result.data.length === take)}
    />
  );
}
