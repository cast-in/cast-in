import { calculateAge, formatDeadline } from "@/lib/format";
import { isJobAccepting } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import { signPublicStorageUrls } from "@/lib/supabase/storage-url";
import type { Database } from "@/types/database";
import type {
  CastingActorPreview,
  OpenJobPreview,
  PagedResult,
} from "@/lib/queries/jobs";

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
type SavedFilterValue = string | readonly string[];

export type SavedJobsParams = {
  q?: string;
  region?: SavedFilterValue;
  genre?: SavedFilterValue;
  roleType?: SavedFilterValue;
  targetGender?: SavedFilterValue;
  targetAgeGroup?: SavedFilterValue;
  platform?: SavedFilterValue;
  sort?: "deadline" | "latest";
  jobState?: "active" | "closed" | "all";
  page?: number;
  pageSize?: number;
};

export type SavedActorsParams = {
  ageGroup?: SavedFilterValue;
  gender?: "male" | "female" | readonly string[];
  genre?: SavedFilterValue;
  heightRange?: SavedFilterValue;
  nationality?: SavedFilterValue;
  q?: string;
  region?: SavedFilterValue;
  skill?: SavedFilterValue;
  sort?: "latest" | "name";
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
    sort = "latest",
    jobState = "all",
    page = 1,
    pageSize = 12,
  } = params;
  const regions = normalizeSavedValues(params.region);
  const genres = normalizeSavedValues(params.genre);
  const roleTypes = normalizeSavedValues(params.roleType);
  const targetGenders = normalizeSavedValues(params.targetGender);
  const targetAgeGroups = normalizeSavedValues(params.targetAgeGroup);
  const platforms = normalizeSavedValues(params.platform);
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
      "id, title, description, genre, region, deadline, status, requirements, role_name, role_type, target_genders, target_age_groups, target_age_min, target_age_max, platforms, media_urls, created_at",
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
      if (
        regions.length > 0 &&
        !regions.some((region) => job.region?.includes(region))
      ) {
        return false;
      }
      if (
        genres.length > 0 &&
        !genres.some((genre) => job.genre?.includes(genre))
      ) {
        return false;
      }
      if (
        roleTypes.length > 0 &&
        !roleTypes.some((roleType) => job.role_type === roleType)
      ) {
        return false;
      }
      if (
        targetGenders.length > 0 &&
        !targetGenders.some((targetGender) =>
          (job.target_genders ?? []).includes(targetGender),
        )
      ) {
        return false;
      }
      if (
        targetAgeGroups.length > 0 &&
        !targetAgeGroups.some((targetAgeGroup) =>
          (job.target_age_groups ?? []).includes(targetAgeGroup),
        )
      ) {
        return false;
      }
      if (
        platforms.length > 0 &&
        !platforms.some((platform) => (job.platforms ?? []).includes(platform))
      ) {
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
  const pagedJobs = filtered.slice(from, to);
  const signedMediaUrlByUrl = await signPublicStorageUrls(
    supabase,
    pagedJobs.flatMap((job) => job.media_urls ?? []),
    "job-media",
  );
  const items = pagedJobs.map(
    (job): OpenJobPreview => ({
      id: job.id,
      title: job.title,
      genre: job.genre,
      region: job.region,
      deadline: job.deadline,
      created_at: job.created_at,
      status: job.status,
      requirements: job.requirements ?? [],
      role_name: job.role_name,
      role_type: job.role_type,
      target_genders: job.target_genders ?? [],
      target_age_groups: job.target_age_groups ?? [],
      target_age_min: job.target_age_min,
      target_age_max: job.target_age_max,
      platforms: job.platforms ?? [],
      media_urls: (job.media_urls ?? []).map(
        (url) => signedMediaUrlByUrl.get(url) ?? url,
      ),
    }),
  );

  return { items, total: filtered.length, page, pageSize };
}

export async function listMyBookmarkedActors(
  params: SavedActorsParams = {},
): Promise<PagedResult<CastingActorPreview>> {
  const {
    q,
    sort = "latest",
    page = 1,
    pageSize = 12,
  } = params;
  const ageGroups = normalizeSavedValues(params.ageGroup);
  const genders = normalizeSavedValues(params.gender);
  const genres = normalizeSavedValues(params.genre);
  const heightRanges = normalizeSavedValues(params.heightRange);
  const nationalities = normalizeSavedValues(params.nationality);
  const regions = normalizeSavedValues(params.region);
  const skills = normalizeSavedValues(params.skill);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page, pageSize };

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, target_id, created_at")
    .eq("user_id", user.id)
    .eq("target_type", "actor")
    .eq("list_name", "기본")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!bookmarks || bookmarks.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  const actorIds = bookmarks.map((bookmark) => bookmark.target_id);
  const { data, error: actorsError } = await supabase
    .from("actor_profiles")
    .select(
      "user_id, region, birth_date, gender, genres, height_cm, weight_kg, image_tags, nationalities, skills, updated_at, profiles!inner(name, avatar_url)",
    )
    .eq("visibility", "public")
    .in("user_id", actorIds);
  if (actorsError) throw actorsError;

  const bookmarkIndexByActorId = new Map(
    bookmarks.map((bookmark, index) => [bookmark.target_id, index]),
  );
  const searchText = q?.trim().toLowerCase();

  const filtered = (data ?? [])
    .map((row): CastingActorPreview => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.user_id,
        name: profile?.name ?? "이름 미등록",
        region: row.region ?? null,
        age: calculateAge(row.birth_date ?? null),
        gender: row.gender ?? null,
        genres: row.genres ?? [],
        avatar_url: profile?.avatar_url ?? null,
        height_cm: row.height_cm ?? null,
        weight_kg: row.weight_kg ?? null,
        image_tags: row.image_tags ?? [],
        nationalities: row.nationalities ?? [],
        skills: row.skills ?? [],
        updated_at: row.updated_at,
      };
    })
    .filter((actor) => {
      if (searchText && !actor.name.toLowerCase().includes(searchText)) {
        return false;
      }
      if (
        regions.length > 0 &&
        !regions.some((region) => actor.region?.includes(region))
      ) {
        return false;
      }
      if (
        genres.length > 0 &&
        !genres.some((genre) => actor.genres.includes(genre))
      ) {
        return false;
      }
      if (
        genders.length > 0 &&
        !genders.some((gender) => actor.gender === gender)
      ) {
        return false;
      }
      if (
        nationalities.length > 0 &&
        !nationalities.some((nationality) =>
          actor.nationalities.includes(nationality),
        )
      ) {
        return false;
      }
      if (
        skills.length > 0 &&
        !skills.some((skill) => actor.skills.includes(skill))
      ) {
        return false;
      }
      if (
        ageGroups.length > 0 &&
        !ageGroups.some((ageGroup) => isAgeInGroup(actor.age, ageGroup))
      ) {
        return false;
      }
      if (
        heightRanges.length > 0 &&
        !heightRanges.some((heightRange) =>
          isHeightInRange(actor.height_cm, heightRange),
        )
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ko-KR");
      return (
        (bookmarkIndexByActorId.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (bookmarkIndexByActorId.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      );
    });

  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  return {
    items: filtered.slice(from, to),
    total: filtered.length,
    page,
    pageSize,
  };
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

function normalizeSavedValues(value: SavedFilterValue | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function isAgeInGroup(age: number | null, group: string) {
  if (age === null) return false;
  if (group === "10s") return age >= 10 && age < 20;
  if (group === "20s") return age >= 20 && age < 30;
  if (group === "30s") return age >= 30 && age < 40;
  if (group === "40s") return age >= 40 && age < 50;
  if (group === "50s_plus") return age >= 50;
  return true;
}

function isHeightInRange(heightCm: number | null, range: string) {
  if (heightCm === null) return false;
  if (range === "under_120") return heightCm < 120;
  if (range === "120_130") return heightCm >= 120 && heightCm <= 130;
  if (range === "131_140") return heightCm >= 131 && heightCm <= 140;
  if (range === "141_150") return heightCm >= 141 && heightCm <= 150;
  if (range === "151_160") return heightCm >= 151 && heightCm <= 160;
  if (range === "161_170") return heightCm >= 161 && heightCm <= 170;
  if (range === "171_180") return heightCm >= 171 && heightCm <= 180;
  if (range === "181_190") return heightCm >= 181 && heightCm <= 190;
  if (range === "over_191") return heightCm > 191;
  return true;
}
