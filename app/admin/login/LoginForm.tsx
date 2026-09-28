"use client";

import { useState } from "react";
import Image from "next/image";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginForm({ base }: { base: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setErr(error.message.includes("Invalid login credentials") ? "이메일 또는 비밀번호가 올바르지 않습니다." : "로그인하지 못했습니다.");
      return;
    }
    // 서버가 새 세션 쿠키를 확실히 읽도록 전체 페이지 이동.
    window.location.href = base;
  }

  const input =
    "h-[52px] w-full rounded border border-field bg-white px-4 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink";

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-[400px] flex-col gap-4 rounded-lg border border-line bg-white p-8">
      <Image src="/logo.png" alt="메딕수학" width={179} height={36} className="mb-2 h-9 w-auto self-start" />
      <h1 className="text-xl font-semibold">관리자 로그인</h1>
      <p className="text-sm text-muted">메딕차트 계정(관리자·편집자)으로 로그인합니다.</p>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        이메일
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        비밀번호
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      </label>
      {err && (
        <p className="text-sm font-semibold text-brand" role="alert">
          {err}
        </p>
      )}
      <button type="submit" disabled={busy} className="h-[52px] rounded bg-ink font-semibold text-white disabled:opacity-60">
        {busy ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
