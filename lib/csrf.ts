export function assertSameOriginOrThrow(req: Request) {
  const origin = req.headers.get("origin");
  // ローカル開発では CSRF を厳格にしない（ホスト差異: 127.0.0.1/localhost などで誤検知しやすいため）
  if (process.env.NODE_ENV !== "production") return;
  if (!origin) return; // サーバ間通信や同一プロセス呼び出しは許容
  try {
    const o = new URL(origin);
    const r = new URL(req.url);
    // 開発/本番ともに「リクエスト先ホスト」と一致していれば許可
    if (o.host !== r.host) {
      throw new Error("Invalid origin");
    }
  } catch {
    throw new Error("Invalid origin");
  }
}
