export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto animate-pulse">
      <div className="h-5 w-40 bg-border-subtle rounded" />
      <div className="h-3 w-24 bg-border-subtle rounded mt-2" />
      <div className="bg-card rounded-xl border border-border-subtle p-5 h-32" />
      <div className="h-3 w-36 bg-border-subtle rounded mt-2" />
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border-subtle p-4 h-20" />
        <div className="bg-card rounded-xl border border-border-subtle p-4 h-20" />
        <div className="bg-card rounded-xl border border-border-subtle p-4 h-20" />
      </div>
      <div className="bg-card rounded-xl border border-border-subtle p-5 h-72" />
      <div className="bg-card rounded-xl border border-border-subtle p-5 h-72" />
    </div>
  );
}
