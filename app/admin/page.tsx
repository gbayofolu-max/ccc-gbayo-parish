import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = adminRow?.role ?? "unknown";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-sm text-navy-light/70">
              Signed in as {user.email} &middot; role: {role}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/presentation/control"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-serif text-lg font-bold text-navy">Presentation Control</h2>
            <p className="mt-1 text-sm text-navy-light/70">
              Control what's shown on the projector — hymns, scripture, announcements.
            </p>
          </Link>

          <Link
            href="/admin/sermons/new"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-serif text-lg font-bold text-navy">Sermon Automation</h2>
            <p className="mt-1 text-sm text-navy-light/70">
              Upload a sermon and let Nehemiah draft daily posts for review.
            </p>
          </Link>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 opacity-60 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-navy">Church Settings</h2>
            <p className="mt-1 text-sm text-navy-light/70">Coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
