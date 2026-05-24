import { calculateAge, formatDeadline } from "@/lib/format";
import { isJobAccepting } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { OpenJobPreview, PagedResult } from "@/lib/queries/jobs";

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

export type SavedJobsParams = {
  q?: string;
  region?: string;
  genre?: string;
  roleType?: string;
  targetGender?: string;
  targetAgeGroup?: string;
  platform?: string;
  sort?: "deadline" | "latest";
  jobState?: "active" | "closed" | "all";
  page?: number;
  pageSize?: number;
};

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

export async function countBookmarkedTargets(
  targetType: BookmarkTargetType,
): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("list_name", "기본");
  if (error) throw error;

  return count ?? 0;
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

export async function listMyBookmarkedJobs(
  params: SavedJobsParams = {},
): Promise<PagedResult<OpenJobPreview>> {
  const {
    q,
    region,
    genre,
    roleType,
    targetGender,
    targetAgeGroup,
    platform,
    sort = "latest",
    jobState = "all",
    page = 1,
    pageSize = 12,
  } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page, pageSize };

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, target_id, created_at")
    .eq("user_id", user.id)
    .eq("target_type", "job")
    .eq("list_name", "기본")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!bookmarks || bookmarks.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  const jobIds = bookmarks.map((bookmark) => bookmark.target_id);
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(
      "id, title, description, genre, region, deadline, status, requirements, role_type, target_genders, target_age_groups, platforms, created_at",
    )
    .in("id", jobIds);
  if (jobsError) throw jobsError;

  const bookmarkIndexByJobId = new Map(
    bookmarks.map((bookmark, index) => [bookmark.target_id, index]),
  );
  const searchText = q?.trim().toLowerCase();

  const filtered = (jobs ?? [])
    .filter((job) => {
      if (jobState === "active" && !isJobAccepting(job)) return false;
      if (jobState === "closed" && isJobAccepting(job)) return false;

      if (searchText) {
        const haystack = [
          job.title,
          job.description,
          job.role_type,
          job.genre,
          ...(job.requirements ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchText)) return false;
      }
      if (region?.trim() && !job.region?.includes(region.trim())) return false;
      if (genre?.trim() && !job.genre?.includes(genre.trim())) return false;
      if (roleType?.trim() && job.role_type !== roleType.trim()) return false;
      if (
        targetGender?.trim() &&
        !(job.target_genders ?? []).includes(targetGender.trim())
      ) {
        return false;
      }
      if (
        targetAgeGroup?.trim() &&
        !(job.target_age_groups ?? []).includes(targetAgeGroup.trim())
      ) {
        return false;
      }
      if (platform?.trim() && !(job.platforms ?? []).includes(platform.trim())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sort === "deadline") {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }

      return (
        (bookmarkIndexByJobId.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (bookmarkIndexByJobId.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      );
    });

  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const items = filtered.slice(from, to).map(
    (job): OpenJobPreview => ({
      id: job.id,
      title: job.title,
      genre: job.genre,
      region: job.region,
      deadline: job.deadline,
      status: job.status,
      requirements: job.requirements ?? [],
      role_type: job.role_type,
      target_genders: job.target_genders ?? [],
      target_age_groups: job.target_age_groups ?? [],
      platforms: job.platforms ?? [],
    }),
  );

  return { items, total: filtered.length, page, pageSize };
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
