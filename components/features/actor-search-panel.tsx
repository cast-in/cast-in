import {
  Check,
  ChevronDown,
  Clapperboard,
  Globe2,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";
import { cn } from "@/lib/utils";

export const ACTOR_NATIONALITY_OPTIONS = [
  "Republic of Korea",
  "United States",
  "Japan",
  "China",
  "Canada",
] as const;

const regionOptions = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "제주",
  "전국",
] as const;
const genreOptions = [
  "드라마",
  "영화",
  "연극",
  "뮤지컬",
  "광고",
  "웹드라마",
  "뮤직비디오",
  "다큐멘터리",
  "예능",
  "숏폼",
  "시트콤",
] as const;
const skillOptions = [
  "액션",
  "보컬",
  "댄스",
  "영어",
  "일본어",
  "중국어",
  "승마",
  "펜싱",
  "기타",
  "피아노",
  "발레",
  "방송 진행",
  "MC",
  "태권도",
  "수영",
  "복싱",
] as const;

const resetButtonClassName = cn(
  buttonVariants({ color: "neutral", variant: "outline", size: "sm" }),
  "w-32",
);

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

export type ActorSearchPanelValues = {
  ageGroup: string;
  gender: "" | "female" | "male";
  genre: string;
  heightRange: string;
  nationality: string;
  q: string;
  region: string;
  skill: string;
  sort: "latest" | "name";
};

export function ActorSearchPanel({
  action,
  resetHref,
  searchLabel,
  values,
}: {
  action: string;
  resetHref: string;
  searchLabel: string;
  values: ActorSearchPanelValues;
}) {
  const formId = action.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const searchId = `${formId || "actor"}-search`;
  const sortId = `${formId || "actor"}-sort`;

  return (
    <form
      action={action}
      method="get"
      className="rounded-xl bg-card px-5 py-6 ring-1 ring-border/70 md:px-6"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={searchId}
            type="search"
            name="q"
            defaultValue={values.q}
            placeholder="작품과 배역에 어울리는 배우를 조건별로 찾아보세요."
            className="pl-10"
          />
        </div>
        <div>
          <label htmlFor={sortId} className="sr-only">
            정렬
          </label>
          <Select id={sortId} name="sort" defaultValue={values.sort}>
            <option value="latest">최신순</option>
            <option value="name">이름순</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <FilterSummaryButton label="국적" icon={Globe2} />
        <FilterSummaryButton label="지역" icon={MapPin} />
        <FilterSummaryButton label="장르" icon={Clapperboard} />
        <FilterSummaryButton label="역할" icon={UserRound} />
        <FilterSummaryButton label="성별 / 나이" icon={UserRound} />
        <FilterSummaryButton label="필터" icon={SlidersHorizontal} tone="primary" />
      </div>

      <div className="mt-5 rounded-lg border bg-background p-5">
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
          <FilterColumn
            title="국적"
            name="nationality"
            selectedValue={values.nationality}
            options={ACTOR_NATIONALITY_OPTIONS}
          />
          <FilterColumn
            title="지역"
            name="region"
            selectedValue={values.region}
            options={regionOptions}
          />
          <FilterColumn
            title="장르"
            name="genre"
            selectedValue={values.genre}
            options={genreOptions}
          />
          <FilterColumn
            title="특기"
            name="skill"
            selectedValue={values.skill}
            options={skillOptions}
          />
          <GenderAgeFilterColumn
            gender={values.gender}
            ageGroup={values.ageGroup}
          />
          <HeightFilterColumn selectedValue={values.heightRange} />
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Link
            href={resetHref}
            className={resetButtonClassName}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            초기화
          </Link>
          <Button type="submit" size="sm" className="w-32">
            적용하기
          </Button>
        </div>
      </div>
    </form>
  );
}

function FilterSummaryButton({
  icon: Icon,
  label,
  tone = "neutral",
}: {
  icon: typeof Globe2;
  label: string;
  tone?: "neutral" | "primary";
}) {
  const isPrimary = tone === "primary";

  return (
    <button
      type="button"
      aria-label={`${label} 필터 선택`}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isPrimary
          ? "border-primary bg-background text-primary hover:bg-primary-soft"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {isPrimary ? (
        <Plus aria-hidden="true" className="size-4" />
      ) : (
        <Icon aria-hidden="true" className="size-4" />
      )}
      {label}
      {!isPrimary ? <ChevronDown aria-hidden="true" className="size-4" /> : null}
    </button>
  );
}

type FilterOption = string | { label: string; value: string };

const filterColumnClassName =
  "min-w-0 border-b border-border pb-5 md:border-b-0 md:border-r md:pr-6 xl:last:border-r-0";

function FilterColumn({
  title,
  name,
  selectedValue,
  options,
}: {
  title: string;
  name: string;
  selectedValue: string;
  options: readonly FilterOption[];
}) {
  const normalizedOptions = normalizeFilterOptions(options);

  return (
    <fieldset className={filterColumnClassName}>
      <legend className="text-base font-bold">{title}</legend>
      <div className="mt-3 space-y-2">
        <FilterRadio
          name={name}
          label="전체"
          value=""
          checked={!selectedValue}
        />
        {normalizedOptions.map((option) => (
          <FilterRadio
            key={option.value}
            name={name}
            label={option.label}
            value={option.value}
            checked={selectedValue === option.value}
          />
        ))}
      </div>
    </fieldset>
  );
}

function GenderAgeFilterColumn({
  gender,
  ageGroup,
}: {
  gender: "" | "female" | "male";
  ageGroup: string;
}) {
  return (
    <div className={filterColumnClassName}>
      <h3 className="text-base font-bold">성별 / 연령대</h3>
      <fieldset className="mt-3">
        <legend className="text-xs font-bold">성별</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterRadio name="gender" label="전체" value="" checked={!gender} compact />
          {JOB_TARGET_GENDER_OPTIONS.map((option) => (
            <FilterRadio
              key={option.value}
              name="gender"
              label={option.label}
              value={option.value}
              checked={gender === option.value}
              compact
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs font-bold">연령대</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterRadio
            name="age_group"
            label="전체"
            value=""
            checked={!ageGroup}
            compact
          />
          {JOB_AGE_GROUP_OPTIONS.map((option) => (
            <FilterRadio
              key={option.value}
              name="age_group"
              label={option.label}
              value={option.value}
              checked={ageGroup === option.value}
              compact
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function HeightFilterColumn({ selectedValue }: { selectedValue: string }) {
  return (
    <fieldset className={filterColumnClassName}>
      <legend className="text-base font-bold">신장</legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <FilterRadio
          name="height"
          label="전체"
          value=""
          checked={!selectedValue}
          compact
        />
        {ACTOR_HEIGHT_RANGE_OPTIONS.map((option) => (
          <FilterRadio
            key={option.value}
            name="height"
            label={option.label}
            value={option.value}
            checked={selectedValue === option.value}
            compact
          />
        ))}
      </div>
    </fieldset>
  );
}

function FilterRadio({
  name,
  label,
  value,
  checked,
  compact = false,
}: {
  name: string;
  label: string;
  value: string;
  checked: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <label className="cursor-pointer outline-none">
        <input
          type="radio"
          name={name}
          value={value}
          defaultChecked={checked}
          className="peer sr-only"
        />
        <span className="inline-flex rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
          {label}
        </span>
      </label>
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md text-xs font-medium outline-none">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span
        className="grid size-3.5 place-items-center rounded-sm border border-border bg-background text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
        aria-hidden="true"
      >
        <Check className="size-2.5" />
      </span>
      <span className="text-foreground transition-colors peer-checked:text-primary">
        {label}
      </span>
    </label>
  );
}

function normalizeFilterOptions(options: readonly FilterOption[]) {
  return options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
}
