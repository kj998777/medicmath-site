"use client";

import { useState, useTransition } from "react";
import type { SiteContent, Teacher, Review, Program, Rule, Step } from "@/lib/site";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { saveContent } from "../../actions";

const inputCls =
  "h-11 w-full rounded border border-field bg-white px-3 text-base font-normal outline-none focus:border-ink focus:ring-1 focus:ring-ink";
const areaCls = inputCls + " h-24 resize-y py-2 leading-[1.6]";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      <span>
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-white p-5 md:p-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// 휴대폰 사진은 크기가 크니 브라우저에서 긴 변 1600px JPEG로 줄여서 올린다.
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("변환 실패"))), "image/jpeg", 0.85));
}

function PhotoPicker({ value, onChange, label, aspect }: { value: string; onChange: (url: string) => void; label: string; aspect: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) {
      setErr("JPG, PNG, WEBP 사진만 올릴 수 있어요.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErr("20MB 이하 사진만 올릴 수 있어요.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const blob = await shrink(file);
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
      const supabase = createBrowserSupabase();
      const { error } = await supabase.storage.from("site-images").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e2) {
      setErr("올리지 못했습니다: " + (e2 instanceof Error ? e2.message : "알 수 없는 오류"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold">
      <span>{label}</span>
      <div className="flex items-end gap-3">
        <div className={"overflow-hidden rounded border border-line bg-sand " + aspect}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-normal text-muted">사진 없음</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded border border-ink px-3 font-semibold hover:bg-sand">
            {busy ? "올리는 중…" : value ? "사진 바꾸기" : "사진 올리기"}
            <input type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={busy} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-left text-xs font-normal text-muted underline">
              사진 빼기
            </button>
          )}
        </div>
      </div>
      {err && <span className="font-normal text-brand">{err}</span>}
    </div>
  );
}

function ListControls({ onUp, onDown, onRemove, canUp, canDown }: { onUp: () => void; onDown: () => void; onRemove: () => void; canUp: boolean; canDown: boolean }) {
  const btn = "h-9 rounded border border-line px-3 text-sm hover:border-ink disabled:opacity-40";
  return (
    <div className="flex gap-2">
      <button type="button" className={btn} onClick={onUp} disabled={!canUp} aria-label="위로">
        ↑
      </button>
      <button type="button" className={btn} onClick={onDown} disabled={!canDown} aria-label="아래로">
        ↓
      </button>
      <button type="button" className={btn + " text-brand"} onClick={onRemove}>
        삭제
      </button>
    </div>
  );
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function ContentEditor({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setC((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMsg(null);
  }
  function setItem<K extends "rules" | "steps" | "programs" | "teachers" | "reviews">(key: K, i: number, patch: Partial<SiteContent[K][number]>) {
    set(key, (c[key] as SiteContent[K][number][]).map((x, j) => (j === i ? { ...x, ...patch } : x)) as SiteContent[K]);
  }


  return (
    <div className="flex flex-col gap-5 pb-28">
      <Section title="기본 정보">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="전화번호" hint="넣으면 모바일 전화 버튼이 켜져요">
            <input className={inputCls} value={c.phone} onChange={(e) => set("phone", e.target.value)} placeholder="064-000-0000" />
          </Field>
          <Field label="운영 시간">
            <input className={inputCls} value={c.hours} onChange={(e) => set("hours", e.target.value)} />
          </Field>
          <Field label="주소">
            <input className={inputCls} value={c.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="지도 링크" hint="네이버·카카오 지도 공유 주소">
            <input className={inputCls} value={c.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
          </Field>
          <Field label="첫 화면 작은 문구">
            <input className={inputCls} value={c.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="신청 후 연락 기간" hint="예: 영업일 기준 1일">
            <input className={inputCls} value={c.replyWithin} onChange={(e) => set("replyWithin", e.target.value)} />
          </Field>
          <Field label="개인정보 보관 기간" hint="신청 폼 동의 문구에 들어가요">
            <input className={inputCls} value={c.privacyRetention} onChange={(e) => set("privacyRetention", e.target.value)} placeholder="예: 1년" />
          </Field>
        </div>
        <PhotoPicker label="첫 화면 사진 (자습실·수업 사진)" value={c.heroPhoto} onChange={(v) => set("heroPhoto", v)} aspect="h-[120px] w-[160px]" />
      </Section>

      <Section title="학원 원칙">
        {c.rules.map((r: Rule, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl font-black text-brand">{String(i + 1).padStart(2, "0")}</span>
              <ListControls
                canUp={i > 0}
                canDown={i < c.rules.length - 1}
                onUp={() => set("rules", move(c.rules, i, -1))}
                onDown={() => set("rules", move(c.rules, i, 1))}
                onRemove={() => set("rules", c.rules.filter((_, j) => j !== i))}
              />
            </div>
            <Field label="제목">
              <input className={inputCls} value={r.title} onChange={(e) => setItem("rules", i, { title: e.target.value })} />
            </Field>
            <Field label="설명">
              <textarea className={areaCls} value={r.body} onChange={(e) => setItem("rules", i, { body: e.target.value })} />
            </Field>
          </div>
        ))}
        {c.rules.length < 6 && (
          <button type="button" className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm" onClick={() => set("rules", [...c.rules, { title: "", body: "" }])}>
            + 원칙 추가
          </button>
        )}
      </Section>

      <Section title="입학 절차">
        {c.steps.map((s: Step, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand">STEP {i + 1}</span>
              <ListControls
                canUp={i > 0}
                canDown={i < c.steps.length - 1}
                onUp={() => set("steps", move(c.steps, i, -1))}
                onDown={() => set("steps", move(c.steps, i, 1))}
                onRemove={() => set("steps", c.steps.filter((_, j) => j !== i))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="단계 이름">
                <input className={inputCls} value={s.title} onChange={(e) => setItem("steps", i, { title: e.target.value })} />
              </Field>
              <Field label="설명">
                <input className={inputCls} value={s.body} onChange={(e) => setItem("steps", i, { body: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
        {c.steps.length < 8 && (
          <button type="button" className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm" onClick={() => set("steps", [...c.steps, { title: "", body: "" }])}>
            + 단계 추가
          </button>
        )}
      </Section>

      <Section title="수업 안내">
        {c.programs.map((p: Program, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">과정 {i + 1}</span>
              <ListControls
                canUp={i > 0}
                canDown={i < c.programs.length - 1}
                onUp={() => set("programs", move(c.programs, i, -1))}
                onDown={() => set("programs", move(c.programs, i, 1))}
                onRemove={() => set("programs", c.programs.filter((_, j) => j !== i))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="대상 (배지)" hint="예: 중등부">
                <input className={inputCls} value={p.badge} onChange={(e) => setItem("programs", i, { badge: e.target.value })} />
              </Field>
              <Field label="과정 이름">
                <input className={inputCls} value={p.title} onChange={(e) => setItem("programs", i, { title: e.target.value })} />
              </Field>
              <Field label="수업 횟수·시간" hint="예: 주 3회 · 150분">
                <input className={inputCls} value={p.schedule} onChange={(e) => setItem("programs", i, { schedule: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={p.highlight} onChange={(e) => setItem("programs", i, { highlight: e.target.checked })} />
                빨간 배지로 강조
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3 rounded bg-paper p-3">
              <Field label="현재 수강 인원">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={999}
                  className={inputCls + " w-28"}
                  value={p.enrolled}
                  onChange={(e) => setItem("programs", i, { enrolled: Math.max(0, Math.min(999, Number(e.target.value) || 0)) })}
                />
              </Field>
              <span className="pb-2 text-2xl font-semibold text-muted">/</span>
              <Field label="정원">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={999}
                  className={inputCls + " w-28"}
                  value={p.capacity}
                  onChange={(e) => setItem("programs", i, { capacity: Math.max(0, Math.min(999, Number(e.target.value) || 0)) })}
                />
              </Field>
              <p className="pb-2 text-sm text-muted">
                {p.capacity > 0
                  ? p.enrolled >= p.capacity
                    ? "사이트에 “마감”으로 표시돼요."
                    : `사이트에 (${p.enrolled}/${p.capacity})로 크게 표시돼요.`
                  : "정원을 0으로 두면 인원 표시를 숨겨요."}
              </p>
            </div>
            <Field label="설명">
              <textarea className={areaCls} value={p.body} onChange={(e) => setItem("programs", i, { body: e.target.value })} />
            </Field>
          </div>
        ))}
        {c.programs.length < 8 && (
          <button
            type="button"
            className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm"
            onClick={() => set("programs", [...c.programs, { badge: "", highlight: false, title: "", body: "", schedule: "", enrolled: 0, capacity: 0 }])}
          >
            + 과정 추가
          </button>
        )}
      </Section>

      <Section title="강사진">
        {c.teachers.map((t: Teacher, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">강사 {i + 1}</span>
              <ListControls
                canUp={i > 0}
                canDown={i < c.teachers.length - 1}
                onUp={() => set("teachers", move(c.teachers, i, -1))}
                onDown={() => set("teachers", move(c.teachers, i, 1))}
                onRemove={() => set("teachers", c.teachers.filter((_, j) => j !== i))}
              />
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <PhotoPicker label="사진" value={t.photo} onChange={(v) => setItem("teachers", i, { photo: v })} aspect="h-[120px] w-[94px]" />
              <div className="grid flex-1 gap-3 md:grid-cols-2">
                <Field label="이름" hint="예: 홍길동 원장">
                  <input className={inputCls} value={t.name} onChange={(e) => setItem("teachers", i, { name: e.target.value })} />
                </Field>
                <Field label="담당 학년">
                  <input className={inputCls} value={t.grades} onChange={(e) => setItem("teachers", i, { grades: e.target.value })} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="학력·약력">
                    <textarea className={areaCls} value={t.career} onChange={(e) => setItem("teachers", i, { career: e.target.value })} />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        ))}
        {c.teachers.length < 12 && (
          <button
            type="button"
            className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm"
            onClick={() => set("teachers", [...c.teachers, { name: "", grades: "", career: "", photo: "" }])}
          >
            + 강사 추가
          </button>
        )}
      </Section>

      <Section title="수강 후기">
        {c.reviews.map((r: Review, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">후기 {i + 1}</span>
              <ListControls
                canUp={i > 0}
                canDown={i < c.reviews.length - 1}
                onUp={() => set("reviews", move(c.reviews, i, -1))}
                onDown={() => set("reviews", move(c.reviews, i, 1))}
                onRemove={() => set("reviews", c.reviews.filter((_, j) => j !== i))}
              />
            </div>
            <Field label="후기 내용">
              <textarea className={areaCls} value={r.quote} onChange={(e) => setItem("reviews", i, { quote: e.target.value })} />
            </Field>
            <Field label="작성자" hint="예: 중앙고 2학년 학생">
              <input className={inputCls} value={r.who} onChange={(e) => setItem("reviews", i, { who: e.target.value })} />
            </Field>
          </div>
        ))}
        {c.reviews.length < 12 && (
          <button type="button" className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm" onClick={() => set("reviews", [...c.reviews, { quote: "", who: "" }])}>
            + 후기 추가
          </button>
        )}
      </Section>

      <Section title="하단 정보 · 외부 링크">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="대표자">
            <input className={inputCls} value={c.business.owner} onChange={(e) => set("business", { ...c.business, owner: e.target.value })} />
          </Field>
          <Field label="사업자등록번호">
            <input className={inputCls} value={c.business.bizNo} onChange={(e) => set("business", { ...c.business, bizNo: e.target.value })} />
          </Field>
          <Field label="학원등록번호">
            <input className={inputCls} value={c.business.academyNo} onChange={(e) => set("business", { ...c.business, academyNo: e.target.value })} />
          </Field>
          <Field label="블로그 주소">
            <input className={inputCls} value={c.links.blog} onChange={(e) => set("links", { ...c.links, blog: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="인스타그램 주소">
            <input className={inputCls} value={c.links.instagram} onChange={(e) => set("links", { ...c.links, instagram: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="카카오톡 채널 주소">
            <input className={inputCls} value={c.links.kakao} onChange={(e) => set("links", { ...c.links, kakao: e.target.value })} placeholder="https://" />
          </Field>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-5 py-3">
          <p className={"flex-1 text-sm " + (msg ? (msg.ok ? "text-[#1F6B4A]" : "text-brand") : "text-muted")} role="status">
            {msg ? msg.text : dirty ? "저장하지 않은 변경이 있어요." : "변경 사항 없음"}
          </p>
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={() =>
              start(async () => {
                const r = await saveContent(c);
                setMsg({ ok: r.ok, text: r.message });
                if (r.ok) setDirty(false);
              })
            }
            className="h-12 rounded bg-brand px-8 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
