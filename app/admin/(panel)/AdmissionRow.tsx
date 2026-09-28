"use client";

import { useState, useTransition } from "react";
import { updateAdmission } from "../actions";

export type Admission = {
  id: string;
  created_at: string;
  student_name: string;
  school_grade: string;
  phone: string;
  recent_score: string | null;
  reason: string;
  status: string;
  memo: string | null;
};

const STATUSES = ["신규", "연락완료", "테스트예정", "입학", "보류"];
const BADGE: Record<string, string> = {
  신규: "bg-brand text-white",
  연락완료: "bg-sand text-ink",
  테스트예정: "bg-ink text-white",
  입학: "bg-[#1F6B4A] text-white",
  보류: "bg-line text-muted",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdmissionRow({ a }: { a: Admission }) {
  const [open, setOpen] = useState(a.status === "신규");
  const [status, setStatus] = useState(a.status);
  const [memo, setMemo] = useState(a.memo ?? "");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const tel = a.phone.replace(/[^\d+]/g, "");

  return (
    <li className="rounded-lg border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left"
      >
        <span className={"rounded px-2 py-1 text-xs font-semibold " + (BADGE[a.status] ?? "bg-line")}>{a.status}</span>
        <span className="text-base font-semibold">{a.student_name}</span>
        <span className="text-sm text-muted">{a.school_grade}</span>
        <span className="ml-auto text-sm text-muted">{fmt(a.created_at)}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-line px-5 py-5">
          <dl className="grid grid-cols-[96px_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">연락처</dt>
            <dd>
              <a href={`tel:${tel}`} className="font-semibold underline">
                {a.phone}
              </a>
            </dd>
            <dt className="text-muted">최근 성적</dt>
            <dd>{a.recent_score || "—"}</dd>
            <dt className="text-muted">신청 이유</dt>
            <dd className="whitespace-pre-wrap leading-[1.7]">{a.reason}</dd>
          </dl>

          <div className="flex flex-col gap-3 rounded bg-paper p-4 md:flex-row md:items-end">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              상태
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 rounded border border-field bg-white px-3 text-base font-normal"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold">
              메모 (관리자만 보임)
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={1000}
                placeholder="예: 10/2 통화, 토요일 테스트 예약"
                className="h-11 rounded border border-field bg-white px-3 text-base font-normal"
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await updateAdmission(a.id, status, memo);
                  setMsg(r.message);
                })
              }
              className="h-11 rounded bg-ink px-5 font-semibold text-white disabled:opacity-60"
            >
              {pending ? "저장 중…" : "저장"}
            </button>
          </div>
          {msg && (
            <p className="text-sm text-muted" role="status">
              {msg}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
