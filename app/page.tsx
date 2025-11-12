"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Performance = {
  id: string;
  show_title: string;
  start_at: string;
  venue: string;
  capacity: number;
  reserved_count: number;
  remaining: number;
};

export default function HomePage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/performances", { cache: "no-store" });
        const data = res.ok ? await res.json().catch(() => []) : [];
        if (mounted) setPerformances(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setPerformances([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl p-6 text-white shadow-md bg-gradient-to-r from-brand to-brand-accent">
        <h1 className="text-2xl font-bold">次回公演のご案内</h1>
        <p className="mt-2 text-white/90">チケットは当日精算・無料予約です。</p>
        <a className="mt-4 inline-block btn-secondary bg-white/90 hover:bg-white text-brand" href="/reserve">
          予約する
        </a>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">公演回一覧</h2>
        {loading ? (
          <p>読み込み中…</p>
        ) : performances.length === 0 ? (
          <p className="text-sm text-gray-600">現在、表示できる公演はありません。</p>
        ) : (
          <ul className="grid gap-3">
            {performances.map((p) => (
              <li key={p.id} className="card hover:shadow-md transition-shadow">
                <div className="font-semibold">{p.show_title}</div>
                <div className="text-sm text-gray-600">
                  {format(new Date(p.start_at), "yyyy/MM/dd HH:mm")} @ {p.venue}
                </div>
                <div className="mt-1 text-sm">
                  残席: <span className={p.remaining > 0 ? "text-green-600" : "text-red-600"}>{p.remaining}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
