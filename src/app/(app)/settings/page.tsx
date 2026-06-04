import { getCurrentUser } from '@/lib/user.server';
import { fetchCategoriesAction, fetchUnpaidDebtsAction, fetchUserBudgetsAction } from '@/actions/core.actions';
import { SettingsContent } from '@/components/settings/SettingsContent';

interface SettingsPageProps {
  searchParams: Promise<{
    budgetMonth?: string;
    budgetYear?: string;
  }>;
}

const parseBudgetPeriod = (monthParam?: string, yearParam?: string) => {
  const now = new Date();
  const parsedMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  const parsedYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

  return {
    month: Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1,
    year: Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : now.getFullYear(),
  };
};

export default async function SettingsPage(props: SettingsPageProps) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  const categoriesResult = await fetchCategoriesAction();
  const debtsResult = await fetchUnpaidDebtsAction();
  const budgetPeriod = parseBudgetPeriod(searchParams.budgetMonth, searchParams.budgetYear);
  const budgetsResult = await fetchUserBudgetsAction(budgetPeriod.month, budgetPeriod.year);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <SettingsContent
        user={user}
        categories={categoriesResult.success ? categoriesResult.data || [] : []}
        debts={debtsResult.success ? debtsResult.data || [] : []}
        budgets={budgetsResult.success ? budgetsResult.data || [] : []}
        budgetMonth={budgetPeriod.month}
        budgetYear={budgetPeriod.year}
      />
    </div>
  );
}
