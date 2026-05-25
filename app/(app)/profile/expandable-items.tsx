"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExpandableItems({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {expanded ? children : null}
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex h-9 items-center gap-2 px-3 text-sm font-bold text-foreground/75 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {expanded ? "접기" : "더보기"}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 transition", expanded && "rotate-180")}
          />
        </button>
      </div>
    </>
  );
}
