import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Only these paths require login. Everything else on the site
// (homepage, events, /live, history, etc.) stays fully public.
export const config = {
  matcher: ["/admin/:path*", "/presentation/control/:path*"],
};
