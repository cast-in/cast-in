import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleBookmarkAction } from "@/app/(app)/bookmarks/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookmarkTargetType } from "@/lib/queries/bookmarks";

export function BookmarkButton({
  targetType,
  targetId,
  bookmarked,
  redirectTo,
  className,
}: {
  targetType: BookmarkTargetType;
  targetId: string;
  bookmarked: boolean;
  redirectTo: string;
  className?: string;
}) {
  const Icon = bookmarked ? BookmarkCheck : Bookmark;

  return (
    <form action={toggleBookmarkAction}>
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <button
        type="submit"
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "보관함에서 제거" : "보관함에 추가"}
        className={cn(
          buttonVariants({
            variant: bookmarked ? "secondary" : "outline",
            size: "sm",
          }),
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
        {bookmarked ? "보관됨" : "보관"}
      </button>
    </form>
  );
}
