export default function DashboardLoading() {
  return <div className="animate-pulse space-y-5"><div className="h-20 rounded-lg bg-muted" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-lg bg-muted" />)}</div><div className="h-96 rounded-lg bg-muted" /></div>;
}
