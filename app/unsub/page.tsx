async function unsub(token: string) {
  const url = `${process.env.APP_BASE_URL}/api/unsub?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  return res.ok;
}

export default async function UnsubPage({ searchParams }: { searchParams: { token?: string } }) {
  const ok = searchParams.token ? await unsub(searchParams.token) : false;
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">配信停止{ok ? "しました" : "に失敗しました"}</h1>
      <p>{ok ? "ご利用ありがとうございました。" : "リンクが無効または処理済みです。"}</p>
    </div>
  );
}

