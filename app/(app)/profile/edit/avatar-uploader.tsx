"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { updateProfileAvatarAction } from "../avatar-actions";

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function AvatarUploader({
  userId,
  profileName,
  initialAvatarUrl,
}: {
  userId: string;
  profileName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const inputId = useId();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("5MB 이하 이미지만 올릴 수 있어요.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${randomId()}.${extForFile(file)}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (uploadErr) {
        setError(uploadErr.message);
        toast.error(uploadErr.message);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const { data: signedUrl } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);

      const result = await updateProfileAvatarAction({
        url: publicUrl.publicUrl,
      });
      if (!result.ok) {
        await supabase.storage.from("avatars").remove([path]);
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setAvatarUrl(signedUrl?.signedUrl ?? publicUrl.publicUrl);
      toast.success("프로필 사진을 업데이트했어요.");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-muted/40 p-4 ring-1 ring-border/70 sm:flex-row sm:items-center">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-muted text-2xl font-semibold text-muted-foreground ring-1 ring-border/70">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${profileName} 프로필 사진`}
            className="h-full w-full object-cover"
          />
        ) : (
          getAvatarFallback(profileName)
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-semibold">프로필 사진</p>
          <p className="mt-1 text-sm text-muted-foreground">
            배우와 캐스팅 담당자가 가장 먼저 보는 이미지예요.
          </p>
        </div>
        <div>
          <Label
            htmlFor={inputId}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-sm transition hover:bg-muted",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                업로드하는 중이에요
              </>
            ) : (
              <>
                <Upload aria-hidden="true" className="size-4" />
                사진 선택
              </>
            )}
          </Label>
          <input
            id={inputId}
            type="file"
            accept={ALLOWED_AVATAR_TYPES.join(",")}
            className="sr-only"
            onChange={onChange}
            disabled={uploading}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function extForFile(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromMime = file.type.split("/")[1];
  return (fromMime ?? "jpg").toLowerCase();
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
