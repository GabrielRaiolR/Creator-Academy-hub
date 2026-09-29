import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "muted";

const dots: Record<Tone, string> = {
  neutral: "bg-zinc-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  muted: "bg-zinc-300",
};

/** "Audited" badge from the design system: white pill, status dot, micro uppercase label. */
export function Badge({
  tone = "neutral",
  pulse = false,
  children,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-100 bg-white px-2.5 py-1 shadow-sm",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dots[tone], pulse && "animate-pulse")} />
      <span className="text-[10px] font-bold tracking-wide text-zinc-600 uppercase">{children}</span>
    </span>
  );
}

/** Frosted pill used as a page eyebrow ("Administração · Aulas"). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "hairline inline-flex w-max items-center rounded-full bg-zinc-50 px-4 py-1.5 text-xs font-medium tracking-wide text-zinc-600 shadow-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tiny uppercase label (stat labels, table headers). */
export function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[10px] font-semibold tracking-widest text-zinc-400 uppercase", className)}>
      {children}
    </span>
  );
}
