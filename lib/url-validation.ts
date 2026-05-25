const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

export function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = URL_SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSocialUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("@")) {
    return normalizeHttpUrl(`https://instagram.com/${trimmed.slice(1)}`);
  }

  return normalizeHttpUrl(trimmed);
}

