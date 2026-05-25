export const ACTOR_NATIONALITY_OPTIONS = [
  "Republic of Korea",
  "United States",
  "Japan",
  "China",
  "Canada",
] as const;

export const ACTOR_HEIGHT_RANGE_OPTIONS = [
  { label: "120cm 미만", value: "under_120" },
  { label: "120~130cm", value: "120_130" },
  { label: "131~140cm", value: "131_140" },
  { label: "141~150cm", value: "141_150" },
  { label: "151~160cm", value: "151_160" },
  { label: "161~170cm", value: "161_170" },
  { label: "171~180cm", value: "171_180" },
  { label: "181~190cm", value: "181_190" },
  { label: "191cm 초과", value: "over_191" },
] as const;
