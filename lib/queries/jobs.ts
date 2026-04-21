import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ApplicationStatus } from "@/types/enums";

export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

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

export type OpenJobPreview = Pick<
  JobRow,
  "id" | "title" | "genre" | "region" | "deadline" | "status"
>;

export async function listOpenJobsPreview(
  limit = 6,
): Promise<OpenJobPreview[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, genre, region, deadline, status")
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
  genres: string[];
  avatar_url: string | null;
};

export async function listActorPreviews(limit = 6): Promise<ActorPreview[]> {
  const supabase = await createClient();

  const { data: actorProfiles, error } = await supabase
    .from("actor_profiles")
    .select("user_id, region, age, genres")
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
      age: actorProfile.age ?? null,
      genres: actorProfile.genres ?? [],
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export type SearchActorsParams = {
  q?: string;
  region?: string;
  genre?: string;
  page?: number;
  pageSize?: number;
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
  const { q, region, genre, page = 1, pageSize = 12 } = params;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("actor_profiles")
    .select("user_id, region, age, genres, profiles!inner(name, avatar_url)", {
      count: "exact",
    })
    .eq("visibility", "public")
    .order("user_id", { ascending: true })
    .range(from, to);

  if (q?.trim()) {
    query = query.ilike("profiles.name", `%${q.trim()}%`);
  }
  if (region?.trim()) {
    query = query.ilike("region", `%${region.trim()}%`);
  }
  if (genre?.trim()) {
    query = query.contains("genres", [genre.trim()]);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const items: ActorPreview[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.user_id,
      name: profile?.name ?? "이름 미등록",
      region: row.region ?? null,
      age: row.age ?? null,
      genres: row.genres ?? [],
      avatar_url: profile?.avatar_url ?? null,
    };
  });

  return { items, total: count ?? 0, page, pageSize };
}

export type SearchJobsParams = {
  q?: string;
  region?: string;
  genre?: string;
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
    region,
    genre,
    sort = "deadline",
    jobState = "active",
    page = 1,
    pageSize = 12,
  } = params;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const now = new Date().toISOString();

  let query = supabase
    .from("jobs")
    .select("id, title, genre, region, deadline, status", { count: "exact" })
    .range(from, to);

  if (jobState === "active") {
    query = query.eq("status", "open").or(`deadline.is.null,deadline.gte.${now}`);
  } else if (jobState === "closed") {
    query = query.or(`status.neq.open,deadline.lt.${now}`);
  }

  if (q?.trim()) {
    const pattern = `%${q.trim()}%`;
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }
  if (region?.trim()) {
    query = query.ilike("region", `%${region.trim()}%`);
  }
  if (genre?.trim()) {
    query = query.ilike("genre", `%${genre.trim()}%`);
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
  memo: string | null;
  casting_memo: string | null;
  status: ApplicationStatus;
  created_at: string;
  actor_id: string;
  actor_name: string;
};

export async function listApplicants(jobId: string): Promise<Applicant[]> {
  const supabase = await createClient();
  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, memo, casting_memo, status, created_at, actor_id")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!apps || apps.length === 0) return [];

  const actorIds = apps.map((a) => a.actor_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", actorIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.name ?? "이름 미등록"]),
  );

  return apps.map((a) => ({
    id: a.id,
    memo: a.memo,
    casting_memo: a.casting_memo,
    status: a.status,
    created_at: a.created_at,
    actor_id: a.actor_id,
    actor_name: nameById.get(a.actor_id) ?? "이름 미등록",
  }));
}

export type JobWithCounts = JobRow & {
  applicant_count: number;
  reviewing_count: number;
  pass_count: number;
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
    { total: number; reviewing: number; pass: number }
  >();
  for (const j of jobs) byJob.set(j.id, { total: 0, reviewing: 0, pass: 0 });
  for (const a of apps ?? []) {
    const agg = byJob.get(a.job_id);
    if (!agg) continue;
    agg.total += 1;
    if (a.status === "reviewing") agg.reviewing += 1;
    if (a.status === "pass") agg.pass += 1;
  }

  return jobs.map((j) => {
    const agg = byJob.get(j.id) ?? { total: 0, reviewing: 0, pass: 0 };
    return {
      ...j,
      applicant_count: agg.total,
      reviewing_count: agg.reviewing,
      pass_count: agg.pass,
    };
  });
}

export type ApplicationWithJob = {
  id: string;
  created_at: string;
  memo: string | null;
  status: ApplicationStatus;
  job_id: string;
  job_title: string;
  job_genre: string | null;
  job_region: string | null;
  deadline: string | null;
  last_message_at: string | null;
};

export async function listMyApplicationsWithJobs(): Promise<ApplicationWithJob[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, created_at, memo, status, job_id")
    .eq("actor_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!applications || applications.length === 0) return [];

  const jobIds = applications.map((application) => application.job_id);
  const [{ data: jobs }, { data: rooms }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, genre, region, deadline")
      .in("id", jobIds),
    supabase
      .from("chat_rooms")
      .select("job_id, last_message_at")
      .eq("actor_id", user.id)
      .in("job_id", jobIds),
  ]);

  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));
  const lastMessageByJobId = new Map(
    (rooms ?? []).map((room) => [room.job_id, room.last_message_at]),
  );

  return applications
    .map((application) => {
      const job = jobById.get(application.job_id);
      if (!job) return null;

      return {
        id: application.id,
        created_at: application.created_at,
        memo: application.memo,
        status: application.status,
        job_id: application.job_id,
        job_title: job.title,
        job_genre: job.genre,
        job_region: job.region,
        deadline: job.deadline,
        last_message_at: lastMessageByJobId.get(application.job_id) ?? null,
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
