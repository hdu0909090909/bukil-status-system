// app/teacher/page.tsx
import { Suspense } from "react";
import TeacherPageInner from "./TeacherPageInner";

export default function TeacherPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">불러오는 중...</div>}>
      {/* TeacherPageInner는 "use client"인 컴포넌트 */}
      <TeacherPageInner />
    </Suspense>
  );
}
