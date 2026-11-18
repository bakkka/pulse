import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/lib/locale";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("to");
  const locale = isLocale(requested) ? requested : "en";

  const referer = request.headers.get("referer");
  let target = "/";
  if (referer) {
    try {
      const back = new URL(referer);
      if (back.origin === url.origin) target = `${back.pathname}${back.search}`;
    } catch {
      target = "/";
    }
  }

  const response = NextResponse.redirect(new URL(target, url.origin), 303);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
