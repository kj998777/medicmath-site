"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitAdmission, type AdmissionState } from "@/lib/admission";

const initial: AdmissionState = { ok: false, message: "" };

const inputCls =
  "h-[52px] w-full rounded border border-field bg-white px-4 text-base font-normal outline-none focus:border-ink focus:ring-1 focus:ring-ink md:bg-[#FBFAF8]";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="text-sm font-normal text-brand">{msg}</span>;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-14 rounded bg-brand text-[17px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60 md:h-[58px]"
    >
      {pending ? "보내는 중…" : "신청하기"}
    </button>
  );
}

export default function AdmissionForm({ privacyRetention }: { privacyRetention: string }) {
  const [state, action] = useFormState(submitAdmission, initial);

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-3 rounded border border-line bg-white p-6 md:p-8" role="status">
        <p className="font-serif text-2xl font-bold">신청이 접수되었습니다.</p>
        <p className="text-muted">{state.message}</p>
      </div>
    );
  }

  const e = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-[18px] md:gap-[22px]" noValidate>
      {/* 봇 차단용 숨은 칸 */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 md:gap-4">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          학생 이름
          <input name="studentName" type="text" placeholder="홍길동" maxLength={30} required className={inputCls} />
          <Err msg={e.studentName} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          학교 · 학년
          <input name="school" type="text" placeholder="예: ○○중 2학년" maxLength={50} required className={inputCls} />
          <Err msg={e.school} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          연락처
          <input name="phone" type="tel" inputMode="tel" placeholder="010-0000-0000" maxLength={20} required className={inputCls} />
          <Err msg={e.phone} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          최근 수학 성적
          <input name="score" type="text" placeholder="예: 내신 3등급" maxLength={50} className={inputCls} />
          <Err msg={e.score} />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        메딕수학에 오려는 이유 (학생 본인 작성)
        <textarea
          name="reason"
          placeholder="왜 지금 공부를 결심했는지 적어 주세요"
          maxLength={1000}
          required
          className={inputCls + " h-[120px] resize-none py-3 md:h-[104px]"}
        />
        <Err msg={e.reason} />
      </label>

      <label className="flex items-start gap-3 text-sm text-muted">
        <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
        <span>
          입학 상담을 위해 학생 이름, 학교·학년, 연락처, 성적, 신청 사유를 수집하며, 상담 종료 후 {privacyRetention} 뒤 파기합니다. 이에
          동의합니다. (필수)
          <br />
          <Err msg={e.consent} />
        </span>
      </label>

      {state.message && !state.ok && (
        <p className="text-sm font-semibold text-brand" role="alert">
          {state.message}
        </p>
      )}

      <Submit />
    </form>
  );
}
