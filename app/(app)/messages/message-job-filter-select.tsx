"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { Select } from "@/components/ui/select";

type MessageJobFilterSelectProps = {
  jobs: { id: string; title: string }[];
  q: string;
  roomId: string;
  selectedJobId: string;
};

export function MessageJobFilterSelect({
  jobs,
  q,
  roomId,
  selectedJobId,
}: MessageJobFilterSelectProps) {
  const router = useRouter();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const query = new URLSearchParams();
    if (roomId) query.set("room", roomId);
    query.set("filter", "job");
    if (event.currentTarget.value) {
      query.set("job_filter", event.currentTarget.value);
    }
    if (q) query.set("q", q);

    router.replace(`/messages?${query.toString()}`, { scroll: false });
  }

  return (
    <label className="block">
      <span className="sr-only">작품 선택</span>
      <Select
        name="job_filter"
        value={selectedJobId}
        onChange={handleChange}
      >
        <option value="">전체 작품</option>
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.title}
          </option>
        ))}
      </Select>
    </label>
  );
}
