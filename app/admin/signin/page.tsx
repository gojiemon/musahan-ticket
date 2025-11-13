"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AdminSigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data?.user) {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">管理ログイン</h1>
      <div className="card">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="text-sm font-medium">メールとパスワードでログイン</div>
          <label className="block">
            <span className="text-sm">メール</span>
            <input className="mt-1 w-full border rounded px-3 py-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm">パスワード</span>
            <input className="mt-1 w-full border rounded px-3 py-2" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="rounded bg-brand.accent text-white px-4 py-2 font-semibold" disabled={loading}>
            {loading ? "処理中…" : "ログイン"}
          </button>
        </form>
      </div>
      <p className="text-sm text-gray-600 mt-4">メールリンク方式のままにしたい場合は /admin/login を使えます。</p>
    </div>
  );
}

