"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BookmarkTargetType } from "@/lib/queries/bookmarks";

const TARGET_TYPES = new Set<BookmarkTargetType>(["actor", "job"]);
const DEFAULT_LIST_NAME = "기본";

export type ToggleBookmarkResult =
  | { ok: true; bookmarked: boolean }
  | { ok: false; error: string };

export async function toggleBookmarkAction(
  formData: FormData,
): Promise<ToggleBookmarkResult> {
  const targetType = String(formData.get("target_type") ?? "") as BookmarkTargetType;
  const targetId = String(formData.get("target_id") ?? "");
  const rawRedirectTo = String(formData.get("redirect_to") ?? "");
  const redirectTo = rawRedirectTo.startsWith("/") ? rawRedirectTo : "/bookmarks";

  if (!TARGET_TYPES.has(targetType) || !targetId) {
    return { ok: false, error: "잘못된 요청이에요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: existing, error: existingErr } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("list_name", DEFAULT_LIST_NAME);
  if (existingErr) return { ok: false, error: existingErr.message };

  const isBookmarked = (existing ?? []).length > 0;
  if (isBookmarked) {
    const ids = (existing ?? []).map((bookmark) => bookmark.id);
    const { error } = await supabase.from("bookmarks").delete().in("id", ids);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      list_name: DEFAULT_LIST_NAME,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(redirectTo);
  revalidatePath("/bookmarks");
  return { ok: true, bookmarked: !isBookmarked };
}
