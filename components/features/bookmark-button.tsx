"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { toggleBookmarkAction } from "@/app/(app)/bookmarks/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookmarkTargetType } from "@/lib/queries/bookmarks";

export function BookmarkButton({
  targetType,
  targetId,
  bookmarked,
  redirectTo,
  compact = false,
  className,
}: {
  targetType: BookmarkTargetType;
  targetId: string;
  bookmarked: boolean;
  redirectTo: string;
  compact?: boolean;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useState(bookmarked);
  const [pending, startTransition] = useTransition();
  const Icon = optimistic ? BookmarkCheck : Bookmark;

  function handleClick() {
    const next = !optimistic;
    setOptimistic(next);
    const formData = new FormData();
    formData.set("target_type", targetType);
    formData.set("target_id", targetId);
    formData.set("redirect_to", redirectTo);
    startTransition(async () => {
      const result = await toggleBookmarkAction(formData);
      if (!result.ok) {
        setOptimistic(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={optimistic ? "저장 취소" : "저장하기"}
      className={cn(
        buttonVariants({
          color: compact ? "neutral" : optimistic ? "secondary" : "neutral",
          variant: compact ? "ghost" : optimistic ? "fill" : "outline",
          size: compact ? "icon-lg" : "sm",
        }),
        compact && "rounded-full text-muted-foreground hover:text-foreground",
        compact && optimistic && "bg-primary/10 text-primary hover:bg-primary/15",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {compact ? null : optimistic ? "저장됨" : "저장"}
    </button>
  );
}
