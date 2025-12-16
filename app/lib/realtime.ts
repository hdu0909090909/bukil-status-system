// lib/realtime.ts
import Ably from "ably";

export const STUDENTS_CHANNEL = "students";
export const STUDENTS_EVENT = "students_changed";

export function createAblyRealtimeClient() {
  const key = process.env.NEXT_PUBLIC_ABLY_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_ABLY_KEY is missing");
  return new Ably.Realtime({ key });
}
