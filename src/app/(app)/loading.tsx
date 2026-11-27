// Shown right away while the next page loads on the server.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuat" className="animate-pulse">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="space-y-4 p-4">
        <div className="h-28 rounded-2xl bg-slate-200/70" />
        <div className="h-48 rounded-2xl bg-slate-200/70" />
        <div className="h-36 rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}
