"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Info, Lightbulb, Plus, X } from "lucide-react";
import { BackButton } from "@/components/features/back-button";
import { DateTimePicker } from "@/components/features/date-picker";
import { JobMediaUploader } from "@/components/features/job-media-uploader";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  JOB_ROLE_TYPE_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";
import { cn } from "@/lib/utils";
import { createJobAction } from "./actions";

const GENRE_OPTIONS = [
  "드라마",
  "영화",
  "광고",
  "뮤지컬",
  "웹드라마",
  "숏폼",
  "시트콤",
  "예능",
  "뮤직비디오",
  "다큐멘터리",
  "연극",
  "기타",
] as const;

const REGION_OPTIONS = [
  "서울 전역",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "제주",
  "전국",
] as const;

const FEE_TYPE_OPTIONS = [
  { value: "negotiable", label: "협의" },
  { value: "per_episode", label: "회차" },
  { value: "daily", label: "일급" },
  { value: "flat", label: "총액" },
  { value: "other", label: "기타" },
] as const;

const GUIDE_ITEMS = [
  ["촬영 지역", "드롭다운으로 선택", "현재는 주요 지역을 제공해요."],
  ["모집 조건", "역할 유형, 성별 선택", "필요하면 숫자 나이 범위를 입력해요."],
  ["나이 구성 변경", "최소~최대 나이 입력", "예: 20 ~ 35"],
  ["협업 선택란 추가", "추가 질문 등록", "지원자가 답해야 할 항목을 만들 수 있어요."],
  ["출연료", "협의 / 회차 / 일급 / 기타", "금액이 있으면 숫자로 입력해요."],
  ["이미지 / 영상", "작품 포스터 및 무드보드", "이미지는 최대 3장, 영상은 1개까지 올려요."],
] as const;

type JobQuestionDraft = {
  id: string;
  label: string;
  required: boolean;
};

export function NewJobForm({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const [questions, setQuestions] = useState<JobQuestionDraft[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (mediaUploading) {
      toast.error("파일 업로드가 끝난 뒤 공고를 올려주세요.");
      return;
    }

    const data = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    if (submitter?.value) data.set("status", submitter.value);
    data.set("application_questions", JSON.stringify(getValidQuestions(questions)));

    startTransition(async () => {
      const result = await createJobAction(data);
      if (result && !result.ok) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BackButton fallbackHref="/jobs" />
          <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
            공고 올리기
          </h1>
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <Button
            type="submit"
            name="status"
            value="draft"
            color="neutral"
            variant="outline"
            disabled={pending || mediaUploading}
            className="border-foreground/20"
          >
            임시저장
          </Button>
          <Button
            type="submit"
            name="status"
            value="open"
            disabled={pending || mediaUploading}
          >
            {pending ? "올리는 중이에요" : "공고 올리기"}
          </Button>
        </div>
      </header>

      {error && <ErrorNotice message={error} size="sm" />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-4">
          <FormSection title="기본 정보">
            <div className="grid gap-2">
              <RequiredLabel htmlFor="title">공고 제목</RequiredLabel>
              <Input
                id="title"
                name="title"
                placeholder="예: 드라마 [도시의 밤] 조연 모집"
                aria-required="true"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <RequiredLabel htmlFor="production_name">
                  제작사 / 브랜드명
                </RequiredLabel>
                <Input
                  id="production_name"
                  name="production_name"
                  placeholder="예: JTBC 스튜디오, 나이키 코리아"
                  aria-required="true"
                />
              </div>
              <div className="grid gap-2">
                <RequiredLabel htmlFor="region">촬영 지역</RequiredLabel>
                <Select id="region" name="region" defaultValue="">
                  <option value="">예: 서울 전역</option>
                  {REGION_OPTIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <ChoicePills
              legend="장르"
              required
              name="genre"
              options={GENRE_OPTIONS.map((genre) => ({
                label: genre,
                value: genre,
              }))}
            />

            <div className="grid gap-2">
              <RequiredLabel htmlFor="deadline">마감 일시</RequiredLabel>
              <DateTimePicker
                id="deadline"
                name="deadline"
                placeholder="연도. 월. 일. --:--"
                minDate={new Date()}
              />
            </div>
          </FormSection>

          <FormSection title="이미지 / 영상">
            <JobMediaUploader
              userId={userId}
              onUploadingChange={setMediaUploading}
            />
          </FormSection>

          <FormSection title="모집 조건">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="role_name">역할명</Label>
                <Input
                  id="role_name"
                  name="role_name"
                  placeholder="예: 주인공 이수현, 형사 박준"
                />
              </div>
              <div className="grid gap-2">
                <RequiredLabel htmlFor="role_type">역할 유형</RequiredLabel>
                <Select id="role_type" name="role_type" defaultValue="">
                  <option value="">선택</option>
                  {JOB_ROLE_TYPE_OPTIONS.map((roleType) => (
                    <option key={roleType} value={roleType}>
                      {roleType}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <RequiredLabel htmlFor="target_gender">성별</RequiredLabel>
                <Select
                  id="target_gender"
                  name="target_genders"
                  defaultValue="female,male"
                >
                  <option value="female,male">무관</option>
                  {JOB_TARGET_GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-bold">나이</legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <Input
                    name="target_age_min"
                    inputMode="numeric"
                    placeholder="예: 20"
                    aria-label="최소 나이"
                  />
                  <span className="text-muted-foreground">~</span>
                  <Input
                    name="target_age_max"
                    inputMode="numeric"
                    placeholder="예: 35"
                    aria-label="최대 나이"
                  />
                </div>
              </fieldset>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requirements">기타 조건 / 필요 조건</Label>
              <Input
                id="requirements"
                name="requirements"
                placeholder="예: 연기 경력 2년 이상, 드라마 경험자 우대"
              />
            </div>
          </FormSection>

          <FormSection title="상세 정보">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="shooting_schedule">촬영 일정</Label>
                <Input
                  id="shooting_schedule"
                  name="shooting_schedule"
                  placeholder="예: 2026년 6월 중순 ~ 8월"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fee_type">출연료</Label>
                <div className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1fr)] gap-3">
                  <Select id="fee_type" name="fee_type" defaultValue="negotiable">
                    {FEE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    name="fee_amount"
                    inputMode="numeric"
                    placeholder="예: 1,500,000원"
                    aria-label="출연료 금액"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <RequiredLabel htmlFor="description">상세 설명</RequiredLabel>
              <Textarea
                id="description"
                name="description"
                rows={5}
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="프로젝트 소개, 촬영 환경, 제출 서류, 오디션 방식을 자유롭게 작성해주세요."
                aria-required="true"
              />
              <p className="text-right text-xs font-medium text-muted-foreground">
                {description.length} / 1000
              </p>
            </div>

            <ApplicationQuestionEditor
              questions={questions}
              onQuestionsChange={setQuestions}
            />

            <div className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
              <Button
                type="submit"
                name="status"
                value="open"
                disabled={pending || mediaUploading}
              >
                {pending ? "올리는 중이에요" : "공고 올리기"}
              </Button>
              <Button
                type="submit"
                name="status"
                value="draft"
                disabled={pending || mediaUploading}
                color="neutral"
                variant="outline"
                className="border-foreground/20"
              >
                임시저장
              </Button>
            </div>
          </FormSection>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <GuideCard />
          <TipCard />
        </aside>
      </div>
    </form>
  );
}

function FormSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-xl font-extrabold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}

function RequiredLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <Label htmlFor={htmlFor} className="font-bold">
      {children} <span className="text-destructive">*</span>
    </Label>
  );
}

function ChoicePills({
  legend,
  name,
  options,
  required = false,
}: {
  legend: string;
  name: string;
  options: readonly { label: string; value: string }[];
  required?: boolean;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-bold">
        {legend} {required ? <span className="text-destructive">*</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex h-9 items-center rounded-full border border-border bg-background px-4 text-sm font-bold text-foreground transition",
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

function ApplicationQuestionEditor({
  onQuestionsChange,
  questions,
}: {
  onQuestionsChange: (questions: JobQuestionDraft[]) => void;
  questions: JobQuestionDraft[];
}) {
  function addQuestion() {
    onQuestionsChange([
      ...questions,
      { id: randomId(), label: "", required: false },
    ]);
  }

  function updateQuestion(id: string, patch: Partial<JobQuestionDraft>) {
    onQuestionsChange(
      questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  }

  function removeQuestion(id: string) {
    onQuestionsChange(questions.filter((question) => question.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="soft-outline"
          onClick={addQuestion}
        >
          <Plus aria-hidden="true" />
          협업 선택란 추가
        </Button>
        <Info aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>

      {questions.length > 0 ? (
        <ul className="grid gap-2">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"
            >
              <Input
                value={question.label}
                onChange={(event) =>
                  updateQuestion(question.id, { label: event.target.value })
                }
                placeholder={`추가 질문 ${index + 1}`}
                aria-label={`추가 질문 ${index + 1}`}
              />
              <label className="inline-flex h-10 items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) =>
                    updateQuestion(question.id, { required: event.target.checked })
                  }
                  className="size-4 accent-primary"
                />
                필수
              </label>
              <Button
                type="button"
                size="icon-sm"
                color="neutral"
                variant="ghost"
                aria-label={`추가 질문 ${index + 1} 삭제`}
                onClick={() => removeQuestion(question.id)}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GuideCard() {
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xl font-extrabold tracking-normal">공고 올리기 가이드</h2>
      <ol className="space-y-4">
        {GUIDE_ITEMS.map(([title, line1, line2], index) => (
          <li key={title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
            <span className="grid size-5 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-extrabold">{title}</span>
              <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                {line1}
                <br />
                {line2}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TipCard() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <Lightbulb aria-hidden="true" className="size-4 text-warning" />
      <h2 className="mt-3 text-sm font-extrabold">TIP</h2>
      <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
        상세한 공고는 더 많은 지원자를 만날 수 있어요.
      </p>
    </section>
  );
}

function getValidQuestions(questions: JobQuestionDraft[]) {
  return questions
    .map((question) => ({
      label: question.label.trim(),
      required: question.required,
    }))
    .filter((question) => question.label.length > 0);
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
