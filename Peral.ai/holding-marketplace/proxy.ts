import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn  = !!req.auth;
  const isHomePage  = pathname === "/";
  const isAuthPage  = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiAuth   = pathname.startsWith("/api/auth");
  const isApiSeed   = pathname.startsWith("/api/seed");

  if (isApiAuth || isApiSeed) return NextResponse.next();
  if (isHomePage)              return NextResponse.next();

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Injetar pathname para layouts Server Component lerem sem depender de hooks client
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo|videos|public).*)"],
};
