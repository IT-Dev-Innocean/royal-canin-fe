export function RoyalCaninLogo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${className}`}
      aria-label="Royal Canin"
    >
      <svg
        viewBox="0 0 120 48"
        className="h-12 w-auto text-[#e2001a]"
        fill="currentColor"
        aria-hidden
      >
        <path d="M60 4c-4 6-12 10-18 12 2 4 4 10 4 16 0 8-3 14-8 18 6-2 14-6 18-12 4 6 12 10 18 12-5-4-8-10-8-18 0-6 2-12 4-16-6-2-14-6-18-12z" />
        <circle cx="60" cy="22" r="3" fill="white" />
      </svg>
      <span className="text-center text-lg font-bold tracking-[0.2em] text-[#e2001a]">
        ROYAL CANIN
      </span>
    </div>
  );
}
