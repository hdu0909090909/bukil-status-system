"use client";

import { useEffect, useState } from "react";

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
  status: Status | string;
  reason: string;
  approved: boolean;
  seatId?: string;
};

export default function TeacherPage() {
  const [students, setStudents] = useState<Student[]>([]);

  // 데이터 불러오기
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/students");
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data);
    };
    load();
  }, []);

  // 개별 저장
  const saveStudent = async (id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
  };

  // ★ 일괄 재실 (수동 실행 전용)
  const resetAllToPresent = async () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: "재실", reason: "" }))
    );

    await Promise.all(
      students.map((s) =>
        fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, status: "재실", reason: "" }),
        })
      )
    );
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-2xl font-bold mb-4">교사 / 교원 페이지</h1>
      <div className="w-[900px] border-2 border-black rounded-md overflow-hidden bg-white">
        {/* 상단 바 */}
        <div className="bg-gray-100 px-3 py-2 font-bold border-b border-black flex items-center justify-between">
          <span>현재 상태</span>
          <button
            onClick={resetAllToPresent}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded"
          >
            일괄 재실
          </button>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="py-2 px-2 text-left w-16">학번</th>
                <th className="py-2 px-2 text-left w-20">이름</th>
                <th className="py-2 px-2 text-left w-32">상태</th>
                <th className="py-2 px-2 text-left">사유</th>
                <th className="py-2 px-2 text-left w-16">허가</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="px-2 py-1">{s.id}</td>
                  <td className="px-2 py-1">{s.name}</td>
                  <td className="px-2 py-1">
                    <select
                      value={s.status}
                      onChange={(e) =>
                        saveStudent(s.id, { status: e.target.value as Status })
                      }
                      className="border rounded px-1 py-[2px] text-xs w-full"
                    >
                      {STATUS_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={s.reason}
                      onChange={(e) => saveStudent(s.id, { reason: e.target.value })}
                      className="border rounded px-1 py-[2px] text-xs w-full"
                      placeholder="사유 입력"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() =>
                        saveStudent(s.id, { approved: !s.approved })
                      }
                      className={`text-xs px-2 py-1 rounded ${
                        s.approved ? "bg-green-500 text-white" : "bg-gray-300"
                      }`}
                    >
                      {s.approved ? "O" : "X"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
