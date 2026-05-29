export const fallbackJobPosterImages = [
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
    mediaUrls?.find(
      (url) => url.trim().length > 0 && !isJobVideoMediaUrl(url),
    ) ?? null
  );
}

export function getFallbackJobPosterSrc(jobId: string) {
  const sum = Array.from(jobId).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return fallbackJobPosterImages[sum % fallbackJobPosterImages.length];
}

export function getJobPosterSrc(job: {
  id: string;
  media_urls?: readonly string[] | null;
}) {
  return (
    getPrimaryJobImageUrl(job.media_urls) ?? getFallbackJobPosterSrc(job.id)
  );
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
