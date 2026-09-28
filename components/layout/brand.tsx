import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

/** Wordmark with a camera mark sized to the type. */
export function Brand({ href, className }: { href: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex min-w-0 items-center gap-2 text-base text-zinc-900 sm:gap-2.5 sm:text-lg", className)} lang="en">
      <LogoMark className="size-[1.5em] shrink-0 text-blue-primary" />
      <span className="font-medium tracking-tight">
        CREATOR<span className="text-zinc-400">ACADEMY</span>
      </span>
    </Link>
  );
}
