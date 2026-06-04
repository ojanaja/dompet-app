import { LogContent } from '@/components/log/LogContent';
import { fetchUserTransactionsAction } from '@/actions/transaction.actions';
import { parseLogQueryParams } from '@/lib/log-query';

interface LogPageProps {
  searchParams: Promise<{ 
    page?: string;
    start?: string;
    end?: string;
    q?: string;
    type?: string;
  }>;
}

export default async function LogPage(props: LogPageProps) {
  const searchParams = await props.searchParams;
  const { page, startDate, endDate, search, type, hasActiveFilters } = parseLogQueryParams(searchParams);
  const take = 20; // 20 item per halaman
  const skip = (page - 1) * take;

  const result = await fetchUserTransactionsAction({
    take,
    skip,
    startDate,
    endDate,
    search,
    type,
  });

  return (
    <LogContent 
      transactions={result.success ? result.data || [] : []} 
      currentPage={page}
      hasMore={!!(result.success && result.data && result.data.length === take)}
      hasActiveFilters={hasActiveFilters}
    />
  );
}
