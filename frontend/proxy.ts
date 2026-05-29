import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/create", "/status", "/admin"];
const DRIVER_ONLY_PREFIXES = ["/driver"];
const AUTH_REQUIRED_PREFIXES = ["/dashboard", ...ADMIN_ONLY_PREFIXES, ...DRIVER_ONLY_PREFIXES];

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

  if (!token && isAuthRequiredRoute) { // Redirect unauthenticated users to login, preserving their intended destination as a callback.
    const loginUrl = new URL("/login", req.url);
    const callbackUrl = `${pathname}${search}`;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (token && isAdminOnlyRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (token && isDriverOnlyRoute && role !== "driver") {
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
    "/login",
  ],
};
