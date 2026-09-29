import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: ReactNode; lang?: string };

/** Pill nav from the design system used as a toggle (tabs, language switch). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-100/80 p-1 shadow-pill",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            lang={option.lang}
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium tracking-tight transition-colors",
              selected ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
