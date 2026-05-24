"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { LandingActor } from "@/lib/queries/jobs";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

type LandingMode = "director" | "actor";

type PlaceholderItem = {
  id: string;
  label: string;
  tone: string;
};

type CompanyLogo = {
  name: string;
  src: string;
};

type JobPosting = {
  title: string;
  category: string;
  location: string;
  deadline: string;
  role: string;
  summary: string;
  tags: string[];
};

type SelectedJobPosting = JobPosting & {
  company: CompanyLogo;
};

const DIRECTOR_TONES = [
  "from-[#e8fff1] via-[#77df91] to-[#22c55e]",
  "from-[#f1f5f9] via-[#a3b3c7] to-[#44556b]",
  "from-[#fff7ed] via-[#fdba74] to-[#f97316]",
  "from-[#eef2ff] via-[#9aa7ff] to-[#4f46e5]",
  "from-[#fdf2f8] via-[#f9a8d4] to-[#db2777]",
  "from-[#ecfeff] via-[#67e8f9] to-[#0891b2]",
  "from-[#f7fee7] via-[#bef264] to-[#65a30d]",
  "from-[#faf5ff] via-[#d8b4fe] to-[#9333ea]",
  "from-[#fff1f2] via-[#fda4af] to-[#e11d48]",
  "from-[#eff6ff] via-[#93c5fd] to-[#2563eb]",
] as const;

const ACTOR_TONES = [
  "from-[#f0fdf4] via-[#86efac] to-[#16a34a]",
  "from-[#eff6ff] via-[#93c5fd] to-[#2563eb]",
  "from-[#fff7ed] via-[#fdba74] to-[#f97316]",
  "from-[#fdf2f8] via-[#f9a8d4] to-[#db2777]",
  "from-[#ecfeff] via-[#67e8f9] to-[#0891b2]",
  "from-[#faf5ff] via-[#d8b4fe] to-[#9333ea]",
  "from-[#fefce8] via-[#fde047] to-[#ca8a04]",
  "from-[#f1f5f9] via-[#94a3b8] to-[#334155]",
  "from-[#fff1f2] via-[#fda4af] to-[#e11d48]",
  "from-[#eef2ff] via-[#a5b4fc] to-[#4f46e5]",
] as const;

const DIRECTOR_ITEMS = createPlaceholderItems("actor", 36, DIRECTOR_TONES);
const ACTOR_ITEMS = createPlaceholderItems("work", 36, ACTOR_TONES);
const VISIBLE_OFFSETS = Array.from({ length: 29 }, (_, index) => index - 14);
const VISUAL_RETURN_DURATION = 1100;
const MOCK_JOB_POSTINGS: JobPosting[] = [
  {
    title: "OTT 시리즈 〈와일드씽〉",
    category: "드라마",
    location: "서울",
    deadline: "5월 24일 마감",
    role: "10대 후반부터 20대 초반 배우",
    summary:
      "밝고 에너지 있는 캐릭터를 찾고 있어요. 자연스러운 대사와 표정 연기가 중요해요.",
    tags: ["주연급 조연", "서울 촬영", "프로필 필수"],
  },
  {
    title: "브랜드 숏폼 캠페인",
    category: "광고",
    location: "경기",
    deadline: "5월 27일 마감",
    role: "20대 배우와 모델",
    summary:
      "제품을 자연스럽게 소개하는 숏폼 광고예요. 카메라 앞 움직임이 편한 분을 찾고 있어요.",
    tags: ["숏폼", "1회차", "상업광고"],
  },
  {
    title: "음악 예능 파일럿",
    category: "예능",
    location: "서울",
    deadline: "5월 30일 마감",
    role: "리액션이 좋은 패널",
    summary:
      "음악을 좋아하고 대화 흐름을 잘 이어갈 수 있는 출연자를 찾고 있어요.",
    tags: ["파일럿", "스튜디오", "토크"],
  },
  {
    title: "청춘 로맨스 웹드라마",
    category: "웹드라마",
    location: "인천",
    deadline: "6월 2일 마감",
    role: "고등학생 이미지 배우",
    summary:
      "친구 사이의 미묘한 감정을 표현하는 장면이 많아요. 생활 연기가 자연스러운 분이 좋아요.",
    tags: ["웹드라마", "교복", "생활연기"],
  },
];

export function LandingShowcase({
  actors = [],
  companyLogos = [],
}: {
  actors?: LandingActor[];
  companyLogos?: CompanyLogo[];
}) {
  const [mode, setMode] = useState<LandingMode>("director");
  const [carouselPosition, setCarouselPositionState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [carouselActivity, setCarouselActivityState] = useState(0);
  const [selectedJob, setSelectedJob] = useState<SelectedJobPosting | null>(
    null,
  );
  const [selectedActor, setSelectedActor] = useState<LandingActor | null>(null);
  const positionRef = useRef(0);
  const activityRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const suppressCardClickRef = useRef(false);
  const pendingActorSelectRef = useRef<LandingActor | null>(null);
  const pendingCompanySelectRef = useRef<CompanyLogo | null>(null);
  const animationRef = useRef<number | null>(null);
  const dragRef = useRef<{
    startX: number;
    startPosition: number;
    lastX: number;
    lastTime: number;
    velocity: number;
  } | null>(null);

  const displayActors = actors.filter((actor) => actor.avatar_url);
  const items = mode === "director" ? DIRECTOR_ITEMS : ACTOR_ITEMS;
  const cardStep = getCardStep(mode);
  const activeItem = items[wrapIndex(Math.round(carouselPosition), items.length)];
  const activeLabel =
    mode === "director"
      ? (getActorForItem(activeItem, displayActors)?.name ?? "사진 등록 배우 없음")
      : activeItem.label;
  const centerIndex = Math.round(carouselPosition);
  const visibleItems = useMemo(
    () =>
      VISIBLE_OFFSETS.map((offset) => {
        const rawIndex = centerIndex + offset;
        return {
          item: items[wrapIndex(rawIndex, items.length)],
          rawIndex,
          visualOffset: rawIndex - carouselPosition,
        };
      }),
    [carouselPosition, centerIndex, items],
  );

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  function setCarouselPosition(nextPosition: number) {
    positionRef.current = nextPosition;
    setCarouselPositionState(nextPosition);
  }

  function setCarouselActivity(nextActivity: number) {
    const boundedActivity = Math.max(0, Math.min(1, nextActivity));
    activityRef.current = boundedActivity;
    setCarouselActivityState(boundedActivity);
  }

  function cancelMomentum() {
    if (animationRef.current === null) return;
    window.cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }

  function switchMode(nextMode: LandingMode) {
    cancelMomentum();
    dragRef.current = null;
    hasDraggedRef.current = false;
    pendingActorSelectRef.current = null;
    pendingCompanySelectRef.current = null;
    setMode(nextMode);
    setCarouselPosition(0);
    setIsDragging(false);
    setCarouselActivity(0);
  }

  function move(delta: number) {
    cancelMomentum();
    startMomentum(delta * 0.008);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (!target.closest("[data-actor-card-button]")) {
      pendingActorSelectRef.current = null;
    }

    if (!target.closest("[data-company-logo-button]")) {
      pendingCompanySelectRef.current = null;
    }

    cancelMomentum();
    hasDraggedRef.current = false;
    suppressCardClickRef.current = false;
    dragRef.current = {
      startX: event.clientX,
      startPosition: positionRef.current,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragRef.current;
    if (!dragState) return;

    const now = performance.now();
    const deltaX = event.clientX - dragState.startX;
    const elapsed = Math.max(1, now - dragState.lastTime);

    if (Math.abs(deltaX) > 6 && !hasDraggedRef.current) {
      hasDraggedRef.current = true;
      suppressCardClickRef.current = true;
      pendingActorSelectRef.current = null;
      pendingCompanySelectRef.current = null;
      setIsDragging(true);
      setCarouselActivity(1);
    }

    if (!hasDraggedRef.current) {
      return;
    }

    dragState.velocity = -((event.clientX - dragState.lastX) / elapsed) / cardStep;
    dragState.lastX = event.clientX;
    dragState.lastTime = now;

    setCarouselPosition(dragState.startPosition - deltaX / cardStep);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragRef.current;
    if (!dragState) return;

    const deltaX = event.clientX - dragState.startX;
    let releaseVelocity = dragState.velocity;
    const dragged = hasDraggedRef.current;
    const pendingActor = pendingActorSelectRef.current;
    const pendingCompany = pendingCompanySelectRef.current;
    dragRef.current = null;
    pendingActorSelectRef.current = null;
    pendingCompanySelectRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (dragged) {
      suppressCardClickRef.current = true;
      window.setTimeout(() => {
        hasDraggedRef.current = false;
        suppressCardClickRef.current = false;
      }, 250);
    } else if (pendingActor) {
      setSelectedActor(pendingActor);
      return;
    } else if (pendingCompany) {
      openRandomJob(pendingCompany);
      return;
    } else {
      return;
    }

    if (Math.abs(releaseVelocity) < 0.002 && Math.abs(deltaX) > cardStep * 0.2) {
      releaseVelocity = deltaX < 0 ? 0.006 : -0.006;
    }

    startMomentum(releaseVelocity);
  }

  function handlePointerCancel() {
    const dragged = hasDraggedRef.current;
    dragRef.current = null;
    hasDraggedRef.current = false;
    pendingActorSelectRef.current = null;
    pendingCompanySelectRef.current = null;
    setIsDragging(false);
    if (dragged) {
      startMomentum(0);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  }

  function startMomentum(initialVelocity: number) {
    cancelMomentum();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCarouselPosition(Math.round(positionRef.current));
      setCarouselActivity(0);
      return;
    }

    setCarouselActivity(1);

    let velocity = Math.max(-0.018, Math.min(0.018, initialVelocity));
    let previousTime = performance.now();

    const tick = (time: number) => {
      const elapsed = Math.min(32, time - previousTime);
      previousTime = time;
      const nextActivity =
        activityRef.current - elapsed / VISUAL_RETURN_DURATION;

      setCarouselActivity(nextActivity);

      if (Math.abs(velocity) > 0.0003) {
        setCarouselPosition(positionRef.current + velocity * elapsed);
        velocity *= Math.exp(-elapsed * 0.0032);
      } else {
        const target = Math.round(positionRef.current);
        const distance = target - positionRef.current;

        if (Math.abs(distance) < 0.001) {
          setCarouselPosition(target);
          setCarouselActivity(0);
          animationRef.current = null;
          return;
        }

        setCarouselPosition(
          positionRef.current + distance * Math.min(1, elapsed * 0.018),
        );
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);
  }

  function openRandomJob(company: CompanyLogo) {
    const job =
      MOCK_JOB_POSTINGS[Math.floor(Math.random() * MOCK_JOB_POSTINGS.length)];
    setSelectedJob({ ...job, company });
  }

  function handleCompanySelect(company: CompanyLogo) {
    if (suppressCardClickRef.current) return;
    openRandomJob(company);
  }

  function handleActorSelect(actor: LandingActor) {
    if (suppressCardClickRef.current) return;
    setSelectedActor(actor);
  }

  function handleActorPointerStart(actor: LandingActor) {
    pendingActorSelectRef.current = actor;
  }

  function handleCompanyPointerStart(company: CompanyLogo) {
    pendingCompanySelectRef.current = company;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-[#151719]">
      <section className="flex min-h-screen w-full items-center">
        <div className="relative min-h-screen w-full overflow-hidden bg-background px-6 py-6 sm:px-8 md:px-10 lg:px-14">
          <header className="relative z-20 flex items-start justify-between gap-6">
            <BrandLogo href="/" size={30} className="shrink-0" />

            <nav aria-label="회원 메뉴" className="flex items-center gap-3 text-sm">
              <Link href="/signup" className="hover:text-primary">
                회원가입
              </Link>
              <span className="h-3 w-px bg-border" aria-hidden="true" />
              <Link href="/login" className="hover:text-primary">
                로그인
              </Link>
            </nav>
          </header>

          <div className="absolute inset-x-0 top-[calc(25vh-3.5rem)] z-20 flex -translate-y-1/2 justify-center px-6 sm:top-[calc(25vh-3.875rem)] sm:px-8 md:top-[calc(25vh-4rem)] md:px-10 lg:px-14">
            <ModeSwitch mode={mode} onModeChange={switchMode} />
          </div>

          <div
            data-landing-carousel
            role="region"
            aria-label={
              mode === "director"
                ? "배우 프로필 샘플 캐러셀"
                : "작품 로고 샘플 캐러셀"
            }
            tabIndex={0}
            className={cn(
              "absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 touch-pan-y outline-none focus-visible:ring-1 focus-visible:ring-primary/35",
              mode === "actor"
                ? "h-[300px] sm:h-[340px] md:h-[360px]"
                : "h-[300px] sm:h-[340px] md:h-[360px]",
              isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onKeyDown={handleKeyDown}
          >
            <p className="sr-only">
              좌우 방향키나 드래그로 샘플을 넘길 수 있어요. 현재 샘플은{" "}
              {activeLabel}입니다.
            </p>

            <div
              className={cn(
                "absolute inset-x-[-40vw] top-1/2 -translate-y-1/2 [perspective:820px] [transform-style:preserve-3d]",
                mode === "actor"
                  ? "h-[280px] sm:h-[320px] md:h-[340px]"
                  : "h-[280px] sm:h-[320px] md:h-[340px]",
              )}
            >
              {visibleItems.map(({ item, rawIndex, visualOffset }) => (
                <PlaceholderCard
                  key={`${mode}-${item.id}-${rawIndex}`}
                  item={item}
                  mode={mode}
                  visualOffset={visualOffset}
                  isDragging={isDragging}
                  carouselActivity={carouselActivity}
                  actors={displayActors}
                  companyLogos={companyLogos}
                  onActorPointerStart={handleActorPointerStart}
                  onActorSelect={handleActorSelect}
                  onCompanyPointerStart={handleCompanyPointerStart}
                  onCompanySelect={handleCompanySelect}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 right-6 text-right text-2xl font-medium leading-tight tracking-[-0.03em] text-primary sm:right-8 md:bottom-10 md:right-10">
            <p>Cast in</p>
            <h1>배우와 작품을 잇다.</h1>
          </div>

          <JobPostingDialog
            job={selectedJob}
            onOpenChange={(open) => {
              if (!open) setSelectedJob(null);
            }}
          />
          <ActorProfileDialog
            actor={selectedActor}
            onOpenChange={(open) => {
              if (!open) setSelectedActor(null);
            }}
          />
        </div>
      </section>
    </main>
  );
}

function ModeSwitch({
  mode,
  onModeChange,
}: {
  mode: LandingMode;
  onModeChange: (mode: LandingMode) => void;
}) {
  const actor = mode === "actor";

  return (
    <div className="grid w-full max-w-[34rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 text-4xl sm:text-5xl">
      <button
        type="button"
        className={cn(
          "justify-self-end text-right transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/35",
          actor ? "text-muted-foreground/20" : "text-foreground",
        )}
        onClick={() => onModeChange("director")}
      >
        Director
      </button>
      <Switch
        checked={actor}
        onCheckedChange={(checked) =>
          onModeChange(checked ? "actor" : "director")
        }
        aria-label="배우와 캐스팅 모드 전환"
        className="h-9 w-16 bg-primary data-checked:bg-primary [&_[data-slot=switch-thumb]]:size-7 [&_[data-slot=switch-thumb]]:translate-x-1 data-checked:[&_[data-slot=switch-thumb]]:translate-x-8"
      />
      <button
        type="button"
        className={cn(
          "justify-self-start text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/35",
          actor ? "text-foreground" : "text-muted-foreground/20",
        )}
        onClick={() => onModeChange("actor")}
      >
        Actor
      </button>
    </div>
  );
}

function PlaceholderCard({
  item,
  mode,
  visualOffset,
  isDragging,
  carouselActivity,
  actors,
  companyLogos,
  onActorPointerStart,
  onActorSelect,
  onCompanyPointerStart,
  onCompanySelect,
}: {
  item: PlaceholderItem;
  mode: LandingMode;
  visualOffset: number;
  isDragging: boolean;
  carouselActivity: number;
  actors: LandingActor[];
  companyLogos: CompanyLogo[];
  onActorPointerStart: (actor: LandingActor) => void;
  onActorSelect: (actor: LandingActor) => void;
  onCompanyPointerStart: (company: CompanyLogo) => void;
  onCompanySelect: (company: CompanyLogo) => void;
}) {
  const abs = Math.abs(visualOffset);
  const step = getCardStep(mode);
  const centerProgress = Math.max(0, 1 - abs);
  const activeAmount = carouselActivity * centerProgress;
  const scale = 1 + activeAmount * 0.24;
  const rotate =
    carouselActivity > 0
      ? Math.max(-2.8, Math.min(2.8, visualOffset)) * -10 * carouselActivity
      : 0;
  const translateZ = Math.min(abs, 5) * -16 * carouselActivity;
  const translateY = activeAmount * -24;
  const brightness = 0.72 + activeAmount * 0.28;
  const grayscale = 1 - activeAmount;
  const activeOpacity =
    abs > 6.5 ? 0.18 : Math.max(0.42, 1 - abs * 0.075);
  const opacity = 1 - (1 - activeOpacity) * carouselActivity;
  const transformOrigin =
    carouselActivity <= 0 || abs < 0.05
      ? "center center"
      : visualOffset < 0
        ? "right center"
        : "left center";
  const baseStyle = {
    zIndex: Math.round(50 - abs * 3),
    opacity,
    transformOrigin,
    transform: `translateX(-50%) translateX(${visualOffset * step}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotate}deg) scale(${scale})`,
  } satisfies CSSProperties;
  const directorStyle = {
    ...baseStyle,
    filter: `grayscale(${grayscale}) brightness(${brightness})`,
  } satisfies CSSProperties;
  const logoFilter = `grayscale(${grayscale}) brightness(${brightness})`;

  if (mode === "actor") {
    return (
      <div
        data-landing-card
        className={cn(
          "absolute left-1/2 top-1/2 grid -translate-y-1/2 grid-rows-3 gap-3",
          isDragging
            ? "transition-none"
            : "transition-[filter,opacity,transform] duration-700 ease-out",
        )}
        style={baseStyle}
      >
        {Array.from({ length: 3 }, (_, rowIndex) => {
          const logo = getCompanyLogo(item, rowIndex, companyLogos);

          if (!logo) {
            return (
              <div
                key={`${item.id}-${rowIndex}`}
                className="h-[76px] w-[76px] rounded-[24px] border border-border/60 bg-muted/60 sm:h-[92px] sm:w-[92px] md:h-[104px] md:w-[104px]"
              />
            );
          }

          return (
            <button
              key={`${item.id}-${rowIndex}`}
              data-company-logo-button
              type="button"
              aria-label={`${logo.name} 공고 보기`}
              onPointerDown={() => {
                onCompanyPointerStart(logo);
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (event.detail === 0) {
                  onCompanySelect(logo);
                }
              }}
              style={
                {
                  "--company-logo-filter": logoFilter,
                } as CSSProperties
              }
              className="relative h-[76px] w-[76px] cursor-pointer overflow-hidden rounded-[24px] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition-[filter,box-shadow,transform] duration-200 [filter:var(--company-logo-filter)] hover:scale-[1.04] hover:![filter:none] hover:shadow-[0_16px_34px_rgba(0,0,0,0.2)] focus-visible:![filter:none] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/35 sm:h-[92px] sm:w-[92px] md:h-[104px] md:w-[104px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                draggable={false}
                src={logo.src}
                alt=""
                className="pointer-events-none h-full w-full select-none object-cover"
              />
            </button>
          );
        })}
      </div>
    );
  }

  const actor = getActorForItem(item, actors);

  if (!actor) return null;

  return (
    <button
      data-landing-card
      data-actor-card-button
      type="button"
      aria-label={`${actor.name} 배우 프로필 보기`}
      onPointerDown={() => {
        onActorPointerStart(actor);
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (event.detail === 0) {
          onActorSelect(actor);
        }
      }}
      className={cn(
        "absolute left-1/2 top-1/2 -translate-y-1/2 overflow-hidden rounded-sm bg-muted text-muted-foreground shadow-[0_18px_44px_rgba(0,0,0,0.16)] ring-1 ring-black/5 hover:![filter:none] focus-visible:![filter:none] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/35",
        isDragging
          ? "transition-none"
          : "transition-[filter,opacity,transform] duration-700 ease-out",
        "h-[252px] w-[92px] sm:h-[300px] sm:w-[110px] md:h-[336px] md:w-[124px]",
      )}
      style={directorStyle}
    >
      {actor.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={actor.avatar_url}
          alt=""
          draggable={false}
          loading="lazy"
          className="pointer-events-none h-full w-full select-none object-cover"
        />
      ) : null}
    </button>
  );
}

function JobPostingDialog({
  job,
  onOpenChange,
}: {
  job: SelectedJobPosting | null;
  onOpenChange: (open: boolean) => void;
}) {
  const posterTitle = job ? getPosterTitle(job.title) : "";

  return (
    <Dialog open={job !== null} onOpenChange={onOpenChange}>
      {job ? (
        <DialogContent
          showCloseButton={false}
          style={{
            width: "min(1180px, calc(100vw - 2rem))",
            maxWidth: "min(1180px, calc(100vw - 2rem))",
            height: "min(760px, calc(100svh - 2rem))",
          }}
          className="block gap-0 overflow-hidden rounded-none bg-background p-0 ring-white/80"
        >
          <DialogClose
            render={
              <button
                type="button"
                className="absolute right-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-transparent text-primary transition-colors hover:text-primary/75 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30"
                aria-label="공고 모달 닫기"
              />
            }
          >
            <XIcon aria-hidden="true" className="size-8" strokeWidth={2.5} />
          </DialogClose>

          <DialogDescription className="sr-only">
            {job.company.name} 제작사의 {job.title} 공고 정보입니다.
          </DialogDescription>

          <div className="absolute inset-3 grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-4">
            <JobPosterPlaceholder />

            <div className="grid min-h-0 grid-rows-[0.9fr_auto_auto] gap-3">
              <div className="relative min-h-0 overflow-hidden border border-border/60 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.company.src}
                  alt={job.company.name}
                  className="h-full w-full object-contain p-12"
                  draggable={false}
                />
              </div>

              <section className="rounded-2xl border bg-background p-6">
                <DialogTitle className="text-2xl font-bold leading-none text-foreground">
                  {posterTitle}
                </DialogTitle>

                <dl className="mt-7 grid grid-cols-2 gap-x-10 gap-y-6 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      지역
                    </dt>
                    <dd className="mt-3 font-bold text-foreground">
                      {job.location}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      장르
                    </dt>
                    <dd className="mt-3 font-bold text-foreground">
                      {job.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      마감
                    </dt>
                    <dd className="mt-3 font-bold text-foreground">
                      {job.deadline}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border bg-background p-6">
                <h3 className="text-base font-bold text-foreground">
                  모집 내용
                </h3>
                <p className="mt-8 text-sm leading-7 text-[#424242]">
                  {job.summary}
                </p>
              </section>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function JobPosterPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="min-h-0 border border-border/60 bg-muted/60"
    />
  );
}

function ActorProfileDialog({
  actor,
  onOpenChange,
}: {
  actor: LandingActor | null;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = actor ? formatActorMeta(actor) : "";
  const portfolioImages = actor?.portfolio_image_urls.slice(0, 3) ?? [];

  return (
    <Dialog open={actor !== null} onOpenChange={onOpenChange}>
      {actor ? (
        <DialogContent
          showCloseButton={false}
          style={{
            width: "min(1180px, calc(100vw - 2rem))",
            maxWidth: "min(1180px, calc(100vw - 2rem))",
            height: "min(760px, calc(100svh - 2rem))",
          }}
          className="block gap-0 overflow-hidden rounded-none bg-background p-0 ring-white/80"
        >
          <DialogClose
            render={
              <button
                type="button"
                className="absolute right-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-transparent text-primary transition-colors hover:text-primary/75 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30"
                aria-label="배우 프로필 닫기"
              />
            }
          >
            <XIcon aria-hidden="true" className="size-8" strokeWidth={2.5} />
          </DialogClose>

          <DialogDescription className="sr-only">
            {actor.name} 배우의 대표 사진, 포트폴리오 이미지, 대표 키워드입니다.
          </DialogDescription>

          <div className="absolute inset-3 grid grid-cols-[minmax(0,1.18fr)_minmax(0,0.62fr)_minmax(0,0.66fr)] grid-rows-2 gap-3">
            <ActorModalPhoto
              src={actor.avatar_url}
              alt={`${actor.name} 프로필 사진`}
              className="row-span-2"
            />
            <ActorModalPhoto
              src={portfolioImages[0] ?? null}
              alt={`${actor.name} 포트폴리오 사진 1`}
            />
            <ActorModalPhoto
              src={portfolioImages[1] ?? null}
              alt={`${actor.name} 포트폴리오 사진 2`}
            />

            <div className="flex min-h-0 flex-col overflow-hidden border bg-background px-5 py-4">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <DialogTitle className="text-3xl font-bold leading-none tracking-tight text-[#424242]">
                  {actor.name}
                </DialogTitle>
                <p className="pb-0.5 text-sm font-semibold text-[#424242]">
                  {meta}
                </p>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                장르, 특기, 이미지
              </p>

              <h3 className="mt-1.5 text-base font-bold text-foreground">
                대표 키워드
              </h3>

              <div className="mt-3 space-y-3 pb-1">
                <ActorKeywordGroup title="대표 장르" items={actor.genres} />
                <ActorKeywordGroup title="특기" items={actor.skills} />
                <ActorKeywordGroup title="이미지 키워드" items={[]} />
              </div>
            </div>

            <ActorModalPhoto
              src={portfolioImages[2] ?? null}
              alt={`${actor.name} 포트폴리오 사진 3`}
            />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function ActorModalPhoto({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-transparent bg-muted/60",
        src ? "border-transparent" : "border-border/60",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}

function ActorKeywordGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section>
      <h4 className="text-sm font-bold text-foreground">{title}</h4>
      <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
        {items.filter(Boolean).map((item) => (
          <Badge key={item} color="primary" variant="soft-outline" size="sm">
            {item}
          </Badge>
        ))}
      </div>
    </section>
  );
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function getCardStep(mode: LandingMode) {
  return mode === "director" ? 148 : 124;
}

function createPlaceholderItems(
  prefix: string,
  count: number,
  tones: readonly string[],
) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    label:
      prefix === "actor"
        ? String(index + 1).padStart(2, "0")
        : String.fromCharCode(65 + (index % 26)),
    tone: tones[index % tones.length],
  }));
}

function getCompanyLogo(
  item: PlaceholderItem,
  rowIndex: number,
  companyLogos: CompanyLogo[],
) {
  if (companyLogos.length === 0) return null;

  const logoIndex =
    (getItemNumber(item.id) + rowIndex * 11) % companyLogos.length;
  return companyLogos[logoIndex];
}

function getActorForItem(item: PlaceholderItem, actors: LandingActor[]) {
  if (actors.length === 0) return null;
  return actors[getItemNumber(item.id) % actors.length] ?? null;
}

function getItemNumber(id: string) {
  return Number(id.match(/\d+$/)?.[0] ?? "0");
}

function getPosterTitle(title: string) {
  return title.match(/〈(.+?)〉/)?.[1] ?? title;
}

function formatActorMeta(actor: LandingActor) {
  return [
    actor.age !== null ? `${actor.age}세` : null,
    getGenderLabel(actor.gender),
    actor.region,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return "성별 미등록";
}
