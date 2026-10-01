"use client";

import { useState, useTransition } from "react";
import type { SiteContent, Teacher, Case, Program, Rule, Step } from "@/lib/site";
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

// 사진 1장을 검사·축소해서 Supabase 저장소(site-images)에 올리고 공개 주소를 돌려준다.
async function uploadPhoto(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw new Error("JPG, PNG, WEBP 사진만 올릴 수 있어요.");
  if (file.size > 20 * 1024 * 1024) throw new Error("20MB 이하 사진만 올릴 수 있어요.");
  const blob = await shrink(file);
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
  const supabase = createBrowserSupabase();
  const { error } = await supabase.storage.from("site-images").upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

// 첫 화면 사진 여러 장 — 순서대로 자동 슬라이드된다.
function HeroPhotos({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const MAX_PHOTOS = 10;

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - value.length);
    e.target.value = "";
    if (files.length === 0) return;
    setErr("");
    setBusy(files.length);
    const added: string[] = [];
    for (const f of files) {
      try {
        added.push(await uploadPhoto(f));
      } catch (e2) {
        setErr(`${f.name}: ` + (e2 instanceof Error ? e2.message : "올리지 못했습니다"));
      }
      setBusy((n) => n - 1);
    }
    if (added.length) onChange([...value, ...added]);
  }

  const btn = "h-8 w-8 rounded border border-line bg-white text-sm hover:border-ink disabled:opacity-40";
  return (
    <div className="flex flex-col gap-2 text-sm font-semibold">
      <span>
        첫 화면 사진 (자습실·수업)
        <span className="ml-2 font-normal text-muted">여러 장이면 5초마다 자동으로 넘어가요 · 최대 {MAX_PHOTOS}장 · 첫 장이 맨 먼저</span>
      </span>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src + i} className="flex flex-col gap-1.5">
            <div className="relative h-[100px] w-[140px] overflow-hidden rounded border border-line bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">{i + 1}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" className={btn} aria-label="앞으로" disabled={i === 0} onClick={() => onChange(move(value, i, -1))}>
                ←
              </button>
              <button type="button" className={btn} aria-label="뒤로" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, 1))}>
                →
              </button>
              <button type="button" className={btn + " text-brand"} aria-label="이 사진 빼기" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          </div>
        ))}
        {value.length < MAX_PHOTOS && (
          <label className="flex h-[100px] w-[140px] cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-ink text-center text-sm hover:bg-sand">
            {busy > 0 ? `올리는 중… (${busy})` : "+ 사진 추가"}
            <span className="text-xs font-normal text-muted">여러 장 선택 가능</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={onFiles} disabled={busy > 0} />
          </label>
        )}
      </div>
      {err && <span className="font-normal text-brand">{err}</span>}
    </div>
  );
}

function PhotoPicker({ value, onChange, label, aspect }: { value: string; onChange: (url: string) => void; label: string; aspect: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadPhoto(file));
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

export default function ContentEditor({ initial, loadedAt }: { initial: SiteContent; loadedAt: string | null }) {
  const [c, setC] = useState<SiteContent>(initial);
  // 이 화면을 연 뒤 다른 곳(다른 탭·기기, SQL)에서 바뀌었으면 덮어쓰지 않도록, 불러온 시각을 같이 보낸다.
  const [baseAt, setBaseAt] = useState<string | null>(loadedAt);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setC((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMsg(null);
  }
  function setItem<K extends "rules" | "steps" | "programs" | "teachers" | "cases">(key: K, i: number, patch: Partial<SiteContent[K][number]>) {
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
        <HeroPhotos value={c.heroPhotos} onChange={(v) => set("heroPhotos", v)} />
      </Section>

      <Section title="강사진 위 이야기 (누가 가르치나)">
        <p className="-mt-2 text-sm text-muted">강사진 카드 위에 크게 보여요. 제목을 비우면 이 상자가 사라져요.</p>
        <Field label="제목">
          <input className={inputCls} value={c.teacherStory.title} onChange={(e) => set("teacherStory", { ...c.teacherStory, title: e.target.value })} />
        </Field>
        <Field label="본문" hint="빈 줄로 문단을 나눠요">
          <textarea className={areaCls} value={c.teacherStory.body} onChange={(e) => set("teacherStory", { ...c.teacherStory, body: e.target.value })} />
        </Field>
        <Field label="핵심 사실" hint="한 줄에 하나씩 · 최대 5줄">
          <textarea
            className={areaCls}
            value={c.teacherStory.facts.join("\n")}
            onChange={(e) => set("teacherStory", { ...c.teacherStory, facts: e.target.value.split("\n").slice(0, 5) })}
          />
        </Field>
        <Field label="자세히 보기 링크" hint="블로그 글 주소 · 비우면 안 보여요">
          <input className={inputCls} value={c.teacherStory.link} onChange={(e) => set("teacherStory", { ...c.teacherStory, link: e.target.value })} />
        </Field>
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

      <Section title="성적 향상 사례">
        <p className="-mt-2 text-sm text-muted">사이트에 &ldquo;이전 → 이후&rdquo; 성적이 크게 보여요. 학생 이름은 쓰지 말고 학교·학년 정도만 적어 주세요.</p>
        {c.cases.map((k: Case, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">사례 {i + 1}</span>
              <ListControls
                canUp={i > 0}
                canDown={i < c.cases.length - 1}
                onUp={() => set("cases", move(c.cases, i, -1))}
                onDown={() => set("cases", move(c.cases, i, 1))}
                onRemove={() => set("cases", c.cases.filter((_, j) => j !== i))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="학생" hint="예: 중앙고 2학년">
                <input className={inputCls} value={k.who} onChange={(e) => setItem("cases", i, { who: e.target.value })} />
              </Field>
              <Field label="시험" hint="예: 1학기 기말">
                <input className={inputCls} value={k.exam} onChange={(e) => setItem("cases", i, { exam: e.target.value })} />
              </Field>
              <Field label="이전 성적" hint="예: 4등급, 62점">
                <input className={inputCls} value={k.before} onChange={(e) => setItem("cases", i, { before: e.target.value })} />
              </Field>
              <Field label="이후 성적" hint="예: 2등급, 91점">
                <input className={inputCls} value={k.after} onChange={(e) => setItem("cases", i, { after: e.target.value })} />
              </Field>
              <Field label="걸린 기간" hint="예: 3개월 · 비우면 안 보여요">
                <input className={inputCls} value={k.period} onChange={(e) => setItem("cases", i, { period: e.target.value })} />
              </Field>
            </div>
            <Field label="한마디" hint="무엇을 바꿨는지 · 비우면 안 보여요">
              <input className={inputCls} value={k.note} onChange={(e) => setItem("cases", i, { note: e.target.value })} />
            </Field>
            <Field label="자세히 보기 링크" hint="블로그 글 주소(https://…) · 비우면 안 보여요">
              <input className={inputCls} value={k.link} placeholder="https://blog.naver.com/…" onChange={(e) => setItem("cases", i, { link: e.target.value })} />
            </Field>
          </div>
        ))}
        {c.cases.length < 8 && (
          <button
            type="button"
            className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm"
            onClick={() => set("cases", [...c.cases, { who: "", exam: "", before: "", after: "", period: "", note: "", link: "" }])}
          >
            + 사례 추가
          </button>
        )}
      </Section>

      <Section title="학원 소개">
        <Field label="제목" hint="크게 보이는 첫 문장">
          <input className={inputCls} value={c.about.headline} onChange={(e) => set("about", { ...c.about, headline: e.target.value })} />
        </Field>
        <Field label="부제">
          <input className={inputCls} value={c.about.subtitle} onChange={(e) => set("about", { ...c.about, subtitle: e.target.value })} />
        </Field>
        <Field label="본문" hint="문단 사이는 한 줄 비우기(엔터 두 번)">
          <textarea className={areaCls + " h-48"} value={c.about.body} onChange={(e) => set("about", { ...c.about, body: e.target.value })} />
        </Field>
        <Field label="강조 문장" hint="본문 아래 빨간 글씨로 크게 · 비우면 안 보여요">
          <input className={inputCls} value={c.about.highlight} onChange={(e) => set("about", { ...c.about, highlight: e.target.value })} />
        </Field>
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
              <Field label="강조 문구" hint="예: 고등 선행 포함 · 카드에 빨간 띠로 크게 · 비우면 안 보여요">
                <input className={inputCls} value={p.point} onChange={(e) => setItem("programs", i, { point: e.target.value })} />
              </Field>
              <Field label="교습비 (카드에 크게)" hint="비워 두면 카드에는 안 보이고 맨 아래 게시표에만 나와요">
                <input className={inputCls} value={p.fee} onChange={(e) => setItem("programs", i, { fee: e.target.value })} />
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
            onClick={() => set("programs", [...c.programs, { badge: "", highlight: false, title: "", body: "", point: "", schedule: "", fee: "", enrolled: 0, capacity: 0 }])}
          >
            + 과정 추가
          </button>
        )}
      </Section>

      <Section title="교습비 안내 (교습비 등 게시표)">
        <p className="-mt-2 text-sm text-muted">교육청에 등록한 값 그대로 적어 주세요. 법적으로 홈페이지에 표시해야 해서, 사이트 맨 아래에 작은 글씨로 보여요.</p>
        {c.tuition.rows.map((t, i) => (
          <div key={i} className="grid gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <Field label="교습과목">
              <input className={inputCls} value={t.subject} onChange={(e) => set("tuition", { ...c.tuition, rows: c.tuition.rows.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)) })} />
            </Field>
            <Field label="횟수">
              <input className={inputCls} value={t.schedule} onChange={(e) => set("tuition", { ...c.tuition, rows: c.tuition.rows.map((x, j) => (j === i ? { ...x, schedule: e.target.value } : x)) })} />
            </Field>
            <Field label="총 교습시간">
              <input className={inputCls} value={t.minutes} onChange={(e) => set("tuition", { ...c.tuition, rows: c.tuition.rows.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)) })} />
            </Field>
            <Field label="교습비">
              <input className={inputCls} value={t.fee} onChange={(e) => set("tuition", { ...c.tuition, rows: c.tuition.rows.map((x, j) => (j === i ? { ...x, fee: e.target.value } : x)) })} />
            </Field>
            <button type="button" className="self-end rounded border border-line px-3 py-2 text-sm" onClick={() => set("tuition", { ...c.tuition, rows: c.tuition.rows.filter((_, j) => j !== i) })}>
              빼기
            </button>
          </div>
        ))}
        {c.tuition.rows.length < 10 && (
          <button
            type="button"
            className="self-start rounded border border-dashed border-ink px-4 py-2 text-sm"
            onClick={() => set("tuition", { ...c.tuition, rows: [...c.tuition.rows, { subject: "", schedule: "", minutes: "", fee: "" }] })}
          >
            + 줄 추가
          </button>
        )}
        <div className="grid gap-3 md:grid-cols-[1fr_3fr]">
          <Field label="적용일자">
            <input className={inputCls} value={c.tuition.appliedFrom} onChange={(e) => set("tuition", { ...c.tuition, appliedFrom: e.target.value })} />
          </Field>
          <Field label="안내 문구">
            <input className={inputCls} value={c.tuition.note} onChange={(e) => set("tuition", { ...c.tuition, note: e.target.value })} />
          </Field>
        </div>
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
                const r = await saveContent(c, baseAt);
                setMsg({ ok: r.ok, text: r.message });
                if (r.ok) {
                  setDirty(false);
                  if (r.savedAt) setBaseAt(r.savedAt);
                }
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
