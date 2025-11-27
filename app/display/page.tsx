// app/display/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

const STATUS_LIST = [
  "재실","미디어스페이스","귀가","외출","호실자습","아단관 강당3","아단관 강의실",
  "방과후수업","동아리 활동","교내활동","화장실","상담","기타",
] as const;

type Status = (typeof STATUS_LIST)[number];
type Student = { id:string; name:string; status:string; reason:string; approved:boolean; seatId?:string };

const SEAT_POS: Record<string,{x:number;y:number}> = {
  "11115":{x:40,y:20},"11130":{x:140,y:20},"11125":{x:240,y:20},"11106":{x:340,y:20},"11124":{x:440,y:20},"11110":{x:540,y:20},
  "11119":{x:40,y:90},"11108":{x:140,y:90},"11120":{x:240,y:90},"11118":{x:340,y:90},"11102":{x:440,y:90},"11126":{x:540,y:90},
  "11128":{x:40,y:160},"11127":{x:140,y:160},"11121":{x:240,y:160},"11103":{x:340,y:160},"11107":{x:440,y:160},"11116":{x:540,y:160},
  "11112":{x:40,y:230},"11101":{x:140,y:230},"11129":{x:240,y:230},"11117":{x:340,y:230},"11109":{x:440,y:230},"11113":{x:540,y:230},
  "11104":{x:40,y:300},"11122":{x:140,y:300},
};

const sortById = <T extends {id:string}>(list:T[]) => [...list].sort((a,b)=>Number(a.id)-Number(b.id));

// ✅ 호실자습도 gone 그룹으로 묶음
const statusToPlace = (st:string):"classroom"|"mediaspace"|"gone"|"etc" =>
  st==="재실"
    ? "classroom"
    : st==="미디어스페이스"
    ? "mediaspace"
    : (st==="귀가" || st==="외출" || st==="호실자습")
    ? "gone"
    : "etc";

// 상태별 색
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

export default function DisplayPage(){
  const [students, setStudents] = useState<Student[]>([]);
  const [now, setNow] = useState("");
  const [toast, setToast] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editedRef = useRef<Record<string,number>>({});

  // 시계
  useEffect(()=> {
    const tick=()=>{
      const d=new Date();
      const yyyy=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,"0"), dd=String(d.getDate()).padStart(2,"0");
      const hh=String(d.getHours()).padStart(2,"0"), mi=String(d.getMinutes()).padStart(2,"0");
      setNow(`${yyyy}-${mm}-${dd} ${hh}:${mi}`);
    };
    tick();
    const t=setInterval(tick,30_000);
    return ()=>clearInterval(t);
  },[]);

  // 전체화면 상태 추적
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // 폴링 1초
  useEffect(()=> {
    const load=async()=>{
      const res=await fetch("/api/students",{ cache:"no-store" });
      if(!res.ok) return;
      const server:Student[]=await res.json();
      const sortedServer=sortById(server);
      const now=Date.now();
      const edited=editedRef.current;

      setStudents(prev=>{
        const prevMap=new Map(prev.map(s=>[s.id,s]));
        return sortedServer.map(sv=>{
          const t=edited[sv.id];
          if(t && now-t<1000) return prevMap.get(sv.id) ?? sv;
          return sv;
        });
      });
    };
    load();
    const t=setInterval(load,1000);
    return ()=>clearInterval(t);
  },[]);

  const patchStatus = async (id:string, status: Status) => {
    editedRef.current[id]=Date.now();
    setStudents(prev=>sortById(prev.map(s=>s.id===id?{...s,status}:s)));
    await fetch("/api/students",{
      method:"PATCH", headers:{ "Content-Type":"application/json" }, cache:"no-store",
      body: JSON.stringify({ id, status }),
    });
  };

  const saveReason = async (id:string) => {
    const stu = students.find(s=>s.id===id);
    if(!stu) return;
    const res = await fetch("/api/students", {
      method:"PATCH", headers:{ "Content-Type":"application/json" }, cache:"no-store",
      body: JSON.stringify({ id, reason: stu.reason }),
    });
    if(res.ok){
      const data=await res.json().catch(()=>null);
      if(data && Array.isArray(data.students)) setStudents(sortById(data.students));
      setToast(`${stu.name}(${stu.id}) 사유 저장 완료`);
    }else{
      setToast("사유 저장 실패");
    }
    setTimeout(()=>setToast(""), 2000);
  };

  const resetAllToPresent = async () => {
    const payload = students.map(s=>({ id:s.id, status:"재실", reason:"" }));
    setStudents(prev=>sortById(prev.map(s=>({ ...s, status:"재실", reason:"" }))));
    await fetch("/api/students",{
      method:"PATCH", headers:{ "Content-Type":"application/json" }, cache:"no-store",
      body: JSON.stringify(payload),
    });
    setToast("전체 재실로 변경되었습니다.");
    setTimeout(()=>setToast(""), 2000);
  };

  const classroomStudents = students.filter(s=>statusToPlace(s.status)==="classroom" && s.seatId);
  const mediaStudents = students.filter(s=>statusToPlace(s.status)==="mediaspace").sort((a,b)=>Number(a.id)-Number(b.id));
  const goneStudents = students.filter(s=>statusToPlace(s.status)==="gone").sort((a,b)=>Number(a.id)-Number(b.id));
  const etcStudents  = students.filter(s=>statusToPlace(s.status)==="etc").sort((a,b)=>Number(a.id)-Number(b.id));

  const etcByStatus:Record<string,Student[]>= {};
  for(const s of etcStudents){ (etcByStatus[s.status]??=([])).push(s); }

  const totalCount=students.length;
  const inClassOrMedia = students.filter(s=>["재실","미디어스페이스"].includes(s.status)).length;
  const outClassOrMedia = totalCount - inClassOrMedia;
  const inCampus = students.filter(s=>!["귀가","외출","호실자습"].includes(s.status)).length;
  const outCampus = totalCount - inCampus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-6 py-4">
      {/* 상단바 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
            1-11 출결 현황
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            실시간으로 교실·미디어스페이스·귀가/외출/호실자습 상태를 모니터링합니다.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em]">
            LAST UPDATE
          </span>
          <span className="text-sm font-mono text-slate-200">{now}</span>

          {/* 전체화면 토글 버튼 */}
          <button
            onClick={toggleFullscreen}
            className="mt-2 text-[11px] px-3 py-1.5 rounded-full border border-slate-600 bg-slate-900/80 hover:bg-slate-800/90 transition font-semibold text-slate-200"
          >
            {isFullscreen ? "창 모드로" : "전체화면"}
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 왼쪽: 현재 상태 테이블 */}
        <div className="h-[1300px] w-[560px] flex flex-col bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_40px_rgba(15,23,42,0.8)] backdrop-blur-md overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center px-4 py-3 border-b border-slate-700/70 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-900/80">
            <span className="text-base font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
              현재 상태
            </span>

            {/* 토스트 */}
            <div className="flex-1 flex justify-end mr-3">
              {toast && (
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  {toast}
                </span>
              )}
            </div>

            <button
              onClick={resetAllToPresent}
              className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(56,189,248,0.6)] hover:scale-[1.02] active:scale-95 transition-transform"
              title="표의 모든 학생을 재실로 변경"
            >
              전체 재실
            </button>
          </div>

          {/* 테이블 */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-700/80 backdrop-blur">
                  <tr className="text-xs text-slate-300">
                    <th className="py-2 px-3 text-left w-16 font-medium">학번</th>
                    <th className="py-2 px-2 text-left w-16 font-medium">이름</th>
                    <th className="py-2 px-2 text-left w-32 font-medium">상태</th>
                    <th className="py-2 px-2 text-left font-medium">사유</th>
                    <th className="py-2 px-2 text-center w-20 font-medium">사유 저장</th>
                    <th className="py-2 px-2 text-center w-14 font-medium">허가</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx)=>(
                    <tr
                      key={s.id}
                      className={`border-b border-slate-800/60 ${
                        idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/25"
                      } hover:bg-slate-800/50 transition-colors`}
                    >
                      <td className="px-3 py-1.5 font-mono text-[13px] text-slate-200">
                        {s.id}
                      </td>
                      <td className="px-2 py-1.5 truncate text-[13px]">
                        {s.name}
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={s.status}
                          onChange={(e)=>patchStatus(s.id, e.target.value as Status)}
                          className={`w-full text-xs px-2 py-[5px] rounded-full border bg-slate-900/80 outline-none focus:ring-1 focus:ring-sky-400/70 ${statusColor(s.status)}`}
                        >
                          {STATUS_LIST.map(st=>(
                            <option key={st} value={st} className="bg-slate-900">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={s.reason}
                          onChange={(e)=>{
                            editedRef.current[s.id]=Date.now();
                            setStudents(prev=>sortById(prev.map(p=>p.id===s.id?{...p, reason:e.target.value}:p)));
                          }}
                          className="w-full text-xs px-2 py-[6px] rounded-full border border-slate-700/70 bg-slate-900/70 focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
                          placeholder="사유 입력"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={()=>saveReason(s.id)}
                          className="w-full text-xs px-2 py-[6px] rounded-full bg-amber-400/90 text-slate-950 font-semibold hover:bg-amber-300 transition-colors"
                          title="이 학생의 사유만 서버에 저장"
                        >
                          저장
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`inline-flex justify-center items-center w-full text-xs px-2 py-[6px] rounded-full border ${
                            s.approved
                              ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-200"
                              : "bg-rose-500/20 border-rose-400/60 text-rose-200"
                          }`}
                          title="허가는 교원 페이지에서만 변경 가능합니다"
                        >
                          {s.approved ? "O" : "X"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        불러온 학생 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 오른쪽: 교실 + 요약 + 기타 */}
        <div className="h-[1300] flex-1 flex flex-col gap-4">
          <div className="flex gap-4 h-[45%] min-h-[320px]">
            {/* 교실 */}
            <div className="relative flex flex-col w-[650px] max-w-[650px] bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_40px_rgba(15,23,42,0.8)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/70 bg-slate-900/80">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gradient-to-b from-emerald-400 to-sky-400 rounded-full" />
                  &lt;교실&gt;
                </div>
                <div className="text-xs text-slate-400">
                  재실 인원:{" "}
                  <span className="font-semibold text-emerald-300">
                    {classroomStudents.length}
                  </span>
                </div>
              </div>
              <div className="relative flex-1 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.18),_transparent_55%)]">
                {classroomStudents.map(s=>{
                  const pos = s.seatId ? SEAT_POS[s.seatId] : undefined;
                  if(!pos) return null;
                  return (
                    <div
                      key={s.id}
                      className="absolute px-3 py-1.5 text-sm font-semibold rounded-xl bg-slate-900/90 border border-slate-600/80 shadow-[0_0_18px_rgba(15,23,42,0.9)] flex flex-col items-center min-w-[80px]"
                      style={{ left: pos.x, top: pos.y+16 }}
                    >
                      <span className="text-sm text-slate-200">{s.name}</span>
                      <span className="mt-0.5 text-[11px] px-2 py-[1px] rounded-full border border-slate-600/70 text-slate-300 bg-slate-950/80">
                        {s.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 오른쪽: 미디어/귀가+호실자습 + 인원 요약 */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-3 h-1/2 min-h-[160px]">
                {/* 미디어 */}
                <div className="flex-1 bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_28px_rgba(15,23,42,0.8)] flex flex-col overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-700/70 bg-slate-900/80 text-sm font-semibold text-center">
                    &lt;미디어스페이스&gt;
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
                    {mediaStudents.map((s,idx)=>(
                      <div
                        key={s.id}
                        className="border border-sky-500/40 bg-sky-500/10 text-sm font-semibold text-sky-100 text-center py-1.5 rounded-xl shadow-[0_0_16px_rgba(56,189,248,0.5)]"
                      >
                        {idx+1}. {s.name}
                      </div>
                    ))}
                    {mediaStudents.length === 0 && (
                      <div className="text-xs text-slate-500 text-center mt-3">
                        미디어스페이스 인원이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                {/* 귀가/외출/호실자습 */}
                <div className="flex-1 bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_28px_rgba(15,23,42,0.8)] flex flex-col overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-700/70 bg-slate-900/80 text-sm font-semibold text-center">
                    &lt;귀가 / 외출 / 호실자습&gt;
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
                    {goneStudents.map(s=>(
                      <div
                        key={s.id}
                        className={`border text-sm text-center py-1.5 rounded-xl shadow-[0_0_16px_rgba(15,23,42,0.7)] ${statusColor(s.status)}`}
                      >
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-[11px] opacity-80 mt-[1px]">
                          {s.status}
                        </div>
                      </div>
                    ))}
                    {goneStudents.length === 0 && (
                      <div className="text-xs text-slate-500 text-center mt-3">
                        귀가·외출·호실자습 인원이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 인원 카드들 */}
              <div className="flex gap-3 h-1/2 min-h-[160px]">
                {/* 인원 (교실·미디어스페이스) */}
                <div className="flex-1 bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_28px_rgba(15,23,42,0.8)] px-4 py-3 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">인원 (교실·미디어스페이스)</div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-[0.18em]">
                      CLASS & MEDIA
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">총원</span>
                    <span className="font-bold text-xl text-slate-100">{totalCount}</span>
                  </div>
                  {/* ✅ 결원 먼저 */}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">결원</span>
                    <span className="font-bold text-xl text-rose-400">{outClassOrMedia}</span>
                  </div>
                  <div className="mt-auto flex justify-between text-sm pt-2 border-t border-slate-700/60">
                    <span className="text-slate-400">재실/미디어스페이스</span>
                    <span className="font-bold text-xl text-emerald-300">{inClassOrMedia}</span>
                  </div>
                </div>

                {/* 인원 (교내) */}
                <div className="flex-1 bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_28px_rgba(15,23,42,0.8)] px-4 py-3 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">인원 (교내)</div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-[0.18em]">
                      ON CAMPUS
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">총원</span>
                    <span className="font-bold text-xl text-slate-100">{totalCount}</span>
                  </div>
                  {/* ✅ 결원 먼저 */}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">결원</span>
                    <span className="font-bold text-xl text-rose-400">{outCampus}</span>
                  </div>
                  <div className="mt-auto flex justify-between text-sm pt-2 border-t border-slate-700/60">
                    <span className="text-slate-400">교내에 있음</span>
                    <span className="font-bold text-xl text-sky-300">{inCampus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 기타 */}
          <div className="flex-1 min-h-[140px] bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-[0_0_40px_rgba(15,23,42,0.8)] flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-700/70 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="w-1.5 h-4 bg-gradient-to-b from-sky-400 to-violet-500 rounded-full" />
                &lt;기타&gt;
              </div>
              <span className="text-xs text-slate-500">
                화장실·상담·동아리실 등
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
              <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))" }}>
                {Object.keys(etcByStatus).map(st=>(
                  <div
                    key={st}
                    className={`rounded-xl border px-3 py-2 bg-slate-950/60 ${statusColor(st)}`}
                  >
                    <div className="text-xs font-semibold mb-1.5 flex items-center justify-between">
                      <span>{st}</span>
                      <span className="text-[11px] text-slate-200/80">
                        {etcByStatus[st].length}명
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {etcByStatus[st].slice().sort((a,b)=>Number(a.id)-Number(b.id)).map(s=>(
                        <div key={s.id} className="text-[13px] leading-tight">
                          <div className="flex items-center justify_between">
                            <span>{s.name}</span>
                            <span className="text-[11px] text-slate-200/80 font-mono">
                              {s.id}
                            </span>
                          </div>
                          {s.reason && (
                            <div className="text-[11px] text-slate-100/85 mt-[2px]">
                              {s.reason}
                            </div>
                          )}
                          <div className={`text-[11px] mt-[1px] ${
                            s.approved ? "text-emerald-200" : "text-rose-200"
                          }`}>
                            {s.approved ? "허가됨" : "미허가"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(etcByStatus).length === 0 && (
                  <div className="text-sm text-slate-500">
                    기타 상태에 해당하는 인원이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
