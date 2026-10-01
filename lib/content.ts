import "server-only";
import { createClient } from "@supabase/supabase-js";
import { defaultContent, type SiteContent } from "@/lib/site";

// 관리자 화면 입력값 → 사이트에 쓰는 형태로 정리하는 함수.
// 서버 액션에서 저장 전에, 공개 페이지에서 읽은 뒤에 모두 이 함수를 거친다.
// (모양이 틀린 값·너무 긴 값·허용되지 않은 사진 주소는 버리고 기본값으로 채운다.)

const MAX = { short: 80, mid: 200, long: 1000 };
const LIMITS = { rules: 6, steps: 8, programs: 8, teachers: 12, reviews: 12 };

function str(v: unknown, fallback: string, max: number): string {
  if (typeof v !== "string") return fallback;
  return v.trim().slice(0, max);
}

function count(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(999, Math.max(0, Math.floor(n))) : 0;
}

function httpUrl(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  const s = v.trim().slice(0, max);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

// 사진은 우리 Supabase 저장소(site-images 버킷)의 공개 주소만 허용한다.
export function imageUrlPrefix(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return base ? `${base.replace(/\/$/, "")}/storage/v1/object/public/site-images/` : "";
}

function photo(v: unknown): string {
  if (typeof v !== "string") return "";
  const prefix = imageUrlPrefix();
  const s = v.trim();
  return prefix && s.startsWith(prefix) && s.length < 600 ? s : "";
}

function list<T>(v: unknown, limit: number, fallback: T[], map: (x: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(v)) return fallback;
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .slice(0, limit)
    .map(map);
}

export function sanitizeContent(raw: unknown): SiteContent {
  const d = defaultContent;
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const biz = (r.business && typeof r.business === "object" ? r.business : {}) as Record<string, unknown>;
  const links = (r.links && typeof r.links === "object" ? r.links : {}) as Record<string, unknown>;

  const about = (r.about && typeof r.about === "object" ? r.about : {}) as Record<string, unknown>;

  return {
    about: {
      headline: str(about.headline, d.about.headline, MAX.mid),
      subtitle: str(about.subtitle, d.about.subtitle, MAX.mid),
      body: str(about.body, d.about.body, 2000),
      highlight: str(about.highlight, d.about.highlight, MAX.mid),
    },
    tagline: str(r.tagline, d.tagline, MAX.short),
    phone: str(r.phone, d.phone, 20).replace(/[^\d\-+() ]/g, ""),
    hours: str(r.hours, d.hours, MAX.mid),
    replyWithin: str(r.replyWithin, d.replyWithin, MAX.short),
    address: str(r.address, d.address, MAX.mid),
    mapUrl: httpUrl(r.mapUrl) || d.mapUrl,
    heroPhoto: photo(r.heroPhoto),
    heroPhotos: (() => {
      const arr = Array.isArray(r.heroPhotos) ? r.heroPhotos.map(photo).filter(Boolean).slice(0, 10) : [];
      // 예전에 1장만 저장해 둔 경우에도 슬라이드 첫 장으로 이어 쓴다.
      if (arr.length === 0 && photo(r.heroPhoto)) arr.push(photo(r.heroPhoto));
      return arr;
    })(),
    privacyRetention: str(r.privacyRetention, d.privacyRetention, MAX.short),
    business: {
      owner: str(biz.owner, d.business.owner, MAX.short),
      bizNo: str(biz.bizNo, d.business.bizNo, MAX.short),
      academyNo: str(biz.academyNo, d.business.academyNo, MAX.short),
    },
    links: { blog: httpUrl(links.blog), instagram: httpUrl(links.instagram), kakao: httpUrl(links.kakao) },
    rules: list(r.rules, LIMITS.rules, d.rules, (x) => ({ title: str(x.title, "", MAX.short), body: str(x.body, "", MAX.long) })),
    steps: list(r.steps, LIMITS.steps, d.steps, (x) => ({ title: str(x.title, "", MAX.short), body: str(x.body, "", MAX.mid) })),
    programs: list(r.programs, LIMITS.programs, d.programs, (x) => ({
      badge: str(x.badge, "", 30),
      highlight: x.highlight === true,
      title: str(x.title, "", MAX.short),
      body: str(x.body, "", MAX.long),
      schedule: str(x.schedule, "", MAX.short),
      enrolled: count(x.enrolled),
      capacity: count(x.capacity),
    })),
    teachers: list(r.teachers, LIMITS.teachers, d.teachers, (x) => ({
      name: str(x.name, "", MAX.short),
      grades: str(x.grades, "", MAX.short),
      career: str(x.career, "", MAX.long),
      photo: photo(x.photo),
    })),
    cases: list(r.cases, 8, d.cases, (x) => ({
      who: str(x.who, "", MAX.short),
      exam: str(x.exam, "", MAX.short),
      before: str(x.before, "", 20),
      after: str(x.after, "", 20),
      period: str(x.period, "", 30),
      note: str(x.note, "", MAX.mid),
      link: httpUrl(x.link),
    })),
    reviews: list(r.reviews, LIMITS.reviews, d.reviews, (x) => ({ quote: str(x.quote, "", MAX.long), who: str(x.who, "", MAX.short) })),
  };
}

// 공개 페이지용: 로그인 없이(anon) site_content를 읽는다. 실패하면 기본값.
export async function getContent(): Promise<SiteContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return defaultContent;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.from("site_content").select("data").eq("id", "main").maybeSingle();
    if (error || !data) return defaultContent;
    return sanitizeContent(data.data);
  } catch {
    return defaultContent;
  }
}
