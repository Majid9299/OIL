"use client";

interface ContainerCardProps {
  icon: string;
  label: string;
  literCapacity: number;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ContainerCard({
  icon,
  label,
  literCapacity,
  count,
  onIncrement,
  onDecrement,
}: ContainerCardProps) {
  const isFull = count > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onIncrement}
        aria-label={`إضافة ${label} ممتلئة`}
        className="relative flex h-32 w-24 items-end justify-center overflow-hidden rounded-b-3xl rounded-t-xl border-2 border-neutral-300 bg-neutral-50 shadow-sm transition active:scale-95"
      >
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-500 ease-out"
          style={{
            height: isFull ? "85%" : "12%",
            backgroundColor: "var(--color-oil)",
            opacity: isFull ? 0.9 : 0.2,
          }}
        />
        <span className="relative z-10 mb-3 text-4xl">{icon}</span>
        {isFull && (
          <span className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow">
            {count}
          </span>
        )}
      </button>

      <p className="text-sm font-bold text-neutral-900">
        {label} {literCapacity} لتر
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          disabled={count === 0}
          aria-label={`إنقاص ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-lg font-bold text-neutral-600 transition active:scale-90 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-base font-extrabold text-neutral-900">
          {count}
        </span>
        <button
          onClick={onIncrement}
          aria-label={`إضافة ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-lg font-bold text-neutral-600 transition active:scale-90"
        >
          +
        </button>
      </div>

      {isFull ? (
        <span className="text-xs font-semibold text-brand-700">
          {count * literCapacity} لتر
        </span>
      ) : (
        <span className="text-xs text-neutral-400">اضغط عند الامتلاء</span>
      )}
    </div>
  );
}
