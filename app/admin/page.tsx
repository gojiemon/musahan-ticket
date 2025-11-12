import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import AdminDashboard from "./ui/AdminDashboard";

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const role = (session?.user?.app_metadata as any)?.role;
  if (!session) {
    return (
      <div>
        <p>ログインが必要です。</p>
        <a className="underline text-brand.accent" href="/admin/login">ログインへ</a>
      </div>
    );
  }
  if (role !== "admin") {
    return <p>権限がありません。</p>;
  }
  return <AdminDashboard />;
}

