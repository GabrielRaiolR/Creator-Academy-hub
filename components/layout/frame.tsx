import type { ReactNode } from "react";
import { BackgroundMotion } from "./background-motion";

/** Full-bleed page: white ground, content column centered, grid lines behind it. */
export function Frame({ children, fillViewport = false }: { children: ReactNode; fillViewport?: boolean }) {
  return (
    <div className={fillViewport ? "h-dvh overflow-hidden bg-white" : "min-h-dvh bg-white"}>
      <div className={`relative mx-auto flex w-full max-w-7xl flex-col ${fillViewport ? "h-full" : "min-h-dvh"}`}>
        <BackgroundMotion />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
