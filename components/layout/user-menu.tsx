"use client";

import { ChevronDown, LogOut, Shield, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Spinner } from "@/components/ui/spinner";
import { logoutAction } from "@/lib/actions/auth";
import { localePath } from "@/lib/i18n/config";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
}

function LogoutButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
    >
      {pending ? <Spinner /> : <LogOut aria-hidden className="size-4 text-zinc-400" strokeWidth={1.5} />}
      {label}
    </button>
  );
}

/** Click-to-open account menu (no hover dependency); closes on outside click and Escape. */
export function UserMenu({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const { segment, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t.nav.menu}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-full border border-white/60 bg-white/50 p-1 shadow-pill backdrop-blur-sm transition-colors hover:bg-white/80 sm:pr-2.5"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {initials(name)}
        </span>
        <ChevronDown aria-hidden className="hidden size-4 text-zinc-500 sm:block" strokeWidth={1.5} />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white p-2 shadow-ring"
        >
          <div className="border-b border-zinc-100 px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <div className="flex flex-col py-1" onClick={() => setOpen(false)}>
            <Link href={localePath(segment, "/perfil")} className={itemClass}>
              <UserIcon aria-hidden className="size-4 text-zinc-400" strokeWidth={1.5} />
              {t.nav.profile}
            </Link>
            {isAdmin ? (
              <Link href={localePath(segment, "/admin")} className={itemClass}>
                <Shield aria-hidden className="size-4 text-zinc-400" strokeWidth={1.5} />
                {t.nav.admin}
              </Link>
            ) : null}
          </div>
          <form action={logoutAction} className="border-t border-zinc-100 pt-1">
            <input type="hidden" name="locale" value={segment} />
            <LogoutButton label={t.nav.logout} />
          </form>
        </div>
      ) : null}
    </div>
  );
}
