// app/api/ably/auth/route.ts
import { NextResponse } from "next/server";
import Ably from "ably";

export async function POST() {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, message: "ABLY_API_KEY missing" },
      { status: 500 }
    );
  }

  const rest = new Ably.Rest({ key: apiKey });

  // 토큰 요청 (제일 단순 버전)
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: "web",
  });

  return NextResponse.json(tokenRequest);
}
