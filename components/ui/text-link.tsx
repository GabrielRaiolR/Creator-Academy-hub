import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Text link with the design system's arrow nudge. */
export function TextLink({
  direction = "forward",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { direction?: "forward" | "back" }) {
  return (
    <Link
      className={cn(
        "group inline-flex items-center gap-2 text-sm text-zinc-900 transition-colors hover:text-blue-dark",
        className,
      )}
      {...props}
    >
      {direction === "back" ? (
        <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
      ) : null}
      {children}
      {direction === "forward" ? (
        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
      ) : null}
    </Link>
  );
}
