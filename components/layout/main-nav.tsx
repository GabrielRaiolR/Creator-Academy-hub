"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; exact?: boolean };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Frosted pill nav. On small screens it scrolls horizontally instead of collapsing into a hover menu. */
export function MainNav({ items, label, className }: { items: NavItem[]; label: string; className?: string }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>("[aria-current='page']");
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = current.getBoundingClientRect();
    const delta = itemRect.left - listRect.left - (listRect.width - itemRect.width) / 2;
    list.scrollLeft += delta;
  }, [pathname]);

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ul
        ref={listRef}
        className="no-scrollbar mx-auto flex w-full items-center gap-1 overflow-x-auto rounded-full border border-zinc-200/80 bg-zinc-100/80 p-1 shadow-pill md:w-max"
      >
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href} className="min-w-fit flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 w-full items-center justify-center rounded-full px-3 text-center text-sm font-medium tracking-tight whitespace-nowrap transition-colors md:w-auto md:px-4",
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
