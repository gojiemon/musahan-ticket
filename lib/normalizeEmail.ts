export function normalizeEmail(raw: string): string {
  const s = raw.trim().toLowerCase();
  const [local, domain] = s.split("@");
  if (!local || !domain) return s;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const noPlus = local.split("+")[0];
    const noDots = noPlus.replace(/\./g, "");
    return `${noDots}@gmail.com`;
  }
  return `${local.split("+")[0]}@${domain}`;
}

