import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Paths that require authentication. Admin paths need admin role check
// done in the page/API itself, not middleware (middleware can't check DB).
export const protectedPaths = [
  "/admin",
  "/dashboard",
  "/inventory",
];

export const isProtectedPath = (pathname: string) =>
  protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.authId = user.id as string;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    // Middleware gate: redirect unauthenticated visitors away from
    // protected pages to the sign-in page.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (isProtectedPath(pathname)) {
        return !!auth?.user;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
