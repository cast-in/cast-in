import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FilterField = {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
};

// 서버 렌더 GET 폼. 검색어·필터를 URL 쿼리로 전달해서 페이지 리로드로 반영됨.
export function SearchFilterBar({
  action,
  searchField,
  filters = [],
  extras,
}: {
  action: string;
  searchField: FilterField;
  filters?: FilterField[];
  extras?: ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className="grid gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/70"
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          name={searchField.name}
          defaultValue={searchField.defaultValue}
          placeholder={searchField.placeholder}
          aria-label={searchField.label}
          className="pl-9"
        />
      </div>
      {(filters.length > 0 || extras) && (
        <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          {filters.map((filter) => (
            <Input
              key={filter.name}
              name={filter.name}
              defaultValue={filter.defaultValue}
              placeholder={filter.placeholder ?? filter.label}
              aria-label={filter.label}
            />
          ))}
          {extras}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          검색
        </Button>
      </div>
    </form>
  );
}
