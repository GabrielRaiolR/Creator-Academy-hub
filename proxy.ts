import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import {
  isLocaleSegment,
  LOCALE_COOKIE,
  localePath,
  segmentFromAcceptLanguage,
  type LocaleSegment,
} from "@/lib/i18n/config";

function preferredSegment(request: NextRequest): LocaleSegment {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocaleSegment(cookie)) return cookie;
  return segmentFromAcceptLanguage(request.headers.get("accept-language"));
}

/**
 * 1. Every page lives under `/pt` or `/bn`; other paths get the visitor's preferred prefix.
 * 2. Optimistic redirect to the login page when there is no session cookie at all.
 *    This is only a UX shortcut — layouts, Server Actions and Route Handlers
 *    validate the session against the database.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segment = pathname.split("/")[1];

  if (!isLocaleSegment(segment)) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(preferredSegment(request), pathname);
    return NextResponse.redirect(url);
  }

  const isLoginPage = pathname === localePath(segment, "/login");
  if (!isLoginPage && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(segment, "/login");
    url.search = "";
    if (pathname !== localePath(segment)) url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|.*\\..*).*)"],
};
