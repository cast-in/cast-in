import type { Json } from "@/types/database";

export type ActorSocialLink = {
  url: string;
  title: string;
};

export const MAX_SOCIAL_LINKS = 5;

const MAX_URL_LENGTH = 300;
const MAX_TITLE_LENGTH = 48;

export function parseSocialLinks(value: unknown): ActorSocialLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const url = typeof record.url === "string" ? normalizeUrl(record.url) : null;
      if (!url) return null;

      const title =
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim().slice(0, MAX_TITLE_LENGTH)
          : getDefaultLinkTitle(url);

      return { url, title };
    })
    .filter((item): item is ActorSocialLink => Boolean(item))
    .slice(0, MAX_SOCIAL_LINKS);
}

export function parseSocialLinksFromForm(formData: FormData):
  | { ok: true; links: ActorSocialLink[] }
  | { ok: false; error: string } {
  const urls = formData.getAll("social_url").map((value) => String(value).trim());
  const titles = formData
    .getAll("social_title")
    .map((value) => String(value).trim());
  const count = Math.max(urls.length, titles.length);
  const links: ActorSocialLink[] = [];

  for (let index = 0; index < count; index++) {
    const rawUrl = urls[index] ?? "";
    const rawTitle = titles[index] ?? "";

    if (!rawUrl && !rawTitle) continue;
    if (!rawUrl) return { ok: false, error: "링크 주소를 입력해주세요." };
    if (rawUrl.length > MAX_URL_LENGTH) {
      return { ok: false, error: "링크 주소가 너무 길어요." };
    }
    if (rawTitle.length > MAX_TITLE_LENGTH) {
      return { ok: false, error: "링크 제목은 48자 이내로 입력해주세요." };
    }

    const url = normalizeUrl(rawUrl);
    if (!url) return { ok: false, error: "올바른 링크 주소를 입력해주세요." };

    links.push({
      url,
      title: rawTitle || getDefaultLinkTitle(url),
    });

    if (links.length > MAX_SOCIAL_LINKS) {
      return { ok: false, error: "링크는 최대 5개까지 추가할 수 있어요." };
    }
  }

  return { ok: true, links };
}

export function socialLinksToJson(links: ActorSocialLink[]): Json {
  return links.map((link) => ({
    url: link.url,
    title: link.title,
  }));
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function getDefaultLinkTitle(url: string) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, "");
  const firstPath = parsed.pathname.split("/").filter(Boolean)[0];

  if (hostname === "instagram.com" && firstPath) return firstPath;
  return hostname;
}
