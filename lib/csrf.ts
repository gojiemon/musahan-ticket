export function assertSameOriginOrThrow(req: Request) {
  if (process.env.NODE_ENV !== "production") return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  try {
    const o = new URL(origin);
    const r = new URL(req.url);
    if (o.host !== r.host) {
      throw new Error("Invalid origin");
    }
  } catch {
    throw new Error("Invalid origin");
  }
}
