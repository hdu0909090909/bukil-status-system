// app/change-password/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChangePasswordPageOuter() {
  // Vercel이 요구하는 Suspense 래핑
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
      <ChangePasswordPageInner />
    </Suspense>
  );
}

function ChangePasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // /change-password?role=student&id=11101 이런 식으로 오면 자동 세팅
  const initialRole =
    (searchParams.get("role") as "student" | "teacher" | null) || "student";
  const initialId = searchParams.get("id") || "";

  const [tab, setTab] = useState<"student" | "teacher">(initialRole);
  const [userId, setUserId] = useState(initialId); // 학생이면 학번, 교원이면 아이디
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!userId.trim()) {
      setError(tab === "student" ? "학번을 입력하세요." : "아이디를 입력하세요.");
      return;
    }
    if (!oldPw.trim()) {
      setError("현재 비밀번호를 입력하세요.");
      return;
    }
    if (!newPw.trim()) {
      setError("새 비밀번호를 입력하세요.");
      return;
    }
    if (newPw !== newPw2) {
      setError("새 비밀번호가 서로 다릅니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: tab,
          id: userId.trim(),
          oldPw,
          newPw,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "비밀번호 변경에 실패했습니다.");
        return;
      }

      setOkMsg("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      setError("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edeff2] flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-3xl shadow-sm border border-[#e5e7eb] py-8 px-8">
        <h1 className="text-3xl font-bold text-center mb-6 tracking-tight">
          비밀번호 변경
        </h1>

        {/* 탭 (학생 / 교원) */}
        <div className="flex bg-[#e9edf2] rounded-lg overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("student");
              setError("");
              setOkMsg("");
            }}
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
            onClick={() => {
              setTab("teacher");
              setError("");
              setOkMsg("");
            }}
            className={`flex-1 py-2.5 text-sm font-semibold border-l border-[#d5d7da] ${
              tab === "teacher"
                ? "bg-[#1976ff] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            교사·교원
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 아이디 / 학번 */}
          <div>
            <label className="block text-sm mb-1 text-gray-800">
              {tab === "student" ? "학번" : "교원 아이디"}
            </label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
              placeholder={
                tab === "student" ? "예: 11101" : "예: 윤인하 / 이도현"
              }
            />
          </div>

          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-sm mb-1 text-gray-800">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
              placeholder="현재 비밀번호를 입력하세요."
            />
            {tab === "student" && (
              <p className="text-[11px] text-gray-400 mt-1">
                (※초기 비밀번호: 12345678)
              </p>
            )}
            {tab === "teacher" && (
              <p className="text-[11px] text-gray-400 mt-1">
                뀨?
              </p>
            )}
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm mb-1 text-gray-800">
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
              placeholder="새 비밀번호를 입력하세요."
            />
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <label className="block text-sm mb-1 text-gray-800">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976ff] text-sm"
              placeholder="다시 한 번 입력하세요."
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
          {okMsg && <p className="text-green-600 text-xs">{okMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1976ff] hover:bg-[#105ee0] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-semibold mt-1"
          >
            {loading ? "변경 중..." : "비밀번호 변경하기"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            로그인 화면으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
}
