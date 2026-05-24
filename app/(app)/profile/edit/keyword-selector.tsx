"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type KeywordSelectorProps = {
  name: string;
  label: string;
  options: string[];
  initialValues: string[];
  addPlaceholder: string;
};

function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueKeywords(values: string[]) {
  return Array.from(
    new Map(
      values
        .map((value) => normalizeKeyword(value))
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), value]),
    ).values(),
  );
}

export function KeywordSelector({
  name,
  label,
  options,
  initialValues,
  addPlaceholder,
}: KeywordSelectorProps) {
  const [selected, setSelected] = useState(() => uniqueKeywords(initialValues));
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const visibleOptions = useMemo(
    () => uniqueKeywords([...options, ...selected]),
    [options, selected],
  );

  const selectedKeys = useMemo(
    () => new Set(selected.map((value) => value.toLowerCase())),
    [selected],
  );

  const inputId = `${name}-custom-keyword`;

  function toggleKeyword(value: string) {
    const normalized = normalizeKeyword(value);
    if (!normalized) return;

    setSelected((current) => {
      const key = normalized.toLowerCase();
      const exists = current.some((item) => item.toLowerCase() === key);

      return exists
        ? current.filter((item) => item.toLowerCase() !== key)
        : [...current, normalized];
    });
  }

  function addKeyword() {
    const normalized = normalizeKeyword(draft);
    if (!normalized) return;

    setSelected((current) => uniqueKeywords([...current, normalized]));
    setDraft("");
    setIsAdding(false);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-foreground">{label}</legend>
      <input type="hidden" name={name} value={selected.join(", ")} />

      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const isSelected = selectedKeys.has(option.toLowerCase());

          return (
            <Button
              key={option}
              type="button"
              size="xs"
              color={isSelected ? "primary" : "neutral"}
              variant={isSelected ? "soft-outline" : "outline"}
              aria-pressed={isSelected}
              onClick={() => toggleKeyword(option)}
              className={cn(
                "h-8 rounded-full px-3",
                !isSelected && "bg-background text-muted-foreground",
              )}
            >
              {option}
            </Button>
          );
        })}

        {!isAdding ? (
          <Button
            type="button"
            size="xs"
            color="primary"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="h-8 rounded-full border-dashed px-3"
          >
            <Plus aria-hidden="true" className="size-3" />
            직접 추가
          </Button>
        ) : null}
      </div>

      {isAdding ? (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Label htmlFor={inputId} className="sr-only">
            {label} 직접 추가
          </Label>
          <Input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addKeyword();
              }
            }}
            placeholder={addPlaceholder}
            className="h-9 bg-background"
          />
          <Button type="button" size="sm" onClick={addKeyword}>
            추가
          </Button>
          <Button
            type="button"
            size="sm"
            color="neutral"
            variant="ghost"
            onClick={() => {
              setDraft("");
              setIsAdding(false);
            }}
          >
            취소
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
