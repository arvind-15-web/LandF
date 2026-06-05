export default function Spinner({ fullscreen = false, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = <div className={`${sizes[size]} border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin`} />;
  if (fullscreen) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">{spinner}<span className="text-slate-400 text-sm">Loading…</span></div>
    </div>
  );
  return <div className="flex justify-center p-8">{spinner}</div>;
}
