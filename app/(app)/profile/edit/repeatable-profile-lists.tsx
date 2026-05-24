"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActorAward, ActorCredit } from "@/lib/queries/actor-profile-showcase";

type CreditRow = {
  key: string;
  year: string;
  title: string;
  role: string;
  href: string;
};

type AwardRow = {
  key: string;
  year: string;
  title: string;
  organization: string;
};

export function CreditRows({ initialItems }: { initialItems: ActorCredit[] }) {
  const [rows, setRows] = useState<CreditRow[]>(
    initialItems.length > 0
      ? initialItems.map((item) => ({
          key: item.id,
          year: item.year?.toString() ?? "",
          title: item.title,
          role: item.role ?? "",
          href: item.href ?? "",
        }))
      : [emptyCreditRow()],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,8rem)_2.5rem]"
          >
            <Input
              name="credit_year"
              inputMode="numeric"
              placeholder="연도 입력"
              value={row.year}
              onChange={(event) => updateCredit(index, "year", event.target.value)}
            />
            <Input
              name="credit_title"
              placeholder="작품명 입력"
              value={row.title}
              onChange={(event) => updateCredit(index, "title", event.target.value)}
            />
            <Input
              name="credit_role"
              placeholder="역할 입력"
              value={row.role}
              onChange={(event) => updateCredit(index, "role", event.target.value)}
            />
            <input type="hidden" name="credit_href" value={row.href} />
            <RemoveButton
              label="필모그래피 행 삭제"
              onClick={() => setRows((current) => removeOrReset(current, index, emptyCreditRow))}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        color="primary"
        variant="soft-outline"
        size="sm"
        className="mx-auto flex border-dashed"
        onClick={() => setRows((current) => [...current, emptyCreditRow()])}
      >
        <Plus aria-hidden="true" className="size-4" />
        필모그래피 추가
      </Button>
    </div>
  );

  function updateCredit(index: number, key: keyof Omit<CreditRow, "key">, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }
}

export function AwardRows({ initialItems }: { initialItems: ActorAward[] }) {
  const [rows, setRows] = useState<AwardRow[]>(
    initialItems.length > 0
      ? initialItems.map((item) => ({
          key: item.id,
          year: item.year?.toString() ?? "",
          title: item.title,
          organization: item.organization ?? "",
        }))
      : [emptyAwardRow()],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_2.5rem]"
          >
            <Input
              name="award_year"
              inputMode="numeric"
              placeholder="연도 입력"
              value={row.year}
              onChange={(event) => updateAward(index, "year", event.target.value)}
            />
            <Input
              name="award_title"
              placeholder="수상명 입력"
              value={row.title}
              onChange={(event) => updateAward(index, "title", event.target.value)}
            />
            <input
              type="hidden"
              name="award_organization"
              value={row.organization}
            />
            <RemoveButton
              label="수상 행 삭제"
              onClick={() => setRows((current) => removeOrReset(current, index, emptyAwardRow))}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        color="primary"
        variant="soft-outline"
        size="sm"
        className="mx-auto flex border-dashed"
        onClick={() => setRows((current) => [...current, emptyAwardRow()])}
      >
        <Plus aria-hidden="true" className="size-4" />
        수상 추가
      </Button>
    </div>
  );

  function updateAward(index: number, key: keyof Omit<AwardRow, "key">, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  }
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      color="destructive"
      variant="soft-outline"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
    >
      <Minus aria-hidden="true" className="size-4" />
    </Button>
  );
}

function removeOrReset<T>(
  rows: T[],
  index: number,
  createEmptyRow: () => T,
) {
  if (rows.length <= 1) return [createEmptyRow()];
  return rows.filter((_, rowIndex) => rowIndex !== index);
}

function emptyCreditRow(): CreditRow {
  return {
    key: randomKey(),
    year: "",
    title: "",
    role: "",
    href: "",
  };
}

function emptyAwardRow(): AwardRow {
  return {
    key: randomKey(),
    year: "",
    title: "",
    organization: "",
  };
}

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
