"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

type ActorApplicationSortValue = "latest" | "oldest";

export function ActorApplicationSort({
  value,
}: {
  value: ActorApplicationSortValue;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(nextValue: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextValue === "oldest") {
      next.set("sort", nextValue);
    } else {
      next.delete("sort");
    }
    next.delete("page");

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="relative w-full sm:w-[160px]">
      <Select
        aria-label="지원 내역 정렬"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="h-11 appearance-none rounded-md bg-card pr-10 font-medium"
      >
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
      </Select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
