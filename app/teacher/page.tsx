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

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data);
    };
    load();
  }, []);

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

  const setAllToDefault = async () => {
    const next = students.map((s) => ({
      ...s,
      status: "재실",
      reason: "",
      approved: true,
    }));
    setStudents(next);
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true, status: "재실", reason: "", approved: true }),
    });
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold">교사 / 교원 페이지</h1>
          <button
            onClick={setAllToDefault}
            className="bg-blue-500 text-white text-sm px-3 py-2 rounded"
          >
            전체 재실 처리
          </button>
        </div>

        {/* 모바일에서는 카드형, 큰 화면에서는 테이블 */}
        <div className="block lg:hidden space-y-3">
          {students.map((s) => (
            <div key={s.id} className="border rounded p-3 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold">
                  {s.name} ({s.id})
                </div>
                <button
                  onClick={() => saveStudent(s.id, { approved: !s.approved })}
                  className={`text-xs px-2 py-1 rounded ${
                    s.approved ? "bg-green-500 text-white" : "bg-gray-300"
                  }`}
                >
                  {s.approved ? "허가" : "미허가"}
                </button>
              </div>
              <div className="mb-2">
                <label className="text-xs block mb-1">상태</label>
                <select
                  value={s.status}
                  onChange={(e) =>
                    saveStudent(s.id, { status: e.target.value as Status })
                  }
                  className="border rounded w-full text-sm px-2 py-1"
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1">사유</label>
                <input
                  value={s.reason}
                  onChange={(e) => saveStudent(s.id, { reason: e.target.value })}
                  className="border rounded w-full text-sm px-2 py-1"
                  placeholder="사유 입력"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 데스크톱 테이블 */}
        <div className="hidden lg:block w-full border-2 border-black rounded-md overflow-hidden bg-white">
          <div className="bg-gray-100 px-3 py-2 font-bold border-b border-black">
            현재 상태
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
    </div>
  );
}
