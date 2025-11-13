"use client";

import { supabaseBrowser } from "@/lib/supabaseClient";
import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else if (data?.user) window.location.href = "/admin";
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">管理ログイン</h1>
      <div className="card">
        <form onSubmit={onPassword} className="space-y-3">
          <div className="text-sm font-medium">メールとパスワードでログイン</div>
          <label className="block">
            <span className="text-sm">メール</span>
            <input className="mt-1 w-full border rounded px-3 py-2" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm">パスワード</span>
            <input className="mt-1 w-full border rounded px-3 py-2" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <div className="text-red-600">{error}</div>}
          <button className="rounded bg-brand.accent text-white px-4 py-2 font-semibold">ログイン</button>
        </form>
      </div>
    </div>
  );
}
