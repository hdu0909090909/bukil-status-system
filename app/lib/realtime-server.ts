// app/lib/realtime-server.ts
import { Rest } from "ably";
import { STUDENTS_CHANNEL, STUDENTS_EVENT } from "./realtime";

export async function publishStudentsUpdate(payload?: Record<string, any>) {
  const key = process.env.ABLY_API_KEY;
  if (!key) return;

  const ably = new Rest({ key });

  await ably.channels.get(STUDENTS_CHANNEL).publish(STUDENTS_EVENT, {
    at: Date.now(),
    ...payload,
  });
}
