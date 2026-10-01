"use server";

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { notifyNewAdmission } from "@/lib/notify";

export type AdmissionState = {
  ok: boolean;
  message: string;
  errors?: Partial<Record<"studentName" | "school" | "phone" | "parentPhone" | "score" | "reason" | "consent", string>>;
};

function field(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

// 입학 테스트 신청 저장.
// 익명(anon) 키로 admission_requests 테이블에 INSERT만 한다 — RLS로 익명 사용자는
// 넣기만 가능하고 읽기·수정·삭제는 불가 (supabase/0014_admission_requests.sql 참고).
export async function submitAdmission(_prev: AdmissionState, fd: FormData): Promise<AdmissionState> {
  // 봇 차단용 숨은 칸 — 사람은 비워 둔다.
  if (field(fd, "website")) return { ok: true, message: "신청이 접수되었습니다." };

  const studentName = field(fd, "studentName");
  const school = field(fd, "school");
  const phone = field(fd, "phone");
  const parentPhone = field(fd, "parentPhone");
  const score = field(fd, "score");
  const reason = field(fd, "reason");
  const consent = fd.get("consent") === "on";

  const errors: AdmissionState["errors"] = {};
  if (!studentName || studentName.length > 30) errors.studentName = "학생 이름을 입력해 주세요.";
  if (!school || school.length > 50) errors.school = "학교와 학년을 입력해 주세요.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) errors.phone = "학생 연락처를 정확히 입력해 주세요.";
  const pDigits = parentPhone.replace(/\D/g, "");
  if (pDigits.length < 9 || pDigits.length > 11) errors.parentPhone = "학부모 연락처를 정확히 입력해 주세요.";
  if (score.length > 50) errors.score = "50자 이내로 입력해 주세요.";
  if (reason.length < 10) errors.reason = "학생 본인이 10자 이상 적어 주세요.";
  else if (reason.length > 1000) errors.reason = "1000자 이내로 입력해 주세요.";
  if (!consent) errors.consent = "개인정보 수집·이용에 동의해 주세요.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "입력 내용을 확인해 주세요.", errors };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[admission] Supabase 환경변수가 설정되지 않았습니다.");
    return { ok: false, message: "지금은 신청을 받을 수 없습니다. 전화로 문의해 주세요." };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("admission_requests").insert({
    student_name: studentName,
    school_grade: school,
    phone,
    parent_phone: parentPhone,
    recent_score: score || null,
    reason,
  });

  if (error) {
    console.error("[admission] insert 실패:", error.message);
    return { ok: false, message: "신청 중 문제가 생겼습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요." };
  }

  // 원장님께 문자 알림 (설정돼 있을 때만, 실패해도 신청은 그대로 접수)
  await notifyNewAdmission({ studentName, school, phone, parentPhone });

  return { ok: true, message: "신청이 접수되었습니다. 확인 후 연락드리겠습니다." };
}
