import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isHomePage  = req.nextUrl.pathname === "/";
  const isAuthPage  = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isApiSeed = req.nextUrl.pathname.startsWith("/api/seed");

  if (isApiAuth || isApiSeed) return NextResponse.next();

  if (isHomePage) return NextResponse.next();

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo|videos|public).*)"],
};
