import type { Metadata } from "next";
import {
  Bell,
  Briefcase,
  CalendarDays,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import { DatePicker, DateTimePicker } from "@/components/features/date-picker";
import { PageContainer } from "@/components/page-container";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ThemeModeTabs } from "./theme-mode-tabs";

export const metadata: Metadata = {
  title: "CDS",
};

const tokens = [
  { name: "background", className: "bg-background" },
  { name: "foreground", className: "bg-foreground" },
  { name: "ink", className: "bg-ink" },
  { name: "muted-ink", className: "bg-muted-ink" },
  { name: "card", className: "bg-card" },
  { name: "card-foreground", className: "bg-card-foreground" },
  { name: "popover", className: "bg-popover" },
  { name: "popover-foreground", className: "bg-popover-foreground" },
  { name: "primary", className: "bg-primary" },
  { name: "primary-soft", className: "bg-primary-soft" },
  { name: "primary-foreground", className: "bg-primary-foreground" },
  { name: "secondary", className: "bg-secondary" },
  { name: "secondary-hover", className: "bg-secondary-hover" },
  { name: "secondary-soft", className: "bg-secondary-soft" },
  { name: "secondary-soft-hover", className: "bg-secondary-soft-hover" },
  {
    name: "secondary-soft-foreground",
    className: "bg-secondary-soft-foreground",
  },
  { name: "secondary-foreground", className: "bg-secondary-foreground" },
  { name: "destructive", className: "bg-destructive" },
  { name: "destructive-foreground", className: "bg-destructive-foreground" },
  { name: "success", className: "bg-success" },
  { name: "success-soft", className: "bg-success-soft" },
  { name: "success-foreground", className: "bg-success-foreground" },
  { name: "warning", className: "bg-warning" },
  { name: "warning-soft", className: "bg-warning-soft" },
  { name: "warning-foreground", className: "bg-warning-foreground" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-foreground", className: "bg-accent-foreground" },
  { name: "muted", className: "bg-muted" },
  { name: "muted-foreground", className: "bg-muted-foreground" },
  { name: "border", className: "bg-border" },
  { name: "input", className: "bg-input" },
  { name: "ring", className: "bg-ring" },
  { name: "chart-1", className: "bg-chart-1" },
  { name: "chart-2", className: "bg-chart-2" },
  { name: "chart-3", className: "bg-chart-3" },
  { name: "chart-4", className: "bg-chart-4" },
  { name: "chart-5", className: "bg-chart-5" },
  { name: "sidebar", className: "bg-sidebar" },
  { name: "sidebar-foreground", className: "bg-sidebar-foreground" },
  { name: "sidebar-primary", className: "bg-sidebar-primary" },
  {
    name: "sidebar-primary-foreground",
    className: "bg-sidebar-primary-foreground",
  },
  { name: "sidebar-accent", className: "bg-sidebar-accent" },
  {
    name: "sidebar-accent-foreground",
    className: "bg-sidebar-accent-foreground",
  },
  { name: "sidebar-border", className: "bg-sidebar-border" },
  { name: "sidebar-ring", className: "bg-sidebar-ring" },
];

const tableRows = [
  {
    name: "김서연",
    role: "배우",
    state: "검토 중",
    date: "2026.05.08",
  },
  {
    name: "박지훈",
    role: "캐스팅",
    state: "확정",
    date: "2026.05.12",
  },
  {
    name: "이하린",
    role: "배우",
    state: "대기",
    date: "2026.05.18",
  },
];

const SHOW_THEME_MODE_TABS = false;

export default function CdsPage() {
  return (
    <PageContainer
      pageTitle="Cast In Design System (CDS)"
      actions={SHOW_THEME_MODE_TABS ? <ThemeModeTabs /> : null}
    >
      <div className="space-y-10">
        <ShowcaseSection title="Tokens">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {tokens.map((token) => (
              <div
                key={token.name}
                className="flex min-w-0 items-center gap-2 rounded-lg border bg-background p-2.5"
              >
                <span
                  className={`size-7 shrink-0 rounded-md border ${token.className}`}
                />
                <span className="min-w-0 truncate font-mono text-xs">
                  {token.name}
                </span>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Buttons">
          <div className="grid gap-4">
            <SampleGroup title="Size">
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button size="md">md</Button>
              <Button size="lg">lg</Button>
            </SampleGroup>

            <SampleGroup title="Fill">
              <Button>Primary</Button>
              <Button color="secondary">Secondary</Button>
              <Button color="success">Success</Button>
              <Button color="warning">Warning</Button>
              <Button color="destructive">Destructive</Button>
            </SampleGroup>

            <SampleGroup title="Soft">
              <Button variant="soft">Primary</Button>
              <Button color="secondary" variant="soft">
                Secondary
              </Button>
              <Button color="success" variant="soft">
                Success
              </Button>
              <Button color="warning" variant="soft">
                Warning
              </Button>
              <Button color="destructive" variant="soft">
                Destructive
              </Button>
            </SampleGroup>

            <SampleGroup title="Outline">
              <Button variant="outline">Primary</Button>
              <Button color="secondary" variant="outline">
                Secondary
              </Button>
              <Button color="success" variant="outline">
                Success
              </Button>
              <Button color="warning" variant="outline">
                Warning
              </Button>
              <Button color="destructive" variant="outline">
                Destructive
              </Button>
              <Button color="neutral" variant="outline">
                Neutral
              </Button>
            </SampleGroup>

            <SampleGroup title="Soft outline">
              <Button variant="soft-outline">Primary</Button>
              <Button color="secondary" variant="soft-outline">
                Secondary
              </Button>
              <Button color="success" variant="soft-outline">
                Success
              </Button>
              <Button color="warning" variant="soft-outline">
                Warning
              </Button>
              <Button color="destructive" variant="soft-outline">
                Destructive
              </Button>
            </SampleGroup>

            <SampleGroup title="Ghost">
              <Button variant="ghost">Primary</Button>
              <Button color="secondary" variant="ghost">
                Secondary
              </Button>
              <Button color="success" variant="ghost">
                Success
              </Button>
              <Button color="warning" variant="ghost">
                Warning
              </Button>
              <Button color="destructive" variant="ghost">
                Destructive
              </Button>
              <Button color="neutral" variant="ghost">
                Neutral
              </Button>
            </SampleGroup>

            <SampleGroup title="Link">
              <Button variant="link">Primary</Button>
              <Button color="secondary" variant="link">
                Secondary
              </Button>
              <Button color="success" variant="link">
                Success
              </Button>
              <Button color="warning" variant="link">
                Warning
              </Button>
              <Button color="destructive" variant="link">
                Destructive
              </Button>
              <Button color="neutral" variant="link">
                Neutral
              </Button>
            </SampleGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Badges">
          <div className="grid gap-4">
            <SampleGroup title="Size">
              <Badge size="sm">
                sm
              </Badge>
              <Badge size="md">
                md
              </Badge>
              <Badge size="lg">
                lg
              </Badge>
            </SampleGroup>

            <SampleGroup title="Fill">
              <Badge>Primary</Badge>
              <Badge color="secondary">Secondary</Badge>
              <Badge color="success">Success</Badge>
              <Badge color="warning">Warning</Badge>
              <Badge color="destructive">Destructive</Badge>
            </SampleGroup>

            <SampleGroup title="Soft">
              <Badge variant="soft">Primary</Badge>
              <Badge color="secondary" variant="soft">
                Secondary
              </Badge>
              <Badge color="success" variant="soft">
                Success
              </Badge>
              <Badge color="warning" variant="soft">
                Warning
              </Badge>
              <Badge color="destructive" variant="soft">
                Destructive
              </Badge>
            </SampleGroup>

            <SampleGroup title="Outline">
              <Badge variant="outline">Primary</Badge>
              <Badge color="secondary" variant="outline">
                Secondary
              </Badge>
              <Badge color="success" variant="outline">
                Success
              </Badge>
              <Badge color="warning" variant="outline">
                Warning
              </Badge>
              <Badge color="destructive" variant="outline">
                Destructive
              </Badge>
              <Badge color="neutral" variant="outline">
                Neutral
              </Badge>
            </SampleGroup>

            <SampleGroup title="Soft outline">
              <Badge variant="soft-outline">Primary</Badge>
              <Badge color="secondary" variant="soft-outline">
                Secondary
              </Badge>
              <Badge color="success" variant="soft-outline">
                Success
              </Badge>
              <Badge color="warning" variant="soft-outline">
                Warning
              </Badge>
              <Badge color="destructive" variant="soft-outline">
                Destructive
              </Badge>
            </SampleGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Forms">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="cds-name">이름</Label>
              <Input id="cds-name" defaultValue="캐스트인" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cds-role">역할</Label>
              <Select id="cds-role" defaultValue="actor">
                <option value="actor">배우</option>
                <option value="casting">캐스팅 디렉터</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cds-date">날짜</Label>
              <DatePicker
                id="cds-date"
                name="cds-date"
                defaultValue="2026-05-08"
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="cds-message">메모</Label>
              <Textarea
                id="cds-message"
                rows={4}
                defaultValue="오디션 일정과 콜타임을 확인해 주세요."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cds-datetime">일시</Label>
              <DateTimePicker
                id="cds-datetime"
                name="cds-datetime"
                defaultValue="2026-05-08T14:30"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background p-4 lg:col-span-3">
              <div>
                <p className="text-sm font-medium">알림 받기</p>
                <p className="text-xs text-muted-foreground">
                  새 메시지와 공고 변경을 알려줍니다.
                </p>
              </div>
              <Switch defaultChecked aria-label="알림 받기" />
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Cards and Content">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>공고 카드</CardTitle>
                <CardDescription>
                  CardHeader, CardTitle, CardDescription
                </CardDescription>
                <CardAction>
                  <Badge color="secondary">진행 중</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  카드 콘텐츠는 리스트, 상세, 대시보드 요약 영역에 사용합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Button color="neutral" size="sm" variant="outline">
                  자세히 보기
                </Button>
              </CardFooter>
            </Card>
            <SurfaceCard className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">SurfaceCard</p>
                  <Badge color="neutral" variant="outline">
                    shadow
                  </Badge>
                </div>
                <Separator />
                <p className="text-sm leading-6 text-muted-foreground">
                  살짝 떠 있는 표면을 만들 때 쓰는 카드 래퍼입니다.
                </p>
              </div>
            </SurfaceCard>
            <div className="grid gap-3">
              <StatCard label="지원자" value={128} description="이번 달 누적" />
              <StatCard
                label="매칭률"
                value="74%"
                description="전월 대비 +8%"
              />
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Tabs, Dialog, Popover">
          <div className="grid gap-6 lg:grid-cols-2">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="profile">프로필</TabsTrigger>
                <TabsTrigger value="messages">메시지</TabsTrigger>
              </TabsList>
              <TabsContent
                value="overview"
                className="rounded-lg border bg-background p-4"
              >
                <p className="text-sm text-muted-foreground">
                  탭 콘텐츠 영역입니다. 선택 상태와 포커스 링을 확인하세요.
                </p>
              </TabsContent>
              <TabsContent
                value="profile"
                className="rounded-lg border bg-background p-4"
              >
                <p className="text-sm text-muted-foreground">
                  프로필 탭 샘플입니다.
                </p>
              </TabsContent>
              <TabsContent
                value="messages"
                className="rounded-lg border bg-background p-4"
              >
                <p className="text-sm text-muted-foreground">
                  메시지 탭 샘플입니다.
                </p>
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <Dialog>
                <DialogTrigger
                  render={<Button color="neutral" variant="outline" />}
                >
                  다이얼로그 열기
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>지원자 초대</DialogTitle>
                    <DialogDescription>
                      다이얼로그 타이틀, 설명, 푸터 스타일을 확인합니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2">
                    <Label htmlFor="cds-dialog-email">이메일</Label>
                    <Input
                      id="cds-dialog-email"
                      type="email"
                      placeholder="name@example.com"
                    />
                  </div>
                  <DialogFooter>
                    <Button color="neutral" variant="outline">
                      취소
                    </Button>
                    <Button>초대 보내기</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Popover>
                <PopoverTrigger render={<Button color="secondary" />}>
                  팝오버 열기
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>빠른 안내</PopoverTitle>
                    <PopoverDescription>
                      짧은 설명이나 보조 액션을 담는 표면입니다.
                    </PopoverDescription>
                  </PopoverHeader>
                  <PopoverClose render={<Button size="sm" className="w-fit" />}>
                    확인
                  </PopoverClose>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Table and Lists">
          <Table>
            <TableCaption>캐스트인 테이블 컴포넌트 샘플</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">이름</TableHead>
                <TableHead scope="col">역할</TableHead>
                <TableHead scope="col">상태</TableHead>
                <TableHead scope="col">일정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <Badge
                      color={row.state === "확정" ? "primary" : "neutral"}
                      variant={row.state === "확정" ? "fill" : "outline"}
                    >
                      {row.state}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowcaseSection>

        <ShowcaseSection title="States">
          <div className="grid gap-4 lg:grid-cols-3">
            <EmptyState
              icon={Search}
              title="검색 결과가 없어요"
              description="필터를 줄이거나 다른 키워드로 다시 검색해 보세요."
              action={<Button size="sm">필터 초기화</Button>}
            />
            <div className="grid content-start gap-3 rounded-lg border bg-background p-4">
              <ErrorNotice message="저장 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요." />
              <ErrorNotice size="sm" message="필수 입력값을 확인해 주세요." />
            </div>
            <div className="grid content-start gap-3 rounded-lg border bg-background p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Avatar">
          <div className="flex flex-wrap items-center gap-6">
            <Avatar size="sm">
              <AvatarFallback>김</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>박</AvatarFallback>
              <AvatarBadge />
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>CI</AvatarFallback>
              <AvatarBadge />
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>김</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>이</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>박</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+8</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Icon Scale">
          <div className="flex flex-wrap items-center gap-3">
            {[Search, Bell, CalendarDays, Briefcase, MessageSquare, Users].map(
              (Icon, index) => (
                <Button
                  key={index}
                  variant="outline"
                  color="neutral"
                  size="icon"
                  aria-label={`아이콘 샘플 ${index + 1}`}
                >
                  <Icon aria-hidden="true" />
                </Button>
              ),
            )}
          </div>
        </ShowcaseSection>
      </div>
    </PageContainer>
  );
}

function SampleGroup({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`space-y-3 rounded-lg border bg-background p-4 ${className}`}
    >
      <h4 className="text-xs font-semibold text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function ShowcaseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
