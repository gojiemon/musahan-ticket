"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useEffect, useRef, useState } from "react";

const schema = z.object({
  performance_id: z.string().uuid(),
  name: z.string().min(1, "氏名は必須です"),
  email: z.string().email("メール形式で入力してください"),
  qty: z.coerce.number().int().min(1).max(10),
  note: z.string().max(500).optional(),
  newsletter_optin: z.boolean().optional(),
  hcaptcha_token: z.string().min(1)
});

type FormValues = z.infer<typeof schema>;

type Performance = {
  id: string;
  show_title: string;
  start_at: string;
  venue: string;
  capacity: number;
  reserved_count: number;
  remaining: number;
};

export default function ReservePage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { qty: 1 }
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/performances");
      setPerformances(await res.json());
      setLoading(false);
    })();
  }, []);

  const onVerify = (token: string) => setValue("hcaptcha_token", token);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `予約に失敗しました(${res.status})`);
      }
      const data = await res.json();
      window.location.href = `/thanks?token=${encodeURIComponent(data.token)}`;
    } catch (e: any) {
      setError(e.message);
      captchaRef.current?.resetCaptcha();
    }
  };

  if (loading) return <p>読み込み中…</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">チケット予約</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 card">
        <label className="block">
          <span className="label">公演回</span>
          <select className="input" aria-label="公演回" {...register("performance_id")}>
            {performances.map(p => (
              <option key={p.id} value={p.id}>
                {p.show_title} / {new Date(p.start_at).toLocaleString()} @ {p.venue}（残 {p.remaining}）
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">氏名</span>
          <input className="input" aria-label="氏名" {...register("name")} />
          {errors.name && <span className="text-red-600 text-sm">{errors.name.message}</span>}
        </label>
        <label className="block">
          <span className="label">メール</span>
          <input className="input" aria-label="メール" type="email" {...register("email")} />
          {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}
        </label>
        <label className="block">
          <span className="label">枚数</span>
          <input className="input" aria-label="枚数" type="number" min={1} max={10} {...register("qty", { valueAsNumber: true })} />
          {errors.qty && <span className="text-red-600 text-sm">{errors.qty.message}</span>}
        </label>
        <label className="block">
          <span className="label">備考</span>
          <textarea className="input" rows={3} aria-label="備考" {...register("note")} />
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" aria-label="案内メールを受け取る" {...register("newsletter_optin")} />
          <span>案内メールを受け取る</span>
        </label>
        <input type="hidden" {...register("hcaptcha_token")} />
        <div>
          <HCaptcha sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!} onVerify={onVerify} ref={captchaRef} />
          {errors.hcaptcha_token && <span className="text-red-600 text-sm">{errors.hcaptcha_token.message}</span>}
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "送信中…" : "予約送信"}
        </button>
      </form>
    </div>
  );
}

