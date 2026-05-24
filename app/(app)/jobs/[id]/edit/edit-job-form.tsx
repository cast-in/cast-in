"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/features/date-picker";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_PLATFORM_OPTIONS,
  JOB_ROLE_TYPE_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";
import type { JobRow } from "@/lib/queries/jobs";
import { cn } from "@/lib/utils";
import { updateJobAction } from "./actions";

export function EditJobForm({ job }: { job: JobRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateJobAction(data);
      if (result && !result.ok) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && <ErrorNotice message={error} size="sm" />}

      <input type="hidden" name="job_id" value={job.id} />
      <input type="hidden" name="status" value={job.status} />

      <div className="grid gap-2">
        <Label htmlFor="title">공고 제목</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={job.title}
          placeholder="공고 제목을 입력해주세요"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="genre">장르</Label>
          <Input
            id="genre"
            name="genre"
            defaultValue={job.genre ?? ""}
            placeholder="공고 장르를 입력해주세요"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="region">촬영 지역</Label>
          <Input
            id="region"
            name="region"
            defaultValue={job.region ?? ""}
            placeholder="촬영 지역을 입력해주세요"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="fee_text">출연료</Label>
          <Input
            id="fee_text"
            name="fee_text"
            defaultValue={job.fee_text ?? ""}
            placeholder="출연료 조건을 입력해주세요"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="shooting_schedule">촬영 일정</Label>
          <Input
            id="shooting_schedule"
            name="shooting_schedule"
            defaultValue={job.shooting_schedule ?? ""}
            placeholder="촬영 일정을 입력해주세요"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="role_type">역할</Label>
          <Select id="role_type" name="role_type" defaultValue={job.role_type ?? ""}>
            <option value="">역할을 선택해주세요</option>
            {JOB_ROLE_TYPE_OPTIONS.map((roleType) => (
              <option key={roleType} value={roleType}>
                {roleType}
              </option>
            ))}
          </Select>
        </div>
        <ChoiceGroup
          legend="플랫폼/채널"
          name="platforms"
          options={JOB_PLATFORM_OPTIONS.map((platform) => ({
            label: platform,
            value: platform,
          }))}
          selectedValues={job.platforms}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ChoiceGroup
          legend="대상 성별"
          name="target_genders"
          options={JOB_TARGET_GENDER_OPTIONS}
          selectedValues={job.target_genders}
        />
        <ChoiceGroup
          legend="대상 연령대"
          name="target_age_groups"
          options={JOB_AGE_GROUP_OPTIONS}
          selectedValues={job.target_age_groups}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="deadline">마감 일시</Label>
        <DateTimePicker
          id="deadline"
          name="deadline"
          defaultValue={job.deadline}
          placeholder="마감 일시 선택"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="requirements">요건 (쉼표 구분)</Label>
        <Input
          id="requirements"
          name="requirements"
          defaultValue={job.requirements.join(", ")}
          placeholder="필요 조건을 쉼표로 구분해서 입력해주세요"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">상세 설명</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={job.description ?? ""}
          placeholder="프로젝트 소개, 촬영 일정, 페이 조건 등을 입력해주세요"
        />
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? "저장하는 중이에요" : "저장하기"}
        </Button>
      </div>
    </form>
  );
}

type ChoiceOption = {
  readonly label: string;
  readonly value: string;
};

function ChoiceGroup({
  legend,
  name,
  options,
  selectedValues,
}: {
  legend: string;
  name: string;
  options: readonly ChoiceOption[];
  selectedValues: readonly string[];
}) {
  const selected = new Set(selectedValues);

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.has(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex h-9 items-center rounded-full border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition",
                "peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
