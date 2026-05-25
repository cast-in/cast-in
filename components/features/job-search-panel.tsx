"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Clapperboard,
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
import { surfaceCardClassName } from "@/components/ui/surface-card";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_PLATFORM_OPTIONS,
  JOB_ROLE_TYPE_OPTIONS,
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

const resetButtonClassName = cn(
  buttonVariants({ color: "neutral", variant: "outline", size: "sm" }),
  "w-32",
);

type JobFilterState = {
  genre: string[];
  platform: string[];
  region: string[];
  roleType: string[];
  targetAgeGroup: string[];
  targetGender: string[];
};

export type JobSearchPanelValues = {
  q: string;
  region: string[];
  genre: string[];
  roleType: string[];
  targetGender: string[];
  targetAgeGroup: string[];
  platform: string[];
  sort: "recommended" | "deadline" | "latest";
  jobState?: "active" | "closed" | "all";
};

export function JobSearchPanel({
  action,
  resetHref,
  searchLabel,
  showRecommendedSort = false,
  values,
}: {
  action: string;
  resetHref: string;
  searchLabel: string;
  showRecommendedSort?: boolean;
  values: JobSearchPanelValues;
}) {
  const router = useRouter();
  const formId = action.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const searchId = `${formId || "job"}-search`;
  const sortId = `${formId || "job"}-sort`;
  const filterPanelId = `${formId || "job"}-filters`;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<JobFilterState>(() =>
    toJobFilterState(values),
  );
  const selectedCounts = useMemo(
    () => ({
      audience:
        selectedFilters.targetGender.length +
        selectedFilters.targetAgeGroup.length,
      genre: selectedFilters.genre.length,
      platform: selectedFilters.platform.length,
      region: selectedFilters.region.length,
      roleType: selectedFilters.roleType.length,
      total:
        selectedFilters.region.length +
        selectedFilters.genre.length +
        selectedFilters.roleType.length +
        selectedFilters.targetGender.length +
        selectedFilters.targetAgeGroup.length +
        selectedFilters.platform.length,
    }),
    [selectedFilters],
  );

  useEffect(() => {
    setSelectedFilters(toJobFilterState(values));
  }, [values]);

  function togglePanel() {
    setFiltersOpen((open) => !open);
  }

  function setFilterValue(key: keyof JobFilterState, value: string, checked: boolean) {
    setSelectedFilters((current) => {
      const values = new Set(current[key]);
      if (checked) values.add(value);
      else values.delete(value);

      return { ...current, [key]: [...values] };
    });
  }

  function clearFilter(key: keyof JobFilterState) {
    setSelectedFilters((current) => ({ ...current, [key]: [] }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    const q = String(formData.get("q") ?? "").trim();
    const defaultSort = showRecommendedSort ? "recommended" : "latest";
    const sort = String(formData.get("sort") ?? defaultSort).trim();
    const status = String(formData.get("status") ?? "active").trim();

    if (q) query.set("q", q);
    appendQueryValues(query, "region", selectedFilters.region);
    appendQueryValues(query, "genre", selectedFilters.genre);
    appendQueryValues(query, "role", selectedFilters.roleType);
    appendQueryValues(query, "target_gender", selectedFilters.targetGender);
    appendQueryValues(query, "age_group", selectedFilters.targetAgeGroup);
    appendQueryValues(query, "platform", selectedFilters.platform);
    if (sort && sort !== defaultSort) query.set("sort", sort);
    if (status && status !== "active") query.set("status", status);

    const qs = query.toString();
    setFiltersOpen(false);
    router.replace(qs ? `${action}?${qs}` : action, { scroll: false });
  }

  return (
    <form
      action={action}
      method="get"
      onSubmit={handleSubmit}
      className={cn(surfaceCardClassName, "px-5 py-6 shadow-none md:px-6")}
    >
      {values.jobState && values.jobState !== "active" ? (
        <input type="hidden" name="status" value={values.jobState} />
      ) : null}
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
            placeholder="작품명, 역할, 키워드로 검색해보세요"
            className="pl-10"
          />
        </div>
        <div>
          <label htmlFor={sortId} className="sr-only">
            정렬
          </label>
          <Select id={sortId} name="sort" defaultValue={values.sort}>
            {showRecommendedSort ? (
              <option value="recommended">추천순</option>
            ) : null}
            <option value="latest">최신순</option>
            <option value="deadline">마감 임박순</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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
          count={selectedCounts.roleType}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="성별 / 나이"
          icon={UserRound}
          count={selectedCounts.audience}
          controlsId={filterPanelId}
          expanded={filtersOpen}
          onClick={togglePanel}
        />
        <FilterSummaryButton
          label="플랫폼"
          icon={Calendar}
          count={selectedCounts.platform}
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
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-5">
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
                title="역할"
                name="role"
                selectedValues={selectedFilters.roleType}
                options={JOB_ROLE_TYPE_OPTIONS}
                onClear={() => clearFilter("roleType")}
                onToggle={(value, checked) =>
                  setFilterValue("roleType", value, checked)
                }
              />
              <GenderAgeFilterColumn
                targetGender={selectedFilters.targetGender}
                targetAgeGroup={selectedFilters.targetAgeGroup}
                onClearGender={() => clearFilter("targetGender")}
                onClearAgeGroup={() => clearFilter("targetAgeGroup")}
                onToggleGender={(value, checked) =>
                  setFilterValue("targetGender", value, checked)
                }
                onToggleAgeGroup={(value, checked) =>
                  setFilterValue("targetAgeGroup", value, checked)
                }
              />
              <FilterColumn
                title="플랫폼 / 채널"
                name="platform"
                selectedValues={selectedFilters.platform}
                options={JOB_PLATFORM_OPTIONS}
                onClear={() => clearFilter("platform")}
                onToggle={(value, checked) =>
                  setFilterValue("platform", value, checked)
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
  icon: typeof MapPin;
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
  showAllOption = true,
  onClear,
  onToggle,
}: {
  title: string;
  name: string;
  selectedValues: string[];
  options: readonly FilterOption[];
  showAllOption?: boolean;
  onClear: () => void;
  onToggle: (value: string, checked: boolean) => void;
}) {
  const normalizedOptions = normalizeFilterOptions(options);

  return (
    <fieldset className={filterColumnClassName}>
      <legend className="text-base font-bold">{title}</legend>
      <div className="mt-3 space-y-2">
        {showAllOption ? (
          <FilterCheckbox
            name={name}
            label="전체"
            value=""
            checked={selectedValues.length === 0}
            onCheckedChange={onClear}
          />
        ) : null}
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
  targetGender,
  targetAgeGroup,
  onClearGender,
  onClearAgeGroup,
  onToggleGender,
  onToggleAgeGroup,
}: {
  targetGender: string[];
  targetAgeGroup: string[];
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
            name="target_gender"
            label="전체"
            value=""
            checked={targetGender.length === 0}
            compact
            onCheckedChange={onClearGender}
          />
          {JOB_TARGET_GENDER_OPTIONS.map((option) => (
            <FilterCheckbox
              key={option.value}
              name="target_gender"
              label={option.label}
              value={option.value}
              checked={targetGender.includes(option.value)}
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
            checked={targetAgeGroup.length === 0}
            compact
            onCheckedChange={onClearAgeGroup}
          />
          {JOB_AGE_GROUP_OPTIONS.map((option) => (
            <FilterCheckbox
              key={option.value}
              name="age_group"
              label={option.label}
              value={option.value}
              checked={targetAgeGroup.includes(option.value)}
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

function toJobFilterState(values: JobSearchPanelValues): JobFilterState {
  return {
    genre: [...values.genre],
    platform: [...values.platform],
    region: [...values.region],
    roleType: [...values.roleType],
    targetAgeGroup: [...values.targetAgeGroup],
    targetGender: [...values.targetGender],
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
