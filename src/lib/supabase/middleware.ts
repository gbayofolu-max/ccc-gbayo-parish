import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPath = path === "/admin/login";

  if (!isLoginPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  if (user && !isLoginPath) {
    // The signed-in person's own role (the admin_users table lets each user read only their own row).
    const { data: row } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = row?.role;

    // Signed in but not on the team list: no access to anything protected.
    if (role !== "admin" && role !== "operator") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("denied", "1");
      return NextResponse.redirect(url);
    }

    // Operators may use the projector controls only.
    if (
      role === "operator" &&
      path !== "/presentation/control" &&
      !path.startsWith("/presentation/control/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/presentation/control";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
