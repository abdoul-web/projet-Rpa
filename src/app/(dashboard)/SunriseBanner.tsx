export function SunriseBanner() {
  return (
    <div className="sunrise-sky relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-amber-100 via-orange-50 to-white sm:h-32">
      <div
        className="sunrise-rays pointer-events-none absolute left-1/2 top-[70%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "repeating-conic-gradient(from 0deg, rgba(251,146,60,0.25) 0deg 4deg, transparent 4deg 18deg)",
        }}
      />
      <div className="sunrise-sun absolute left-1/2 top-[70%] h-16 w-16 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_50px_14px_rgba(251,146,60,0.35)] sm:h-20 sm:w-20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-amber-200/80" />
    </div>
  );
}
