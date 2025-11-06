// app/teacher/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* 공통 상태 목록 */
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

const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
] as const;

const TIME_SLOTS = ["8교시", "야간 1차시", "야간 2차시"] as const;
type DayKey = (typeof DAYS)[number]["key"];
type TimeSlot = (typeof TIME_SLOTS)[number];

export default function TeacherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user") || "윤인하";
  const displayName =
    userParam === "윤인하" ? "윤인하 선생님" : `${userParam} 학생`;

  const [tab, setTab] = useState<"status" | "schedule">("status");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  // 🔴 지금 뭔가 수정 중인지 표시
  const [isMutating, setIsMutating] = useState(false);

  const fetchStudents = async () => {
    const res = await fetch("/api/students");
    const data: Student[] = await res.json();
    data.sort((a, b) => a.id.localeCompare(b.id));
    setStudents(data);
  };

  // 첫 로드
  useEffect(() => {
    const load = async () => {
      await fetchStudents();
      setLoading(false);
    };
    load();
  }, []);

  // 상태 탭일 때만 폴링하고, 수정 중일 때는 잠깐 스킵
  useEffect(() => {
    if (tab !== "status") return;
    let stop = false;

    const tick = async () => {
      if (stop) return;
      if (isMutating) return; // 🔴 수정 중이면 덮어쓰기 금지
      const res = await fetch("/api/students");
      if (!res.ok) return;
      const data: Student[] = await res.json();
      data.sort((a, b) => a.id.localeCompare(b.id));
      if (!stop) setStudents(data);
    };

    tick();
    const t = setInterval(tick, 1500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [tab, isMutating]);

  // 개별 저장
  const saveStudent = async (id: string, updates: Partial<Student>) => {
    setIsMutating(true);
    // 화면 먼저 반영
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    // 서버에 저장
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    // 서버 값으로 한 번 맞춰줌
    await fetchStudents();
    setIsMutating(false);
  };

  // 일괄 재실
  const resetAllToPresent = async () => {
    setIsMutating(true);
    // 화면 먼저 바꾸기
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: "재실", reason: "" }))
    );
    // 서버로 일괄 PATCH
    await Promise.all(
      students.map((s) =>
        fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, status: "재실", reason: "" }),
        })
      )
    );
    // 끝나고 서버 걸로 동기화
    await fetchStudents();
    setIsMutating(false);
  };

  // 일괄 허가
  const approveAll = async () => {
    setIsMutating(true);
    setStudents((prev) => prev.map((s) => ({ ...s, approved: true })));
    await Promise.all(
      students.map((s) =>
        fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, approved: true }),
        })
      )
    );
    await fetchStudents();
    setIsMutating(false);
  };

  // 일괄 불허가
  const disapproveAll = async () => {
    setIsMutating(true);
    setStudents((prev) => prev.map((s) => ({ ...s, approved: false })));
    await Promise.all(
      students.map((s) =>
        fetch("/api/students", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, approved: false }),
        })
      )
    );
    await fetchStudents();
    setIsMutating(false);
  };

  const handleLogout = () => {
    router.push("/");
  };

  // 인원 카드
  const total = students.length;
  const inClassOrMedia = students.filter(
    (s) => s.status === "재실" || s.status === "미디어스페이스"
  ).length;
  const outClassOrMedia = total - inClassOrMedia;

  const inCampus = students.filter((s) => {
    if (s.status === "귀가" || s.status === "외출") return false;
    if (s.status === "호실자습") return false;
    return true;
  }).length;
  const outCampus = total - inCampus;

  const refreshNow = async () => {
    await fetchStudents();
  };

  return (
    <div className="min-h-screen bg-[#dfe3e8]">
      {/* 상단 바 */}
      <div className="w-full bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm font-semibold text-gray-700">
              교사 / 교원 페이지
            </div>
            <div className="flex bg-[#e5e9f0] rounded-lg overflow-hidden">
              <button
                onClick={() => setTab("status")}
                className={`px-4 py-2 text-sm font-semibold ${
                  tab === "status"
                    ? "bg-[#1f6fe5] text-white"
                    : "text-gray-700"
                }`}
              >
                학생 상태
              </button>
              <button
                onClick={() => setTab("schedule")}
                className={`px-4 py-2 text-sm font-semibold ${
                  tab === "schedule"
                    ? "bg-[#1f6fe5] text-white"
                    : "text-gray-700"
                }`}
              >
                스케줄러
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-8 h-8 rounded-full bg-[#1f6fe5] border border-blue-200" />
            <div className="leading-tight">
              <div className="font-semibold">{displayName}</div>
              <div className="flex gap-2 mt-[2px]">
                <button
                  onClick={() =>
                    (window.location.href = `/change-password?role=teacher&id=${encodeURIComponent(
                      userParam
                    )}`)
                  }
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  비밀번호 변경
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-6xl mx-auto mt-4 px-3 pb-6 flex flex-col gap-4">
        {tab === "status" ? (
          <>
            <div className="bg-white border border-gray-300 rounded-md p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">학생 상태 관리</div>
                <div className="flex gap-2">
                  <button
                    onClick={resetAllToPresent}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded"
                  >
                    일괄 재실
                  </button>
                  <button
                    onClick={approveAll}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded"
                  >
                    일괄 허가
                  </button>
                  <button
                    onClick={disapproveAll}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded"
                  >
                    일괄 불허가
                  </button>
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 w-20 text-left border-b">
                        학번
                      </th>
                      <th className="px-2 py-2 w-28 text-left border-b">
                        이름
                      </th>
                      <th className="px-2 py-2 w-40 text-left border-b">
                        상태
                      </th>
                      <th className="px-2 py-2 text-left border-b">사유</th>
                      <th className="px-2 py-2 w-16 text-left border-b">
                        허가
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-4 text-center text-gray-400"
                        >
                          불러오는 중...
                        </td>
                      </tr>
                    ) : (
                      students.map((s, idx) => (
                        <tr
                          key={s.id}
                          className={`border-b last:border-b-0 ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-2 py-1">{s.id}</td>
                          <td className="px-2 py-1">{s.name}</td>
                          <td className="px-2 py-1">
                            <select
                              value={s.status}
                              onChange={(e) =>
                                saveStudent(s.id, {
                                  status: e.target.value as Status,
                                })
                              }
                              className="border rounded px-1 py-[2px] text-sm w-full bg-white"
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
                              className="border rounded px-1 py-[2px] text-sm w-full bg-white"
                              placeholder="여기에 사유 입력"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <button
                              onClick={() =>
                                saveStudent(s.id, { approved: !s.approved })
                              }
                              className={`text-xs px-3 py-[5px] rounded ${
                                s.approved
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-800"
                              }`}
                            >
                              {s.approved ? "O" : "X"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 인원 카드 */}
            <div className="flex gap-4">
              <div className="bg-white rounded-md shadow-sm px-4 py-4 flex-1 flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1">
                  인원(교실, 미디어스페이스)
                </div>
                <div className="flex justify-between text-sm">
                  <span>총원</span>
                  <span className="font-bold text-lg">{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>재실인원</span>
                  <span className="font-bold text-lg text-green-600">
                    {inClassOrMedia}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>결원</span>
                  <span className="font-bold text-lg text-red-500">
                    {outClassOrMedia}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm px-4 py-4 flex-1 flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1">
                  인원(교내에 있는 학생)
                </div>
                <div className="flex justify-between text-sm">
                  <span>총원</span>
                  <span className="font-bold text-lg">{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>재실인원</span>
                  <span className="font-bold text-lg text-green-600">
                    {inCampus}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>결원</span>
                  <span className="font-bold text-lg text-red-500">
                    {outCampus}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <SchedulerTab onApplied={refreshNow} />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────── */
/* 스케줄러 탭 */
/* ──────────────────────────────── */
function SchedulerTab({ onApplied }: { onApplied?: () => void }) {
  const [day, setDay] = useState<DayKey>("mon");
  const [slot, setSlot] = useState<TimeSlot>("8교시");
  const [rows, setRows] = useState<
    Array<{ studentId: string; name: string; status: string; reason: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const sortById = (
    list: Array<{ studentId: string; name: string; status: string; reason: string }>
  ) => [...list].sort((a, b) => a.studentId.localeCompare(b.studentId));

  // 요일/시간 바뀌면 목록 가져오기
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/scheduler?day=${day}&slot=${encodeURIComponent(slot)}`
      );
      if (res.ok) {
        const data = await res.json();
        const items = (data.items ?? []) as Array<{
          studentId: string;
          name: string;
          status: string;
          reason: string;
        }>;
        if (items.length > 0) {
          setRows(sortById(items));
          setLoading(false);
          return;
        }
      }

      // 스케줄 없으면 현재 학생들로 채우기
      const res2 = await fetch("/api/students");
      if (res2.ok) {
        const students: Student[] = await res2.json();
        const filled = students
          .map((s) => ({
            studentId: s.id,
            name: s.name,
            status: "변경안함",
            reason: "",
          }))
          .sort((a, b) => a.studentId.localeCompare(b.studentId));
        setRows(filled);
      } else {
        setRows([]);
      }
      setLoading(false);
    };
    load();
  }, [day, slot]);

  const fillFromCurrent = async () => {
    const res = await fetch("/api/students");
    const students: Student[] = await res.json();
    const items = students
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        status: s.status ?? "변경안함",
        reason: s.reason ?? "",
      }))
      .sort((a, b) => a.studentId.localeCompare(b.studentId));
    setRows(items);
  };

  const setAllNoChange = () => {
    setRows((prev) =>
      prev.map((r) => ({ ...r, status: "변경안함", reason: "" }))
    );
  };

  const saveRows = async () => {
    await fetch("/api/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, slot, items: rows }),
    });
    alert("스케줄을 저장했습니다.");
  };

  const applyTemplate = async () => {
    const res = await fetch("/api/scheduler/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, slot }),
    });
    if (res.ok) {
      alert("이 스케줄을 적용했습니다.");
      onApplied?.();
    } else {
      alert("스케줄 적용에 실패했습니다.");
    }
  };

  const updateRow = (
    studentId: string,
    part: Partial<{ status: string; reason: string }>
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, ...part } : r))
    );
  };

  return (
    <div className="bg-white border border-gray-300 rounded-md p-3 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDay(d.key)}
              className={`px-3 py-1 text-sm border rounded ${
                day === d.key ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-2">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              onClick={() => setSlot(t)}
              className={`px-3 py-1 text-sm border rounded ${
                slot === t ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={setAllNoChange}
            className="px-3 py-1 text-sm bg-gray-200 rounded"
          >
            전체 변경안함
          </button>
          <button
            onClick={fillFromCurrent}
            className="px-3 py-1 text-sm bg-gray-200 rounded"
          >
            현재 상태로 채우기
          </button>
          <button
            onClick={saveRows}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          >
            스케줄 저장
          </button>
          <button
            onClick={applyTemplate}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded"
          >
            이 스케줄 적용
          </button>
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 w-20 text-left border-b">학번</th>
              <th className="px-2 py-2 w-24 text-left border-b">이름</th>
              <th className="px-2 py-2 w-32 text-left border-b">이 시간 상태</th>
              <th className="px-2 py-2 text-left border-b">사유</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                  이 시간에 저장된 스케줄이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.studentId} className="border-b last:border-b-0">
                  <td className="px-2 py-1">{r.studentId}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateRow(r.studentId, { status: e.target.value })
                      }
                      className="border rounded px-1 py-[2px] text-sm w-full"
                    >
                      <option value="변경안함">변경안함</option>
                      {STATUS_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={r.reason}
                      onChange={(e) =>
                        updateRow(r.studentId, { reason: e.target.value })
                      }
                      className="border rounded px-1 py-[2px] text-sm w-full"
                      placeholder="사유"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400">
        ※ “변경안함”으로 둔 학생은 이 차시 스케줄을 적용해도 실제 학생 상태를 바꾸지 않습니다.
      </p>
    </div>
  );
}
