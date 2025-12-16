import Ably from "ably";

const ably = new Ably.Realtime({
  key: process.env.ABLY_API_KEY!,
});

export async function publishStudentsChanged() {
  const channel = ably.channels.get("students");
  await channel.publish("changed", { ts: Date.now() });
}
