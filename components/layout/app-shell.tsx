import { Suspense, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/permissions/rules";
import { format, type Messages } from "@/lib/i18n/messages";
import { Brand } from "./brand";
import { Frame } from "./frame";
import { LanguageSwitcher } from "./language-switcher";
import { MainNav, type NavItem } from "./main-nav";
import { UserMenu } from "./user-menu";

type AppShellProps = {
  user: CurrentUser;
  homeHref: string;
  nav: NavItem[];
  t: Messages;
  children: ReactNode;
};

/** Authenticated chrome shared by the student area and the admin area. */
export function AppShell({ user, homeHref, nav, t, children }: AppShellProps) {
  return (
    <Frame>
      <header className="px-6 pt-6 md:px-10 md:pt-8 xl:px-12">
        <div className="flex items-center justify-between gap-3">
          <Brand href={homeHref} />
          <MainNav items={nav} label={t.nav.primary} className="hidden md:block" />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Suspense fallback={null}>
              <LanguageSwitcher />
            </Suspense>
            <UserMenu name={user.name} email={user.email} isAdmin={user.role === "ADMIN" && user.active} />
          </div>
        </div>
        <MainNav items={nav} label={t.nav.primary} className="mt-5 md:hidden" />
      </header>

      <main id="main" className="flex-1 px-6 pt-10 pb-16 md:px-10 md:pt-16 xl:px-12">
        {children}
      </main>

      <footer className="border-t border-zinc-950/5 px-6 py-6 text-xs text-zinc-500 md:px-10 xl:px-12">
        {format(t.footer.rights, { year: new Date().getFullYear() })}
      </footer>
    </Frame>
  );
}
