"use client";

import { supabaseBrowser } from "@/lib/supabaseClient";
import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` }
    });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">管理ログイン</h1>
      {sent ? (
        <p>ログインリンクをメール送信しました。ご確認ください。</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm">メール</span>
            <input className="mt-1 w-full border rounded px-3 py-2" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          {error && <div className="text-red-600">{error}</div>}
          <button className="rounded bg-brand.accent text-white px-4 py-2 font-semibold">ログインリンク送信</button>
        </form>
      )}
    </div>
  );
}

