import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Admin-only pages (SUPER_ADMIN + ADMIN)
    "/admin/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
    // Public pages (buyer storefront, auth pages)
    // These are intentionally excluded so they're accessible to everyone
    // "/shop/:path*",
    // "/categories/:path*",
  ],
};
