import type { CSSProperties } from "react";

/**
 * Vertical grid from the Lumina design system: five columns and a short
 * gradient stroke falling along the rules (`beam-fall`). The source beams are
 * orange; here the same stroke is zinc so it sits on the white page.
 */
export function BackgroundMotion() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 mx-auto flex w-full max-w-7xl border-r border-zinc-950/[0.06]"
    >
      <div className="relative h-full flex-1 overflow-hidden border-l border-zinc-950/[0.06]" />

      <div className="relative h-full flex-1 overflow-hidden border-l border-zinc-950/[0.06]">
        <div className="motion-beam motion-beam-1 absolute top-0 -left-px h-64 w-0.5 bg-gradient-to-b from-transparent via-zinc-400/70 to-transparent" />
      </div>

      <div className="relative flex h-full flex-1 justify-center overflow-hidden border-l border-zinc-950/[0.06]">
        <div className="motion-beam motion-beam-2 absolute top-0 -left-px h-96 w-0.5 bg-gradient-to-b from-transparent via-zinc-400/70 to-transparent" />
        <div className="h-full w-px border-r border-dashed border-zinc-400/15" />
        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2">
          <div
            className="motion-beam motion-beam-1 absolute top-0 left-0 h-64 w-0.5 bg-gradient-to-b from-transparent via-zinc-400/70 to-transparent"
            style={{ animationDelay: "1.5s" } as CSSProperties}
          />
        </div>
      </div>

      <div className="relative h-full flex-1 overflow-hidden border-l border-zinc-950/[0.06]">
        <div className="motion-beam motion-beam-3 absolute top-0 -left-px h-48 w-0.5 bg-gradient-to-b from-transparent via-zinc-400/70 to-transparent" />
      </div>

      <div className="relative h-full flex-1 overflow-hidden border-l border-zinc-950/[0.06]" />
    </div>
  );
}
