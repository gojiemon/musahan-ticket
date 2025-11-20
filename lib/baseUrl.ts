import { headers } from "next/headers";

function buildFromHeaders(h: Headers) {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Host header missing");
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Returns the application base URL using the APP_BASE_URL env when available.
 *
 * The request is optional: when provided, its origin is used. When omitted, the
 * current request headers are used (via next/headers) so server components can
 * resolve the active host.
 */
export function getBaseUrl(req?: Request) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (req) return new URL(req.url).origin;
  return buildFromHeaders(headers());
}

export function withBasePath(path: string, req?: Request) {
  return `${getBaseUrl(req)}${path}`;
}
