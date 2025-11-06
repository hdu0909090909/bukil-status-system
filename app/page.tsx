"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"student" | "teacher" | "tv">("student");
  const [studentId, setStudentId] = useState("");
  const [studentPw, setStudentPw] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teacherPw, setTeacherPw] = useState("");
  const [tvKey, setTvKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ------------------ 학생 로그인 ------------------
    if (tab === "student") {
      if (!studentId.trim()) {
        setError("학번 / 아이디를 입력하세요.");
        return;
      }

      // ✅ 여기서 API로 검증
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "student",
          id: studentId.trim(),
          password: studentPw,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message || "로그인에 실패했습니다.");
        return;
      }

      router.push(`/student?id=${data.id}`);
      return;
    }

    // ------------------ 교원 로그인 ------------------
    if (tab === "teacher") {
      if (!teacherId.trim()) {
        setError("교원 아이디를 입력하세요.");
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "teacher",
          id: teacherId.trim(),
          password: teacherPw,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message || "로그인에 실패했습니다.");
        return;
      }

      // ✅ teacher/page.tsx는 지금도 ?user=... 로 받으니까 그대로 맞춰줌
      router.push(`/teacher?user=${encodeURIComponent(data.id)}`);
      return;
    }

    // ------------------ TV 로그인 ------------------
    if (tab === "tv") {
      if (tvKey.trim() !== "TV-ROOM-111") {
        setError("TV 키가 올바르지 않습니다. (예: TV-ROOM-111)");
        return;
      }
      router.push("/display");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-[#edeff2] flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-3xl shadow-sm border border-[#e5e7eb] py-8 px-8">
        <h1 className="text-3xl font-bold text-center mb-6 tracking-tight">
          로그인
        </h1>

        {/* 탭 */}
        <div className="flex bg-[#e9edf2] rounded-lg overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setTab("student")}
            className={`flex-1 py-2.5 text-sm font-semibold ${
              tab === "student"
                ? "bg-[#1976ff] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            학생
          </button>
          <button
            type="button"
            onClick={() => setTab("teacher")}
            className={`flex-1 py-2.5 text-sm font-semibold border-l border-[#d5d7da] ${
              tab === "teacher"
                ? "bg-[#1976ff] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            교사·교원
          </button>
          <button
            type="button"
            onClick={() => setTab("tv")}
            className={`flex-1 py-2.5 text-sm font-semibold border-l border-[#d5d7da] ${
              tab === "tv"
                ? "bg-[#1976ff] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            TV
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학생 입력칸 */}
          {tab === "student" && (
            <>
              <div>
                <label className="block text-sm mb-1 text-gray-800">
                  학번 / 아이디
                </label>
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
                  placeholder="아이디를 입력하세요."
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-800">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={studentPw}
                  onChange={(e) => setStudentPw(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
                  placeholder="비밀번호를 입력하세요."
                />
              </div>
            </>
          )}

          {/* 교원 입력칸 */}
          {tab === "teacher" && (
            <>
              <div>
                <label className="block text-sm mb-1 text-gray-800">
                  교원 아이디
                </label>
                <input
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
                  placeholder="아이디를 입력하세요."
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-800">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={teacherPw}
                  onChange={(e) => setTeacherPw(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
                  placeholder="비밀번호를 입력하세요."
                />
              </div>
            </>
          )}

          {/* TV 입력칸 */}
          {tab === "tv" && (
            <div>
              <label className="block text-sm mb-1 text-gray-800">
                표시용 키 / 토큰
              </label>
              <input
                value={tvKey}
                onChange={(e) => setTvKey(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
                placeholder="ex) TV-ROOM-111"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                TV는 이 키만 있으면 접속됩니다.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#1976ff] hover:bg-[#105ee0] text-white py-2.5 rounded-md text-sm font-semibold mt-1"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
