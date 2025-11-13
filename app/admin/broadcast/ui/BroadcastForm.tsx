"use client";

import { useState } from "react";

export default function BroadcastForm() {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p>お知らせ本文をここに入力してください。</p>");
  const [testEmail, setTestEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = async (mode: "test" | "send") => {
    setStatus(null);
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          testEmail: mode === "test" ? testEmail || undefined : undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "送信に失敗しました");
      }
      setStatus(mode === "test" ? "テスト送信しました" : `送信完了: ${data?.sent ?? 0}件`);
    } catch (e: any) {
      setError(e.message ?? "エラーが発生しました");
    } finally {
      setSending(false);
    }
  };

  const disabled = sending || !subject || !html;

  return (
    <div className="card space-y-4">
      <div>
        <label className="label">件名</label>
        <input
          type="text"
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="例: 次回公演のご案内"
        />
      </div>

      <div>
        <label className="label">本文（HTML可）</label>
        <textarea
          className="input"
          rows={10}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">基本的な HTML タグ（&lt;p&gt;, &lt;br&gt;, &lt;a&gt;, &lt;img&gt; など）が使えます。</p>
      </div>

      <div className="border-t pt-4 space-y-2">
        <label className="label">テスト送信先（任意）</label>
        <div className="flex gap-2 flex-wrap">
          <input
            type="email"
            className="input flex-1"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => send("test")}
            disabled={!testEmail || sending}
          >
            テスト送信
          </button>
        </div>
      </div>

      {status && <div className="text-sm text-green-600">{status}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex justify-end">
        <button className="btn-primary" type="button" disabled={disabled} onClick={() => send("send")}>
          {sending ? "送信中…" : "購読者へ送信"}
        </button>
      </div>
    </div>
  );
}

