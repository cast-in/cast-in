import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tv,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

const regionOptions = ["서울", "경기", "인천", "부산", "대구"];
const genreOptions = ["드라마", "영화", "연극", "뮤지컬", "광고"];

export type JobSearchPanelValues = {
  q: string;
  region: string;
  genre: string;
  roleType: string;
  targetGender: string;
  targetAgeGroup: string;
  platform: string;
  sort: "deadline" | "latest";
  jobState?: "active" | "closed" | "all";
};

export function JobSearchPanel({
  action,
  resetHref,
  searchLabel,
  values,
}: {
  action: string;
  resetHref: string;
  searchLabel: string;
  values: JobSearchPanelValues;
}) {
  const formId = action.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const searchId = `${formId || "job"}-search`;
  const sortId = `${formId || "job"}-sort`;

  return (
    <form
      action={action}
      method="get"
      className={cn(surfaceCardClassName, "px-5 py-6 md:px-6")}
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
            <option value="latest">최신순</option>
            <option value="deadline">마감 임박순</option>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <FilterSummary label="지역" icon={<MapPin aria-hidden="true" className="size-4" />} />
        <FilterSummary label="장르" icon={<Tv aria-hidden="true" className="size-4" />} />
        <FilterSummary label="역할" icon={<UserRound aria-hidden="true" className="size-4" />} />
        <FilterSummary
          label="성별 / 나이"
          icon={<UserRound aria-hidden="true" className="size-4" />}
        />
        <FilterSummary
          label="필터"
          icon={<SlidersHorizontal aria-hidden="true" className="size-4" />}
          tone="primary"
        />
      </div>

      <div className="mt-5 rounded-lg border bg-background p-5">
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-5">
          <FilterColumn
            title="지역"
            name="region"
            searchPlaceholder="지역 검색"
            selectedValue={values.region}
            options={regionOptions}
          />
          <FilterColumn
            title="장르"
            name="genre"
            searchPlaceholder="장르 검색"
            selectedValue={values.genre}
            options={genreOptions}
          />
          <FilterColumn
            title="역할"
            name="role"
            searchPlaceholder="역할 검색"
            selectedValue={values.roleType}
            options={JOB_ROLE_TYPE_OPTIONS}
          />
          <GenderAgeFilterColumn
            targetGender={values.targetGender}
            targetAgeGroup={values.targetAgeGroup}
          />
          <FilterColumn
            title="플랫폼 / 채널"
            name="platform"
            searchPlaceholder="채널 검색"
            selectedValue={values.platform}
            options={JOB_PLATFORM_OPTIONS}
          />
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Link
            href={resetHref}
            className={buttonVariants({
              color: "neutral",
              variant: "outline",
              size: "sm",
              className: "w-32",
            })}
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

function FilterSummary({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "primary";
}) {
  return (
    <Badge
      color={tone === "primary" ? "primary" : "neutral"}
      variant={tone === "primary" ? "soft-outline" : "outline"}
      size="lg"
      className="h-9 gap-2 rounded-lg px-3"
    >
      {icon}
      {label}
      <ChevronDown aria-hidden="true" className="size-4" />
    </Badge>
  );
}

type FilterOption = string | { label: string; value: string };

const filterColumnClassName =
  "min-w-0 border-b border-border pb-5 md:border-b-0 md:border-r md:pr-6 xl:last:border-r-0";

function FilterColumn({
  title,
  name,
  searchPlaceholder,
  selectedValue,
  options,
  showAllOption = true,
}: {
  title: string;
  name: string;
  searchPlaceholder?: string;
  selectedValue: string;
  options: readonly FilterOption[];
  showAllOption?: boolean;
}) {
  const normalizedOptions = normalizeFilterOptions(options);

  return (
    <fieldset className={filterColumnClassName}>
      <legend className="text-base font-bold">{title}</legend>
      {searchPlaceholder ? (
        <div className="relative mt-3">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            aria-label={`${title} 내부 검색`}
            placeholder={searchPlaceholder}
            className="h-8 pl-7 text-xs"
          />
        </div>
      ) : null}
      <div className="mt-3 space-y-2">
        {showAllOption ? (
          <FilterRadio
            name={name}
            label="전체"
            value=""
            checked={!selectedValue || selectedValue === "all"}
          />
        ) : null}
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
      <p className="mt-3 text-xs font-medium text-primary">더보기</p>
    </fieldset>
  );
}

function GenderAgeFilterColumn({
  targetGender,
  targetAgeGroup,
}: {
  targetGender: string;
  targetAgeGroup: string;
}) {
  return (
    <div className={filterColumnClassName}>
      <h3 className="text-base font-bold">성별 / 연령대</h3>
      <fieldset className="mt-3">
        <legend className="text-xs font-bold">성별</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterRadio
            name="target_gender"
            label="전체"
            value=""
            checked={!targetGender}
            compact
          />
          {JOB_TARGET_GENDER_OPTIONS.map((option) => (
            <FilterRadio
              key={option.value}
              name="target_gender"
              label={option.label}
              value={option.value}
              checked={targetGender === option.value}
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
            checked={!targetAgeGroup}
            compact
          />
          {JOB_AGE_GROUP_OPTIONS.map((option) => (
            <FilterRadio
              key={option.value}
              name="age_group"
              label={option.label}
              value={option.value}
              checked={targetAgeGroup === option.value}
              compact
            />
          ))}
        </div>
      </fieldset>
    </div>
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
      <label
        className={cn(
          "cursor-pointer rounded-md border px-3 py-1 text-xs font-medium outline-none focus-within:ring-3 focus-within:ring-ring/50",
          checked
            ? "border-primary bg-primary-soft text-primary"
            : "border-border bg-background text-foreground",
        )}
      >
        <input
          type="radio"
          name={name}
          value={value}
          defaultChecked={checked}
          className="sr-only"
        />
        {label}
      </label>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md text-xs font-medium outline-none focus-within:ring-3 focus-within:ring-ring/50",
        checked ? "text-primary" : "text-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-3.5 place-items-center rounded-sm border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background",
        )}
        aria-hidden="true"
      >
        {checked ? <Check className="size-2.5" /> : null}
      </span>
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function normalizeFilterOptions(options: readonly FilterOption[]) {
  return options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
}
