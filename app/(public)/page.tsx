import Link from "next/link";
import {
  ChevronDown,
  Mail,
  Phone,
  Plus,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";

const PARTNER_GROUPS = [
  {
    title: "엔터/매니지먼트",
    items: ["매니지먼트", "신인개발", "레이블", "에이전시"],
  },
  {
    title: "드라마/영화",
    items: ["드라마", "영화", "OTT", "독립장편"],
  },
  {
    title: "광고/브랜드",
    items: ["브랜드", "캠페인", "커머스", "라이브"],
  },
] as const;

const PROCESS_STEPS = [
  {
    step: "STEP 1",
    title: "모드 선택",
  },
  {
    step: "STEP 2",
    title: "공고 탐색·등록",
  },
  {
    step: "STEP 3",
    title: "지원 검토",
  },
  {
    step: "STEP 4",
    title: "섭외 확정",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "캐스트인은 누구나 쓸 수 있나요?",
    answer:
      "배우, 모델, 캐스팅팀, 제작사 모두 쓸 수 있어요. 가입 후 필요한 모드를 골라서 시작하면 돼요.",
  },
  {
    question: "한 계정으로 배우와 캐스팅 모드를 같이 쓸 수 있나요?",
    answer:
      "한 계정에서 두 모드를 모두 추가할 수 있어요. 필요한 순간에 설정에서 바로 전환하면 돼요.",
  },
  {
    question: "프로필을 다 채우기 전에도 둘러볼 수 있나요?",
    answer:
      "랜딩과 소개 화면은 바로 볼 수 있어요. 실제 지원과 공고 관리는 가입 후 프로필을 채우면 바로 시작할 수 있어요.",
  },
  {
    question: "지원자와 메시지는 어떻게 관리하나요?",
    answer:
      "지원 상태, 검토 흐름, 메시지 연결을 앱 안에서 한 화면으로 이어서 관리할 수 있어요.",
  },
] as const;

const FOOTER_INFO_COLUMNS = [
  {
    title: "안내",
    links: [
      { label: "함께하는 현장", href: "#partners" },
      { label: "이용 절차", href: "#process" },
      { label: "자주 묻는 질문", href: "#faq" },
    ],
  },
] as const;

const PARTNER_BUBBLE_STYLES = [
  "bg-sky-500 text-white",
  "bg-slate-950 text-white",
  "bg-white text-slate-700 ring-1 ring-slate-200",
  "bg-cyan-300 text-slate-900",
  "bg-slate-200 text-slate-700",
  "bg-emerald-400 text-slate-900",
  "bg-orange-500 text-white",
  "bg-yellow-300 text-slate-900",
  "bg-blue-100 text-blue-700",
];

export default async function LandingPage() {
  const { user, profile, activeRole, availableRoles } = await getViewerProfile();
  const primaryHref = user ? "/discover" : "/login";
  const serviceEntryLabel = user ? "내 화면 열기" : "로그인";
  const servicePrimaryLabel = user ? "바로 시작하기" : "무료로 시작하기";
  const footerServiceLinks = [
    { label: "둘러보기", href: "/discover" },
    { label: serviceEntryLabel, href: primaryHref },
    { label: servicePrimaryLabel, href: primaryHref },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader viewer={{ user, profile, activeRole, availableRoles }} />

      <main className="overflow-hidden">
        <section className="mx-auto max-w-5xl px-5 py-18 md:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="secondary">캐스트인</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              배우와 캐스팅을
              <br />
              한 곳에서.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              추천부터 지원자 관리, 실시간 메시지까지 한 곳에서 이어져요.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                무료로 시작하기
              </Link>
              <Link
                href="/discover"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                둘러보기
              </Link>
            </div>
          </div>
        </section>

        <section
          id="partners"
          className="bg-primary px-5 py-20 text-primary-foreground md:py-28"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium tracking-[0.18em] text-primary-foreground/70 uppercase">
                함께하는 현장
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                캐스트인과 함께하는 업체
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {PARTNER_GROUPS.map((group, groupIndex) => (
                <article
                  key={group.title}
                  className="rounded-[32px] bg-card p-6 text-card-foreground shadow-[0_16px_48px_rgba(10,37,64,0.12)] ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {group.title}
                    </h3>
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Plus aria-hidden="true" className="size-4" />
                    </span>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={item}
                        className={cn(
                          "flex size-[5.5rem] items-center justify-center rounded-full text-center text-sm font-semibold leading-tight tracking-tight md:size-24 md:text-base",
                          PARTNER_BUBBLE_STYLES[
                            (groupIndex * 3 + itemIndex) %
                              PARTNER_BUBBLE_STYLES.length
                          ],
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/40 px-5 py-20 md:py-28">
          <div className="mx-auto max-w-5xl space-y-24 md:space-y-28">
            <section id="process" className="space-y-8">
              <div className="text-center">
                <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  이용 절차
                </h2>
              </div>

              <div className="overflow-hidden rounded-[32px] bg-card shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-border/70">
                <div className="grid divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
                  {PROCESS_STEPS.map((step) => (
                    <div key={step.step} className="px-6 py-8 md:px-8 md:py-10">
                      <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
                        {step.step}
                      </p>
                      <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-card-foreground">
                        {step.title}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="faq" className="space-y-8">
              <div className="text-center">
                <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  자주 묻는 질문
                </h2>
              </div>

              <div className="space-y-4">
                {/* Keep FAQ on native details/summary so it works with keyboard and screen readers without extra JS. */}
                {FAQ_ITEMS.map((item, index) => (
                  <details
                    key={item.question}
                    open={index === 0}
                    className="rounded-[28px] bg-card shadow-[0_12px_40px_rgba(15,23,42,0.04)] ring-1 ring-border/70"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-6 text-left text-lg font-semibold text-card-foreground [&::-webkit-details-marker]:hidden">
                      <span>Q. {item.question}</span>
                      <ChevronDown
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                      />
                    </summary>
                    <div className="border-t border-border px-6 py-5 text-base leading-7 text-muted-foreground">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </section>

        <footer
          id="contact"
          className="border-t border-border bg-background px-5 py-16"
        >
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1.4fr]">
              <div>
                <BrandLogo textClassName="text-xl" />
                <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                  캐스트인은 배우와 캐스팅이 더 빠르고 자연스럽게 연결되도록
                  돕는 캐스팅 협업 플랫폼이에요.
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                {FOOTER_INFO_COLUMNS.map((column) => (
                  <div key={column.title}>
                    <h3 className="text-sm font-semibold text-foreground">
                      {column.title}
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <Link href={link.href} className="hover:text-foreground">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    서비스
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    {footerServiceLinks.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="hover:text-foreground">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">문의</h3>
                <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p className="flex items-start gap-3">
                    <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>평일 10:00 - 18:00에 문의를 확인해요.</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>hello@cast-in.app</span>
                  </p>
                  <p>
                    로그인 후 설정 화면으로 이동하면 더 빠르게 문의를 남길 수
                    있어요.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-border pt-8">
              <p className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                Copyright © Cast In. All Rights Reserved
              </p>
              <div className="mt-5 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>캐스트인은 배우와 캐스팅이 함께 쓰는 협업 플랫폼이에요.</p>
                <p>서비스 안내, 이용 절차, 자주 묻는 질문은 이 페이지에서 바로 확인할 수 있어요.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
                <Link href="#faq" className="hover:text-foreground">
                  자주 묻는 질문
                </Link>
                <Link href="#process" className="hover:text-foreground">
                  이용 절차
                </Link>
                <Link href="/login" className="hover:text-foreground">
                  로그인
                </Link>
                <Link href="/discover" className="hover:text-foreground">
                  둘러보기
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
