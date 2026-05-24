export const JOB_ROLE_TYPE_OPTIONS = [
  "주연",
  "조연",
  "단역",
  "엑스트라",
  "더빙 / 내레이션",
] as const;

export const JOB_TARGET_GENDER_OPTIONS = [
  { label: "여성", value: "female" },
  { label: "남성", value: "male" },
] as const;

export const JOB_AGE_GROUP_OPTIONS = [
  { label: "10대", value: "10s" },
  { label: "20대", value: "20s" },
  { label: "30대", value: "30s" },
  { label: "40대", value: "40s" },
  { label: "50대+", value: "50s_plus" },
] as const;

export const JOB_PLATFORM_OPTIONS = [
  "넷플릭스",
  "디즈니+",
  "티빙",
  "웨이브",
  "독립 영화",
] as const;

export type JobTargetGender = (typeof JOB_TARGET_GENDER_OPTIONS)[number]["value"];

export const JOB_TARGET_GENDER_VALUES = JOB_TARGET_GENDER_OPTIONS.map(
  (option) => option.value,
);
export const JOB_AGE_GROUP_VALUES = JOB_AGE_GROUP_OPTIONS.map(
  (option) => option.value,
);

const genderLabelByValue = new Map(
  JOB_TARGET_GENDER_OPTIONS.map((option) => [option.value, option.label]),
);
const ageGroupLabelByValue = new Map(
  JOB_AGE_GROUP_OPTIONS.map((option) => [option.value, option.label]),
);

export function formatJobRoleType(roleType: string | null | undefined) {
  return roleType?.trim() || "역할 협의";
}

export function formatJobGenderLabel(values: readonly string[] | null | undefined) {
  const genders = normalizeOptionValues(values, JOB_TARGET_GENDER_VALUES);
  if (genders.length === 0 || genders.length === JOB_TARGET_GENDER_VALUES.length) {
    return "성별 무관";
  }

  return genders.map((value) => genderLabelByValue.get(value) ?? value).join("/");
}

export function formatJobAgeGroupsLabel(
  values: readonly string[] | null | undefined,
) {
  const ageGroups = normalizeOptionValues(values, JOB_AGE_GROUP_VALUES);
  if (ageGroups.length === 0 || ageGroups.length === JOB_AGE_GROUP_VALUES.length) {
    return "연령 무관";
  }

  return ageGroups.map((value) => ageGroupLabelByValue.get(value) ?? value).join("/");
}

export function formatJobAudienceLabel({
  targetGenders,
  targetAgeGroups,
}: {
  targetGenders: readonly string[] | null | undefined;
  targetAgeGroups: readonly string[] | null | undefined;
}) {
  const genderLabel = formatJobGenderLabel(targetGenders);
  const ageLabel = formatJobAgeGroupsLabel(targetAgeGroups);

  if (genderLabel === "성별 무관" && ageLabel === "연령 무관") {
    return "성별/연령 무관";
  }
  if (genderLabel === "성별 무관") return ageLabel;
  if (ageLabel === "연령 무관") return genderLabel;
  return `${ageLabel} ${genderLabel}`;
}

export function formatJobPlatformsLabel(
  values: readonly string[] | null | undefined,
) {
  const platforms = normalizeOptionValues(values, JOB_PLATFORM_OPTIONS);
  if (platforms.length === 0) return "플랫폼 협의";
  return platforms.join(", ");
}

export function getPrimaryJobPlatform(
  values: readonly string[] | null | undefined,
) {
  return normalizeOptionValues(values, JOB_PLATFORM_OPTIONS)[0] ?? "CASTIN";
}

export function normalizeOptionValues<T extends string>(
  values: readonly string[] | null | undefined,
  allowedValues: readonly T[],
): T[] {
  const unique = new Set<T>();

  for (const value of values ?? []) {
    if (!allowedValues.includes(value as T)) continue;
    unique.add(value as T);
  }

  return [...unique];
}
