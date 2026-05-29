const placeholderJobPosterImages = [
  "/job-posters/sample-1.png",
  "/job-posters/sample-2.png",
] as const;

export function isJobVideoMediaUrl(url: string) {
  return /\.(mp4|mov|webm)(?:$|\?)/i.test(url);
}

export function getPrimaryJobImageUrl(
  mediaUrls: readonly string[] | null | undefined,
) {
  return (
    normalizeJobMediaUrls(mediaUrls).find((url) => !isJobVideoMediaUrl(url)) ??
    null
  );
}

export function isPlaceholderJobPosterUrl(url: string) {
  const pathname = getUrlPathname(url);
  return Boolean(
    pathname &&
      placeholderJobPosterImages.some((placeholder) => pathname === placeholder),
  );
}

export function normalizeJobMediaUrls(
  mediaUrls: readonly string[] | null | undefined,
) {
  return (
    mediaUrls
      ?.map((url) => url.trim())
      .filter((url) => url.length > 0 && !isPlaceholderJobPosterUrl(url)) ?? []
  );
}

export function getJobPosterSrc(job: {
  id: string;
  media_urls?: readonly string[] | null;
}) {
  return getPrimaryJobImageUrl(job.media_urls);
}

export function getMediaFileName(url: string, fallback: string) {
  const pathname = getUrlPathname(url);
  if (!pathname) return fallback;

  const fileName = pathname.split("/").filter(Boolean).pop();
  if (!fileName) return fallback;

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function getUrlPathname(url: string) {
  try {
    return new URL(url, "https://cast-in.local").pathname;
  } catch {
    return null;
  }
}
