// app/student/page.tsx
"use client";

import { Suspense } from "react";
import StudentPageInner from "./StudentPageInner";

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">불러오는 중...</div>}>
      <StudentPageInner />
    </Suspense>
  );
}
