// app/lib/realtime-client.ts
"use client";

import { useEffect } from "react";
import Ably from "ably";

type Callback = () => void;

/**
 * Ably 실시간 갱신 훅
 * - channel: "students"
 * - event: "changed"
 */
export function useStudentsRealtime(onChanged: Callback) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (!key) {
      console.warn("[ably] NEXT_PUBLIC_ABLY_KEY is missing");
      return;
    }

    const ably = new Ably.Realtime({ key });
    const channel = ably.channels.get("students");

    let timer: any = null;

    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          onChanged();
        } catch (e) {
          console.error("[ably] onChanged error:", e);
        }
      }, 120);
    };

    // 연결 상태 로그(문제 디버깅용)
    ably.connection.on("connected", () => console.log("[ably] connected"));
    ably.connection.on("failed", (e) => console.log("[ably] failed", e));

    channel.subscribe("changed", handler);

    return () => {
      clearTimeout(timer);
      channel.unsubscribe("changed", handler);
      ably.close();
    };
  }, [onChanged]);
}
