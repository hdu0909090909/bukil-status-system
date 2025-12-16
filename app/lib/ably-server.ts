// app/lib/ably-server.ts
import Ably from "ably";

/**
 * 서버에서 학생 목록이 바뀌었음을 Ably로 브로드캐스트
 * - channel: "students"
 * - event: "changed"
 */
export async function publishStudentsChanged() {
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    console.error("[ably] ABLY_API_KEY is missing");
    return;
  }

  try {
    const client = new Ably.Rest({ key });
    const channel = client.channels.get("students");
    await channel.publish("changed", { t: Date.now() });
  } catch (err) {
    console.error("[ably] publishStudentsChanged failed:", err);
  }
}
