// app/teacher/TeacherPageInner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";
type TimeSlot = "8교시" | "야간 1차시" | "야간 2차시";

const sortById = <T extends { id: string }>(list: T[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

/** 상태별 색상 (디스플레이 페이지 톤 맞춰서) */
const statusColor = (status: string) => {
  switch (status) {
    case "재실":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-500/50";
    case "미디어스페이스":
      return "bg-sky-500/15 text-sky-200 border-sky-500/50";
    case "귀가":
      return "bg-rose-500/18 text-rose-200 border-rose-500/60";
    case "외출":
      return "bg-orange-500/18 text-orange-200 border-orange-500/60";
    case "호실자습":
      return "bg-violet-500/18 text-violet-200 border-violet-500/60";
    default:
      return "bg-slate-500/10 text-slate-200 border-slate-500/40";
  }
};

export default function TeacherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user") || "윤인하";
  const displayName =
    userParam === "윤인하" ? "윤인하 선생님" : `${userParam} 학생`;

  const [tab, setTab] = useState<"status" | "schedule">("status");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 사유 입력 드래프트(입력 중 값)
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  // 현재 사유 입력 중인 학생 id 모음
  const editingReason = useRef<Set<string>>(new Set());
  // status/approved 최근 수정 보호(5초)
  const editedRef = useRef<Record<string, number>>({});

  // 스케줄러 ON/OFF 상태
  const [schedEnabled, setSchedEnabled] = useState<boolean>(true);

  // 첫 로드
  useEffect(() => {
    const load = async () => {
      const [res1, res2] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }),
        fetch("/api/scheduler/state", { cache: "no-store" }).catch(() => null),
      ]);
      const data: Student[] = await res1.json();
      setStudents(sortById(data));
      if (res2 && res2.ok) {
        const j = await res2.json();
        if (typeof j.enabled === "boolean") setSchedEnabled(j.enabled);
      }
      setLoading(false);
    };
    load();
  }, []);

  // 폴링(상태 탭에서만)
  useEffect(() => {
    if (tab !== "status") return;

    const tick = async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (!res.ok) return;
      const server: Student[] = await res.json();
      const sorted = sortById(server);
      const now = Date.now();

      setStudents((prev) => {
        const prevMap = new Map(prev.map((s) => [s.id, s]));
        return sorted.map((sv) => {
          const wasEdited = editedRef.current[sv.id];
          const keepLocal = wasEdited && now - wasEdited < 5000;

          // reason: 입력 중이거나 드래프트가 있으면 드래프트 우선
          const localDraft = reasonDraft[sv.id];
          const isTyping = editingReason.current.has(sv.id);
          const reason =
            isTyping || localDraft !== undefined ? localDraft ?? "" : sv.reason;

          if (keepLocal) {
            const local = prevMap.get(sv.id) ?? sv;
            return {
              ...sv,
              reason,
              status: local.status,
              approved: local.approved,
            };
          }
          return { ...sv, reason };
        });
      });
    };

    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [tab, reasonDraft]);

  // 공통 PATCH (단건 / 배열 모두)
  const patch = async (payload: any) => {
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });
  };

  // 상태/허가 즉시 저장 (낙관적 + 5초 보호)
  const saveStudent = async (id: string, updates: Partial<Student>) => {
    editedRef.current[id] = Date.now();
    setStudents((prev) =>
      sortById(prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    );
    await patch({ id, ...updates });
  };

  // 사유 저장: 버튼 클릭 시 서버 반영
  const saveReason = async (s: Student) => {
    const draft = reasonDraft[s.id] ?? "";
    await patch({ id: s.id, reason: draft });

    // 저장 후 드래프트 제거
    setReasonDraft((m) => {
      const { [s.id]: _, ...rest } = m;
      return rest;
    });
    setMessage(`${s.name}(${s.id}) 사유가 "${draft || "-"}"로 저장되었습니다.`);
    setTimeout(() => setMessage(""), 2500);
  };

  // 일괄 재실(전체)
  const resetAllToPresent = async () => {
    const payload = students.map((s) => ({
      id: s.id,
      status: "재실" as const,
      reason: "",
    }));
    setStudents((prev) =>
      sortById(prev.map((s) => ({ ...s, status: "재실", reason: "" })))
    );
    await patch(payload);
  };

  // “귀가/외출/호실자습 제외” 일괄 재실
  const resetAllExceptOut = async () => {
    const targets = students.filter(
      (s) => !["귀가", "외출", "호실자습"].includes(s.status)
    );
    if (targets.length === 0) return;

    const payload = targets.map((s) => ({
      id: s.id,
      status: "재실" as const,
      reason: "",
    }));
    setStudents((prev) =>
      sortById(
        prev.map((s) =>
          ["귀가", "외출", "호실자습"].includes(s.status)
            ? s
            : { ...s, status: "재실", reason: "" }
        )
      )
    );
    await patch(payload);
  };

  const approveAll = async () => {
    const payload = students.map((s) => ({ id: s.id, approved: true }));
    setStudents((prev) =>
      sortById(prev.map((s) => ({ ...s, approved: true })))
    );
    await patch(payload);
  };

  const disapproveAll = async () => {
    const payload = students.map((s) => ({ id: s.id, approved: false }));
    setStudents((prev) =>
      sortById(prev.map((s) => ({ ...s, approved: false })))
    );
    await patch(payload);
  };

  // 스케줄러 ON/OFF 토글
  const toggleScheduler = async () => {
    const next = !schedEnabled;
    setSchedEnabled(next);
    await fetch("/api/scheduler/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    setMessage(`스케줄러가 ${next ? "ON" : "OFF"} 되었습니다.`);
    setTimeout(() => setMessage(""), 2000);
  };

  const handleLogout = () => router.push("/");

  // 인원 카드
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
    const data: Student[] = await res.json();
    setStudents(sortById(data));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* 상단 바 */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col">
              <div className="text-xs text-slate-400 tracking-[0.18em] uppercase">
                Teacher Console
              </div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-flex h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                출결·스케줄 관리
              </div>
            </div>

            <div className="inline-flex bg-slate-800/80 rounded-2xl p-1">
              <button
                onClick={() => setTab("status")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition ${
                  tab === "status"
                    ? "bg-sky-500 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.7)]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                학생 상태
              </button>
              <button
                onClick={() => setTab("schedule")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition ${
                  tab === "schedule"
                    ? "bg-sky-500 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.7)]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                스케줄러
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            {message && (
              <div className="hidden md:inline-flex items-center max-w-xs text-[11px] px-3 py-1.5 rounded-full bg-sky-950/70 border border-sky-600/70 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.6)]">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mr-1.5" />
                <span className="truncate">{message}</span>
              </div>
            )}

            <button
              onClick={toggleScheduler}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                schedEnabled
                  ? "bg-emerald-500/90 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                  : "bg-slate-800 text-slate-200 border-slate-600"
              }`}
              title="스케줄러 자동 적용 ON/OFF"
            >
              스케줄러 {schedEnabled ? "ON" : "OFF"}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-emerald-400 border border-slate-900 shadow-[0_0_18px_rgba(56,189,248,0.8)]" />
              <div className="leading-tight">
                <div className="font-semibold text-sm">{displayName}</div>
                <div className="flex gap-2 mt-[2px]">
                  <button
                    onClick={() =>
                      (window.location.href = `/change-password?role=teacher&id=${encodeURIComponent(
                        userParam
                      )}`)
                    }
                    className="text-[11px] text-sky-300 hover:text-sky-200"
                  >
                    비밀번호 변경
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 메시지 전용 줄은 제거해서 아이콘 높이 고정 */}
      </div>

      {/* 본문 */}
      <div className="max-w-6xl mx-auto mt-5 px-4 pb-8 flex flex-col gap-4">
        {tab === "status" ? (
          <>
            {/* 상태 카드 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-[0_0_40px_rgba(15,23,42,0.9)] flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
                  학생 상태 관리
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={resetAllToPresent}
                    className="px-3 py-1.5 text-[11px] rounded-full bg-sky-500 text-slate-950 font-semibold shadow-[0_0_12px_rgba(56,189,248,0.7)] hover:bg-sky-400 transition"
                  >
                    일괄 재실(전체)
                  </button>
                  <button
                    onClick={resetAllExceptOut}
                    className="px-3 py-1.5 text-[11px] rounded-full bg-indigo-500 text-slate-50 font-semibold shadow-[0_0_12px_rgba(99,102,241,0.7)] hover:bg-indigo-400 transition"
                  >
                    귀가/외출/호자 제외 재실
                  </button>
                  <button
                    onClick={approveAll}
                    className="px-3 py-1.5 text-[11px] rounded-full bg-emerald-500 text-slate-950 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.7)] hover:bg-emerald-400 transition"
                  >
                    일괄 허가
                  </button>
                  <button
                    onClick={disapproveAll}
                    className="px-3 py-1.5 text-[11px] rounded-full bg-rose-500 text-slate-50 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.7)] hover:bg-rose-400 transition"
                  >
                    일괄 불허가
                  </button>
                </div>
              </div>

              <div className="max-h-[460px] overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-800/80">
                    <tr className="text-xs text-slate-300">
                      <th className="px-3 py-2 w-20 text-left">학번</th>
                      <th className="px-2 py-2 w-28 text-left">이름</th>
                      <th className="px-2 py-2 w-40 text-left">상태</th>
                      <th className="px-2 py-2 text-left">사유</th>
                      <th className="px-2 py-2 w-28 text-left">사유 저장</th>
                      <th className="px-2 py-2 w-16 text-left">허가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-6 text-center text-sm text-slate-400"
                        >
                          불러오는 중...
                        </td>
                      </tr>
                    ) : (
                      students.map((s, idx) => {
                        const draft = reasonDraft[s.id];
                        const inputValue =
                          draft !== undefined ? draft : s.reason;

                        return (
                          <tr
                            key={s.id}
                            className={`border-b border-slate-800/70 ${
                              idx % 2 === 0
                                ? "bg-slate-900/50"
                                : "bg-slate-900/30"
                            } hover:bg-slate-800/60 transition-colors`}
                          >
                            <td className="px-3 py-1.5 text-xs font-mono text-slate-200">
                              {s.id}
                            </td>
                            <td className="px-2 py-1.5 text-sm">{s.name}</td>
                            <td className="px-2 py-1.5">
                              {/* 상태 select 색상 래핑 */}
                              <div
                                className={`w-full rounded-full border px-1 ${statusColor(
                                  s.status
                                )}`}
                              >
                                <select
                                  value={s.status}
                                  onChange={(e) =>
                                    saveStudent(s.id, {
                                      status: e.target.value as Status,
                                    })
                                  }
                                  className="w-full bg-transparent border-none outline-none text-xs py-[6px] px-1 pr-5 appearance-none"
                                >
                                  {STATUS_LIST.map((st) => (
                                    <option
                                      key={st}
                                      value={st}
                                      className="bg-slate-900 text-slate-100"
                                    >
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                value={inputValue}
                                onFocus={() => {
                                  editingReason.current.add(s.id);
                                  setReasonDraft((m) =>
                                    m[s.id] === undefined
                                      ? { ...m, [s.id]: s.reason }
                                      : m
                                  );
                                }}
                                onChange={(e) =>
                                  setReasonDraft((m) => ({
                                    ...m,
                                    [s.id]: e.target.value,
                                  }))
                                }
                                onBlur={() => {
                                  editingReason.current.delete(s.id);
                                }}
                                className="border border-slate-700/70 rounded-full px-2 py-[6px] text-xs w-full bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                placeholder="여기에 사유 입력"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <button
                                onClick={() => saveReason(s)}
                                className="text-[11px] bg-amber-400/90 text-slate-950 px-3 py-[6px] rounded-full w-full font-semibold hover:bg-amber-300 transition"
                              >
                                저장
                              </button>
                            </td>
                            <td className="px-2 py-1.5">
                              <button
                                onClick={() =>
                                  saveStudent(s.id, { approved: !s.approved })
                                }
                                className={`text-[11px] px-3 py-[6px] rounded-full w-full font-semibold border transition ${
                                  s.approved
                                    ? "bg-emerald-500/90 text-slate-950 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
                                    : "bg-rose-500/90 text-slate-50 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.7)] hover:bg-rose-400"
                                }`}
                              >
                                {s.approved ? "O" : "X"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 인원 카드 */}
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 shadow-[0_0_30px_rgba(15,23,42,0.9)] flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gradient-to-b from-emerald-400 to-sky-400 rounded-full" />
                  인원 (교실·미디어스페이스)
                </div>
                <div className="flex justify-between text-xs items-center text-slate-300">
                  <span>총원</span>
                  <span className="font-bold text-xl text-slate-50">
                    {total}
                  </span>
                </div>
                {/* 결원 먼저 */}
                <div className="flex justify-between text-xs items-center text-slate-300">
                  <span>결원</span>
                  <span
                    className={`font-bold text-xl ${
                      outClassOrMedia === 0
                        ? "text-slate-500"
                        : "text-rose-400"
                    }`}
                  >
                    {outClassOrMedia}
                  </span>
                </div>
                {/* 재실 인원은 아래, 구분선 */}
                <div className="flex justify-between text-xs items-center text-slate-300 mt-1 pt-2 border-t border-slate-700/70">
                  <span>재실 인원</span>
                  <span className="font-bold text-xl text-emerald-300">
                    {inClassOrMedia}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-4 shadow-[0_0_30px_rgba(15,23,42,0.9)] flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gradient-to-b from-sky-400 to-indigo-400 rounded-full" />
                  인원 (교내 기준)
                </div>
                <div className="flex justify-between text-xs items-center text-slate-300">
                  <span>총원</span>
                  <span className="font-bold text-xl text-slate-50">
                    {total}
                  </span>
                </div>
                {/* 교내에 없음(결원) 먼저 */}
                <div className="flex justify-between text-xs items-center text-slate-300">
                  <span>교내에 없음</span>
                  <span
                    className={`font-bold text-xl ${
                      outCampus === 0 ? "text-slate-500" : "text-rose-400"
                    }`}
                  >
                    {outCampus}
                  </span>
                </div>
                {/* 교내에 있음은 아래, 구분선 */}
                <div className="flex justify-between text-xs items-center text-slate-300 mt-1 pt-2 border-t border-slate-700/70">
                  <span>교내에 있음</span>
                  <span className="font-bold text-xl text-sky-300">
                    {inCampus}
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
            items.sort((a, b) => Number(a.studentId) - Number(b.studentId))
          );
          setLoading(false);
          return;
        }
      }

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

  const setAllNoChange = () =>
    setRows((prev) =>
      prev.map((r) => ({ ...r, status: "변경안함", reason: "" }))
    );

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
      const j = await res.json().catch(() => ({}));
      alert(j.message || "스케줄 적용에 실패했습니다.");
    }
  };

  const updateRow = (
    studentId: string,
    part: Partial<{ status: string; reason: string }>
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, ...part } : r
      )
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-[0_0_40px_rgba(15,23,42,0.9)] flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {[
            { key: "mon", label: "월" },
            { key: "tue", label: "화" },
            { key: "wed", label: "수" },
            { key: "thu", label: "목" },
            { key: "fri", label: "금" },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => setDay(d.key as DayKey)}
              className={`px-3 py-1.5 text-xs border rounded-full transition ${
                day === d.key
                  ? "bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                  : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-3">
          {(["8교시", "야간 1차시", "야간 2차시"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSlot(t)}
              className={`px-3 py-1.5 text-xs border rounded-full transition ${
                slot === t
                  ? "bg-slate-100 text-slate-900 border-slate-200"
                  : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2 items-center">
          <button
            onClick={setAllNoChange}
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-200 rounded-full border border-slate-600 hover:bg-slate-700 transition"
          >
            전체 변경안함
          </button>
          <button
            onClick={fillFromCurrent}
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-200 rounded-full border border-slate-600 hover:bg-slate-700 transition"
          >
            현재 상태로 채우기
          </button>
          <button
            onClick={saveRows}
            className="px-3 py-1.5 text-xs bg-sky-500 text-slate-950 rounded-full font-semibold shadow-[0_0_12px_rgba(56,189,248,0.7)] hover:bg-sky-400 transition"
          >
            스케줄 저장
          </button>
          <button
            onClick={applyTemplate}
            className="px-3 py-1.5 text-xs bg-emerald-500 text-slate-950 rounded-full font-semibold shadow-[0_0_12px_rgba(16,185,129,0.7)] hover:bg-emerald-400 transition"
          >
            이 스케줄 적용
          </button>
        </div>
      </div>

      <div className="max-h-[520px] overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-800/80">
            <tr className="text-xs text-slate-300">
              <th className="px-3 py-2 w-20 text-left">학번</th>
              <th className="px-2 py-2 w-24 text-left">이름</th>
              <th className="px-2 py-2 w-32 text-left">이 시간 상태</th>
              <th className="px-2 py-2 text-left">사유</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-slate-400"
                >
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-sm text-slate-400"
                >
                  이 시간에 저장된 스케줄이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.studentId}
                  className="border-b border-slate-800/70 hover:bg-slate-800/60 transition-colors"
                >
                  <td className="px-3 py-1.5 text-xs font-mono text-slate-200">
                    {r.studentId}
                  </td>
                  <td className="px-2 py-1.5 text-sm">{r.name}</td>
                  <td className="px-2 py-1.5">
                    {/* 스케줄러 상태 select도 래핑해서 색 적용 */}
                    <div
                      className={`w-full rounded-full border px-1 ${statusColor(
                        r.status
                      )}`}
                    >
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateRow(r.studentId, { status: e.target.value })
                        }
                        className="w-full bg-transparent border-none outline-none text-xs py-[6px] px-1 pr-5 appearance-none"
                      >
                        <option value="변경안함" className="bg-slate-900 text-slate-100">
                          변경안함
                        </option>
                        {STATUS_LIST.map((st) => (
                          <option
                            key={st}
                            value={st}
                            className="bg-slate-900 text-slate-100"
                          >
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={r.reason}
                      onChange={(e) =>
                        updateRow(r.studentId, { reason: e.target.value })
                      }
                      className="border border-slate-700/70 rounded-full px-2 py-[6px] text-xs w-full bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                      placeholder="사유"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">
        ※ “변경안함”은 적용 시 실제 상태를 바꾸지 않습니다.
      </p>
    </div>
  );
}
