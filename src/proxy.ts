import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  sessionExpiry,
  shouldRenew,
} from "@/lib/session";

// Optimistic check: send anyone without a valid session to /login, and
// renew the idle timer on every visit. Pages and server actions check the
// session again with requireAuth().
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const expiresAt = await sessionExpiry(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === "/login") {
    return expiresAt
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!expiresAt) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  if (shouldRenew(expiresAt)) {
    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken(),
      SESSION_COOKIE_OPTIONS,
    );
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|icon-192.png|icon-512.png|apple-icon.png|manifest.webmanifest|robots.txt).*)"],
};
