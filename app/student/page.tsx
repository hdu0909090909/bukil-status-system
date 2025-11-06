"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const STATUS_LIST = [
  "재실",
  "미디어스페이스",
  "귀가",
  "외출",
  "호실자습",
  "아단관 강당3",
  "아단관 강의실",
  "방과후수업",
  "동아리 활동",
  "교내활동",
  "보건실 요양",
  "상담",
  "기타",
] as const;

type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
};

export default function StudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [me, setMe] = useState<Student | null>(null);
  const [status, setStatus] = useState<string>("재실");
  const [reason, setReason] = useState("");

  // 데이터 불러오기
  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      const res = await fetch("/api/students");
      const data: Student[] = await res.json();
      const found = data.find((s) => s.id === studentId);
      if (found) {
        setMe(found);
        setStatus(found.status);
        setReason(found.reason);
      }
    };
    load();
  }, [studentId]);

  const handleLogout = () => {
    router.push("/");
  };

  if (!studentId) {
    return (
      <div className="p-6 text-center text-gray-700">
        잘못된 접근입니다. 처음 페이지에서 로그인해주세요.
      </div>
    );
  }

  if (!me) {
    return (
      <div className="p-6 text-center text-gray-500">불러오는 중...</div>
    );
  }

  const handleSave = async () => {
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: me.id,
        status,
        reason,
      }),
    });
    alert("저장되었습니다.");
  };

  // 🔑 여기서 기존 change-password 페이지로 보내기
  const goToChangePassword = () => {
    router.push(`/change-password?role=student&id=${me.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* 상단 헤더 */}
      <div className="w-full bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 font-semibold"
          >
            ← 로그아웃
          </button>

          <div className="flex flex-col items-center text-gray-700">
            <span className="text-lg font-semibold">
              {me.name} <span className="text-gray-500 text-sm">학생</span>
            </span>
            <span className="text-xs text-gray-400">학번 {me.id}</span>
          </div>

          <div className="w-[72px]" />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-[360px]">
          <h2 className="text-lg font-semibold mb-4 text-center">상태 변경</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">사유</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                placeholder="사유를 입력하세요"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-[#1976ff] hover:bg-[#105ee0] text-white py-2 rounded-md text-sm font-semibold mt-2"
            >
              저장
            </button>

            {/* 여기 버튼만 추가 */}
            <button
              onClick={goToChangePassword}
              className="w-full border border-gray-200 text-gray-700 py-2 rounded-md text-sm font-semibold mt-2 hover:bg-gray-50"
            >
              비밀번호 변경하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
