import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export const ATTACHMENT_BUCKET = "attachments";
export const ATTACHMENT_SIGNED_URL_TTL_SECONDS = 10 * 60;
export const MAX_ATTACHMENT_COUNT = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
] as const;

export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_TYPES.join(",");

export type AttachmentKind = "file" | "image" | "video";

export type AttachmentMetadata = {
  id: string;
  kind: AttachmentKind;
  mimeType: string;
  name: string;
  path: string;
  signedUrl?: string | null;
  size: number;
};

export type AttachmentScope = "applications" | "messages";

export function createAttachmentPath({
  file,
  scope,
  targetId,
  userId,
}: {
  file: File;
  scope: AttachmentScope;
  targetId: string;
  userId: string;
}) {
  return `${scope}/${targetId}/${userId}/${randomId()}.${getAttachmentExtension(file)}`;
}

export function createAttachmentMetadata({
  file,
  path,
}: {
  file: File;
  path: string;
}): AttachmentMetadata {
  return {
    id: randomId(),
    kind: getAttachmentKind(file.type),
    mimeType: file.type,
    name: file.name,
    path,
    size: file.size,
  };
}

export function validateAttachmentFile(file: File) {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type as AllowedAttachmentType)) {
    return "PDF, 이미지, MP4 또는 MOV 파일만 첨부할 수 있어요.";
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return "파일은 50MB 이하만 첨부할 수 있어요.";
  }

  return null;
}

export function parseAttachmentList(value: unknown): AttachmentMetadata[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_ATTACHMENT_COUNT)
    .map(toAttachmentMetadata)
    .filter((item): item is AttachmentMetadata => Boolean(item));
}

export function parseAttachmentFormValue(
  value: FormDataEntryValue | null,
): { ok: true; attachments: AttachmentMetadata[] } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: true, attachments: [] };
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    const attachments = parseAttachmentList(parsed);
    if (Array.isArray(parsed) && parsed.length > MAX_ATTACHMENT_COUNT) {
      return { ok: false, error: "첨부 파일은 최대 5개까지 보낼 수 있어요." };
    }
    return { ok: true, attachments };
  } catch {
    return { ok: false, error: "첨부 파일 정보를 확인할 수 없어요." };
  }
}

export function attachmentsToJson(attachments: AttachmentMetadata[]): Json {
  return attachments.slice(0, MAX_ATTACHMENT_COUNT).map((attachment) => ({
    id: attachment.id,
    kind: attachment.kind,
    mimeType: attachment.mimeType,
    name: attachment.name,
    path: attachment.path,
    size: attachment.size,
  }));
}

export async function signAttachments(
  supabase: SupabaseClient<Database>,
  attachments: readonly AttachmentMetadata[],
) {
  return Promise.all(
    attachments.map(async (attachment) => {
      const { data, error } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrl(attachment.path, ATTACHMENT_SIGNED_URL_TTL_SECONDS);

      if (error || !data?.signedUrl) return attachment;
      return { ...attachment, signedUrl: data.signedUrl };
    }),
  );
}

export function isAttachmentPathForOwner({
  path,
  scope,
  targetId,
  userId,
}: {
  path: string;
  scope: AttachmentScope;
  targetId: string;
  userId: string;
}) {
  return path.startsWith(`${scope}/${targetId}/${userId}/`) && isSafePath(path);
}

export function formatAttachmentSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function toAttachmentMetadata(value: unknown): AttachmentMetadata | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id : randomId();
  const path = typeof item.path === "string" ? item.path : "";
  const name = typeof item.name === "string" ? item.name : "";
  const mimeType = typeof item.mimeType === "string" ? item.mimeType : "";
  const size = typeof item.size === "number" ? item.size : 0;
  const kind =
    item.kind === "image" || item.kind === "video" || item.kind === "file"
      ? item.kind
      : getAttachmentKind(mimeType);
  const signedUrl = typeof item.signedUrl === "string" ? item.signedUrl : null;

  if (!id || !path || !name || !mimeType || !isSafePath(path)) return null;
  if (!ALLOWED_ATTACHMENT_TYPES.includes(mimeType as AllowedAttachmentType)) {
    return null;
  }
  if (!Number.isFinite(size) || size < 0 || size > MAX_ATTACHMENT_SIZE_BYTES) {
    return null;
  }

  return { id, kind, mimeType, name, path, signedUrl, size };
}

function getAttachmentKind(mimeType: string): AttachmentKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

function getAttachmentExtension(file: File) {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/quicktime") return "mov";

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension?.replace(/[^a-z0-9]/g, "") || "bin";
}

function isSafePath(path: string) {
  return !path.startsWith("/") && !path.includes("..") && path.split("/").length >= 4;
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

type AllowedAttachmentType = (typeof ALLOWED_ATTACHMENT_TYPES)[number];
