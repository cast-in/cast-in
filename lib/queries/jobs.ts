import { calculateAge } from "@/lib/format";
import { parseSocialLinks, type ActorSocialLink } from "@/lib/social-links";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ApplicationStatus } from "@/types/enums";

export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
export type JobApplicationQuestion =
  Database["public"]["Tables"]["job_application_questions"]["Row"];

export async function listMyJobs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("casting_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listJobApplicationQuestions(
  jobId: string,
): Promise<JobApplicationQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_application_questions")
    .select("id, job_id, label, required, sort_order, created_at")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type JobDetailMeta = {
  applicant_count: number;
  casting_avatar_url: string | null;
  casting_company_name: string | null;
  casting_contact: string | null;
  casting_intro: string | null;
  casting_job_count: number;
  casting_name: string;
};

export async function getJobDetailMeta(
  job: Pick<JobRow, "id" | "casting_id">,
): Promise<JobDetailMeta> {
  const supabase = await createClient();
  const [
    { data: profile, error: profileError },
    { data: castingProfile, error: castingProfileError },
    { count: castingJobCount, error: castingJobCountError },
    { count: applicantCount, error: applicantCountError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", job.casting_id)
      .maybeSingle(),
    supabase
      .from("casting_profiles")
      .select("company_name, contact, intro")
      .eq("user_id", job.casting_id)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("casting_id", job.casting_id),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id),
  ]);

  const error =
    profileError ??
    castingProfileError ??
    castingJobCountError ??
    applicantCountError;
  if (error) throw error;

  return {
    applicant_count: applicantCount ?? 0,
    casting_avatar_url: profile?.avatar_url ?? null,
    casting_company_name: castingProfile?.company_name ?? null,
    casting_contact: castingProfile?.contact ?? null,
    casting_intro: castingProfile?.intro ?? null,
    casting_job_count: castingJobCount ?? 0,
    casting_name:
      profile?.name ?? castingProfile?.company_name ?? "캐스팅 담당자",
  };
}

export type OpenJobPreview = Pick<
  JobRow,
  | "id"
  | "title"
  | "genre"
  | "region"
  | "deadline"
  | "status"
  | "requirements"
  | "role_type"
  | "target_genders"
  | "target_age_groups"
  | "platforms"
>;

export async function listOpenJobsPreview(
  limit = 6,
): Promise<OpenJobPreview[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, genre, region, deadline, status, requirements, role_type, target_genders, target_age_groups, platforms",
    )
    .eq("status", "open")
    .or(`deadline.is.null,deadline.gte.${now}`)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type ActorPreview = {
  id: string;
  name: string;
  region: string | null;
  age: number | null;
  gender: string | null;
  genres: string[];
  avatar_url: string | null;
};

export type CastingActorPreview = ActorPreview & {
  height_cm: number | null;
  image_tags: string[];
  nationalities: string[];
  skills: string[];
  updated_at: string;
  weight_kg: number | null;
};

export type ActorDetail = ActorPreview & {
  affiliation: string | null;
  bio: string | null;
  birth_date: string | null;
  email: string | null;
  gender: string | null;
  height_cm: number | null;
  image_tags: string[];
  social_links: ActorSocialLink[];
  skills: string[];
  updated_at: string;
  weight_kg: number | null;
};

export type LandingActor = ActorPreview & {
  bio: string | null;
  height_cm: number | null;
  portfolio_image_urls: string[];
  skills: string[];
  updated_at: string;
};

export async function listActorPreviews(limit = 6): Promise<ActorPreview[]> {
  const supabase = await createClient();

  const { data: actorProfiles, error } = await supabase
    .from("actor_profiles")
    .select("user_id, region, birth_date, gender, genres")
    .eq("visibility", "public")
    .limit(limit);
  if (error) throw error;
  if (!actorProfiles || actorProfiles.length === 0) return [];

  const actorIds = actorProfiles.map((actorProfile) => actorProfile.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", actorIds);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return actorProfiles.map((actorProfile) => {
    const profile = profileById.get(actorProfile.user_id);
    return {
      id: actorProfile.user_id,
      name: profile?.name ?? "이름 미등록",
      region: actorProfile.region ?? null,
      age: calculateAge(actorProfile.birth_date ?? null),
      gender: actorProfile.gender ?? null,
      genres: actorProfile.genres ?? [],
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export async function listLandingActors(limit = 18): Promise<LandingActor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("actor_profiles")
    .select(
      "user_id, bio, birth_date, gender, height_cm, region, genres, skills, updated_at, profiles!inner(name, avatar_url)",
    )
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(limit * 3);

  if (error) throw error;

  const actors = (data ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      return {
        id: row.user_id,
        name: profile?.name ?? "이름 미등록",
        region: row.region ?? null,
        age: calculateAge(row.birth_date ?? null),
        gender: row.gender ?? null,
        genres: row.genres ?? [],
        avatar_url: profile?.avatar_url ?? null,
        bio: row.bio ?? null,
        height_cm: row.height_cm ?? null,
        portfolio_image_urls: [],
        skills: row.skills ?? [],
        updated_at: row.updated_at,
      };
    })
    .filter((actor) => actor.avatar_url)
    .slice(0, limit);

  if (actors.length === 0) return [];

  const actorIds = actors.map((actor) => actor.id);
  const { data: portfolioItems, error: portfolioError } = await supabase
    .from("portfolio_items")
    .select("actor_id, url")
    .in("actor_id", actorIds)
    .eq("type", "image")
    .order("created_at", { ascending: false });

  if (portfolioError) throw portfolioError;

  const imageUrlsByActorId = new Map<string, string[]>();
  for (const item of portfolioItems ?? []) {
    const urls = imageUrlsByActorId.get(item.actor_id) ?? [];
    if (urls.length < 3) {
      urls.push(item.url);
      imageUrlsByActorId.set(item.actor_id, urls);
    }
  }

  return actors.map((actor) => ({
    ...actor,
    portfolio_image_urls: imageUrlsByActorId.get(actor.id) ?? [],
  }));
}

type SearchFilterValue = string | readonly string[];

export type SearchActorsParams = {
  q?: string;
  region?: SearchFilterValue;
  genre?: SearchFilterValue;
  gender?: "male" | "female" | readonly string[];
  page?: number;
  pageSize?: number;
};

export type SearchCastingActorsParams = SearchActorsParams & {
  ageGroup?: SearchFilterValue;
  heightRange?: SearchFilterValue;
  nationality?: SearchFilterValue;
  skill?: SearchFilterValue;
  sort?: "latest" | "name";
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function searchActors(
  params: SearchActorsParams = {},
): Promise<PagedResult<ActorPreview>> {
  const { q, page = 1, pageSize = 12 } = params;
  const regions = normalizeSearchValues(params.region);
  const genres = normalizeSearchValues(params.genre);
  const genders = normalizeSearchValues(params.gender);
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("actor_profiles")
    .select("user_id, region, birth_date, gender, genres, profiles!inner(name, avatar_url)", {
      count: "exact",
    })
    .eq("visibility", "public")
    .order("user_id", { ascending: true })
    .range(from, to);

  if (q?.trim()) {
    query = query.ilike("profiles.name", `%${q.trim()}%`);
  }
  if (regions.length === 1) {
    query = query.ilike("region", `%${regions[0]}%`);
  } else if (regions.length > 1) {
    query = query.or(
      regions.map((region) => `region.ilike.%${region}%`).join(","),
    );
  }
  if (genres.length > 0) {
    query = query.overlaps("genres", genres);
  }
  if (genders.length === 1) {
    query = query.eq("gender", genders[0]);
  } else if (genders.length > 1) {
    query = query.in("gender", genders);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const items: ActorPreview[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.user_id,
      name: profile?.name ?? "이름 미등록",
      region: row.region ?? null,
      age: calculateAge(row.birth_date ?? null),
      gender: row.gender ?? null,
      genres: row.genres ?? [],
      avatar_url: profile?.avatar_url ?? null,
    };
  });

  return { items, total: count ?? 0, page, pageSize };
}

export async function searchCastingActors(
  params: SearchCastingActorsParams = {},
): Promise<PagedResult<CastingActorPreview>> {
  const {
    q,
    sort = "latest",
    page = 1,
    pageSize = 12,
  } = params;
  const regions = normalizeSearchValues(params.region);
  const genres = normalizeSearchValues(params.genre);
  const genders = normalizeSearchValues(params.gender);
  const ageGroups = normalizeSearchValues(params.ageGroup);
  const heightRanges = normalizeSearchValues(params.heightRange);
  const nationalities = normalizeSearchValues(params.nationality);
  const skills = normalizeSearchValues(params.skill);
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("actor_profiles")
    .select(
      "user_id, region, birth_date, gender, genres, height_cm, weight_kg, image_tags, nationalities, skills, updated_at, profiles!inner(name, avatar_url)",
      { count: "exact" },
    )
    .eq("visibility", "public");

  if (q?.trim()) {
    query = query.ilike("profiles.name", `%${q.trim()}%`);
  }
  if (regions.length === 1) {
    query = query.ilike("region", `%${regions[0]}%`);
  } else if (regions.length > 1) {
    query = query.or(
      regions.map((region) => `region.ilike.%${region}%`).join(","),
    );
  }
  if (genres.length > 0) {
    query = query.overlaps("genres", genres);
  }
  if (genders.length === 1) {
    query = query.eq("gender", genders[0]);
  } else if (genders.length > 1) {
    query = query.in("gender", genders);
  }
  if (nationalities.length > 0) {
    query = query.overlaps("nationalities", nationalities);
  }
  if (skills.length > 0) {
    query = query.overlaps("skills", skills);
  }
  query = applyBirthDateFilters(query, ageGroups);
  query = applyHeightFilters(query, heightRanges);

  if (sort === "name") {
    query = query.order("profiles(name)", { ascending: true });
  } else {
    query = query.order("updated_at", { ascending: false });
  }
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    items: (data ?? []).map((row): CastingActorPreview => {
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
    }),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getActorDetail(actorId: string): Promise<ActorDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actor_profiles")
    .select(
      "user_id, affiliation, bio, birth_date, gender, height_cm, image_tags, region, genres, skills, social_links, updated_at, weight_kg, profiles!inner(name, avatar_url, email)",
    )
    .eq("user_id", actorId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return {
    id: data.user_id,
    name: profile?.name ?? "이름 미등록",
    email: profile?.email ?? null,
    region: data.region ?? null,
    age: calculateAge(data.birth_date ?? null),
    genres: data.genres ?? [],
    avatar_url: profile?.avatar_url ?? null,
    affiliation: data.affiliation ?? null,
    bio: data.bio ?? null,
    birth_date: data.birth_date ?? null,
    gender: data.gender ?? null,
    height_cm: data.height_cm ?? null,
    image_tags: data.image_tags ?? [],
    social_links: parseSocialLinks(data.social_links),
    skills: data.skills ?? [],
    updated_at: data.updated_at,
    weight_kg: data.weight_kg ?? null,
  };
}

function getBirthDateRangeForAgeGroup(group: string | undefined) {
  if (!group?.trim()) return null;

  if (group === "10s") {
    return { after: dateYearsAgo(20), onOrBefore: dateYearsAgo(10) };
  }
  if (group === "20s") {
    return { after: dateYearsAgo(30), onOrBefore: dateYearsAgo(20) };
  }
  if (group === "30s") {
    return { after: dateYearsAgo(40), onOrBefore: dateYearsAgo(30) };
  }
  if (group === "40s") {
    return { after: dateYearsAgo(50), onOrBefore: dateYearsAgo(40) };
  }
  if (group === "50s_plus") {
    return { onOrBefore: dateYearsAgo(50) };
  }

  return null;
}

function getHeightCmRange(range: string | undefined) {
  if (!range?.trim()) return null;

  if (range === "under_120") return { lt: 120 };
  if (range === "120_130") return { gte: 120, lte: 130 };
  if (range === "131_140") return { gte: 131, lte: 140 };
  if (range === "141_150") return { gte: 141, lte: 150 };
  if (range === "151_160") return { gte: 151, lte: 160 };
  if (range === "161_170") return { gte: 161, lte: 170 };
  if (range === "171_180") return { gte: 171, lte: 180 };
  if (range === "181_190") return { gte: 181, lte: 190 };
  if (range === "over_191") return { gt: 191 };

  return null;
}

type RangeFilterQuery<T> = {
  gt(column: string, value: string | number): T;
  gte(column: string, value: string | number): T;
  lt(column: string, value: string | number): T;
  lte(column: string, value: string | number): T;
  or(filters: string): T;
};

function applyBirthDateFilters<T extends RangeFilterQuery<T>>(
  query: T,
  ageGroups: readonly string[],
) {
  if (ageGroups.length === 0) return query;
  if (ageGroups.length === 1) {
    const birthDateRange = getBirthDateRangeForAgeGroup(ageGroups[0]);
    if (birthDateRange?.after) {
      query = query.gt("birth_date", birthDateRange.after);
    }
    if (birthDateRange?.onOrBefore) {
      query = query.lte("birth_date", birthDateRange.onOrBefore);
    }
    return query;
  }

  const clauses = ageGroups
    .map((ageGroup) => {
      const range = getBirthDateRangeForAgeGroup(ageGroup);
      if (!range) return "";

      const rangeClauses = [
        range.after ? `birth_date.gt.${range.after}` : "",
        range.onOrBefore ? `birth_date.lte.${range.onOrBefore}` : "",
      ].filter(Boolean);

      return rangeClauses.length > 1
        ? `and(${rangeClauses.join(",")})`
        : rangeClauses[0];
    })
    .filter(Boolean);

  return clauses.length > 0 ? query.or(clauses.join(",")) : query;
}

function applyHeightFilters<T extends RangeFilterQuery<T>>(
  query: T,
  heightRanges: readonly string[],
) {
  if (heightRanges.length === 0) return query;
  if (heightRanges.length === 1) {
    const heightCmRange = getHeightCmRange(heightRanges[0]);
    if (heightCmRange?.gt !== undefined) {
      query = query.gt("height_cm", heightCmRange.gt);
    }
    if (heightCmRange?.gte !== undefined) {
      query = query.gte("height_cm", heightCmRange.gte);
    }
    if (heightCmRange?.lt !== undefined) {
      query = query.lt("height_cm", heightCmRange.lt);
    }
    if (heightCmRange?.lte !== undefined) {
      query = query.lte("height_cm", heightCmRange.lte);
    }
    return query;
  }

  const clauses = heightRanges
    .map((heightRange) => {
      const range = getHeightCmRange(heightRange);
      if (!range) return "";

      const rangeClauses = [
        range.gt !== undefined ? `height_cm.gt.${range.gt}` : "",
        range.gte !== undefined ? `height_cm.gte.${range.gte}` : "",
        range.lt !== undefined ? `height_cm.lt.${range.lt}` : "",
        range.lte !== undefined ? `height_cm.lte.${range.lte}` : "",
      ].filter(Boolean);

      return rangeClauses.length > 1
        ? `and(${rangeClauses.join(",")})`
        : rangeClauses[0];
    })
    .filter(Boolean);

  return clauses.length > 0 ? query.or(clauses.join(",")) : query;
}

function normalizeSearchValues(value: SearchFilterValue | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function dateYearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export type SearchJobsParams = {
  q?: string;
  region?: SearchFilterValue;
  genre?: SearchFilterValue;
  requirement?: string;
  roleType?: SearchFilterValue;
  targetGender?: SearchFilterValue;
  targetAgeGroup?: SearchFilterValue;
  platform?: SearchFilterValue;
  sort?: "deadline" | "latest";
  jobState?: "active" | "closed" | "all";
  page?: number;
  pageSize?: number;
};

export async function searchOpenJobs(
  params: SearchJobsParams = {},
): Promise<PagedResult<OpenJobPreview>> {
  const {
    q,
    requirement,
    sort = "deadline",
    jobState = "active",
    page = 1,
    pageSize = 12,
  } = params;
  const regions = normalizeSearchValues(params.region);
  const genres = normalizeSearchValues(params.genre);
  const roleTypes = normalizeSearchValues(params.roleType);
  const targetGenders = normalizeSearchValues(params.targetGender);
  const targetAgeGroups = normalizeSearchValues(params.targetAgeGroup);
  const platforms = normalizeSearchValues(params.platform);
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const now = new Date().toISOString();

  let query = supabase
    .from("jobs")
    .select(
      "id, title, genre, region, deadline, status, requirements, role_type, target_genders, target_age_groups, platforms",
      { count: "exact" },
    )
    .range(from, to);

  if (jobState === "active") {
    query = query.eq("status", "open").or(`deadline.is.null,deadline.gte.${now}`);
  } else if (jobState === "closed") {
    query = query.or(`status.neq.open,deadline.lt.${now}`);
  }

  if (q?.trim()) {
    const pattern = `%${q.trim()}%`;
    query = query.or(
      `title.ilike.${pattern},description.ilike.${pattern},role_type.ilike.${pattern}`,
    );
  }
  if (regions.length === 1) {
    query = query.ilike("region", `%${regions[0]}%`);
  } else if (regions.length > 1) {
    query = query.or(
      regions.map((region) => `region.ilike.%${region}%`).join(","),
    );
  }
  if (genres.length === 1) {
    query = query.ilike("genre", `%${genres[0]}%`);
  } else if (genres.length > 1) {
    query = query.or(genres.map((genre) => `genre.ilike.%${genre}%`).join(","));
  }
  if (requirement?.trim()) {
    query = query.contains("requirements", [requirement.trim()]);
  }
  if (roleTypes.length === 1) {
    query = query.eq("role_type", roleTypes[0]);
  } else if (roleTypes.length > 1) {
    query = query.in("role_type", roleTypes);
  }
  if (targetGenders.length > 0) {
    query = query.overlaps("target_genders", targetGenders);
  }
  if (targetAgeGroups.length > 0) {
    query = query.overlaps("target_age_groups", targetAgeGroups);
  }
  if (platforms.length > 0) {
    query = query.overlaps("platforms", platforms);
  }

  if (sort === "latest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("deadline", { ascending: true, nullsFirst: false });
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { items: data ?? [], total: count ?? 0, page, pageSize };
}

export type Applicant = {
  id: string;
  job_id: string;
  memo: string | null;
  casting_memo: string | null;
  status: ApplicationStatus;
  created_at: string;
  actor_id: string;
  actor_name: string;
  actor_avatar_url: string | null;
  actor_age: number | null;
  actor_gender: string | null;
  actor_region: string | null;
  actor_height_cm: number | null;
  actor_weight_kg: number | null;
  actor_genres: string[];
  actor_skills: string[];
  actor_image_tags: string[];
};

export async function listApplicants(jobId: string): Promise<Applicant[]> {
  const supabase = await createClient();
  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, job_id, memo, casting_memo, status, created_at, actor_id")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!apps || apps.length === 0) return [];

  const actorIds = apps.map((a) => a.actor_id);
  const [{ data: profiles }, { data: actorProfiles }] = await Promise.all([
    supabase.from("profiles").select("id, name, avatar_url").in("id", actorIds),
    supabase
      .from("actor_profiles")
      .select(
        "user_id, birth_date, gender, height_cm, image_tags, region, genres, skills, weight_kg",
      )
      .in("user_id", actorIds),
  ]);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.name ?? "이름 미등록"]),
  );
  const avatarById = new Map(
    (profiles ?? []).map((p) => [p.id, p.avatar_url ?? null]),
  );
  const actorProfileById = new Map(
    (actorProfiles ?? []).map((profile) => [profile.user_id, profile]),
  );

  return apps.map((a) => {
    const actorProfile = actorProfileById.get(a.actor_id);

    return {
      id: a.id,
      job_id: a.job_id,
      memo: a.memo,
      casting_memo: a.casting_memo,
      status: a.status,
      created_at: a.created_at,
      actor_id: a.actor_id,
      actor_name: nameById.get(a.actor_id) ?? "이름 미등록",
      actor_avatar_url: avatarById.get(a.actor_id) ?? null,
      actor_age: calculateAge(actorProfile?.birth_date ?? null),
      actor_gender: actorProfile?.gender ?? null,
      actor_region: actorProfile?.region ?? null,
      actor_height_cm: actorProfile?.height_cm ?? null,
      actor_weight_kg: actorProfile?.weight_kg ?? null,
      actor_genres: actorProfile?.genres ?? [],
      actor_skills: actorProfile?.skills ?? [],
      actor_image_tags: actorProfile?.image_tags ?? [],
    };
  });
}

export type JobWithCounts = JobRow & {
  applicant_count: number;
  pending_count: number;
  reviewing_count: number;
  pass_count: number;
  hold_count: number;
  reject_count: number;
};

export async function listMyJobsWithCounts(): Promise<JobWithCounts[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("casting_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!jobs || jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const { data: apps } = await supabase
    .from("applications")
    .select("job_id, status")
    .in("job_id", jobIds);

  const byJob = new Map<
    string,
    {
      total: number;
      pending: number;
      reviewing: number;
      pass: number;
      hold: number;
      reject: number;
    }
  >();
  for (const j of jobs) {
    byJob.set(j.id, {
      total: 0,
      pending: 0,
      reviewing: 0,
      pass: 0,
      hold: 0,
      reject: 0,
    });
  }
  for (const a of apps ?? []) {
    const agg = byJob.get(a.job_id);
    if (!agg) continue;
    agg.total += 1;
    if (a.status === "pending") agg.pending += 1;
    if (a.status === "reviewing") agg.reviewing += 1;
    if (a.status === "pass") agg.pass += 1;
    if (a.status === "hold") agg.hold += 1;
    if (a.status === "reject") agg.reject += 1;
  }

  return jobs.map((j) => {
    const agg = byJob.get(j.id) ?? {
      total: 0,
      pending: 0,
      reviewing: 0,
      pass: 0,
      hold: 0,
      reject: 0,
    };
    return {
      ...j,
      applicant_count: agg.total,
      pending_count: agg.pending,
      reviewing_count: agg.reviewing,
      pass_count: agg.pass,
      hold_count: agg.hold,
      reject_count: agg.reject,
    };
  });
}

export type ApplicationWithJob = {
  id: string;
  created_at: string;
  updated_at: string;
  memo: string | null;
  status: ApplicationStatus;
  job_id: string;
  job_title: string;
  job_genre: string | null;
  job_region: string | null;
  job_role_type: string | null;
  job_target_age_groups: string[];
  job_target_genders: string[];
  job_media_urls: string[];
  deadline: string | null;
  last_message_at: string | null;
  last_message_body: string | null;
  unread_message_count: number;
};

export async function listMyApplicationsWithJobs(
  options: { since?: string } = {},
): Promise<ApplicationWithJob[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let applicationsQuery = supabase
    .from("applications")
    .select("id, created_at, updated_at, memo, status, job_id")
    .eq("actor_id", user.id);

  if (options.since) {
    applicationsQuery = applicationsQuery.gte("created_at", options.since);
  }

  const { data: applications, error } = await applicationsQuery.order(
    "created_at",
    { ascending: false },
  );
  if (error) throw error;
  if (!applications || applications.length === 0) return [];

  const jobIds = applications.map((application) => application.job_id);
  const [{ data: jobs }, { data: rooms }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, genre, region, role_type, target_age_groups, target_genders, media_urls, deadline",
      )
      .in("id", jobIds),
    supabase
      .from("chat_rooms")
      .select("id, job_id, last_message_at")
      .eq("actor_id", user.id)
      .in("job_id", jobIds),
  ]);

  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));
  const roomsByJobId = new Map((rooms ?? []).map((room) => [room.job_id, room]));
  const lastMessageByJobId = new Map(
    (rooms ?? []).map((room) => [room.job_id, room.last_message_at]),
  );
  const roomIds = (rooms ?? []).map((room) => room.id);
  const unreadByRoomId = new Map<string, number>();
  const latestBodyByRoomId = new Map<string, string>();

  if (roomIds.length > 0) {
    const [{ data: unreadMessages }, { data: recentMessages }] = await Promise.all([
      supabase
        .from("messages")
        .select("room_id")
        .neq("sender_id", user.id)
        .is("read_at", null)
        .in("room_id", roomIds),
      supabase
        .from("messages")
        .select("room_id, body, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    for (const message of unreadMessages ?? []) {
      unreadByRoomId.set(
        message.room_id,
        (unreadByRoomId.get(message.room_id) ?? 0) + 1,
      );
    }

    for (const message of recentMessages ?? []) {
      if (!latestBodyByRoomId.has(message.room_id)) {
        latestBodyByRoomId.set(message.room_id, message.body);
      }
    }
  }

  return applications
    .map((application) => {
      const job = jobById.get(application.job_id);
      if (!job) return null;
      const room = roomsByJobId.get(application.job_id);

      return {
        id: application.id,
        created_at: application.created_at,
        updated_at: application.updated_at,
        memo: application.memo,
        status: application.status,
        job_id: application.job_id,
        job_title: job.title,
        job_genre: job.genre,
        job_region: job.region,
        job_role_type: job.role_type,
        job_target_age_groups: job.target_age_groups ?? [],
        job_target_genders: job.target_genders ?? [],
        job_media_urls: job.media_urls ?? [],
        deadline: job.deadline,
        last_message_at: lastMessageByJobId.get(application.job_id) ?? null,
        last_message_body: room ? (latestBodyByRoomId.get(room.id) ?? null) : null,
        unread_message_count: room ? (unreadByRoomId.get(room.id) ?? 0) : 0,
      };
    })
    .filter((application): application is ApplicationWithJob => Boolean(application));
}

export async function getMyApplicationForJob(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("applications")
    .select("id, created_at, memo, status, job_id")
    .eq("actor_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
