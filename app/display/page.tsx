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
  "11127":{x:40,y:160},"11128":{x:140,y:160},"11121":{x:240,y:160},"11103":{x:340,y:160},"11107":{x:440,y:160},"11111":{x:540,y:160},
  "11112":{x:40,y:230},"11101":{x:140,y:230},"11129":{x:240,y:230},"11117":{x:340,y:230},"11116":{x:440,y:230},
  "11104":{x:40,y:300},"11122":{x:140,y:300},"11109":{x:240,y:300},"11113":{x:340,y:300},
};

const sortById = <T extends {id:string}>(list:T[]) => [...list].sort((a,b)=>Number(a.id)-Number(b.id));
const statusToPlace = (st:string):"classroom"|"mediaspace"|"gone"|"etc" =>
  st==="재실"?"classroom": st==="미디어스페이스"?"mediaspace": (st==="귀가"||st==="외출")?"gone":"etc";

export default function DisplayPage(){
  const [students, setStudents] = useState<Student[]>([]);
  const [now, setNow] = useState("");
  const [toast, setToast] = useState("");

  // 최근 로컬 수정 보호(5초)
  const editedRef = useRef<Record<string,number>>({});

  // 시계
  useEffect(()=> {
    const tick=()=>{
      const d=new Date();
      const yyyy=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,"0"), dd=String(d.getDate()).padStart(2,"0");
      const hh=String(d.getHours()).padStart(2,"0"), mi=String(d.getMinutes()).padStart(2,"0");
      setNow(`${yyyy}-${mm}-${dd} ${hh}:${mi}`);
    };
    tick(); const t=setInterval(tick,30_000); return ()=>clearInterval(t);
  },[]);

  // 최초 + 폴링(3초)
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
          if(t && now-t<5000) return prevMap.get(sv.id) ?? sv;
          return sv;
        });
      });
    };
    load();
    const t=setInterval(load,3000);
    return ()=>clearInterval(t);
  },[]);

  // 단건 PATCH (상태만)
  const patchStatus = async (id:string, status: Status) => {
    editedRef.current[id]=Date.now();
    setStudents(prev=>sortById(prev.map(s=>s.id===id?{...s,status}:s)));
    await fetch("/api/students",{
      method:"PATCH", headers:{ "Content-Type":"application/json" }, cache:"no-store",
      body: JSON.stringify({ id, status }),
    });
  };

  // 행별 사유 저장(PATCH: reason만)
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

  // 전체 재실
  const resetAllToPresent = async () => {
    const payload = students.map(s=>({ id:s.id, status:"재실", reason:"" }));
    setStudents(prev=>sortById(prev.map(s=>({ ...s, status:"재실", reason:"" }))));
    await fetch("/api/students",{
      method:"PATCH", headers:{ "Content-Type":"application/json" }, cache:"no-store",
      body: JSON.stringify(payload),
    });
    setToast("전체 재실로 변경되었습니다."); setTimeout(()=>setToast(""), 2000);
  };

  // 분류 및 카운트
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
    <div className="min-h-screen bg-white p-4 flex flex-col gap-4">
      {/* 상단바 */}
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-semibold">표시 화면</h2>
        <div className="flex items-center gap-3">
          {toast && <div className="text-sm text-blue-600">{toast}</div>}
          <div className="text-sm text-gray-600">{now}</div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 왼쪽 표 */}
        <div className="w-[520px] border-2 border-black rounded-md flex flex-col min-h-0">
          <div className="flex items-center justify-between bg-gray-100 px-3 py-2 font-bold border-b border-black">
            <span>현재 상태</span>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAllToPresent}
                className="text-xs px-3 py-1 rounded bg-blue-500 text-white"
                title="표의 모든 학생을 재실로 변경"
              >
                전체 재실
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-black sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2 text-left w-14">학번</th>
                  <th className="py-2 px-2 text-left w-16">이름</th>
                  <th className="py-2 px-2 text-left w-24">상태</th>
                  <th className="py-2 px-2 text-left">사유</th>
                  <th className="py-2 px-2 text-left w-20">사유 저장</th>
                  {/* 허가(O/X)는 표시만, 토글 없음 */}
                  <th className="py-2 px-2 text-left w-12">허가</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s=>(
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="px-2 py-1">{s.id}</td>
                    <td className="px-2 py-1 truncate">{s.name}</td>
                    <td className="px-2 py-1">
                      <select
                        value={s.status}
                        onChange={(e)=>patchStatus(s.id, e.target.value as Status)}
                        className="border rounded px-1 py-[1px] text-[11px] w-full"
                      >
                        {STATUS_LIST.map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={s.reason}
                        onChange={(e)=>{
                          editedRef.current[s.id]=Date.now();
                          setStudents(prev=>sortById(prev.map(p=>p.id===s.id?{...p, reason:e.target.value}:p)));
                        }}
                        className="border rounded px-1 py-[1px] text-[11px] w-full"
                        placeholder="사유 입력"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={()=>saveReason(s.id)}
                        className="text-[11px] px-2 py-[2px] rounded w-full bg-orange-500 text-white"
                        title="이 학생의 사유만 서버에 저장"
                      >
                        저장
                      </button>
                    </td>
                    <td className="px-2 py-1">
                      {/* 읽기 전용 배지 */}
                      <span
                        className={`inline-block w-full text-center text-[11px] px-2 py-[2px] rounded ${s.approved?"bg-green-500 text-white":"bg-gray-300 text-gray-800"}`}
                        title="허가는 교원 페이지에서만 변경 가능합니다"
                      >
                        {s.approved ? "O" : "X"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽 레이아웃 */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex gap-4 min-h-[360px]">
            {/* 교실 */}
            <div className="relative border-2 border-black w-[650px] h-[420px] flex flex-col">
              <div className="text-center font-bold py-1 border-b border-black bg-white">&lt;교실&gt;</div>
              <div className="relative flex-1">
                {students.filter(s=>statusToPlace(s.status)==="classroom" && s.seatId).map(s=>{
                  const pos = s.seatId ? SEAT_POS[s.seatId] : undefined;
                  if(!pos) return null;
                  return (
                    <div key={s.id} className="absolute border-[3px] border-black px-3 py-1 text-sm font-semibold bg-white"
                         style={{ left: pos.x, top: pos.y+10 }}>
                      {s.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 오른쪽: 미디어/귀가 + 인원 */}
            <div className="flex-1 flex gap-3 min-h-0 h-[420px]">
              <div className="w-[360px] flex flex-col gap-3 h-full min-h-0">
                <div className="border-2 border-black flex-1 flex flex-col min-h-0">
                  <div className="text-center font-bold py-1 border-b border-black bg-white">&lt;미디어스페이스&gt;</div>
                  <div className="p-2 flex flex-col gap-2 overflow-y-auto">
                    {mediaStudents.map((s,idx)=>(
                      <div key={s.id} className="border-[2px] border-black bg-white text-sm font-semibold text-center py-1">
                        {idx+1}. {s.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-2 border-black flex-1 flex flex-col min-h-0">
                  <div className="text-center font-bold py-1 border-b border-black bg-white">&lt;귀가/외출&gt;</div>
                  <div className="p-2 flex flex-col gap-2 overflow-y-auto">
                    {goneStudents.map(s=>(
                      <div key={s.id} className="border-[2px] border-black bg-gray-200 text-sm text-center py-1">
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 h-full min-h-0">
                <div className="bg-white border border-gray-300 rounded-md px-3 py-3 flex-1 flex flex-col">
                  <div className="text-base font-semibold mb-3 text-center">인원 (교실·미디어스페이스)</div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">총원</span><span className="font-bold text-lg">{totalCount}</span></div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">재실/미디어스페이스</span><span className="font-bold text-lg text-green-600">{inClassOrMedia}</span></div>
                  <div className="flex justify-between text-sm mt-auto"><span className="text-gray-600">결원</span><span className="font-bold text-lg text-red-500">{outClassOrMedia}</span></div>
                </div>

                <div className="bg-white border border-gray-300 rounded-md px-3 py-3 flex-1 flex flex-col">
                  <div className="text-base font-semibold mb-3 text-center">인원 (교내)</div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">총원</span><span className="font-bold text-lg">{totalCount}</span></div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">교내에 있음</span><span className="font-bold text-lg text-green-600">{inCampus}</span></div>
                  <div className="flex justify-between text-sm mt-auto"><span className="text-gray-600">결원</span><span className="font-bold text-lg text-red-500">{outCampus}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 기타 */}
          <div className="border-2 border-black flex-1 min-h-[140px] flex flex-col">
            <div className="px-3 py-1 font-bold border-b border-black bg-white">&lt;기타&gt;</div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))" }}>
                {Object.keys(etcByStatus).map(st=>(
                  <div key={st} className="border-2 border-black bg-white">
                    <div className="text-xs font-semibold px-2 py-1 border-b bg-gray-50">{st}</div>
                    <div className="p-2 flex flex-col gap-1">
                      {etcByStatus[st].slice().sort((a,b)=>Number(a.id)-Number(b.id)).map(s=>(
                        <div key={s.id} className="text-sm leading-tight">
                          {s.name}
                          {s.reason && <div className="text-[10px] text-gray-500">{s.reason}</div>}
                          <div className={`text-[10px] ${s.approved?"text-blue-600":"text-red-500"}`}>
                            {s.approved?"허가됨":"미허가"}
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
