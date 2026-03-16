import { NextResponse } from "next/server";

export function middleware() {
  // Temporarily allow all requests through; auth protection will be re-enabled later.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};

