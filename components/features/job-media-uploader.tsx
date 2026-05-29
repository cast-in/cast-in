"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { ImagePlus, Loader2, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getMediaFileName,
  isJobVideoMediaUrl,
} from "@/lib/job-media";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_COUNT = 3;
const MAX_VIDEO_COUNT = 1;
const SIGNED_PREVIEW_TTL_SECONDS = 60 * 60;

export type JobMediaUploaderItem = {
  id: string;
  name: string;
  previewUrl: string;
  type: "image" | "video";
  url: string;
  path?: string;
  persisted?: boolean;
};

export function toJobMediaUploaderItem(
  url: string,
  index: number,
  previewUrl = url,
): JobMediaUploaderItem {
  const type = isJobVideoMediaUrl(url) ? "video" : "image";
  const fallback =
    type === "video" ? `공고 영상 ${index + 1}` : `공고 이미지 ${index + 1}`;

  return {
    id: `${index}-${url}`,
    name: getMediaFileName(url, fallback),
    previewUrl,
    type,
    url,
    persisted: true,
  };
}

export function JobMediaUploader({
  initialItems = [],
  inputName = "media_urls",
  onUploadingChange,
  userId,
}: {
  initialItems?: JobMediaUploaderItem[];
  inputName?: string;
  onUploadingChange?: (uploading: boolean) => void;
  userId: string;
}) {
  const imageInputId = useId();
  const videoInputId = useId();
  const [items, setItems] = useState<JobMediaUploaderItem[]>(initialItems);
  const [uploadingType, setUploadingType] = useState<"image" | "video" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const images = items.filter((item) => item.type === "image");
  const videos = items.filter((item) => item.type === "video");

  async function uploadFiles(files: File[], type: "image" | "video") {
    setError(null);
    if (files.length === 0) return;

    const validationError = validateFiles(files, type, {
      imageCount: images.length,
      videoCount: videos.length,
    });
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setUploadingType(type);
    onUploadingChange?.(true);
    try {
      const supabase = createClient();
      const uploadedItems: JobMediaUploaderItem[] = [];

      for (const file of files) {
        const id = randomId();
        const path = `${userId}/${type}/${id}.${extForFile(file)}`;
        const { error: uploadErr } = await supabase.storage
          .from("job-media")
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadErr) {
          if (uploadedItems.length > 0) {
            setItems((prev) => [...prev, ...uploadedItems]);
          }
          setError(uploadErr.message);
          toast.error(uploadErr.message);
          return;
        }

        const { data: publicUrl } = supabase.storage
          .from("job-media")
          .getPublicUrl(path);
        const { data: signedUrl } = await supabase.storage
          .from("job-media")
          .createSignedUrl(path, SIGNED_PREVIEW_TTL_SECONDS);

        uploadedItems.push({
          id,
          name: file.name,
          path,
          previewUrl: signedUrl?.signedUrl ?? publicUrl.publicUrl,
          type,
          url: publicUrl.publicUrl,
          persisted: false,
        });
      }

      setItems((prev) => [...prev, ...uploadedItems]);
    } finally {
      setUploadingType(null);
      onUploadingChange?.(false);
    }
  }

  async function removeItem(item: JobMediaUploaderItem) {
    setError(null);
    setItems((prev) => prev.filter((target) => target.id !== item.id));

    if (item.persisted || !item.path) return;

    const { error: removeError } = await createClient()
      .storage
      .from("job-media")
      .remove([item.path]);
    if (removeError) {
      setError(removeError.message);
      toast.error(removeError.message);
    }
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadFiles(files, type);
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <input key={item.id} type="hidden" name={inputName} value={item.url} />
      ))}

      <p className="text-sm font-bold">작품 포스터 / 무드보드</p>
      <div className="grid gap-3 md:grid-cols-2">
        <UploadTile
          accept={ALLOWED_IMAGE.join(",")}
          description="PNG, JPG · 최대 10MB · 최대 3장"
          disabled={uploadingType !== null || images.length >= MAX_IMAGE_COUNT}
          htmlFor={imageInputId}
          icon={<ImagePlus aria-hidden="true" className="size-8" />}
          label={uploadingType === "image" ? "업로드 중" : "이미지 업로드"}
          multiple
          onChange={(event) => handleChange(event, "image")}
          uploading={uploadingType === "image"}
        />
        <UploadTile
          accept={ALLOWED_VIDEO.join(",")}
          description="MP4, MOV, WEBM · 최대 100MB · 최대 1개"
          disabled={uploadingType !== null || videos.length >= MAX_VIDEO_COUNT}
          htmlFor={videoInputId}
          icon={<Video aria-hidden="true" className="size-8" />}
          label={uploadingType === "video" ? "업로드 중" : "영상 업로드"}
          onChange={(event) => handleChange(event, "video")}
          uploading={uploadingType === "video"}
        />
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-2">
          {items.map((item, index) => (
            <MediaListItem
              key={item.id}
              item={item}
              index={index}
              onRemove={() => void removeItem(item)}
            />
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MediaListItem({
  index,
  item,
  onRemove,
}: {
  index: number;
  item: JobMediaUploaderItem;
  onRemove: () => void;
}) {
  const typeLabel = item.type === "video" ? "영상" : "이미지";

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-2 text-sm">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-muted">
        {item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt={`공고 이미지 ${index + 1} 미리보기`}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <Video aria-hidden="true" className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{item.name}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {typeLabel}
        </p>
      </div>
      <Button
        type="button"
        size="icon-xs"
        color="neutral"
        variant="ghost"
        aria-label={`${item.name} 삭제`}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </Button>
    </li>
  );
}

function UploadTile({
  accept,
  description,
  disabled,
  htmlFor,
  icon,
  label,
  multiple = false,
  onChange,
  uploading,
}: {
  accept: string;
  description: string;
  disabled: boolean;
  htmlFor: string;
  icon: ReactNode;
  label: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}) {
  const descriptionId = `${htmlFor}-description`;

  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        "grid min-h-36 cursor-pointer place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center transition hover:bg-muted",
        disabled && "pointer-events-none opacity-55",
      )}
    >
      <input
        id={htmlFor}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        aria-describedby={descriptionId}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="grid place-items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-background shadow-sm">
          {uploading ? (
            <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          ) : (
            icon
          )}
        </span>
        <span className="text-sm font-extrabold">{label}</span>
        <span
          id={descriptionId}
          className="text-xs font-medium text-muted-foreground"
        >
          {description}
        </span>
      </span>
    </Label>
  );
}

function validateFiles(
  files: readonly File[],
  type: "image" | "video",
  counts: { imageCount: number; videoCount: number },
) {
  if (type === "image") {
    if (files.length + counts.imageCount > MAX_IMAGE_COUNT) {
      return "이미지는 최대 3장까지 올릴 수 있어요.";
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE.includes(file.type)) {
        return "PNG, JPG, WEBP 이미지만 올릴 수 있어요.";
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return "이미지는 10MB 이하만 올릴 수 있어요.";
      }
    }
  }

  if (type === "video") {
    if (files.length + counts.videoCount > MAX_VIDEO_COUNT) {
      return "영상은 1개만 올릴 수 있어요.";
    }

    for (const file of files) {
      if (!ALLOWED_VIDEO.includes(file.type)) {
        return "MP4, MOV, WEBM 영상만 올릴 수 있어요.";
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return "영상은 100MB 이하만 올릴 수 있어요.";
      }
    }
  }

  return null;
}

function extForFile(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromMime = file.type.split("/")[1];
  return (fromMime ?? "bin").toLowerCase();
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
