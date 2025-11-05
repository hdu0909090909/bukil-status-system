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

  // 🔹 학생 데이터 로드
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/students");
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data);
    };
    load();
  }, []);

  // 🔹 학생 정보 업데이트
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

  // 🔹 전체 재실로 변경 버튼
  const setAllToDefault = async () => {
    const updated = students.map((s) => ({
      ...s,
      status: "재실",
      reason: "",
      approved: true,
    }));
    setStudents(updated);
    await fetch("/api/students/reset", { method: "POST" });
    alert("전체 재실로 변경되었습니다.");
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-2xl font-bold mb-4">교사 / 교원 페이지</h1>

      <div className="w-full max-w-full border-2 border-black rounded-md overflow-hidden bg-white">
        <div className="bg-gray-100 px-3 py-2 font-bold border-b border-black flex justify-between items-center">
          <span>현재 상태</span>
          <button
            onClick={setAllToDefault}
            className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
          >
            전체 재실로 변경
          </button>
        </div>

        {/* ✅ 반응형 가로 스크롤 */}
        <div className="overflow-x-auto">
          <table className="min-w-[650px] w-full text-sm sm:text-xs">
            <thead className="bg-gray-50 border-b border-black sticky top-0">
              <tr>
                <th className="py-2 px-2 text-left w-16">학번</th>
                <th className="py-2 px-2 text-left w-20">이름</th>
                <th className="py-2 px-2 text-left w-32">상태</th>
                <th className="py-2 px-2 text-left">사유</th>
                <th className="py-2 px-2 text-center w-16">허가</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  {/* 학번 */}
                  <td className="px-2 py-1">{s.id}</td>

                  {/* 이름 */}
                  <td className="px-2 py-1">{s.name}</td>

                  {/* 상태 */}
                  <td className="px-2 py-1">
                    <select
                      value={s.status}
                      onChange={(e) =>
                        saveStudent(s.id, { status: e.target.value as Status })
                      }
                      className="border rounded px-1 py-[1px] text-[11px] w-full"
                    >
                      {STATUS_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 사유 */}
                  <td className="px-2 py-1">
                    <input
                      value={s.reason}
                      onChange={(e) =>
                        saveStudent(s.id, { reason: e.target.value })
                      }
                      className="border rounded px-1 py-[1px] text-[11px] w-full"
                      placeholder="사유 입력"
                    />
                  </td>

                  {/* 허가 */}
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() =>
                        saveStudent(s.id, { approved: !s.approved })
                      }
                      className={`text-[11px] px-2 py-[2px] rounded ${
                        s.approved
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-black"
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
