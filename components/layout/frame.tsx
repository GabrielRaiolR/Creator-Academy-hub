import type { ReactNode } from "react";

/**
 * The design system's page frame: zinc ground, frosted glass panel with
 * hairline vertical grid lines. Edge-to-edge below xl.
 */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center xl:p-8">
      <div className="glass-panel relative flex w-full flex-col xl:max-w-[1300px] xl:rounded-[2.5rem] xl:border xl:border-white/50 xl:shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex justify-between overflow-hidden px-6 md:px-10 xl:rounded-[2.5rem] xl:px-12"
        >
          <div className="h-full w-px bg-zinc-950/5" />
          <div className="hidden h-full w-px bg-zinc-950/5 md:block" />
          <div className="hidden h-full w-px bg-zinc-950/5 lg:block" />
          <div className="hidden h-full w-px bg-zinc-950/5 xl:block" />
          <div className="h-full w-px bg-zinc-950/5" />
        </div>
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
