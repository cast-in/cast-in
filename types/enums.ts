/**
 * types/database.ts 는 supabase gen types 로 자동 생성되므로
 * 앱에서 자주 쓰는 Enum alias 는 여기서 export.
 */
import type { Database } from "./database";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type JobStatus = Database["public"]["Enums"]["job_status"];
export type ApplicationStatus =
  Database["public"]["Enums"]["application_status"];
