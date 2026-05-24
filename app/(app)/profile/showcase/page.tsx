import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { BackButton } from "@/components/features/back-button";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  listActorAwards,
  listActorCredits,
  type ActorAward,
  type ActorCredit,
} from "@/lib/queries/actor-profile-showcase";
import { getViewerProfile } from "@/lib/queries/viewer";
import {
  addActorAwardAction,
  addActorCreditAction,
  deleteActorAwardAction,
  deleteActorCreditAction,
} from "./actions";

export default async function ProfileShowcasePage() {
  const { profile, activeRole } = await getViewerProfile();
  if (!profile) return null;
  if (activeRole !== "actor") redirect("/profile");

  const [credits, awards] = await Promise.all([
    listActorCredits(profile.id).catch(() => []),
    listActorAwards(profile.id).catch(() => []),
  ]);

  return (
    <PageContainer size="wide" pageTitle="필모그래피와 수상" actions={<BackButton fallbackHref="/profile" />}>
      <div className="grid gap-5 lg:grid-cols-2">
        <ShowcaseManager
          title="필모그래피"
          description="작품명, 역할, 확인 링크를 등록해요."
          form={<CreditForm />}
          items={<CreditList items={credits} />}
        />
        <ShowcaseManager
          title="수상"
          description="수상명과 주최 기관을 등록해요."
          form={<AwardForm />}
          items={<AwardList items={awards} />}
        />
      </div>
    </PageContainer>
  );
}

function ShowcaseManager({
  title,
  description,
  form,
  items,
}: {
  title: string;
  description: string;
  form: ReactNode;
  items: ReactNode;
}) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        {form}
        {items}
      </CardContent>
    </SurfaceCard>
  );
}

function CreditForm() {
  return (
    <form action={addActorCreditAction} className="grid gap-3 rounded-xl bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <Field id="credit-year" name="year" label="연도" placeholder="연도 입력" />
        <Field id="credit-title" name="title" label="작품명" placeholder="작품명 입력" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="credit-role" name="role" label="역할" placeholder="역할 입력" />
        <Field id="credit-href" name="href" label="링크" placeholder="링크 URL 입력" />
      </div>
      <Button type="submit" className="justify-self-end">
        추가하기
      </Button>
    </form>
  );
}

function AwardForm() {
  return (
    <form action={addActorAwardAction} className="grid gap-3 rounded-xl bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <Field id="award-year" name="year" label="연도" placeholder="연도 입력" />
        <Field id="award-title" name="title" label="수상명" placeholder="수상명 입력" required />
      </div>
      <Field
        id="award-organization"
        name="organization"
        label="주최 기관"
        placeholder="주최 기관 입력"
      />
      <Button type="submit" className="justify-self-end">
        추가하기
      </Button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} placeholder={placeholder} required={required} />
    </div>
  );
}

function CreditList({ items }: { items: ActorCredit[] }) {
  if (items.length === 0) return <EmptyList label="등록된 필모그래피가 없어요." />;

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {item.year ? `${item.year} · ` : ""}
              {item.title}
            </p>
            {item.role ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
            ) : null}
          </div>
          <DeleteForm id={item.id} action={deleteActorCreditAction} label="필모그래피 삭제" />
        </li>
      ))}
    </ul>
  );
}

function AwardList({ items }: { items: ActorAward[] }) {
  if (items.length === 0) return <EmptyList label="등록된 수상 이력이 없어요." />;

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {item.year ? `${item.year} · ` : ""}
              {item.title}
            </p>
            {item.organization ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {item.organization}
              </p>
            ) : null}
          </div>
          <DeleteForm id={item.id} action={deleteActorAwardAction} label="수상 이력 삭제" />
        </li>
      ))}
    </ul>
  );
}

function DeleteForm({
  id,
  action,
  label,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" color="destructive" variant="soft-outline" size="icon-sm" aria-label={label}>
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>
    </form>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <p className="rounded-xl bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}
