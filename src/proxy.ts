import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Optimistic check: send anyone without a valid session to /login.
// Pages and server actions check again with requireAuth().
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const valid = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === "/login") {
    return valid
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!valid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|robots.txt).*)"],
};
