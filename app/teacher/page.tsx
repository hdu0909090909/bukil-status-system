"use client";

import { Suspense } from "react";
import TeacherPageInner from "./TeacherPageInner";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-slate-300 p-8">Loading...</div>}>
      <TeacherPageInner />
    </Suspense>
  );
}
