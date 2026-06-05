import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { getLoginPathForCallback } from "@/lib/authRedirects";

const ADMIN_ONLY_PREFIXES = ["/create", "/status", "/admin"];
const DRIVER_ONLY_PREFIXES = ["/driver"];
const USER_ONLY_PREFIXES = ["/report", "/reports"];
const AUTH_REQUIRED_PREFIXES = [
  "/dashboard",
  ...ADMIN_ONLY_PREFIXES,
  ...DRIVER_ONLY_PREFIXES,
  ...USER_ONLY_PREFIXES,
];

const startsWithAny = (pathname: string, prefixes: string[]) => {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token?.role as string | undefined) ?? "";

  const isAuthRequiredRoute = startsWithAny(pathname, AUTH_REQUIRED_PREFIXES);
  const isAdminOnlyRoute = startsWithAny(pathname, ADMIN_ONLY_PREFIXES);
  const isDriverOnlyRoute = startsWithAny(pathname, DRIVER_ONLY_PREFIXES);
  const isUserOnlyRoute = startsWithAny(pathname, USER_ONLY_PREFIXES);

  if (!token && isAuthRequiredRoute) {
    const callbackUrl = `${pathname}${search}`;
    const loginPath = getLoginPathForCallback(callbackUrl);
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/login/citizen" ||
    pathname === "/login/staff";

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (token && isAdminOnlyRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (token && isDriverOnlyRoute && role !== "driver") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (token && isUserOnlyRoute && role !== "user") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create/:path*",
    "/status/:path*",
    "/admin/:path*",
    "/driver/:path*",
    "/report/:path*",
    "/reports/:path*",
    "/login",
    "/login/citizen",
    "/login/staff",
    "/signup",
  ],
};
