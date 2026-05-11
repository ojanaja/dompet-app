import { LogContent } from '@/components/log/LogContent';
import { fetchUserTransactionsAction } from '@/actions/transaction.actions';

interface LogPageProps {
  searchParams: { page?: string };
}

export default async function LogPage({ searchParams }: LogPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const take = 20; // 20 item per halaman
  const skip = (page - 1) * take;

  const result = await fetchUserTransactionsAction(take, skip);

  return (
    <LogContent 
      transactions={result.success ? result.data as any : []} 
      currentPage={page}
      hasMore={!!(result.success && result.data && result.data.length === take)}
    />
  );
}
