// app/teacher/page.tsx
"use client";

import { useEffect, useState } from "react";
import Desktop from "./TeacherPageInner";   // 또는 "./desktop"
import Mobile from "./TeacherMobile";       // 또는 "./mobile"

export default function TeacherPageRouter() {
  // 처음 한 번만 window 보고 초기값 결정
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 950;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const next = window.innerWidth < 950;
      setIsMobile(prev => (prev === next ? prev : next));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? <Mobile /> : <Desktop />;
}
