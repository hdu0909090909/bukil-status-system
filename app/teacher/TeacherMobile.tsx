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
};

const sortById = <T extends { id: string }>(list: T[]) =>
  [...list].sort((a, b) => Number(a.id) - Number(b.id));

/** 데스크톱 TeacherPage와 톤 맞춘 상태 색상 */
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

export default function TeacherMobile() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const editedRef = useRef<Record<string, number>>({});

  const [tab, setTab] = useState<"status" | "scheduler">("status");

  const [schedDay, setSchedDay] = useState<"mon" | "tue" | "wed" | "thu" | "fri">("mon");
  const [schedSlot, setSchedSlot] = useState<"8교시" | "야간 1차시" | "야간 2차시">("8교시");
  const [schedRows, setSchedRows] = useState<
    Array<{ studentId: string; name: string; status: string; reason: string }>
  >([]);

  // 첫 로딩
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      const data: Student[] = await res.json();
      setStudents(sortById(data));
      setLoading(false);
    };
    load();
  }, []);

  // 자동 갱신 (상태 탭일 때만)
  useEffect(() => {
    if (tab !== "status") return;
    const tick = async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (!res.ok) return;
      const server: Student[] = await res.json();
      const sorted = sortById(server);
      const now = Date.now();

      setStudents((prev) =>
        sorted.map((sv) => {
          const t = editedRef.current[sv.id];
          if (t && now - t < 1500) return prev.find((p) => p.id === sv.id) ?? sv;
          return sv;
        })
      );
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [tab]);

  // PATCH 공통
  const patch = async (payload: any) =>
    await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

  const saveStatus = async (id: string, status: Status) => {
    editedRef.current[id] = Date.now();
    setStudents((prev) =>
      sortById(prev.map((s) => (s.id === id ? { ...s, status } : s)))
    );
    await patch({ id, status });
  };

  const saveReason = async (s: Student) => {
    await patch({ id: s.id, reason: s.reason });
    setToast(`${s.name} 사유 저장됨`);
    setTimeout(() => setToast(""), 2000);
  };

  const toggleApprove = async (s: Student) => {
    const newVal = !s.approved;
    editedRef.current[s.id] = Date.now();
    setStudents((prev) =>
      sortById(prev.map((p) => (p.id === s.id ? { ...p, approved: newVal } : p)))
    );
    await patch({ id: s.id, approved: newVal });
  };

  const resetAllToPresent = async () => {
    const payload = students.map((s) => ({ id: s.id, status: "재실", reason: "" }));
    setStudents((prev) =>
      sortById(prev.map((s) => ({ ...s, status: "재실", reason: "" })))
    );
    await patch(payload);
    setToast("전체 재실 완료");
    setTimeout(() => setToast(""), 2000);
  };

  /* ──────────────────────────────── */
  /* 스케줄러 */
  /* ──────────────────────────────── */
  const loadScheduler = async () => {
    setTab("scheduler");
    const res = await fetch(
      `/api/scheduler?day=${schedDay}&slot=${encodeURIComponent(schedSlot)}`
    );
    const data = await res.json().catch(() => null);
    if (data?.items?.length) {
      setSchedRows(
        data.items
          .slice()
          .sort((a: any, b: any) => Number(a.studentId) - Number(b.studentId))
      );
    } else {
      setSchedRows(
        students.map((s) => ({
          studentId: s.id,
          name: s.name,
          status: "변경안함",
          reason: "",
        }))
      );
    }
  };

  const updateRow = (id: string, part: any) =>
    setSchedRows((prev) =>
      prev.map((r) => (r.studentId === id ? { ...r, ...part } : r))
    );

  const saveSchedule = async () => {
    await fetch("/api/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: schedDay, slot: schedSlot, items: schedRows }),
    });
    setToast("스케줄 저장 완료");
    setTimeout(() => setToast(""), 2000);
  };

  const applySchedule = async () => {
    const res = await fetch("/api/scheduler/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: schedDay, slot: schedSlot }),
    });
    if (res.ok) {
      setToast("스케줄 적용됨");
      loadScheduler();
    }
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-3 py-4 flex flex-col gap-3">
      {/* 상단 */}
      <div className="flex gap-3 justify-between items-center mb-1">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Teacher Console
          </span>
          <span className="text-base font-semibold flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-300/70 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            모바일 출결 관리
          </span>
        </div>
        <button
          className="text-[11px] bg-slate-800 text-slate-100 px-3 py-1.5 rounded-full border border-slate-600 hover:bg-slate-700 transition"
          onClick={() => (window.location.href = "/")}
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 rounded-full bg-slate-900/80 p-1 border border-slate-700">
        <button
          onClick={() => setTab("status")}
          className={`flex-1 py-1.5 text-[12px] rounded-full font-semibold ${
            tab === "status"
              ? "bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
              : "text-slate-300"
          }`}
        >
          상태
        </button>
        <button
          onClick={() => loadScheduler()}
          className={`flex-1 py-1.5 text-[12px] rounded-full font-semibold ${
            tab === "scheduler"
              ? "bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
              : "text-slate-300"
          }`}
        >
          스케줄러
        </button>
      </div>

      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-slate-900/95 text-slate-50 px-4 py-2 rounded-full shadow-lg z-50 text-[12px] border border-sky-500/60">
          {toast}
        </div>
      )}

      {/* ───────────────────────────── 상태 탭 ───────────────────────────── */}
      {tab === "status" && (
        <div className="flex flex-col gap-3 pb-6">
          <button
            onClick={resetAllToPresent}
            className="bg-sky-500 text-slate-950 py-2 rounded-xl font-semibold text-sm shadow-[0_0_12px_rgba(56,189,248,0.7)] hover:bg-sky-400 transition border border-sky-300"
          >
            전체 재실
          </button>

          {loading ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              불러오는 중…
            </div>
          ) : (
            students.map((s) => (
              <div
                key={s.id}
                className="border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 bg-slate-900/80 shadow-[0_0_20px_rgba(15,23,42,0.8)]"
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {s.id}
                    </span>
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                  <button
                    onClick={() => toggleApprove(s)}
                    className={`px-3 py-1.5 text-[11px] rounded-full font-semibold border transition ${
                      s.approved
                        ? "bg-emerald-500/90 text-slate-950 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                        : "bg-rose-500/90 text-slate-50 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.7)]"
                    }`}
                  >
                    {s.approved ? "허가" : "불가"}
                  </button>
                </div>

                {/* 현재 상태 뱃지 */}
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold border ${statusColor(
                    s.status
                  )}`}
                >
                  {s.status}
                </div>

                {/* 상태 선택 (컬러 래핑) */}
                <div
                  className={`w-full rounded-full border px-1 mt-1 ${statusColor(
                    s.status
                  )}`}
                >
                  <select
                    value={s.status}
                    onChange={(e) => saveStatus(s.id, e.target.value as Status)}
                    className="w-full bg-transparent border-none outline-none text-[12px] py-[7px] px-2 pr-6 appearance-none"
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

                <textarea
                  className="border border-slate-700/70 rounded-xl p-2 text-[12px] min-h-[60px] bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                  value={s.reason}
                  onChange={(e) =>
                    setStudents((prev) =>
                      sortById(
                        prev.map((p) =>
                          p.id === s.id ? { ...p, reason: e.target.value } : p
                        )
                      )
                    )
                  }
                  placeholder="사유 입력"
                />

                <button
                  onClick={() => saveReason(s)}
                  className="w-full bg-amber-400/90 text-slate-950 py-2 rounded-xl font-semibold text-[12px] hover:bg-amber-300 transition"
                >
                  사유 저장
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ───────────────────────────── 스케줄러 탭 ───────────────────────────── */}
      {tab === "scheduler" && (
        <div className="flex flex-col gap-3 pb-6">
          <div className="flex gap-2">
            {["mon", "tue", "wed", "thu", "fri"].map((d) => (
              <button
                key={d}
                onClick={() => setSchedDay(d as any)}
                className={`flex-1 py-1.5 rounded-full text-[11px] border ${
                  schedDay === d
                    ? "bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                    : "bg-slate-900/80 text-slate-200 border-slate-700"
                }`}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>

          <select
            value={schedSlot}
            onChange={(e) => setSchedSlot(e.target.value as any)}
            className="border border-slate-700 rounded-full py-2 px-3 text-[12px] bg-slate-900/80 text-slate-100"
          >
            <option>8교시</option>
            <option>야간 1차시</option>
            <option>야간 2차시</option>
          </select>

          {/* 스케줄 카드 리스트 */}
          <div className="flex flex-col gap-3">
            {schedRows.map((r) => (
              <div
                key={r.studentId}
                className="border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 bg-slate-900/80 shadow-[0_0_20px_rgba(15,23,42,0.8)]"
              >
                <div className="font-semibold text-sm">{r.name}</div>

                <div
                  className={`w-full rounded-full border px-1 ${statusColor(
                    r.status === "변경안함" ? "" : r.status
                  )}`}
                >
                  <select
                    value={r.status}
                    onChange={(e) =>
                      updateRow(r.studentId, { status: e.target.value })
                    }
                    className="w-full bg-transparent border-none outline-none text-[12px] py-[7px] px-2 pr-6 appearance-none"
                  >
                    <option
                      value="변경안함"
                      className="bg-slate-900 text-slate-100"
                    >
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

                <textarea
                  className="border border-slate-700/70 rounded-xl p-2 text-[12px] min-h-[60px] bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                  value={r.reason}
                  onChange={(e) =>
                    updateRow(r.studentId, { reason: e.target.value })
                  }
                  placeholder="사유"
                />
              </div>
            ))}
          </div>

          <button
            onClick={saveSchedule}
            className="w-full bg-sky-500 text-slate-950 py-2 rounded-xl font-semibold text-[12px] shadow-[0_0_12px_rgba(56,189,248,0.7)] hover:bg-sky-400 transition border border-sky-300"
          >
            스케줄 저장
          </button>
          <button
            onClick={applySchedule}
            className="w-full bg-emerald-500 text-slate-950 py-2 rounded-xl font-semibold text-[12px] shadow-[0_0_12px_rgba(16,185,129,0.7)] hover:bg-emerald-400 transition border border-emerald-300"
          >
            스케줄 적용
          </button>
        </div>
      )}
    </div>
  );
}
