"use client";

import { Toaster as Sonner } from "sonner";

/** Toasts sit at the bottom and leave on their own. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={24}
      duration={2000}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border-0 !bg-white !font-sans !text-zinc-900 !shadow-ring !text-sm !tracking-tight",
          description: "!text-zinc-500",
          success: "[&_[data-icon]]:!text-emerald-500",
          error: "[&_[data-icon]]:!text-red-500",
        },
      }}
    />
  );
}
