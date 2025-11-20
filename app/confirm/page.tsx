import { withBasePath } from "@/lib/baseUrl";

async function confirm(token: string) {
  const url = withBasePath(`/api/confirm?token=${encodeURIComponent(token)}`);
  const res = await fetch(url, { cache: "no-store" });
  return res.ok;
}

export default async function ConfirmPage({ searchParams }: { searchParams: { token?: string } }) {
  const ok = searchParams.token ? await confirm(searchParams.token) : false;
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">購読{ok ? "が確定しました" : "に失敗しました"}</h1>
      <p>{ok ? "ありがとうございます。次回公演のご案内をお送りします。" : "トークンが無効または期限切れです。"}</p>
    </div>
  );
}

