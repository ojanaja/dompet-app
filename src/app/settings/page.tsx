import { GlassCard } from '@/components/layout/GlassCard';
import { getCurrentUser } from '@/lib/user.server';
import { fetchCategoriesAction, fetchUnpaidDebtsAction, fetchUserBudgetsAction } from '@/actions/core.actions';
import { SettingsContent } from '@/components/settings/SettingsContent';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const categoriesResult = await fetchCategoriesAction();
  const debtsResult = await fetchUnpaidDebtsAction();
  
  const now = new Date();
  const budgetsResult = await fetchUserBudgetsAction(now.getMonth() + 1, now.getFullYear());

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <SettingsContent
        user={user}
        categories={categoriesResult.success ? categoriesResult.data || [] : []}
        debts={debtsResult.success ? debtsResult.data || [] : []}
        budgets={budgetsResult.success ? budgetsResult.data || [] : []}
      />
    </div>
  );
}
