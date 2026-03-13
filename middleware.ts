import { NextResponse } from "next/server";

export function middleware() {
  // Temporarily disable auth protection to unblock testing.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};

