import { LogContent } from '@/components/log/LogContent';
import { fetchUserTransactionsAction } from '@/actions/transaction.actions';

export default async function LogPage() {
  const result = await fetchUserTransactionsAction();

  return (
    <LogContent transactions={result.success ? result.data as any : []} />
  );
}
