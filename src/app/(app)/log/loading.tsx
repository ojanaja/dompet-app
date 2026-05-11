export default function LogLoading() {
  return (
    <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto animate-pulse">
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-card rounded-lg border border-border-subtle" />
        <div className="w-20 h-10 bg-card rounded-lg border border-border-subtle" />
      </div>
      <div className="h-3 w-16 bg-border-subtle rounded ml-1" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card rounded-xl border border-border-subtle p-4 h-14" />
      ))}
    </div>
  );
}
