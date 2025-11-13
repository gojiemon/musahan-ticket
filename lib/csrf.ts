export function assertSameOriginOrThrow(req: Request) {
  const origin = req.headers.get("origin");
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
