"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioItem } from "@/lib/queries/portfolio";
import { cn } from "@/lib/utils";
import {
  addPortfolioItemAction,
  deletePortfolioItemAction,
} from "../portfolio/actions";
import { updateProfileAvatarAction } from "../avatar-actions";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE = 50 * 1024 * 1024;

export function EditablePortfolioSection({
  userId,
  title,
  kind,
  items,
  limit,
  avatarUrl,
}: {
  userId: string;
  title: string;
  kind: "image" | "video";
  items: PortfolioItem[];
  limit: number;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const inputId = useId();
  const [visibleItems, setVisibleItems] = useState(items.slice(0, limit));

  // items prop이 변경되면 (추가/삭제 후 router.refresh) visibleItems를 동기화
  const itemIds = items.map((i) => i.id).join(",");
  useEffect(() => {
    setVisibleItems(items.slice(0, limit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds, limit]);

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accepts = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;

  async function handleFile(file: File) {
    setError(null);

    if (!accepts.includes(file.type)) {
      setError(kind === "image" ? "이미지 파일만 올릴 수 있어요." : "영상 파일만 올릴 수 있어요.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("50MB 이하 파일만 올릴 수 있어요.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${randomId()}.${extForFile(file)}`;

      const { error: uploadErr } = await supabase.storage
        .from("portfolio")
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
        .from("portfolio")
        .getPublicUrl(path);

      const result = await addPortfolioItemAction({
        type: kind,
        url: publicUrl.publicUrl,
        caption: title,
      });
      if (!result.ok) {
        await supabase.storage.from("portfolio").remove([path]);
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(kind === "image" ? "대표 이미지를 추가했어요." : "대표 영상을 추가했어요.");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: PortfolioItem) {
    setError(null);
    setDeletingId(item.id);
    try {
      const result = await deletePortfolioItemAction(item.id);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setVisibleItems((current) => current.filter((candidate) => candidate.id !== item.id));
      toast.success("삭제했어요.");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrimary(item: PortfolioItem) {
    setError(null);
    setSettingPrimaryId(item.id);
    try {
      const result = await updateProfileAvatarAction({ url: item.url });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("대표 이미지로 설정했어요.");
      router.refresh();
    } finally {
      setSettingPrimaryId(null);
    }
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  return (
    <section className="rounded-[22px] bg-card px-5 py-6 shadow-sm ring-1 ring-border/70 md:px-7 md:py-7">
      <h2 className="text-2xl font-bold tracking-normal">{title}</h2>

      <div
        className={cn(
          "mt-5 grid gap-3",
          kind === "image" ? "sm:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        {visibleItems.map((item, index) => (
          <EditablePortfolioTile
            key={item.id}
            item={item}
            index={index}
            kind={kind}
            deleting={deletingId === item.id}
            onDelete={() => void handleDelete(item)}
            isPrimary={kind === "image" && item.url === avatarUrl}
            onSetPrimary={kind === "image" ? () => void handleSetPrimary(item) : undefined}
            settingPrimary={settingPrimaryId === item.id}
          />
        ))}

        {visibleItems.length < limit ? (
          <Label
            htmlFor={inputId}
            className={cn(
              "grid min-h-48 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/35 bg-[linear-gradient(45deg,rgba(0,0,0,0.035)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.035)_75%),linear-gradient(45deg,rgba(0,0,0,0.035)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.035)_75%)] bg-[length:32px_32px] bg-[position:0_0,16px_16px] text-primary transition hover:bg-primary-soft",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <span className="grid place-items-center gap-2 text-sm font-bold">
              {uploading ? (
                <Loader2 aria-hidden="true" className="size-7 animate-spin" />
              ) : (
                <span className="grid size-14 place-items-center rounded-full bg-primary-soft">
                  <Plus aria-hidden="true" className="size-7" />
                </span>
              )}
              {kind === "image" ? "이미지 추가" : "영상 추가"}
            </span>
          </Label>
        ) : null}
      </div>

      <input
        id={inputId}
        type="file"
        accept={accepts.join(",")}
        className="sr-only"
        onChange={onChange}
        disabled={uploading}
      />

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function EditablePortfolioTile({
  item,
  index,
  kind,
  deleting,
  onDelete,
  isPrimary,
  onSetPrimary,
  settingPrimary,
}: {
  item: PortfolioItem;
  index: number;
  kind: "image" | "video";
  deleting: boolean;
  onDelete: () => void;
  isPrimary?: boolean;
  onSetPrimary?: () => void;
  settingPrimary?: boolean;
}) {
  return (
    <figure className={cn("group relative overflow-hidden rounded-xl bg-muted", kind === "image" ? "aspect-square" : "aspect-video")}>
      {kind === "image" ? (
        <img
          src={item.url}
          alt={item.caption ?? `대표 이미지 ${index + 1}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          src={item.url}
          aria-label={item.caption ?? `대표 영상 ${index + 1}`}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      )}

      {(isPrimary || kind === "video") && (
        <Badge
          color="neutral"
          size="sm"
          className="absolute left-3 top-3 bg-background/85 text-foreground backdrop-blur"
        >
          대표
        </Badge>
      )}

      <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/20 group-focus-within:bg-black/20">
        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          {onSetPrimary && !isPrimary && (
            <Button
              type="button"
              size="sm"
              className="border-0 bg-white text-black shadow-sm hover:bg-white/90"
              onClick={onSetPrimary}
              disabled={settingPrimary}
            >
              {settingPrimary ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              대표 설정
            </Button>
          )}
          <Button
            type="button"
            color="destructive"
            size="sm"
            className="shadow-sm"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
            삭제
          </Button>
        </div>
      </div>
    </figure>
  );
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
