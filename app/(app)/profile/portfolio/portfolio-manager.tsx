"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/lib/queries/portfolio";
import {
  addPortfolioItemAction,
  deletePortfolioItemAction,
} from "./actions";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_ALL = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

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

export function PortfolioManager({
  userId,
  initialItems,
}: {
  userId: string;
  initialItems: PortfolioItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_ALL.includes(file.type)) {
      setError("이미지(jpg/png/webp/gif) 또는 동영상(mp4/mov/webm)만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("50MB 이하 파일만 올릴 수 있어요.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = extForFile(file);
      const path = `${userId}/${randomId()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("portfolio")
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
        .from("portfolio")
        .getPublicUrl(path);

      const type: "image" | "video" = ALLOWED_IMAGE.includes(file.type)
        ? "image"
        : "video";

      const result = await addPortfolioItemAction({
        type,
        url: publicUrl.publicUrl,
        caption: caption.trim() || null,
      });
      if (!result.ok) {
        await supabase.storage.from("portfolio").remove([path]);
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setCaption("");
      toast.success("포트폴리오에 추가했어요.");
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
    <div className="space-y-6">
      <UploadPanel
        uploading={uploading}
        caption={caption}
        onCaptionChange={setCaption}
        onChange={onChange}
        error={error}
      />
      <PortfolioGrid
        items={items}
        onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
      />
    </div>
  );
}

function UploadPanel({
  uploading,
  caption,
  onCaptionChange,
  onChange,
  error,
}: {
  uploading: boolean;
  caption: string;
  onCaptionChange: (next: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-muted/40 p-4 ring-1 ring-border/70">
      <div className="grid gap-2">
        <Label htmlFor="portfolio-caption">캡션 (선택)</Label>
        <Input
          id="portfolio-caption"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="사진·영상을 한 줄로 설명해주세요."
          disabled={uploading}
        />
      </div>
      <div>
        <Label
          htmlFor="portfolio-file"
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm font-medium text-muted-foreground transition hover:bg-background",
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
              파일 선택 (이미지 또는 동영상, 50MB 이하)
            </>
          )}
        </Label>
        <input
          id="portfolio-file"
          type="file"
          accept={ALLOWED_ALL.join(",")}
          className="sr-only"
          onChange={onChange}
          disabled={uploading}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PortfolioGrid({
  items,
  onDelete,
}: {
  items: PortfolioItem[];
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        아직 올린 포트폴리오가 없어요. 첫 번째 사진이나 영상을 추가해보세요.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <PortfolioCard key={item.id} item={item} onDeleted={() => onDelete(item.id)} />
      ))}
    </div>
  );
}

function PortfolioCard({
  item,
  onDeleted,
}: {
  item: PortfolioItem;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    if (!confirm("이 항목을 삭제할까요? 되돌릴 수 없어요.")) return;
    startTransition(async () => {
      const result = await deletePortfolioItemAction(item.id);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      onDeleted();
      toast.success("삭제했어요.");
    });
  }

  return (
    <div className="group overflow-hidden rounded-2xl bg-card ring-1 ring-border/70">
      <div className="relative aspect-[4/3] bg-muted">
        {item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.caption ?? "포트폴리오"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={item.url}
            controls
            preload="metadata"
            className="h-full w-full object-cover"
          />
        )}
        <Badge
          variant="secondary"
          className="absolute left-2 top-2 bg-background/80 backdrop-blur"
        >
          {item.type === "image" ? "사진" : "영상"}
        </Badge>
        <Button
          variant="destructive"
          size="sm"
          className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
          onClick={handleDelete}
          disabled={pending}
          aria-label="항목 삭제"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {item.caption && (
        <p className="px-4 py-3 text-sm text-foreground/80">{item.caption}</p>
      )}
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
