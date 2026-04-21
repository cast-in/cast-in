import type { JobStatus } from "@/types/enums";

export type JobLike = {
  status: JobStatus;
  deadline: string | null;
};

export function isDeadlinePassed(deadline: string | null, now = new Date()) {
  return Boolean(deadline && new Date(deadline).getTime() < now.getTime());
}

export function isJobAccepting(job: JobLike, now = new Date()) {
  return job.status === "open" && !isDeadlinePassed(job.deadline, now);
}

export function getJobAvailabilityLabel(job: JobLike, now = new Date()) {
  if (job.status === "draft") return "임시저장";
  if (!isJobAccepting(job, now)) return "마감";
  return "모집중";
}
