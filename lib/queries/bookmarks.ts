import { calculateAge, formatDeadline } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BookmarkTargetType = "actor" | "job";

export type BookmarkItem = {
  bookmark_id: string;
  target_type: BookmarkTargetType;
  target_id: string;
  created_at: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
  avatar_url?: string | null;
};

type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];

export async function listBookmarkedTargetIds(
  targetType: BookmarkTargetType,
  targetIds: string[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("bookmarks")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("list_name", "기본")
    .in("target_id", targetIds);
  if (error) throw error;

  return new Set((data ?? []).map((bookmark) => bookmark.target_id));
}

export async function listMyBookmarks(): Promise<BookmarkItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, target_type, target_id, list_name, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!bookmarks || bookmarks.length === 0) return [];

  const actorIds = uniqueTargetIds(bookmarks, "actor");
  const jobIds = uniqueTargetIds(bookmarks, "job");

  const [{ data: actorProfiles }, { data: actorUsers }, { data: jobs }] =
    await Promise.all([
      actorIds.length > 0
        ? supabase
            .from("actor_profiles")
            .select("user_id, region, birth_date, genres, visibility")
            .in("user_id", actorIds)
        : Promise.resolve({ data: [] }),
      actorIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .in("id", actorIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase
            .from("jobs")
            .select("id, title, genre, region, deadline, status")
            .in("id", jobIds)
        : Promise.resolve({ data: [] }),
    ]);

  const actorById = new Map(
    (actorProfiles ?? []).map((actor) => [actor.user_id, actor]),
  );
  const profileById = new Map((actorUsers ?? []).map((profile) => [profile.id, profile]));
  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));

  return bookmarks
    .map((bookmark): BookmarkItem | null => {
      if (bookmark.target_type === "actor") {
        const actor = actorById.get(bookmark.target_id);
        const profile = profileById.get(bookmark.target_id);
        if (!actor || !profile) return null;

        const age = calculateAge(actor.birth_date ?? null);
        return {
          bookmark_id: bookmark.id,
          target_type: "actor",
          target_id: bookmark.target_id,
          created_at: bookmark.created_at,
          title: profile.name ?? "이름 미등록",
          subtitle: [
            actor.region ?? "지역 미등록",
            age !== null ? `${age}세` : null,
            actor.genres?.[0] ?? null,
          ]
            .filter(Boolean)
            .join(" · "),
          badge: "배우",
          href: `/talents/${encodeURIComponent(bookmark.target_id)}`,
          avatar_url: profile.avatar_url,
        };
      }

      if (bookmark.target_type === "job") {
        const job = jobById.get(bookmark.target_id);
        if (!job) return null;

        return {
          bookmark_id: bookmark.id,
          target_type: "job",
          target_id: bookmark.target_id,
          created_at: bookmark.created_at,
          title: job.title,
          subtitle: [
            job.region ?? "-",
            job.genre ?? null,
            formatDeadline(job.deadline),
          ]
            .filter(Boolean)
            .join(" · "),
          badge: job.status === "open" ? "공고" : "마감",
          href: `/jobs/${job.id}`,
        };
      }

      return null;
    })
    .filter((item): item is BookmarkItem => Boolean(item));
}

function uniqueTargetIds(
  bookmarks: BookmarkRow[],
  targetType: BookmarkTargetType,
) {
  return Array.from(
    new Set(
      bookmarks
        .filter((bookmark) => bookmark.target_type === targetType)
        .map((bookmark) => bookmark.target_id),
    ),
  );
}
