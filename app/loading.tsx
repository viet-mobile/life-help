export default function RootLoading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-3 border-slate-200 border-t-amber-500 animate-spin" />
        <span className="text-lg select-none">✨</span>
      </div>
      <p className="mt-4 text-xs font-bold text-slate-500 animate-pulse tracking-wide">
        LIFE.HELP
      </p>
    </div>
  );
}
