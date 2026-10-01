import Image from "next/image";
import Header from "@/components/Header";
import AdmissionForm from "@/components/AdmissionForm";
import MapEmbed from "@/components/MapEmbed";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import PhotoSlideshow from "@/components/PhotoSlideshow";
import { getMedicStats } from "@/lib/medicStats";
import { getContent } from "@/lib/content";

// 관리자 화면에서 저장하면 즉시 갱신(revalidatePath)되고, 그 외에도 1분마다 새로 읽는다.
export const revalidate = 60;

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const wrap = "mx-auto max-w-page px-5 md:px-24";

// 수업 카드 오른쪽 위의 수강 인원 표시 (예: 3/5). 정원이 차면 "마감".
function Seats({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  const full = enrolled >= capacity;
  const left = capacity - enrolled;
  return (
    <div className="-mt-1 flex flex-col items-end leading-none" aria-label={full ? "정원 마감" : `정원 ${capacity}명 중 ${enrolled}명 수강 중`}>
      {full ? (
        <span className="rounded bg-brand px-3 py-2 font-serif text-[26px] font-black text-white md:text-[32px]">마감</span>
      ) : (
        <span className="font-serif font-black tracking-[-1px] text-ink">
          <span className="text-[40px] text-brand md:text-[52px]">{enrolled}</span>
          <span className="mx-0.5 text-[28px] text-[#B3A99C] md:text-[36px]">/</span>
          <span className="text-[28px] md:text-[36px]">{capacity}</span>
        </span>
      )}
      <span className="mt-1.5 text-xs font-semibold text-muted md:text-[13px]">{full ? `정원 ${capacity}명` : `잔여 ${left}석`}</span>
    </div>
  );
}

export default async function Home() {
  const [site, stats] = await Promise.all([getContent(), getMedicStats()]);
  const telHref = site.phone ? `tel:${site.phone.replace(/[^\d+]/g, "")}` : "";
  // 지도 검색용 주소: "…중앙로 312, 2층"에서 층수 부분은 빼야 위치를 정확히 찾는다.
  const mapQuery = site.address.split(",")[0].trim() || site.address;
  const links = [
    { label: "블로그", href: site.links.blog },
    { label: "인스타그램", href: site.links.instagram },
    { label: "카카오톡 채널", href: site.links.kakao },
  ];

  return (
    <div id="top">
      <Header blogHref={site.links.blog} />

      <main className="pb-[84px] lg:pb-0">
        {/* HERO */}
        <section className="bg-ink text-paper">
          <div className={wrap + " flex flex-col gap-6 py-12 md:py-24 lg:flex-row lg:gap-16"}>
            <div className="flex flex-1 flex-col justify-center gap-6 md:gap-8">
              <p className="hero-rise flex items-center gap-2.5 text-[13px] font-semibold tracking-[2px] text-soft md:gap-3 md:text-[15px] md:tracking-[3px]">
                <span className="h-2.5 w-2.5 bg-brand md:h-3.5 md:w-3.5" aria-hidden="true" />
                {site.tagline}
              </p>
              <h1 className="font-serif text-[44px] font-black leading-[1.22] tracking-[-1px] md:text-[76px] md:leading-[1.2] md:tracking-[-2px]">
                <span className="hero-rise block" style={{ animationDelay: "120ms" }}>
                  결심한 학생만
                </span>
                <span className="hero-rise block" style={{ animationDelay: "260ms" }}>
                  받습니다.
                </span>
              </h1>
              <p className="hero-rise max-w-[600px] text-base leading-[1.75] text-soft md:text-xl" style={{ animationDelay: "420ms" }}>
                메딕수학은 성적을 올리고 <span className="text-[#8E857A] line-through">싶은</span> 학생이 아니라,
                <br className="hidden md:inline" /> 성적을 올리기로 <b className="font-semibold text-white">결심한</b> 학생을 가르칩니다.
              </p>
              <PhotoSlideshow photos={site.heroPhotos} className="hero-rise h-[240px] rounded-md md:h-[380px] lg:hidden" />
              <div className="hero-rise flex flex-col gap-2.5 md:mt-2 md:flex-row md:gap-3" style={{ animationDelay: "560ms" }}>
                <a href="#consult" className="flex h-[54px] items-center justify-center rounded bg-brand px-[34px] font-semibold text-white hover:bg-brand-dark md:h-auto md:py-5 md:text-[17px]">
                  입학 테스트 신청
                </a>
                <a href="#admission" className="flex h-[54px] items-center justify-center rounded border-[1.5px] border-[#6E665C] px-8 font-semibold hover:border-paper md:h-auto md:py-[18.5px] md:text-[17px]">
                  입학 기준 보기
                </a>
              </div>
            </div>
            <div className="hero-rise hidden w-[500px] shrink-0 lg:block" style={{ animationDelay: "300ms" }}>
              <PhotoSlideshow photos={site.heroPhotos} className="h-full min-h-[528px] rounded-lg" />
            </div>
          </div>
        </section>

        {/* ABOUT — 학원 소개 */}
        <section id="about" className="border-b border-line bg-white">
          <div className={wrap + " grid grid-cols-1 gap-8 py-14 md:gap-12 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20"}>
            <Reveal className="flex flex-col gap-4 md:gap-6">
              <p className="eyebrow">ABOUT MEDIC MATH</p>
              <h2 className="font-serif text-[32px] font-black leading-[1.3] tracking-[-0.5px] md:text-[48px] md:leading-[1.25] md:tracking-[-1px]">
                {site.about.headline}
              </h2>
              {site.about.subtitle && (
                <p className="flex items-center gap-3 text-[15px] font-semibold text-muted md:text-[17px]">
                  <span className="h-[2px] w-6 shrink-0 bg-brand" aria-hidden="true" />
                  {site.about.subtitle}
                </p>
              )}
            </Reveal>
            <Reveal delay={150} className="flex flex-col gap-6 md:gap-8 lg:pt-10">
              <div className="flex flex-col gap-4 text-base leading-[1.85] text-ink/85 md:text-[18px]">
                {site.about.body
                  .split(/\n\s*\n/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
              </div>
              {site.about.highlight && (
                <p className="border-t-2 border-ink pt-5 font-serif text-[24px] font-bold leading-[1.4] text-brand md:pt-6 md:text-[30px]">
                  {site.about.highlight}
                </p>
              )}
            </Reveal>
          </div>
        </section>

        {/* RULES */}
        <section id="rules" className={wrap + " flex flex-col gap-7 py-14 md:gap-14 md:py-24"}>
          <Reveal className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2.5 md:gap-3.5">
              <p className="eyebrow">OUR RULES</p>
              <h2 className="section-title">
                메딕수학의<br className="md:hidden" /> 원칙
              </h2>
            </div>
            <p className="text-[15px] leading-[1.7] text-muted md:max-w-[440px] md:text-[17px]">
              편하게 다니는 학원이 아닙니다. 대신, 끝까지 따라온 학생은 반드시 결과로 보답받습니다.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8">
            {site.rules.map((r, i) => (
              <Reveal key={i} delay={i * 120} className="flex gap-4 border-t-2 border-ink pt-[18px] md:flex-col md:gap-3.5 md:border-t-[3px] md:pt-7">
                <span className="font-serif text-[30px] font-black leading-none text-brand md:text-[44px]">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-1.5 md:gap-3.5">
                  <h3 className="text-[19px] font-semibold md:text-[25px]">{r.title}</h3>
                  <p className="text-sm leading-[1.7] text-muted md:text-base md:leading-[1.75]">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ADMISSION */}
        <section id="admission" className="bg-sand">
          <div className={wrap + " flex flex-col gap-6 py-14 md:gap-10 md:py-24 lg:flex-row lg:gap-[72px]"}>
            <Reveal className="flex flex-col gap-2.5 lg:w-[440px] lg:shrink-0 md:gap-[22px]">
              <p className="eyebrow">ADMISSION</p>
              <h2 className="section-title">
                아무나<br className="hidden md:inline" /> 받지 않습니다
              </h2>
              <p className="text-[15px] leading-[1.7] text-muted md:text-[17px] md:leading-[1.75]">
                실력보다 의지를 봅니다. 지금 점수가 낮아도 괜찮습니다. 공부할 각오가 되어 있는지, 그것만 확인합니다.
              </p>
            </Reveal>
            <ol className="grid flex-1 grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-5">
              {site.steps.map((s, i) => {
                const last = i === site.steps.length - 1;
                return (
                  <Reveal
                    as="li"
                    key={i}
                    delay={i * 110}
                    className={
                      "flex gap-4 rounded-md p-5 md:flex-col md:gap-2.5 md:rounded-lg md:p-8 " +
                      (last ? "bg-ink text-paper" : "bg-white")
                    }
                  >
                    <span className={"w-[52px] shrink-0 pt-[3px] text-[13px] font-semibold md:w-auto md:pt-0 md:text-sm " + (last ? "text-brand-light" : "text-brand")}>
                      STEP {i + 1}
                    </span>
                    <div className="flex flex-col gap-1 md:gap-2.5">
                      <h3 className="text-lg font-semibold md:text-[22px]">{s.title}</h3>
                      <p className={"text-sm md:text-[15px] md:leading-[1.7] " + (last ? "text-soft" : "text-muted")}>{s.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className={wrap + " flex flex-col gap-6 py-14 md:gap-11 md:pb-[72px] md:pt-24"}>
          <Reveal className="flex flex-col gap-2.5 md:gap-3.5">
            <p className="eyebrow">PROGRAMS</p>
            <h2 className="section-title">수업 안내</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {site.programs.map((p, i) => (
              <Reveal as="article" key={i} delay={i * 120} className="flex flex-col gap-3 rounded-md border border-line bg-white p-6 md:min-h-[300px] md:gap-4 md:rounded-lg md:p-9">
                <div className="flex items-start justify-between gap-3">
                  <span className={"self-start rounded-sm px-2.5 py-[5px] text-[13px] font-semibold text-white md:px-3 md:py-1.5 md:text-sm " + (p.highlight ? "bg-brand" : "bg-ink")}>
                    {p.badge}
                  </span>
                  {p.capacity > 0 && <Seats enrolled={p.enrolled} capacity={p.capacity} />}
                </div>
                <h3 className="text-xl font-semibold md:text-[26px]">{p.title}</h3>
                {p.point && (
                  <p className="flex items-center gap-2 self-start rounded-sm border-2 border-brand bg-brand/5 px-3 py-1.5 text-[15px] font-bold text-brand md:text-[17px]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7z" /></svg>
                    {p.point}
                  </p>
                )}
                <p className="flex-1 text-sm leading-[1.7] text-muted md:text-base">{p.body}</p>
                {p.fee && (
                  <p className="flex items-baseline justify-between gap-3 text-sm text-muted md:text-[15px]">
                    교습비
                    <span className="font-serif text-xl font-black text-ink md:text-2xl">{p.fee}</span>
                  </p>
                )}
                <div className="flex items-center justify-between border-t border-line pt-3 text-sm text-muted md:pt-4 md:text-[15px]">
                  <span>{p.schedule}</span>
                  <a href="#consult" className="py-3 font-semibold text-ink hover:text-brand md:py-0">
                    상담하기 →
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* MEDICCHART — 학습 관리 시스템 홍보 */}
        <section id="medicchart" className="overflow-hidden bg-ink text-paper">
          <div className={wrap + " flex flex-col gap-10 py-16 md:gap-16 md:py-28"}>
            <Reveal className="flex max-w-[820px] flex-col gap-4 md:gap-6">
              <p className="text-xs font-semibold tracking-[3px] text-brand-light md:text-sm">MEDIC CHART</p>
              <h2 className="font-serif text-[32px] font-black leading-[1.28] tracking-[-0.5px] md:text-[56px] md:leading-[1.2] md:tracking-[-1.5px]">
                시험이 끝나면,
                <br />
                숫자로 보여 드립니다.
              </h2>
              <p className="text-base leading-[1.8] text-soft md:text-xl">
                메딕차트는 메딕수학이 직접 만든 학습 관리 시스템입니다. 학교 기출을 한 문제씩 직접 풀어 영역·단원·난이도를
                붙여 두고, 학생이 시험을 보면 어디서 점수가 새는지 바로 찾아냅니다.
              </p>
            </Reveal>

            {stats && (
              <Reveal delay={100} className="grid grid-cols-1 gap-6 border-y border-[#3A362F] py-8 sm:grid-cols-3 md:py-10">
                <div className="flex flex-col gap-2">
                  <p className="font-serif text-[44px] font-black leading-none md:text-[64px]">
                    <CountUp value={stats.exams} />
                    <span className="ml-1 text-[22px] text-soft md:text-[28px]">개</span>
                  </p>
                  <p className="text-sm text-soft md:text-base">직접 풀어 정리한 학교 기출 시험지</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-serif text-[44px] font-black leading-none md:text-[64px]">
                    <CountUp value={stats.items} />
                    <span className="ml-1 text-[22px] text-soft md:text-[28px]">문항</span>
                  </p>
                  <p className="text-sm text-soft md:text-base">하나하나 영역·난이도를 붙인 문항</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-serif text-[44px] font-black leading-none text-brand-light md:text-[64px]">
                    <CountUp value={stats.jejuExams} />
                    <span className="ml-1 text-[22px] text-soft md:text-[28px]">개</span>
                  </p>
                  <p className="text-sm text-soft md:text-base">그중 제주 학교 시험</p>
                </div>
              </Reveal>
            )}

            {/* 메딕차트가 다른 점 — 실제로 운영 중인 기능만 적는다 */}
            <div className="flex flex-col gap-8 md:gap-12">
              <Reveal className="flex flex-col gap-3 md:gap-4">
                <p className="text-xs font-semibold tracking-[3px] text-brand-light md:text-sm">WHAT&apos;S DIFFERENT</p>
                <h3 className="font-serif text-[26px] font-black leading-[1.35] md:text-[40px]">메딕차트가 다른 다섯 가지</h3>
              </Reveal>
              <ol className="flex flex-col">
                {[
                  {
                    t: "문제집이 아니라, 우리 학교 시험지에서 시작합니다",
                    d: "제주 학교들의 실제 기출을 한 문제씩 직접 풀어 영역·단원·난이도를 붙여 둡니다. 난이도는 정답률로 짐작한 값이 아니라 메딕수학이 직접 풀어 보고 매긴 값입니다.",
                    tags: [stats ? `제주 학교 시험 ${stats.jejuExams}개` : "제주 학교 기출", "문항마다 영역·단원·난이도", "새 시험이 들어오면 바로 반영"],
                  },
                  {
                    t: "해설도 검증을 거쳐야 학생에게 갑니다",
                    d: "제주대 의대·수의대·약대 재학생으로 꾸린 검토단이 문항을 각자 따로 풀어 정답을 맞춰 봅니다. 답이 갈리면 한 사람이 더 풀어 다수결로 정하고, 그래도 다르면 원장님이 직접 판정합니다. 틀린 해설로 공부하는 일을 막기 위해서입니다.",
                    tags: ["제주대 의대·수의대·약대 검토단", "따로 풀어 대조", "갈리면 다수결", "최종 판정은 원장님"],
                  },
                  {
                    t: "찍어서 맞힌 점수는 빼고 봅니다",
                    d: "학생이 답안을 낼 때 찍은 문제를 표시합니다. 찍어서 맞힌 배점을 뺀 '실질 점수'로 진짜 실력을 보고, 찍어서 맞힌 문제는 풀이로 다시 확인하게 합니다.",
                    tags: ["점수 / 실질 점수", "찍은 문제 따로 표시"],
                  },
                  {
                    t: "시험이 쌓일수록 약점이 또렷해집니다",
                    d: "시험 결과가 학생별로 쌓여 성적 추이, 두 번 이상 반복해서 놓친 '약점 단원', 그중 쉬운데 놓친 문항부터 고른 '다시 풀 문항'을 자동으로 찾아냅니다.",
                    tags: ["성적 추이 그래프", "약점 단원", "다시 풀 문항 최대 10개"],
                  },
                  {
                    t: "약점에 맞춘 복습지를 바로 만듭니다",
                    d: "다시 풀 문항으로 복습지를 만들고, 약한 단원은 정리된 기출 문항 중 비슷한 문제를 찾아 맞춤 시험지로 묶습니다. 정답·해설지도 함께 나옵니다.",
                    tags: ["맞춤 복습지", "비슷한 기출 찾기", "정답·해설지 포함"],
                  },
                ].map((f, i) => (
                  <Reveal
                    as="li"
                    key={f.t}
                    delay={i * 90}
                    className="grid grid-cols-[40px_1fr] gap-x-4 gap-y-3 border-t border-[#3A362F] py-6 md:grid-cols-[72px_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-x-8 md:py-8"
                  >
                    <span className="font-serif text-2xl font-black leading-none text-brand-light md:text-[40px]">{i + 1}</span>
                    <h4 className="text-lg font-semibold leading-[1.45] md:text-[22px]">{f.t}</h4>
                    <div className="col-start-2 flex flex-col gap-3 md:col-start-3 md:row-start-1">
                      <p className="text-sm leading-[1.8] text-soft md:text-base">{f.d}</p>
                      <ul className="flex flex-wrap gap-2">
                        {f.tags.map((g) => (
                          <li key={g} className="rounded-full border border-[#4A453D] px-3 py-1 text-xs text-paper/80 md:text-[13px]">
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
                {[
                  { t: "개별 성적 보고서", d: "영역·단원·난이도별 결과를 한 장에. 몇 점인지보다 어디서 놓쳤는지를 봅니다." },
                  { t: "전체 해설지", d: "시험마다 모든 문항의 정답과 풀이. 찍어서 맞힌 문제까지 다시 확인합니다." },
                  { t: "누적 학생 보고서", d: "여러 시험을 묶어 성적 추이·약점 단원·다시 풀 문항과 선생님 의견을 한 권으로 정리합니다." },
                  { t: "입학 진단 보고서", d: "입학 테스트도 학교 기출로 난이도를 고르게 섞어 출제하고, 결과를 심화·표준·기초로 진단합니다." },
                ].map((f, i) => (
                  <Reveal as="li" key={f.t} delay={i * 110} className="flex flex-col gap-2 border-t border-[#3A362F] pt-5">
                    <span className="font-serif text-lg font-black text-brand-light">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-lg font-semibold md:text-xl">{f.t}</h3>
                    <p className="text-sm leading-[1.75] text-soft md:text-[15px]">{f.d}</p>
                  </Reveal>
                ))}
              </ul>

              {/* 보고서 모양 그림 (실제 학생 자료가 아닌 예시) */}
              <Reveal delay={200} className="relative">
                <div className="rounded-xl bg-paper p-6 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] md:p-8">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold tracking-[2px] text-brand">MEDIC CHART REPORT</span>
                      <span className="text-lg font-semibold">영역별 결과</span>
                    </div>
                    <span className="rounded bg-sand px-2 py-1 text-xs text-muted">예시 화면</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-5">
                    <div className="rounded-lg border border-line px-4 py-3">
                      <p className="text-xs text-muted">점수</p>
                      <p className="font-serif text-2xl font-black">86</p>
                    </div>
                    <div className="rounded-lg border border-brand/40 bg-brand/5 px-4 py-3">
                      <p className="text-xs text-brand">실질 점수 · 찍어서 맞힘 2문항</p>
                      <p className="font-serif text-2xl font-black text-brand">78</p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-4 pt-5">
                    {[
                      { a: "영역 A", w: 92 },
                      { a: "영역 B", w: 78 },
                      { a: "영역 C", w: 54, weak: true },
                      { a: "영역 D", w: 85 },
                    ].map((r) => (
                      <li key={r.a} className="flex items-center gap-3 text-sm">
                        <span className="w-14 shrink-0 text-muted">{r.a}</span>
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand">
                          <span
                            className={"bar-grow block h-full rounded-full " + (r.weak ? "bg-brand" : "bg-ink")}
                            style={{ width: `${r.w}%` }}
                          />
                        </span>
                        <span className={"w-16 shrink-0 text-right text-xs font-semibold " + (r.weak ? "text-brand" : "text-muted")}>
                          {r.weak ? "다시 볼 단원" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-lg bg-sand p-4 text-sm leading-[1.7]">
                    <b className="font-semibold">다음 시험까지</b> — 놓친 단원부터, 쉬운 문항을 놓친 순서대로 다시 풉니다.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* CASES — 성적 향상 사례 */}
        <section id="cases" className={wrap + " flex flex-col gap-8 py-16 md:gap-12 md:py-24"}>
          <Reveal className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2.5 md:gap-3.5">
              <p className="eyebrow">RESULTS</p>
              <h2 className="section-title">성적 향상 사례</h2>
            </div>
            <p className="text-[15px] leading-[1.7] text-muted md:max-w-[440px] md:text-[17px]">
              결심한 학생들이 실제로 만든 변화입니다.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {site.cases.map((c, i) => (
              <Reveal as="article" key={i} delay={i * 120} className="flex flex-col gap-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{c.who}</span>
                  <span className="text-muted">{c.exam}</span>
                </div>
                {(c.before || c.after) && (
                  <div className="flex flex-wrap items-end gap-x-3 gap-y-2 font-serif md:gap-x-4">
                    {c.before && (
                      <span className={"font-bold leading-tight text-[#B3A99C] " + (c.before.length > 5 ? "text-[19px] md:text-[21px]" : "text-[26px] leading-none md:text-[30px]")}>{c.before}</span>
                    )}
                    {c.after && (
                      <span className="flex items-end gap-3 md:gap-4">
                        {c.before && (
                          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1 shrink-0 text-ink" aria-label="에서">
                            <path d="M2 10h22M17 3l7 7-7 7" />
                          </svg>
                        )}
                        <span className={"font-black leading-none text-brand " + (c.after.length > 5 ? "text-[30px] md:text-[34px]" : "text-[40px] md:text-[48px]")}>{c.after}</span>
                      </span>
                    )}
                  </div>
                )}
                {c.period && <span className="self-start rounded-full bg-sand px-3 py-1 text-xs font-semibold text-muted">{c.period}</span>}
                {c.note && <p className="text-sm leading-[1.7] text-muted md:text-[15px]">{c.note}</p>}
                {c.link && (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className="mt-auto self-start text-sm font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:text-brand">
                    자세히 보기 →
                  </a>
                )}
              </Reveal>
            ))}
          </div>
          {site.links.blog && (
            <a
              href={site.links.blog}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start text-[15px] font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 hover:text-brand md:text-base"
            >
              더 많은 사례와 공부법은 메딕수학 블로그에서 →
            </a>
          )}
        </section>

        {/* TEACHERS */}
        <section id="teachers" className={wrap + " flex flex-col gap-6 pb-14 pt-4 md:gap-11 md:pb-20 md:pt-16"}>
          <Reveal className="flex flex-col gap-2.5 md:gap-3.5">
            <p className="eyebrow">TEACHERS</p>
            <h2 className="section-title">강사진</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {site.teachers.map((t, i) => (
              <Reveal key={i} delay={i * 120} className="flex gap-4 rounded-md border border-line bg-white p-4 md:gap-5 md:rounded-lg md:p-6">
                {t.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photo} alt={t.name} className="h-[110px] w-[88px] shrink-0 rounded object-cover md:h-[180px] md:w-[140px]" />
                ) : (
                  <div className="placeholder-box h-[110px] w-[88px] shrink-0 rounded border-[#BDB4A7] bg-sand text-[13px] text-[#6E665C] md:h-[180px] md:w-[140px] md:text-sm">
                    [사진]
                  </div>
                )}
                <div className="flex flex-col gap-1.5 pt-1 md:gap-2.5">
                  <p className="text-lg font-semibold md:text-[21px]">{t.name}</p>
                  <p className="text-sm leading-[1.6] text-muted md:text-[15px] md:leading-[1.7]">
                    {t.grades}
                    <br />
                    {t.career}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CONSULT + LOCATION */}
        <section className={wrap + " flex flex-col gap-6 py-14 md:gap-12 md:py-24 lg:flex-row"}>
          <div id="consult" className="flex flex-1 flex-col gap-[18px] md:gap-[22px] md:rounded-lg md:border md:border-line md:bg-white md:p-12">
            <h2 className="font-serif text-[30px] font-bold md:text-4xl">입학 테스트 신청</h2>
            <p className="text-[15px] leading-[1.7] text-muted md:text-base">
              신청은 학생 본인의 결심에서 시작됩니다. 남겨 주시면 {site.replyWithin} 안에 연락드립니다.
            </p>
            <AdmissionForm privacyRetention={site.privacyRetention} />
          </div>

          <div id="location" className="flex flex-col gap-4 pt-6 lg:w-[480px] lg:shrink-0 md:gap-5 md:pt-0">
            <h2 className="text-xl font-semibold md:hidden">오시는 길</h2>
            {/* 지도: 키 없이 쓰는 구글 지도 임베드. 주소(층수 제외)로 위치를 찾으므로 관리자 화면에서 주소를 바꾸면 지도도 따라 바뀐다. */}
            <div className="overflow-hidden rounded-md border border-line bg-sand md:rounded-lg lg:flex-1">
              <MapEmbed
                title={`메딕수학 위치 지도 — ${site.address}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=ko&z=17&output=embed`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={site.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center rounded border border-ink text-sm font-semibold hover:bg-sand"
              >
                네이버 지도로 길찾기
              </a>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center rounded border border-ink text-sm font-semibold hover:bg-sand"
              >
                카카오맵으로 길찾기
              </a>
            </div>
            <div className="flex flex-col gap-2.5 text-[15px] leading-[1.6] md:gap-3 md:text-base">
              <p className="hidden text-xl font-semibold md:block">오시는 길</p>
              <p className="flex gap-2.5"><PinIcon />{site.address}</p>
              <p className="flex gap-2.5">
                <PhoneIcon />
                {site.phone ? <a href={telHref}>{site.phone}</a> : "[전화번호]"}
              </p>
              <p className="flex gap-2.5"><ClockIcon />{site.hours}</p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-white pb-[84px] lg:pb-0">
        <div className={wrap + " flex flex-col gap-4 py-8 text-[13px] leading-[1.8] text-muted md:flex-row md:items-start md:justify-between md:py-12 md:text-sm"}>
          <div className="flex flex-col gap-3.5">
            <Image src="/logo.png" alt="메딕수학 MEDIC MATH ACADEMY" width={179} height={36} className="h-7 w-auto self-start object-contain md:h-9" />
            <p>
              {site.address} · {site.phone || "[전화번호]"}
              <br />
              대표 {site.business.owner} · 사업자등록번호 {site.business.bizNo} · 학원등록번호 {site.business.academyNo}
            </p>
            {/* 교습비 등 게시: 학원법상 인터넷 광고(홈페이지)에도 교습비·등록번호·교습과목을 전부 표시해야 함 — 눈에 띄지 않게 하단에 작게 */}
            {site.tuition.rows.length > 0 && (
              <div id="tuition" className="flex flex-col gap-1 text-xs leading-[1.7] text-[#9A9186] md:text-[13px]">
                <p>
                  교습비 등 게시 (교육청 등록번호 {site.business.academyNo}
                  {site.tuition.appliedFrom && <>, {site.tuition.appliedFrom} 적용</>})
                </p>
                <ul>
                  {site.tuition.rows.map((t, i) => (
                    <li key={i}>
                      {t.subject} · {t.schedule} · 총 {t.minutes.replace(/^총\s*/, "")} · 교습비 {t.fee}
                    </li>
                  ))}
                </ul>
                {site.tuition.note && <p>{site.tuition.note}</p>}
              </div>
            )}
          </div>
          <div className="flex gap-5 md:gap-6">
            {links.map((l) =>
              l.href ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  {l.label}
                </a>
              ) : (
                <span key={l.label}>{l.label}</span>
              ),
            )}
          </div>
        </div>
      </footer>

      {/* 모바일 하단 고정 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-line bg-white px-5 pb-5 pt-3 lg:hidden">
        {telHref ? (
          <a href={telHref} className="flex h-[52px] w-[104px] items-center justify-center rounded border-[1.5px] border-ink font-semibold">
            전화
          </a>
        ) : (
          <a href="#location" className="flex h-[52px] w-[104px] items-center justify-center rounded border-[1.5px] border-ink font-semibold">
            오시는 길
          </a>
        )}
        <a href="#consult" className="flex h-[52px] flex-1 items-center justify-center rounded bg-brand font-semibold text-white">
          입학 테스트 신청
        </a>
      </div>
    </div>
  );
}
