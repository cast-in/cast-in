"use client";

/* eslint-disable @next/next/no-img-element */

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { updateProfileAvatarAction } from "../avatar-actions";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function HeroAvatarUploader({
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
      return;
    }

    if (file.size > MAX_SIZE) {
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
          contentType: file.type,
          upsert: false,
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

      const result = await updateProfileAvatarAction({ url: publicUrl.publicUrl });
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

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-3">
      <Label
        htmlFor={inputId}
        className={cn(
          "relative grid aspect-[3/4] w-full max-w-[300px] cursor-pointer place-items-center overflow-hidden rounded-lg border-2 border-dashed border-primary/45 bg-[linear-gradient(45deg,rgba(0,0,0,0.035)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.035)_75%),linear-gradient(45deg,rgba(0,0,0,0.035)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.035)_75%)] bg-[length:32px_32px] bg-[position:0_0,16px_16px] text-primary transition hover:bg-primary-soft",
          uploading && "pointer-events-none opacity-60",
        )}
        aria-busy={uploading ? true : undefined}
      >
        {uploading ? (
          <Loader2
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 z-10 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin"
          />
        ) : null}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${profileName} 프로필 사진`}
            className={cn("h-full w-full object-cover", uploading && "opacity-40")}
          />
        ) : (
          <span
            className={cn(
              "grid place-items-center gap-3 text-center text-sm font-bold",
              uploading && "opacity-0",
            )}
          >
            <span className="grid size-14 place-items-center rounded-full bg-primary-soft">
              <Plus aria-hidden="true" className="size-8" />
            </span>
            <span>
              프로필 사진 변경
              <span className="mt-2 block text-xs text-muted-foreground">
                JPG / PNG · 최대 5MB
              </span>
            </span>
          </span>
        )}
      </Label>

      <input
        id={inputId}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="sr-only"
        onChange={onChange}
        disabled={uploading}
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
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
