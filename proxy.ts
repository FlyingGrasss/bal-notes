import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const rewritePath = request.nextUrl.pathname === "/"
    ? request.nextUrl.hostname === "notlar.balogrenci.org"
      ? "/notlar"
      : request.nextUrl.hostname === "odevler.balogrenci.org"
        ? "/odevler"
        : null
    : null;
  const rewriteUrl = rewritePath ? request.nextUrl.clone() : null;
  if (rewriteUrl && rewritePath) rewriteUrl.pathname = rewritePath;
  const responseForRequest = () => rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request })
    : NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return responseForRequest();

  let response = responseForRequest();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = responseForRequest();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
