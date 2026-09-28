import "server-only";
import { createHmac, randomBytes } from "node:crypto";

// 새 입학 신청이 들어오면 원장님 휴대폰으로 문자(SMS/LMS)를 보낸다. 발송 업체: 솔라피(SOLAPI).
//
// Vercel 환경변수 (4개 모두 있어야 동작, 하나라도 없으면 문자 없이 조용히 넘어감):
//   SOLAPI_API_KEY     솔라피 콘솔 → API Key 관리에서 발급
//   SOLAPI_API_SECRET  위와 같은 곳 (API Secret)
//   SMS_FROM           솔라피에 등록·인증한 발신번호 (예: 0647023455)
//   SMS_TO             받을 번호. 여러 명이면 쉼표로 (예: 01012345678,01098765432) — 최대 3개
//
// 문자 발송이 실패해도 신청 자체는 정상 접수된다(신청 저장 → 문자 순서, 문자 오류는 로그만 남김).

function digits(s: string) {
  return s.replace(/\D/g, "");
}

export async function notifyNewAdmission(a: { studentName: string; school: string; phone: string }): Promise<void> {
  const key = process.env.SOLAPI_API_KEY?.trim();
  const secret = process.env.SOLAPI_API_SECRET?.trim();
  const from = digits(process.env.SMS_FROM ?? "");
  const to = (process.env.SMS_TO ?? "")
    .split(",")
    .map(digits)
    .filter((n) => n.length >= 9 && n.length <= 11)
    .slice(0, 3);
  if (!key || !secret || !from || to.length === 0) return;

  const text = `[메딕수학] 새 입학 신청\n${a.studentName} (${a.school})\n연락처 ${a.phone}`;

  const date = new Date().toISOString();
  const salt = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", secret).update(date + salt).digest("hex");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({ messages: to.map((n) => ({ to: n, from, text })) }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[notify] 문자 발송 실패:", res.status, body.slice(0, 300));
      return;
    }
    const json = (await res.json().catch(() => null)) as { failedMessageList?: unknown[] } | null;
    if (json?.failedMessageList && json.failedMessageList.length > 0) {
      console.error("[notify] 일부 문자 실패:", JSON.stringify(json.failedMessageList).slice(0, 300));
    }
  } catch (e) {
    console.error("[notify] 문자 발송 오류:", e instanceof Error ? e.message : e);
  } finally {
    clearTimeout(timer);
  }
}
