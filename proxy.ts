import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require authentication.
 * Users who are not signed in will be redirected to /signin.
 */
const protectedPrefixes = [
  "/store",
  "/learn",
  "/knowledge-tree",
  "/library",
  "/article/create",
  "/project/create",
  "/dictionary/create",
  "/dictionary/moderation",
  "/setup",
];

function isProtectedProfilePath(pathname: string) {
  if (pathname === "/profile/password") return true;

  // Keep edit page private while allowing public profile pages (/profile/:slug).
  return /^\/profile\/[^/]+\/edit(?:\/|$)/.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request matches a protected route
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  ) || isProtectedProfilePath(pathname);

  if (!isProtected) {
    return NextResponse.next();
  }

  // Create a Supabase client that can read cookies from the request
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: any }>,
        ) {
          // Forward refreshed cookies to the browser
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh the session (important for token rotation)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to sign-in page, preserving the intended destination
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/signin";
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If profile setup is incomplete, redirect to /setup (unless already there)
  const profileComplete = user.user_metadata?.profileComplete;
  if (!profileComplete && pathname !== "/setup") {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = "/setup";
    return NextResponse.redirect(setupUrl);
  }

  // If profile is complete but user is on /setup, let them through (editing)
  return response;
}

export const config = {
  matcher: [
    "/store/:path*",
    "/learn/:path*",
    "/knowledge-tree/:path*",
    "/library/:path*",
    "/profile/:path*",
    "/article/create",
    "/project/create",
    "/dictionary/create",
    "/dictionary/moderation/:path*",
    "/setup",
  ],
};
