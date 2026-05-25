import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SIGNED_STORAGE_URL_TTL_SECONDS = 60 * 60;

export function getPublicStoragePath(url: string, bucket: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const parsedUrl = new URL(url);
    const parsedSupabaseUrl = new URL(supabaseUrl);

    if (parsedUrl.origin !== parsedSupabaseUrl.origin) return null;

    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!parsedUrl.pathname.startsWith(prefix)) return null;

    const path = decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
    if (!path || path.startsWith("/") || path.includes("..")) return null;
    return path;
  } catch {
    return null;
  }
}

export function getUserPublicStoragePath(
  url: string,
  bucket: string,
  userId: string,
) {
  const path = getPublicStoragePath(url, bucket);
  if (!path?.startsWith(`${userId}/`)) return null;
  return path;
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const normalizedBaseUrl = supabaseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`;
}

export async function signPublicStorageUrl(
  supabase: SupabaseClient<Database>,
  url: string | null | undefined,
  bucket: string,
) {
  if (!url) return null;

  const path = getPublicStoragePath(url, bucket);
  if (!path) return url;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_STORAGE_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
}

export async function signPublicStorageUrls(
  supabase: SupabaseClient<Database>,
  urls: readonly string[],
  bucket: string,
) {
  const signedEntries = await Promise.all(
    urls.map(async (url) => [url, await signPublicStorageUrl(supabase, url, bucket)]),
  );

  return new Map(
    signedEntries.map(([url, signedUrl]) => [url, signedUrl ?? url] as const),
  );
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
