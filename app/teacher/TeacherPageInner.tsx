// app/teacher/TeacherPageInner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_LIST = [
  "재실","미디어스페이스","귀가","외출","호실자습","아단관 강당3","아단관 강의실",
  "방과후수업","동아리 활동","교내활동","보건실 요양","상담","기타",
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

export default function TeacherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user") || "윤인하";
  const displayName = userParam === "윤인하" ? "윤인하 선생님" : `${userParam} 학생`;

  const [tab, setTab] = useState<"status" | "schedule">("status");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 사유 입력 드래프트(입력 중 값) — 폴링 덮어쓰기 방지
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  // 현재 사유 입력 중인 학생 id 모음
  const editingReason = useRef<Set<string>>(new Set());
  // status/approved 최근 수정 보호(5초): 폴링 덮어쓰기 방지
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
          const reason = (isTyping || localDraft !== undefined) ? (localDraft ?? "") : sv.reason;

          // status/approved: 최근 5초 내 로컬 수정이면 화면 값 유지
          if (keepLocal) {
            const local = prevMap.get(sv.id) ?? sv;
            return { ...sv, reason, status: local.status, approved: local.approved };
          }
          // 기본: 서버 값 반영 + reason만 위 규칙
          return { ...sv, reason };
        });
      });
    };

    tick();
    const t = setInterval(tick, 3000);
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
    await patch({ id, ...updates }); // 변경된 학생만 PATCH
  };

  // 사유 저장: 포커스 아웃 또는 버튼 클릭 시 서버 반영
  const saveReason = async (s: Student) => {
    const draft = reasonDraft[s.id] ?? "";
    await patch({ id: s.id, reason: draft }); // 단건 PATCH
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
    const payload = students.map((s) => ({ id: s.id, status: "재실" as const, reason: "" }));
    // 낙관적
    setStudents((prev) =>
      sortById(prev.map((s) => ({ ...s, status: "재실", reason: "" })))
    );
    await patch(payload);
  };

  // “귀가/외출/호실자습 제외” 일괄 재실
  const resetAllExceptOut = async () => {
    const targets = students.filter((s) => !["귀가", "외출", "호실자습"].includes(s.status));
    if (targets.length === 0) return;

    const payload = targets.map((s) => ({ id: s.id, status: "재실" as const, reason: "" }));
    // 낙관적
    setStudents((prev) =>
      sortById(prev.map((s) =>
        ["귀가", "외출", "호실자습"].includes(s.status) ? s : { ...s, status: "재실", reason: "" }
      ))
    );
    await patch(payload);
  };

  const approveAll = async () => {
    const payload = students.map((s) => ({ id: s.id, approved: true }));
    setStudents((prev) => sortById(prev.map((s) => ({ ...s, approved: true }))));
    await patch(payload);
  };

  const disapproveAll = async () => {
    const payload = students.map((s) => ({ id: s.id, approved: false }));
    setStudents((prev) => sortById(prev.map((s) => ({ ...s, approved: false }))));
    await patch(payload);
  };

  // 스케줄러 ON/OFF 토글
  const toggleScheduler = async () => {
    const next = !schedEnabled;
    setSchedEnabled(next); // 낙관적
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
  const inCampus = students.filter((s) => !["귀가", "외출", "호실자습"].includes(s.status)).length;
  const outCampus = total - inCampus;

  const refreshNow = async () => {
    const res = await fetch("/api/students", { cache: "no-store" });
    const data: Student[] = await res.json();
    setStudents(sortById(data));
  };

  return (
    <div className="min-h-screen bg-[#dfe3e8]">
      {/* 상단 바 */}
      <div className="w-full bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm font-semibold text-gray-700">교사 / 교원 페이지</div>
            <div className="flex bg-[#e5e9f0] rounded-lg overflow-hidden">
              <button
                onClick={() => setTab("status")}
                className={`px-4 py-2 text-sm font-semibold ${tab === "status" ? "bg-[#1f6fe5] text-white" : "text-gray-700"}`}
              >
                학생 상태
              </button>
              <button
                onClick={() => setTab("schedule")}
                className={`px-4 py-2 text-sm font-semibold ${tab === "schedule" ? "bg-[#1f6fe5] text-white" : "text-gray-700"}`}
              >
                스케줄러
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-700">
            {/* 스케줄러 ON/OFF 토글 */}
            <button
              onClick={toggleScheduler}
              className={`px-3 py-1 rounded ${schedEnabled ? "bg-green-500 text-white" : "bg-gray-300"}`}
              title="스케줄러 자동 적용 ON/OFF"
            >
              스케줄러 {schedEnabled ? "ON" : "OFF"}
            </button>

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
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="max-w-6xl mx-auto px-3 pb-2">
            <div className="bg-blue-50 text-blue-700 text-sm px-3 py-2 rounded-md border border-blue-100">
              {message}
            </div>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="max-w-6xl mx-auto mt-4 px-3 pb-6 flex flex-col gap-4">
        {tab === "status" ? (
          <>
            <div className="bg-white border border-gray-300 rounded-md p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">학생 상태 관리</div>
                <div className="flex gap-2">
                  <button onClick={resetAllToPresent} className="px-3 py-1 text-xs bg-blue-500 text-white rounded">
                    일괄 재실(전체)
                  </button>
                  <button onClick={resetAllExceptOut} className="px-3 py-1 text-xs bg-indigo-500 text-white rounded">
                    귀/외/호 제외 재실
                  </button>
                  <button onClick={approveAll} className="px-3 py-1 text-xs bg-green-500 text-white rounded">
                    일괄 허가
                  </button>
                  <button onClick={disapproveAll} className="px-3 py-1 text-xs bg-red-500 text-white rounded">
                    일괄 불허가
                  </button>
                </div>
              </div>

              <div className="max-h-[450px] overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 w-20 text-left border-b">학번</th>
                      <th className="px-2 py-2 w-28 text-left border-b">이름</th>
                      <th className="px-2 py-2 w-40 text-left border-b">상태</th>
                      <th className="px-2 py-2 text-left border-b">사유</th>
                      <th className="px-2 py-2 w-28 text-left border-b">사유 저장</th>
                      <th className="px-2 py-2 w-16 text-left border-b">허가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center">
                          불러오는 중...
                        </td>
                      </tr>
                    ) : (
                      students.map((s, idx) => {
                        const draft = reasonDraft[s.id];
                        const inputValue = draft !== undefined ? draft : s.reason;

                        return (
                          <tr
                            key={s.id}
                            className={`border-b last:border-b-0 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                          >
                            <td className="px-2 py-1">{s.id}</td>
                            <td className="px-2 py-1">{s.name}</td>
                            <td className="px-2 py-1">
                              <select
                                value={s.status}
                                onChange={(e) => saveStudent(s.id, { status: e.target.value as Status })}
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
                                value={inputValue}
                                onFocus={() => {
                                  editingReason.current.add(s.id);
                                  // 드래프트 없으면 현재 값을 드래프트로 초기화(커서 점프 방지)
                                  setReasonDraft((m) => (m[s.id] === undefined ? { ...m, [s.id]: s.reason } : m));
                                }}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setReasonDraft((m) => ({ ...m, [s.id]: v }));
                                }}
                                onBlur={async () => {
                                  try {
                                    await saveReason(s);
                                  } finally {
                                    editingReason.current.delete(s.id);
                                  }
                                }}
                                className="border rounded px-1 py-[2px] text-sm w-full bg-white"
                                placeholder="여기에 사유 입력"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <button
                                onClick={() => saveReason(s)}
                                className="text-xs bg-orange-500 text-white px-3 py-[5px] rounded w-full"
                              >
                                저장
                              </button>
                            </td>
                            <td className="px-2 py-1">
                              <button
                                onClick={() => saveStudent(s.id, { approved: !s.approved })}
                                className={`text-xs px-3 py-[5px] rounded ${
                                  s.approved ? "bg-green-500 text-white" : "bg-gray-300 text-gray-800"
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
              <div className="bg-white rounded-md shadow-sm px-4 py-4 flex-1 flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1">인원(교실, 미디어스페이스)</div>
                <div className="flex justify-between text-sm items-center">
                  <span>총원</span>
                  <span className="font-bold text-lg">{total}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>재실인원</span>
                  <span className="font-bold text-lg text-green-600">{inClassOrMedia}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>결원</span>
                  <span className={`font-bold text-lg ${outClassOrMedia === 0 ? "text-gray-500" : "text-red-500"}`}>
                    {outClassOrMedia}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm px-4 py-4 flex-1 flex flex-col gap-2">
                <div className="text-sm font-semibold mb-1">인원(교내에 있는 학생)</div>
                <div className="flex justify-between text-sm items-center">
                  <span>총원</span>
                  <span className="font-bold text-lg">{total}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>교내에 있음</span>
                  <span className="font-bold text-lg text-green-600">{inCampus}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>교내에 없음</span>
                  <span className={`font-bold text-lg ${outCampus === 0 ? "text-gray-500" : "text-red-500"}`}>
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
/* 스케줄러 탭 — 네 베이스 유지 + 적용 버튼만 기존대로 */
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
      const res = await fetch(`/api/scheduler?day=${day}&slot=${encodeURIComponent(slot)}`);
      if (res.ok) {
        const data = await res.json();
        const items =
          (data.items as Array<{ studentId: string; name: string; status: string; reason: string }>) ?? [];
        if (items.length > 0) {
          setRows(items.sort((a, b) => Number(a.studentId) - Number(b.studentId)));
          setLoading(false);
          return;
        }
      }
      const res2 = await fetch("/api/students", { cache: "no-store" });
      if (res2.ok) {
        const students: Student[] = await res2.json();
        setRows(
          students
            .map((s) => ({ studentId: s.id, name: s.name, status: "변경안함", reason: "" }))
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
    setRows((prev) => prev.map((r) => ({ ...r, status: "변경안함", reason: "" })));

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
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...part } : r)));
  };

  return (
    <div className="bg-white border border-gray-300 rounded-md p-3 flex flex-col gap-3">
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
              className={`px-3 py-1 text-sm border rounded ${day === d.key ? "bg-blue-500 text-white" : "bg-white"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-2">
          {(["8교시", "야간 1차시", "야간 2차시"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSlot(t)}
              className={`px-3 py-1 text-sm border rounded ${slot === t ? "bg-gray-800 text-white" : "bg-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2 items-center">
          <button onClick={setAllNoChange} className="px-3 py-1 text-sm bg-gray-200 rounded">
            전체 변경안함
          </button>
          <button onClick={fillFromCurrent} className="px-3 py-1 text-sm bg-gray-200 rounded">
            현재 상태로 채우기
          </button>
          <button onClick={saveRows} className="px-3 py-1 text-sm bg-blue-500 text-white rounded">
            스케줄 저장
          </button>
          <button onClick={applyTemplate} className="px-3 py-1 text-sm bg-green-500 text-white rounded">
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
                      onChange={(e) => updateRow(r.studentId, { status: e.target.value })}
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
                      onChange={(e) => updateRow(r.studentId, { reason: e.target.value })}
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
      <p className="text-[11px] text-gray-400">※ “변경안함”은 적용 시 실제 상태를 바꾸지 않습니다.</p>
    </div>
  );
}
