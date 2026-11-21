export default function ServiceLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-150">
      {/* Hero Header Skeleton */}
      <div className="w-full bg-slate-900 py-8 px-4 text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-800 rounded-full animate-pulse" />
            <div className="h-8 w-64 bg-slate-800 rounded-xl animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-4xl mx-auto p-4 space-y-4 mt-4">
        <div className="h-32 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs animate-pulse" />
        <div className="h-48 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs animate-pulse" />
        <div className="h-24 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs animate-pulse" />
      </div>
    </div>
  );
}
