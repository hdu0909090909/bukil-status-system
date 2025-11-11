// app/teacher/TeacherPageInner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
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

const sortById = <T extends { id: string }>(list: T[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

export default function TeacherPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user") || "윤인하";
  const displayName =
    userParam === "윤인하" ? "윤인하 선생님" : `${userParam} 학생`;

  const [tab, setTab] = useState<"status" | "schedule">("status");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔐 내가 최근에 건드린 시간 기록 (id -> timestamp)
  const editedRef = useRef<Record<string, number>>({});

  // 최초 한번 전체 가져오기
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      const data: Student[] = await res.json();
      setStudents(sortById(data));
      setLoading(false);
    };
    load();
  }, []);

  // 상태 탭일 때만 폴링 + 10초 보호
  useEffect(() => {
    if (tab !== "status") return;

    let stop = false;

    const tick = async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (!res.ok) return;
      const data: Student[] = await res.json();
      if (stop) return;

      const now = Date.now();
      const editedMap = editedRef.current;

      setStudents((prev) => {
        const prevById = new Map(prev.map((s) => [s.id, s]));
        const merged = data.map((s) => {
          const editedAt = editedMap[s.id];
          // 10초 안에 내가 만졌으면 서버값 무시
          if (editedAt && now - editedAt < 10_000) {
            return prevById.get(s.id) ?? s;
          }
          return s;
        });
        return sortById(merged);
      });
    };

    tick();
    const t = setInterval(tick, 3000);

    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [tab]);

  // 방금 만짐 표시
  const markEdited = (id: string) => {
    editedRef.current[id] = Date.now();
  };

  // 서버와 동기화하는 공통 함수
  const bulkUpdate = async (
    updates: Array<
      Partial<Pick<Student, "status" | "reason" | "approved">> & { id: string }
    >
  ) => {
    // 1) 화면 먼저 반영
    setStudents((prev) => {
      const m = new Map(prev.map((s) => [s.id, s]));
      for (const u of updates) {
        const old = m.get(u.id);
        if (old) {
          m.set(u.id, { ...old, ...u });
        }
      }
      return sortById(Array.from(m.values()));
    });

    // 2) 내가 만졌다고 기록
    updates.forEach((u) => {
      if (u.id) markEdited(u.id);
    });

    // 3) 서버로
    const res = await fetch("/api/students/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    // 4) 서버가 전체 students를 돌려줘도 10초 보호 한 번 더
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.students)) {
        const serverStudents: Student[] = data.students;
        const now = Date.now();
        const editedMap = editedRef.current;

        setStudents((prev) => {
          const merged = serverStudents.map((s) => {
            const editedAt = editedMap[s.id];
            if (editedAt && now - editedAt < 10_000) {
              // 방금(10초 이내) 내가 만진 애는 내가 가진 값 유지
              const local = prev.find((p) => p.id === s.id);
              return local ?? s;
            }
            return s;
          });
          return sortById(merged);
        });
        return;
      }
    }

    // 실패했으면 전체 다시
    const res2 = await fetch("/api/students", { cache: "no-store" });
    if (res2.ok) {
      const latest: Student[] = await res2.json();
      setStudents(sortById(latest));
    }
  };

  const saveStudent = async (id: string, updates: Partial<Student>) => {
    await bulkUpdate([{ id, ...updates }]);
  };

  // 일괄 버튼들
  const resetAllToPresent = async () => {
    await bulkUpdate(
      students.map((s) => ({ id: s.id, status: "재실", reason: "" }))
    );
  };
  const approveAll = async () => {
    await bulkUpdate(students.map((s) => ({ id: s.id, approved: true })));
  };
  const disapproveAll = async () => {
    await bulkUpdate(students.map((s) => ({ id: s.id, approved: false })));
  };
  const resetAllExceptOut = async () => {
    await bulkUpdate(
      students
        .filter(
          (s) => s.status !== "귀가" && s.status !== "외출" && s.status !== "호실자습"
        )
        .map((s) => ({ id: s.id, status: "재실", reason: "" }))
    );
  };

  const handleLogout = () => router.push("/");

  // 인원 계산 (네가 쓰던 공식 그대로)
  const total = students.length;
  const inClassOrMedia = students.filter(
    (s) => s.status === "재실" || s.status === "미디어스페이스"
  ).length;
  const outClassOrMedia = total - inClassOrMedia;
  const inCampus = students.filter(
    (s) => !["귀가", "외출", "호실자습"].includes(s.status)
  ).length;
  const outCampus = total - inCampus;

  const refreshNow = async () => {
    const res = await fetch("/api/students", { cache: "no-store" });
    if (res.ok) {
      const data: Student[] = await res.json();
      setStudents(sortById(data));
    }
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
                  tab === "status" ? "bg-[#1f6fe5] text-white" : "text-gray-700"
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
                  <button
                    onClick={resetAllExceptOut}
                    className="px-3 py-1 text-xs bg-indigo-500 text-white rounded"
                  >
                    귀가/외출자 제외 재실
                  </button>
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 w-20 text-left border-b">학번</th>
                      <th className="px-2 py-2 w-28 text-left border-b">이름</th>
                      <th className="px-2 py-2 w-40 text-left border-b">상태</th>
                      <th className="px-2 py-2 text-left border-b">사유</th>
                      <th className="px-2 py-2 w-16 text-left border-b">
                        허가
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center">
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
                              onChange={(e) => {
                                markEdited(s.id);
                                saveStudent(s.id, {
                                  status: e.target.value as Status,
                                });
                              }}
                              className="border rounded px-1 py-[2px] text-sm w-full"
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
                              onChange={(e) => {
                                const v = e.target.value;
                                markEdited(s.id);
                                // 화면엔 바로
                                setStudents((prev) =>
                                  prev.map((p) =>
                                    p.id === s.id ? { ...p, reason: v } : p
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                // 포커스 빠질 때 서버 반영
                                saveStudent(s.id, { reason: e.target.value });
                              }}
                              className="border rounded px-1 py-[2px] text-sm w-full"
                              placeholder="여기에 사유 입력"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <button
                              onClick={() => {
                                markEdited(s.id);
                                saveStudent(s.id, { approved: !s.approved });
                              }}
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
                <div className="flex justify-between text-sm items-center">
                  <span>총원</span>
                  <span className="font-bold text-lg">{total}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>재실인원</span>
                  <span className="font-bold text-lg text-green-600">
                    {inClassOrMedia}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>결원</span>
                  <span
                    className={`font-bold text-lg ${
                      outClassOrMedia === 0 ? "text-gray-500" : "text-red-500"
                    }`}
                  >
                    {outClassOrMedia}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm px-4 py-4 flex-1 flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1">
                  인원(교내에 있는 학생)
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>총원</span>
                  <span className="font-bold text-lg">{total}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>교내에 있음</span>
                  <span className="font-bold text-lg text-green-600">
                    {inCampus}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>교내에 없음</span>
                  <span
                    className={`font-bold text-lg ${
                      outCampus === 0 ? "text-gray-500" : "text-red-500"
                    }`}
                  >
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
/* 스케줄러 탭 (네가 쓰던거 거의 그대로) */
/* ──────────────────────────────── */
function SchedulerTab({ onApplied }: { onApplied?: () => void }) {
  const [day, setDay] = useState<DayKey>("mon");
  const [slot, setSlot] = useState<TimeSlot>("8교시");
  const [rows, setRows] = useState<
    Array<{ studentId: string; name: string; status: string; reason: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [schedEnabled, setSchedEnabled] = useState(true);

  // 스케줄러 on/off 상태
  useEffect(() => {
    const loadState = async () => {
      const res = await fetch("/api/scheduler/state", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSchedEnabled(data.enabled ?? true);
      }
    };
    loadState();
  }, []);

  // 특정 요일/차시 불러오기
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const res = await fetch(
        `/api/scheduler?day=${day}&slot=${encodeURIComponent(slot)}`
      );

      if (res.ok) {
        const data = await res.json();
        const items =
          (data.items as Array<{
            studentId: string;
            name: string;
            status: string;
            reason: string;
          }>) ?? [];

        if (items.length > 0) {
          setRows(
            [...items].sort(
              (a, b) => Number(a.studentId) - Number(b.studentId)
            )
          );
          setLoading(false);
          return;
        }
      }

      // 스케줄 없으면 현재 학생 목록으로 채우기
      const res2 = await fetch("/api/students", { cache: "no-store" });
      if (res2.ok) {
        const students: Student[] = await res2.json();
        setRows(
          students
            .map((s) => ({
              studentId: s.id,
              name: s.name,
              status: "변경안함",
              reason: "",
            }))
            .sort((a, b) => Number(a.studentId) - Number(b.studentId))
        );
      } else {
        setRows([]);
      }

      setLoading(false);
    };

    load();
  }, [day, slot]);

  const toggleScheduler = async () => {
    const next = !schedEnabled;
    setSchedEnabled(next);
    await fetch("/api/scheduler/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
  };

  const setAllNoChange = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: "변경안함", reason: "" })));
  };

  const fillFromCurrent = async () => {
    const res = await fetch("/api/students", { cache: "no-store" });
    const students: Student[] = await res.json();
    setRows(
      students
        .map((s) => ({
          studentId: s.id,
          name: s.name,
          status: s.status ?? "변경안함",
          reason: s.reason ?? "",
        }))
        .sort((a, b) => Number(a.studentId) - Number(b.studentId))
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
      const err = await res.json().catch(() => ({}));
      alert(err.message || "스케줄 적용에 실패했습니다.");
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
        {/* 요일 버튼 */}
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

        {/* 시간 버튼 */}
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

        {/* 오른쪽 버튼들 */}
        <div className="ml-auto flex gap-2 items-center">
          <button
            onClick={toggleScheduler}
            className={`px-3 py-1 text-sm rounded ${
              schedEnabled ? "bg-green-500 text-white" : "bg-gray-300"
            }`}
          >
            자동 스케줄 {schedEnabled ? "ON" : "OFF"}
          </button>

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
