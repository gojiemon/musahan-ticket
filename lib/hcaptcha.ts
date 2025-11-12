export async function verifyHCaptcha(token: string, remoteip?: string) {
  if (process.env.DISABLE_HCAPTCHA === '1') return true;
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) throw new Error("HCAPTCHA_SECRET missing");
  const body = new URLSearchParams({
    secret,
    response: token
  });
  if (remoteip) body.set("remoteip", remoteip);

  const res = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.success;
}
