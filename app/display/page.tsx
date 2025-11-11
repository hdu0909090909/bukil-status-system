"use client";

import { useEffect, useRef, useState } from "react";

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
  "화장실",
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

// 자리 좌표
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

const sortById = <T extends { id: string }>(list: T[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

function statusToPlace(
  status: string
): "classroom" | "mediaspace" | "gone" | "etc" {
  if (status === "재실") return "classroom";
  if (status === "미디어스페이스") return "mediaspace";
  if (status === "귀가" || status === "외출") return "gone";
  return "etc";
}

// (있던 스케줄 자동 적용용) 요일
function getDayKeyByDate(
  d: Date
): "mon" | "tue" | "wed" | "thu" | "fri" | null {
  const day = d.getDay();
  switch (day) {
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    case 5:
      return "fri";
    default:
      return null;
  }
}

// 시간대
function getSlotByDate(
  d: Date
): "8교시" | "야간 1차시" | "야간 2차시" | null {
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes >= 16 * 60 + 50 && minutes < 18 * 60) return "8교시";
  if (minutes >= 19 * 60 + 10 && minutes < 21 * 60) return "야간 1차시";
  if (minutes >= 21 * 60 + 15 && minutes < 23 * 60 + 30) return "야간 2차시";
  return null;
}

export default function DisplayPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [now, setNow] = useState("");
  const lastAppliedRef = useRef<string | null>(null);

  // ↑ 여기까지는 네가 쓰던거 그대로

  // 시계
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

  // 👇 학생 데이터: **읽기만** 3초마다
  useEffect(() => {
    let alive = true;

    const load = async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (!res.ok) return;
      const data: Student[] = await res.json();
      if (!alive) return;
      setStudents(sortById(data));
    };

    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // 스케줄 자동 적용은 있던거 유지
  useEffect(() => {
    const checkAndApply = async () => {
      const d = new Date();
      const dayKey = getDayKeyByDate(d);
      const slot = getSlotByDate(d);
      if (!dayKey || !slot) return;

      const key = `${dayKey}|${slot}`;
      if (lastAppliedRef.current === key) return;

      await fetch("/api/scheduler/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: dayKey, slot }),
      });

      lastAppliedRef.current = key;
    };

    checkAndApply();
    const t = setInterval(checkAndApply, 30_000);
    return () => clearInterval(t);
  }, []);

  // 디스플레이에서 직접 수정할 때만 서버에 씀
  const saveStudent = async (id: string, updates: Partial<Student>) => {
    // 화면 먼저
    setStudents((prev) =>
      sortById(prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    );
    // 서버
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
  };

  // 일괄 재실
  const resetAllToPresent = async () => {
    const updated = students.map((s) => ({
      ...s,
      status: "재실" as const,
      reason: "",
    }));
    setStudents(sortById(updated));

    // 서버도 한 명씩 (너가 쓰던 방식 유지)
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

  // 분류
  const classroomStudents = students.filter(
    (s) => statusToPlace(s.status) === "classroom" && s.seatId
  );
  const mediaStudents = students
    .filter((s) => statusToPlace(s.status) === "mediaspace")
    .sort((a, b) => Number(a.id) - Number(b.id));
  const goneStudents = students
    .filter((s) => statusToPlace(s.status) === "gone")
    .sort((a, b) => Number(a.id) - Number(b.id));
  const etcStudents = students
    .filter((s) => statusToPlace(s.status) === "etc")
    .sort((a, b) => Number(a.id) - Number(b.id));

  const etcByStatus: Record<string, Student[]> = {};
  for (const s of etcStudents) {
    if (!etcByStatus[s.status]) etcByStatus[s.status] = [];
    etcByStatus[s.status].push(s);
  }
  const etcStatusKeys = Object.keys(etcByStatus);

  const totalCount = students.length;
  const inClassOrMedia = students.filter((s) => {
    const place = statusToPlace(s.status);
    return place === "classroom" || place === "mediaspace";
  }).length;
  const outClassOrMedia = totalCount - inClassOrMedia;

  const inCampus = students.filter((s) => {
    const place = statusToPlace(s.status);
    if (place === "gone") return false;
    if (s.status === "호실자습") return false;
    return true;
  }).length;
  const outCampus = totalCount - inCampus;

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
                          saveStudent(s.id, {
                            status: e.target.value as Status,
                          })
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
                        onChange={(e) =>
                          saveStudent(s.id, { reason: e.target.value })
                        }
                        className="border rounded px-1 py-[1px] text-[11px] w-full"
                        placeholder="사유 입력"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        disabled
                        className={`text-[11px] px-2 py-[2px] rounded w-full ${
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

        {/* 오른쪽 전체 */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* 위쪽: 교실 + 오른쪽 묶음 */}
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

            {/* 오른쪽: 미디어/귀가 + 인원 */}
            <div className="flex-1 flex gap-3 min-h-0 h-[420px]">
              {/* 왼쪽 세로: 미디어 + 귀가 */}
              <div className="w-[360px] flex flex-col gap-3 h-full min-h-0">
                {/* 미디어스페이스 */}
                <div className="border-2 border-black flex-1 flex flex-col min-h-0">
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

                {/* 귀가/외출 */}
                <div className="border-2 border-black flex-1 flex flex-col min-h-0">
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

              {/* 오른쪽: 인원 카드 2개 */}
              <div className="flex-1 flex flex-col gap-3 h-full min-h-0">
                <div className="bg-white border border-gray-300 rounded-md px-3 py-3 flex-1 flex flex-col">
                  <div className="text-base font-semibold mb-3 text-center">
                    인원 (교실·미디어스페이스)
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">총원</span>
                    <span className="font-bold text-lg">{totalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">재실/미디어스페이스</span>
                    <span className="font-bold text-lg text-green-600">
                      {inClassOrMedia}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-auto">
                    <span className="text-gray-600">결원</span>
                    <span className="font-bold text-lg text-red-500">
                      {outClassOrMedia}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-300 rounded-md px-3 py-3 flex-1 flex flex-col">
                  <div className="text-base font-semibold mb-3 text-center">
                    인원 (교내)
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">총원</span>
                    <span className="font-bold text-lg">{totalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">교내에 있음</span>
                    <span className="font-bold text-lg text-green-600">
                      {inCampus}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-auto">
                    <span className="text-gray-600">결원</span>
                    <span className="font-bold text-lg text-red-500">
                      {outCampus}
                    </span>
                  </div>
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
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                }}
              >
                {etcStatusKeys.map((st) => (
                  <div key={st} className="border-2 border-black bg-white">
                    <div className="text-xs font-semibold px-2 py-1 border-b bg-gray-50">
                      {st}
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {etcByStatus[st]
                        .slice()
                        .sort((a, b) => Number(a.id) - Number(b.id))
                        .map((s) => (
                          <div key={s.id} className="text-sm leading-tight">
                            {s.name}
                            {s.reason && (
                              <div className="text-[10px] text-gray-500">
                                {s.reason}
                              </div>
                            )}
                            <div
                              className={`text-[10px] ${
                                s.approved ? "text-blue-600" : "text-red-500"
                              }`}
                            >
                              {s.approved ? "허가됨" : "미허가"}
                            </div>
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
