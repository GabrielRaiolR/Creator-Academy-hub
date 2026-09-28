"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; exact?: boolean };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Frosted pill nav. On small screens it scrolls horizontally instead of collapsing into a hover menu. */
export function MainNav({ items, label, className }: { items: NavItem[]; label: string; className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ul className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-white/60 bg-white/50 p-1 shadow-pill backdrop-blur-sm">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium tracking-tight transition-colors",
                  active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
