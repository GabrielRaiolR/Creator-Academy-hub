"use client";

import { Toaster as Sonner } from "sonner";

/** Toasts rendered as ring cards to match the design system. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      className="toaster-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border-0 !bg-white !font-sans !text-zinc-900 !shadow-ring !text-sm !tracking-tight",
          description: "!text-zinc-500",
          success: "[&_[data-icon]]:!text-emerald-500",
          error: "[&_[data-icon]]:!text-red-500",
          closeButton: "!border-zinc-100 !bg-white !text-zinc-500",
        },
      }}
    />
  );
}
