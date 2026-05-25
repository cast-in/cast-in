"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
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
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ACTOR_HEIGHT_RANGE_OPTIONS,
  ACTOR_NATIONALITY_OPTIONS,
} from "@/lib/actor-filter-options";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";
import { cn } from "@/lib/utils";

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

type ActorFilterState = {
  ageGroup: string[];
  gender: string[];
  genre: string[];
  heightRange: string[];
  nationality: string[];
  region: string[];
  skill: string[];
};

export type ActorSearchPanelValues = {
  ageGroup: string[];
  gender: string[];
  genre: string[];
  heightRange: string[];
  nationality: string[];
  q: string;
  region: string[];
  skill: string[];
  sort: "recommended" | "latest" | "name";
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
  const router = useRouter();
  const formId = action.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const searchId = `${formId || "actor"}-search`;
  const sortId = `${formId || "actor"}-sort`;
  const filterPanelId = `${formId || "actor"}-filters`;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<ActorFilterState>(() =>
    toActorFilterState(values),
  );
  const selectedCounts = useMemo(
    () => ({
      ageGender: selectedFilters.gender.length + selectedFilters.ageGroup.length,
      genre: selectedFilters.genre.length,
      heightRange: selectedFilters.heightRange.length,
      nationality: selectedFilters.nationality.length,
      region: selectedFilters.region.length,
      skill: selectedFilters.skill.length,
      total:
        selectedFilters.nationality.length +
        selectedFilters.region.length +
        selectedFilters.genre.length +
        selectedFilters.skill.length +
        selectedFilters.gender.length +
        selectedFilters.ageGroup.length +
        selectedFilters.heightRange.length,
    }),
    [selectedFilters],
  );

  useEffect(() => {
    setSelectedFilters(toActorFilterState(values));
  }, [values]);

  function togglePanel() {
    setFiltersOpen((open) => !open);
  }

  function setFilterValue(key: keyof ActorFilterState, value: string, checked: boolean) {
    setSelectedFilters((current) => {
      const values = new Set(current[key]);
      if (checked) values.add(value);
      else values.delete(value);

      return { ...current, [key]: [...values] };
    });
  }

  function clearFilter(key: keyof ActorFilterState) {
    setSelectedFilters((current) => ({ ...current, [key]: [] }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    const q = String(formData.get("q") ?? "").trim();
    const sort = String(formData.get("sort") ?? "recommended").trim();

    if (q) query.set("q", q);
    appendQueryValues(query, "nationality", selectedFilters.nationality);
    appendQueryValues(query, "region", selectedFilters.region);
    appendQueryValues(query, "genre", selectedFilters.genre);
    appendQueryValues(query, "skill", selectedFilters.skill);
    appendQueryValues(query, "gender", selectedFilters.gender);
    appendQueryValues(query, "age_group", selectedFilters.ageGroup);
    appendQueryValues(query, "height", selectedFilters.heightRange);
    if (sort && sort !== "recommended") query.set("sort", sort);

    const qs = query.toString();
    setFiltersOpen(false);
    router.replace(qs ? `${action}?${qs}` : action, { scroll: false });
  }

  return (
    <form
      action={action}
      method="get"
      onSubmit={handleSubmit}
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
            <option value="recommended">추천순</option>
            <option value="latest">최신순</option>
            <option value="name">이름순</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <FilterSummaryButton
          label="국적"
          icon={Globe2}
          count={selectedCounts.nationality}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="지역"
          icon={MapPin}
          count={selectedCounts.region}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="장르"
          icon={Clapperboard}
          count={selectedCounts.genre}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="역할"
          icon={UserRound}
          count={selectedCounts.skill}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="성별 / 나이"
          icon={UserRound}
          count={selectedCounts.ageGender}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="필터"
          icon={SlidersHorizontal}
          tone="primary"
          count={selectedCounts.total}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
      </div>

      <div
        id={filterPanelId}
        aria-hidden={!filtersOpen}
        inert={!filtersOpen}
        className={cn(
          "grid transition-[grid-template-rows,opacity,transform,margin] duration-300 ease-out motion-reduce:transition-none",
          filtersOpen
            ? "mt-5 translate-y-0 grid-rows-[1fr] opacity-100"
            : "pointer-events-none mt-0 -translate-y-1 grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="rounded-lg border bg-background p-5">
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
              <FilterColumn
                title="국적"
                name="nationality"
                selectedValues={selectedFilters.nationality}
                options={ACTOR_NATIONALITY_OPTIONS}
                onClear={() => clearFilter("nationality")}
                onToggle={(value, checked) =>
                  setFilterValue("nationality", value, checked)
                }
              />
              <FilterColumn
                title="지역"
                name="region"
                selectedValues={selectedFilters.region}
                options={regionOptions}
                onClear={() => clearFilter("region")}
                onToggle={(value, checked) =>
                  setFilterValue("region", value, checked)
                }
              />
              <FilterColumn
                title="장르"
                name="genre"
                selectedValues={selectedFilters.genre}
                options={genreOptions}
                onClear={() => clearFilter("genre")}
                onToggle={(value, checked) =>
                  setFilterValue("genre", value, checked)
                }
              />
              <FilterColumn
                title="특기"
                name="skill"
                selectedValues={selectedFilters.skill}
                options={skillOptions}
                onClear={() => clearFilter("skill")}
                onToggle={(value, checked) =>
                  setFilterValue("skill", value, checked)
                }
              />
              <GenderAgeFilterColumn
                gender={selectedFilters.gender}
                ageGroup={selectedFilters.ageGroup}
                onClearGender={() => clearFilter("gender")}
                onClearAgeGroup={() => clearFilter("ageGroup")}
                onToggleGender={(value, checked) =>
                  setFilterValue("gender", value, checked)
                }
                onToggleAgeGroup={(value, checked) =>
                  setFilterValue("ageGroup", value, checked)
                }
              />
              <HeightFilterColumn
                selectedValues={selectedFilters.heightRange}
                onClear={() => clearFilter("heightRange")}
                onToggle={(value, checked) =>
                  setFilterValue("heightRange", value, checked)
                }
              />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                color="neutral"
                variant="outline"
                size="sm"
                className="w-32"
                onClick={() => setFiltersOpen(false)}
              >
                <X aria-hidden="true" className="size-4" />
                닫기
              </Button>
              <div className="flex justify-end gap-3">
                <Link
                  href={resetHref}
                  className={resetButtonClassName}
                  onClick={() => setFiltersOpen(false)}
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  초기화
                </Link>
                <Button type="submit" size="sm" className="w-32">
                  적용하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function FilterSummaryButton({
  icon: Icon,
  label,
  tone = "neutral",
  count,
  controlsId,
  expanded,
  onClick,
}: {
  icon: typeof Globe2;
  label: string;
  tone?: "neutral" | "primary";
  count: number;
  controlsId: string;
  expanded: boolean;
  onClick: () => void;
}) {
  const isPrimary = tone === "primary";
  const ariaLabel = isPrimary ? "상세 필터 열기" : `${label} 필터 선택`;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-controls={controlsId}
      aria-expanded={expanded}
      onClick={onClick}
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
      {count > 0 ? (
        <span className="grid size-5 place-items-center rounded-full border border-primary bg-primary-soft text-[10px] font-bold leading-none text-primary">
          {count}
        </span>
      ) : null}
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
  selectedValues,
  options,
  onClear,
  onToggle,
}: {
  title: string;
  name: string;
  selectedValues: string[];
  options: readonly FilterOption[];
  onClear: () => void;
  onToggle: (value: string, checked: boolean) => void;
}) {
  const normalizedOptions = normalizeFilterOptions(options);

  return (
    <fieldset className={filterColumnClassName}>
      <legend className="text-base font-bold">{title}</legend>
      <div className="mt-3 space-y-2">
        <FilterCheckbox
          name={name}
          label="전체"
          value=""
          checked={selectedValues.length === 0}
          onCheckedChange={onClear}
        />
        {normalizedOptions.map((option) => (
          <FilterCheckbox
            key={option.value}
            name={name}
            label={option.label}
            value={option.value}
            checked={selectedValues.includes(option.value)}
            onCheckedChange={(checked) => onToggle(option.value, checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function GenderAgeFilterColumn({
  gender,
  ageGroup,
  onClearGender,
  onClearAgeGroup,
  onToggleGender,
  onToggleAgeGroup,
}: {
  gender: string[];
  ageGroup: string[];
  onClearGender: () => void;
  onClearAgeGroup: () => void;
  onToggleGender: (value: string, checked: boolean) => void;
  onToggleAgeGroup: (value: string, checked: boolean) => void;
}) {
  return (
    <div className={filterColumnClassName}>
      <h3 className="text-base font-bold">성별 / 연령대</h3>
      <fieldset className="mt-3">
        <legend className="text-xs font-bold">성별</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterCheckbox
            name="gender"
            label="전체"
            value=""
            checked={gender.length === 0}
            compact
            onCheckedChange={onClearGender}
          />
          {JOB_TARGET_GENDER_OPTIONS.map((option) => (
            <FilterCheckbox
              key={option.value}
              name="gender"
              label={option.label}
              value={option.value}
              checked={gender.includes(option.value)}
              compact
              onCheckedChange={(checked) =>
                onToggleGender(option.value, checked)
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs font-bold">연령대</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterCheckbox
            name="age_group"
            label="전체"
            value=""
            checked={ageGroup.length === 0}
            compact
            onCheckedChange={onClearAgeGroup}
          />
          {JOB_AGE_GROUP_OPTIONS.map((option) => (
            <FilterCheckbox
              key={option.value}
              name="age_group"
              label={option.label}
              value={option.value}
              checked={ageGroup.includes(option.value)}
              compact
              onCheckedChange={(checked) =>
                onToggleAgeGroup(option.value, checked)
              }
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function HeightFilterColumn({
  selectedValues,
  onClear,
  onToggle,
}: {
  selectedValues: string[];
  onClear: () => void;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <fieldset className={filterColumnClassName}>
      <legend className="text-base font-bold">신장</legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <FilterCheckbox
          name="height"
          label="전체"
          value=""
          checked={selectedValues.length === 0}
          compact
          onCheckedChange={onClear}
        />
        {ACTOR_HEIGHT_RANGE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            name="height"
            label={option.label}
            value={option.value}
            checked={selectedValues.includes(option.value)}
            compact
            onCheckedChange={(checked) => onToggle(option.value, checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function FilterCheckbox({
  name,
  label,
  value,
  checked,
  onCheckedChange,
  compact = false,
}: {
  name: string;
  label: string;
  value: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <label className="cursor-pointer outline-none">
        <input
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={(event) => onCheckedChange(event.currentTarget.checked)}
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
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
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

function toActorFilterState(values: ActorSearchPanelValues): ActorFilterState {
  return {
    ageGroup: [...values.ageGroup],
    gender: [...values.gender],
    genre: [...values.genre],
    heightRange: [...values.heightRange],
    nationality: [...values.nationality],
    region: [...values.region],
    skill: [...values.skill],
  };
}

function appendQueryValues(
  query: URLSearchParams,
  key: string,
  values: readonly string[],
) {
  for (const value of values) {
    const normalized = value.trim();
    if (normalized) query.append(key, normalized);
  }
}
