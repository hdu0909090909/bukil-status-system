"use client";

import { useEffect } from "react";
import Ably from "ably";

export function useStudentsRealtime(onChanged: () => void) {
  useEffect(() => {
    let ably: Ably.Realtime | null = null;
    let timer: any = null;

    const start = async () => {
      // ✅ 토큰 방식(권장): /api/ably/token
      ably = new Ably.Realtime({
        authUrl: "/api/ably/token",
      });

      const channel = ably.channels.get("students");

      const handler = () => {
        clearTimeout(timer);
        timer = setTimeout(() => onChanged(), 120); // 디바운스
      };

      channel.subscribe("changed", handler);

      return () => {
        clearTimeout(timer);
        channel.unsubscribe("changed", handler);
        ably?.close();
        ably = null;
      };
    };

    let cleanup: null | (() => void) = null;
    start().then((fn) => (cleanup = fn));

    return () => cleanup?.();
  }, [onChanged]);
}
