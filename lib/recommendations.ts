export type RecommendationCredit = {
  title: string | null;
  role?: string | null;
  year?: number | null;
};

export type RecommendationDetails = {
  match_score: number;
  match_reasons: string[];
};

export type ActorRecommendationProfile = {
  age: number | null;
  gender: string | null;
  region: string | null;
  genres: readonly string[];
  skills: readonly string[];
  image_tags: readonly string[];
  credits?: readonly RecommendationCredit[];
};

export type RecommendableJob = {
  id: string;
  title: string;
  genre: string | null;
  region: string | null;
  deadline?: string | null;
  created_at?: string;
  requirements: readonly string[];
  role_name?: string | null;
  role_type: string | null;
  target_age_groups: readonly string[];
  target_age_max?: number | null;
  target_age_min?: number | null;
  target_genders: readonly string[];
};

export type RecommendableActor = {
  id: string;
  name?: string;
  age: number | null;
  gender: string | null;
  genres: readonly string[];
  image_tags: readonly string[];
  region: string | null;
  skills: readonly string[];
  updated_at?: string;
};

export function rankJobsForActor<T extends RecommendableJob>(
  jobs: readonly T[],
  profile: ActorRecommendationProfile | null,
) {
  return jobs
    .map((job) => ({
      ...job,
      ...scoreJobForActor(job, profile),
    }))
    .sort(compareRecommendedJobs);
}

export function rankActorsForCasting<T extends RecommendableActor>(
  actors: readonly T[],
  jobs: readonly RecommendableJob[],
  creditsByActorId: ReadonlyMap<string, readonly RecommendationCredit[]>,
) {
  return actors
    .map((actor) => ({
      ...actor,
      ...scoreActorForCasting(actor, jobs, creditsByActorId.get(actor.id) ?? []),
    }))
    .sort(compareRecommendedActors);
}

function scoreActorForCasting(
  actor: RecommendableActor,
  jobs: readonly RecommendableJob[],
  credits: readonly RecommendationCredit[],
): RecommendationDetails {
  const profile: ActorRecommendationProfile = { ...actor, credits };
  const best = jobs.reduce<RecommendationDetails>(
    (currentBest, job) => {
      const scored = scoreJobForActor(job, profile);
      return scored.match_score > currentBest.match_score ? scored : currentBest;
    },
    { match_score: 0, match_reasons: [] },
  );
  const score = best.match_score + getProfileCompletenessBoost(actor);
  const reasons =
    best.match_score > 0
      ? ["진행 중인 공고와 가까워요", ...best.match_reasons]
      : best.match_reasons;

  return {
    match_score: Math.min(100, score),
    match_reasons: uniqueReasons(reasons).slice(0, 3),
  };
}

function scoreJobForActor(
  job: RecommendableJob,
  profile: ActorRecommendationProfile | null,
): RecommendationDetails {
  if (!profile) return { match_score: 0, match_reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  if (matchesGenre(profile.genres, job.genre)) {
    score += 26;
    reasons.push("장르가 맞아요");
  }

  if (matchesRegion(profile.region, job.region)) {
    score += 18;
    reasons.push("지역이 맞아요");
  }

  if (matchesGender(profile.gender, job.target_genders)) {
    score += 15;
    reasons.push("성별 조건이 맞아요");
  }

  if (matchesAge(profile.age, job)) {
    score += 17;
    reasons.push("나이 조건이 맞아요");
  }

  const requirementMatches = countLooseMatches(
    [...profile.skills, ...profile.image_tags],
    [...job.requirements, job.role_name, job.role_type, job.title],
  );
  if (requirementMatches > 0) {
    score += Math.min(18, 8 + requirementMatches * 5);
    reasons.push("요구 역량이 맞아요");
  }

  const careerScore = scoreCareer(profile.credits ?? [], job);
  if (careerScore >= 10) {
    score += careerScore;
    reasons.push("경력과 가까워요");
  } else if (careerScore > 0) {
    score += careerScore;
    reasons.push("등록 경력이 있어요");
  }

  return {
    match_score: Math.min(100, score),
    match_reasons: uniqueReasons(reasons).slice(0, 3),
  };
}

function matchesGenre(actorGenres: readonly string[], jobGenre: string | null) {
  if (!jobGenre) return false;
  return actorGenres.some((genre) => textMatches(genre, jobGenre));
}

function matchesRegion(actorRegion: string | null, jobRegion: string | null) {
  if (!actorRegion || !jobRegion) return false;
  const actor = normalize(actorRegion);
  const job = normalize(jobRegion);
  if (!actor || !job) return false;
  if (actor.includes("전국") || job.includes("전국")) return true;
  return actor.includes(job) || job.includes(actor);
}

function matchesGender(
  actorGender: string | null,
  targetGenders: readonly string[],
) {
  if (!actorGender || targetGenders.length === 0) return false;
  const actor = normalize(actorGender);
  return targetGenders.some((gender) => {
    const normalized = normalize(gender);
    return normalized === actor || normalized === "all" || normalized === "any";
  });
}

function matchesAge(age: number | null, job: RecommendableJob) {
  if (age === null) return false;
  const hasRange = job.target_age_min != null || job.target_age_max != null;

  if (hasRange) {
    const min = job.target_age_min ?? 0;
    const max = job.target_age_max ?? 200;
    return age >= min && age <= max;
  }

  const ageGroup = getAgeGroup(age);
  return Boolean(ageGroup && job.target_age_groups.includes(ageGroup));
}

function getAgeGroup(age: number) {
  if (age < 20) return "10s";
  if (age < 30) return "20s";
  if (age < 40) return "30s";
  if (age < 50) return "40s";
  return "50s_plus";
}

function countLooseMatches(
  terms: readonly (string | null | undefined)[],
  texts: readonly (string | null | undefined)[],
) {
  const normalizedTerms = uniqueNormalized(terms).filter((term) => term.length > 1);
  const normalizedTexts = uniqueNormalized(texts);

  return normalizedTerms.filter((term) =>
    normalizedTexts.some((text) => text.includes(term) || term.includes(text)),
  ).length;
}

function scoreCareer(
  credits: readonly RecommendationCredit[],
  job: RecommendableJob,
) {
  if (credits.length === 0) return 0;

  const jobTerms = uniqueNormalized([
    job.title,
    job.genre,
    job.role_name,
    job.role_type,
  ]).filter((term) => term.length > 1);

  const hasCloseCredit = credits.some((credit) => {
    const creditTerms = uniqueNormalized([credit.title, credit.role]).filter(
      (term) => term.length > 1,
    );
    return creditTerms.some((creditTerm) =>
      jobTerms.some(
        (jobTerm) =>
          creditTerm.includes(jobTerm) || jobTerm.includes(creditTerm),
      ),
    );
  });

  if (hasCloseCredit) return 12;
  return Math.min(6, Math.max(3, credits.length));
}

function getProfileCompletenessBoost(actor: RecommendableActor) {
  const signalCount =
    actor.genres.length + actor.skills.length + actor.image_tags.length;
  if (signalCount >= 6) return 5;
  if (signalCount >= 3) return 3;
  return 0;
}

function compareRecommendedJobs<T extends RecommendableJob & RecommendationDetails>(
  a: T,
  b: T,
) {
  if (b.match_score !== a.match_score) return b.match_score - a.match_score;
  return compareNullableDateAsc(a.deadline, b.deadline) || compareDateDesc(a.created_at, b.created_at);
}

function compareRecommendedActors<
  T extends RecommendableActor & RecommendationDetails,
>(a: T, b: T) {
  if (b.match_score !== a.match_score) return b.match_score - a.match_score;
  return compareDateDesc(a.updated_at, b.updated_at) || (a.name ?? "").localeCompare(b.name ?? "", "ko-KR");
}

function compareNullableDateAsc(a: string | null | undefined, b: string | null | undefined) {
  const aTime = a ? Date.parse(a) : Number.POSITIVE_INFINITY;
  const bTime = b ? Date.parse(b) : Number.POSITIVE_INFINITY;
  return aTime - bTime;
}

function compareDateDesc(a: string | null | undefined, b: string | null | undefined) {
  const aTime = a ? Date.parse(a) : 0;
  const bTime = b ? Date.parse(b) : 0;
  return bTime - aTime;
}

function textMatches(a: string | null | undefined, b: string | null | undefined) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
}

function uniqueReasons(reasons: readonly string[]) {
  return [...new Set(reasons.filter(Boolean))];
}

function uniqueNormalized(values: readonly (string | null | undefined)[]) {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("ko-KR");
}
