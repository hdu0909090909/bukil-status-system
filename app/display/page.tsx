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

const SEAT_POS: Record<string, { x: number; y: number }> = {
  "11115": { x: 40, y: 20 },
  "11130": { x: 140, y: 20 },
  "11125": { x: 240, y: 20 },
  "11106": { x: 340, y: 20 },
  "11124": { x: 440, y: 20 },
  "11110": { x: 540, y: 20 },

  "11119": { x: 40, y: 90 },
  "11108": { x: 140, y: 90 },
  "11120": { x: 240, y: 90 },
  "11118": { x: 340, y: 90 },
  "11102": { x: 440, y: 90 },
  "11126": { x: 540, y: 90 },

  "11127": { x: 40, y: 160 },
  "11128": { x: 140, y: 160 },
  "11121": { x: 240, y: 160 },
  "11103": { x: 340, y: 160 },
  "11107": { x: 440, y: 160 },
  "11111": { x: 540, y: 160 },

  "11112": { x: 40, y: 230 },
  "11101": { x: 140, y: 230 },
  "11129": { x: 240, y: 230 },
  "11117": { x: 340, y: 230 },
  "11116": { x: 440, y: 230 },

  "11104": { x: 40, y: 300 },
  "11122": { x: 140, y: 300 },
  "11109": { x: 240, y: 300 },
  "11113": { x: 340, y: 300 },
};

function statusToPlace(status: string): "classroom" | "mediaspace" | "gone" | "etc" {
  if (status === "재실") return "classroom";
  if (status === "미디어스페이스") return "mediaspace";
  if (status === "귀가" || status === "외출") return "gone";
  return "etc";
}

export default function DisplayPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [now, setNow] = useState("");

  // 상단 시간
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      setNow(`${yyyy}-${mm}-${dd} ${hh}:${mi}`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  // 학생 데이터 주기적 fetch + 날짜 바뀌면 자동 리셋
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/students");
      if (!res.ok) return;
      const data: Student[] = await res.json();

      // 날짜 체크
      const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      const lastReset = typeof window !== "undefined" ? localStorage.getItem("student-last-reset") : null;

      // 날이 바뀌었다면 자동 재실
      if (lastReset !== today) {
        // 화면 먼저 재실로
        const resetData = data.map((s) => ({
          ...s,
          status: "재실",
          reason: "",
        }));
        setStudents(resetData);

        // 서버에도 전부 PATCH
        await Promise.all(
          data.map((s) =>
            fetch("/api/students", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: s.id, status: "재실", reason: "" }),
            })
          )
        );

        localStorage.setItem("student-last-reset", today);
      } else {
        // 평소에는 그냥 세팅
        setStudents(data);
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const saveStudent = async (id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
  };

  // ★ 일괄 재실 버튼
  const resetAllToPresent = async () => {
    // 화면 먼저
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: "재실",
        reason: "",
      }))
    );

    // 서버에도 전부
    await Promise.all(
      students.map((s) =>
        fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, status: "재실", reason: "" }),
        })
      )
    );

    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("student-last-reset", today);
  };

  const classroomStudents = students.filter(
    (s) => statusToPlace(s.status) === "classroom" && s.seatId
  );
  const mediaStudents = students
    .filter((s) => statusToPlace(s.status) === "mediaspace")
    .sort((a, b) => a.id.localeCompare(b.id));
  const goneStudents = students.filter((s) => statusToPlace(s.status) === "gone");
  const etcStudents = students.filter((s) => statusToPlace(s.status) === "etc");

  // 기타 상태별로 묶기
  const etcByStatus: Record<string, Student[]> = {};
  for (const s of etcStudents) {
    if (!etcByStatus[s.status]) etcByStatus[s.status] = [];
    etcByStatus[s.status].push(s);
  }
  const etcStatusKeys = Object.keys(etcByStatus);

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col gap-4">
      {/* 상단바 */}
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-semibold">표시 화면</h2>
        <div className="text-sm text-gray-600">{now}</div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 왼쪽 표 */}
        <div className="w-[460px] border-2 border-black rounded-md flex flex-col min-h-0">
          <div className="flex items-center justify-between bg-gray-100 px-3 py-2 font-bold border-b border-black">
            <span>현재 상태</span>
            <button
              onClick={resetAllToPresent}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
            >
              일괄 재실
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-black sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2 text-left w-14">학번</th>
                  <th className="py-2 px-2 text-left w-16">이름</th>
                  <th className="py-2 px-2 text-left w-24">상태</th>
                  <th className="py-2 px-2 text-left">사유</th>
                  <th className="py-2 px-2 text-left w-12">허가</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="px-2 py-1">{s.id}</td>
                    <td className="px-2 py-1 truncate">{s.name}</td>
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
                    <td className="px-2 py-1">
                      <input
                        value={s.reason}
                        onChange={(e) => saveStudent(s.id, { reason: e.target.value })}
                        className="border rounded px-1 py-[1px] text-[11px] w-full"
                        placeholder="사유 입력"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => saveStudent(s.id, { approved: !s.approved })}
                        className={`text-[11px] px-2 py-[2px] rounded ${
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

        {/* 오른쪽 전체 - 너가 맞춰놓은 높이 그대로 */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex gap-4 min-h-[360px]">
            {/* 교실 */}
            <div className="relative border-2 border-black w-[650px] h-[420px] flex flex-col">
              <div className="text-center font-bold py-1 border-b border-black bg-white">
                &lt;교실&gt;
              </div>
              <div className="relative flex-1">
                {classroomStudents.map((s) => {
                  const pos = s.seatId ? SEAT_POS[s.seatId] : undefined;
                  if (!pos) return null;
                  return (
                    <div
                      key={s.id}
                      className="absolute border-[3px] border-black px-3 py-1 text-sm font-semibold bg-white"
                      style={{ left: pos.x, top: pos.y + 10 }}
                    >
                      {s.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 오른쪽 세로 박스들 */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div className="border-2 border-black flex-1 min-h-[150px] flex flex-col">
                <div className="text-center font-bold py-1 border-b border-black bg-white">
                  &lt;미디어스페이스&gt;
                </div>
                <div className="p-2 flex flex-col gap-2 overflow-y-auto">
                  {mediaStudents.map((s, idx) => (
                    <div
                      key={s.id}
                      className="border-[2px] border-black bg-white text-sm font-semibold text-center py-1"
                    >
                      {idx + 1}. {s.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-black flex-1 min-h-[150px] flex flex-col">
                <div className="text-center font-bold py-1 border-b border-black bg-white">
                  &lt;귀가/외출&gt;
                </div>
                <div className="p-2 flex flex-col gap-2 overflow-y-auto">
                  {goneStudents.map((s) => (
                    <div
                      key={s.id}
                      className="border-[2px] border-black bg-gray-200 text-sm text-center py-1"
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 기타 */}
          <div className="border-2 border-black flex-1 min-h-[140px] flex flex-col">
            <div className="px-3 py-1 font-bold border-b border-black bg-white">
              &lt;기타&gt;
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
              >
                {etcStatusKeys.map((st) => (
                  <div key={st} className="border-2 border-black bg-white">
                    <div className="text-xs font-semibold px-2 py-1 border-b bg-gray-50">
                      {st}
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {etcByStatus[st].map((s) => (
                        <div key={s.id} className="text-sm leading-tight">
                          {s.name}
                          {s.reason && (
                            <div className="text-[10px] text-gray-500">{s.reason}</div>
                          )}
                          {!s.approved && (
                            <div className="text-[10px] text-red-500">미허가</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
