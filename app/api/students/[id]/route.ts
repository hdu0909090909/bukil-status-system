// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { students } from "@/app/lib/data";

type PartialStudent = {
  status?: string;
  reason?: string;
  approved?: boolean;
  seatId?: string;
  name?: string; // 필요하면
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const target = students.find((s) => s.id === params.id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(target, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idx = students.findIndex((s) => s.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as PartialStudent;
  // 실제 변경된 필드만 덮어쓰기
  const updated = { ...students[idx], ...body };
  students[idx] = updated;

  // 단건만 돌려줌 (대용량 방지, 충돌 최소화)
  return NextResponse.json({ student: updated }, { status: 200 });
}
