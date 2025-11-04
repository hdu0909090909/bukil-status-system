"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

type Status = (typeof STATUS_LIST)[number];

type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
};

export default function StudentPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [me, setMe] = useState<Student | null>(null);
  const [status, setStatus] = useState<string>("재실");
  const [reason, setReason] = useState("");

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

  if (!studentId) {
    return <div className="p-6">잘못된 접근입니다. 처음 페이지에서 로그인해주세요.</div>;
  }

  if (!me) {
    return <div className="p-6">불러오는 중...</div>;
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

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        {me.name} ({me.id})
      </h1>
      <div className="max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded w-full px-2 py-1 text-sm"
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
            className="border rounded w-full px-2 py-1 text-sm"
            placeholder="사유 입력"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
        >
          저장
        </button>
      </div>
    </div>
  );
}
