export default function Spinner({ fullscreen = false, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className={`${sizes[size]} border-2 border-ink-600 border-t-amber-400 rounded-full animate-spin`} />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-ink-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <span className="text-ink-400 font-mono text-xs tracking-widest uppercase animate-pulse">
            Loading…
          </span>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center p-6">{spinner}</div>;
}
