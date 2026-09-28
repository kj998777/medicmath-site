import Image from "next/image";
import Header from "@/components/Header";
import AdmissionForm from "@/components/AdmissionForm";
import { getContent } from "@/lib/content";

// 관리자 화면에서 저장하면 즉시 갱신(revalidatePath)되고, 그 외에도 5분마다 새로 읽는다.
export const revalidate = 300;

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
  const site = await getContent();
  const telHref = site.phone ? `tel:${site.phone.replace(/[^\d+]/g, "")}` : "";
  const links = [
    { label: "블로그", href: site.links.blog },
    { label: "인스타그램", href: site.links.instagram },
    { label: "카카오톡 채널", href: site.links.kakao },
  ];

  return (
    <div id="top">
      <Header />

      <main className="pb-[84px] lg:pb-0">
        {/* HERO */}
        <section className="bg-ink text-paper">
          <div className={wrap + " flex flex-col gap-6 py-12 md:py-24 lg:flex-row lg:gap-16"}>
            <div className="flex flex-1 flex-col justify-center gap-6 md:gap-8">
              <p className="flex items-center gap-2.5 text-[13px] font-semibold tracking-[2px] text-soft md:gap-3 md:text-[15px] md:tracking-[3px]">
                <span className="h-2.5 w-2.5 bg-brand md:h-3.5 md:w-3.5" aria-hidden="true" />
                {site.tagline}
              </p>
              <h1 className="font-serif text-[44px] font-black leading-[1.22] tracking-[-1px] md:text-[76px] md:leading-[1.2] md:tracking-[-2px]">
                결심한 학생만
                <br />
                받습니다.
              </h1>
              <p className="max-w-[600px] text-base leading-[1.75] text-soft md:text-xl">
                메딕수학은 성적을 올리고 <span className="text-[#8E857A] line-through">싶은</span> 학생이 아니라,
                <br className="hidden md:inline" /> 성적을 올리기로 <b className="font-semibold text-white">결심한</b> 학생을 가르칩니다.
              </p>
              {site.heroPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.heroPhoto} alt="메딕수학 자습실·수업 모습" className="h-[220px] w-full rounded-md object-cover md:h-[360px] lg:hidden" />
              ) : (
                <div className="placeholder-box h-[220px] rounded-md border-[#5A534A] bg-[#2A2722] text-[#9A9186] md:h-[360px] lg:hidden">
                  [자습실 · 수업 사진]
                </div>
              )}
              <div className="flex flex-col gap-2.5 md:mt-2 md:flex-row md:gap-3">
                <a href="#consult" className="flex h-[54px] items-center justify-center rounded bg-brand px-[34px] font-semibold text-white hover:bg-brand-dark md:h-auto md:py-5 md:text-[17px]">
                  입학 테스트 신청
                </a>
                <a href="#admission" className="flex h-[54px] items-center justify-center rounded border-[1.5px] border-[#6E665C] px-8 font-semibold hover:border-paper md:h-auto md:py-[18.5px] md:text-[17px]">
                  입학 기준 보기
                </a>
              </div>
            </div>
            {site.heroPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.heroPhoto} alt="메딕수학 자습실·수업 모습" className="hidden w-[500px] shrink-0 rounded-lg object-cover lg:block lg:min-h-[528px]" />
            ) : (
              <div className="placeholder-box hidden w-[500px] shrink-0 rounded-lg border-[#5A534A] bg-[#2A2722] text-[#9A9186] lg:flex lg:min-h-[528px]">
                [자습실 · 수업 사진]
              </div>
            )}
          </div>
        </section>

        {/* RULES */}
        <section id="rules" className={wrap + " flex flex-col gap-7 py-14 md:gap-14 md:py-24"}>
          <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2.5 md:gap-3.5">
              <p className="eyebrow">OUR RULES</p>
              <h2 className="section-title">
                메딕수학의<br className="md:hidden" /> 원칙
              </h2>
            </div>
            <p className="text-[15px] leading-[1.7] text-muted md:max-w-[440px] md:text-[17px]">
              편하게 다니는 학원이 아닙니다. 대신, 끝까지 따라온 학생은 반드시 결과로 보답받습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-8">
            {site.rules.map((r, i) => (
              <div key={i} className="flex gap-4 border-t-2 border-ink pt-[18px] md:flex-col md:gap-3.5 md:border-t-[3px] md:pt-7">
                <span className="font-serif text-[30px] font-black leading-none text-brand md:text-[44px]">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-1.5 md:gap-3.5">
                  <h3 className="text-[19px] font-semibold md:text-[25px]">{r.title}</h3>
                  <p className="text-sm leading-[1.7] text-muted md:text-base md:leading-[1.75]">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ADMISSION */}
        <section id="admission" className="bg-sand">
          <div className={wrap + " flex flex-col gap-6 py-14 md:gap-10 md:py-24 lg:flex-row lg:gap-[72px]"}>
            <div className="flex flex-col gap-2.5 lg:w-[440px] lg:shrink-0 md:gap-[22px]">
              <p className="eyebrow">ADMISSION</p>
              <h2 className="section-title">
                아무나<br className="hidden md:inline" /> 받지 않습니다
              </h2>
              <p className="text-[15px] leading-[1.7] text-muted md:text-[17px] md:leading-[1.75]">
                실력보다 의지를 봅니다. 지금 점수가 낮아도 괜찮습니다. 공부할 각오가 되어 있는지, 그것만 확인합니다.
              </p>
            </div>
            <ol className="grid flex-1 grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-5">
              {site.steps.map((s, i) => {
                const last = i === site.steps.length - 1;
                return (
                  <li
                    key={i}
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
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className={wrap + " flex flex-col gap-6 py-14 md:gap-11 md:pb-[72px] md:pt-24"}>
          <div className="flex flex-col gap-2.5 md:gap-3.5">
            <p className="eyebrow">PROGRAMS</p>
            <h2 className="section-title">수업 안내</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {site.programs.map((p, i) => (
              <article key={i} className="flex flex-col gap-3 rounded-md border border-line bg-white p-6 md:min-h-[300px] md:gap-4 md:rounded-lg md:p-9">
                <div className="flex items-start justify-between gap-3">
                  <span className={"self-start rounded-sm px-2.5 py-[5px] text-[13px] font-semibold text-white md:px-3 md:py-1.5 md:text-sm " + (p.highlight ? "bg-brand" : "bg-ink")}>
                    {p.badge}
                  </span>
                  {p.capacity > 0 && <Seats enrolled={p.enrolled} capacity={p.capacity} />}
                </div>
                <h3 className="text-xl font-semibold md:text-[26px]">{p.title}</h3>
                <p className="flex-1 text-sm leading-[1.7] text-muted md:text-base">{p.body}</p>
                <div className="flex items-center justify-between border-t border-line pt-3 text-sm text-muted md:pt-4 md:text-[15px]">
                  <span>{p.schedule}</span>
                  <a href="#consult" className="py-3 font-semibold text-ink hover:text-brand md:py-0">
                    상담하기 →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* TEACHERS */}
        <section id="teachers" className={wrap + " flex flex-col gap-6 pb-14 pt-4 md:gap-11 md:pb-20 md:pt-16"}>
          <div className="flex flex-col gap-2.5 md:gap-3.5">
            <p className="eyebrow">TEACHERS</p>
            <h2 className="section-title">강사진</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {site.teachers.map((t, i) => (
              <div key={i} className="flex gap-4 rounded-md border border-line bg-white p-4 md:gap-5 md:rounded-lg md:p-6">
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
              </div>
            ))}
          </div>
        </section>

        {/* REVIEWS */}
        <section className="bg-ink text-paper">
          <div className={wrap + " flex flex-col gap-6 py-14 md:gap-10 md:py-20"}>
            <h2 className="font-serif text-[28px] font-bold leading-[1.35] md:text-[40px]">
              버텨낸 학생들의<br className="md:hidden" /> 이야기
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {site.reviews.map((r, i) => (
                <figure key={i} className="flex flex-col gap-2.5 border-t border-[#5A534A] pt-[18px] md:min-h-[160px] md:gap-[18px] md:pt-6">
                  <blockquote className="flex-1 text-base leading-[1.7] md:text-lg md:leading-[1.75]">{r.quote}</blockquote>
                  <figcaption className="text-[13px] text-[#B3A99C] md:text-sm">{r.who}</figcaption>
                </figure>
              ))}
            </div>
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
            <a
              href={site.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="placeholder-box h-[220px] rounded-md border-[#BDB4A7] bg-sand text-[#6E665C] hover:text-ink md:h-[320px] lg:h-auto lg:min-h-[360px] lg:flex-1 md:rounded-lg"
            >
              지도에서 보기 — {site.address}
            </a>
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
            <Image src="/logo.png" alt="메딕수학 MEDIC MATH ACADEMY" width={179} height={36} className="h-7 w-auto md:h-9" />
            <p>
              {site.address} · {site.phone || "[전화번호]"}
              <br />
              대표 {site.business.owner} · 사업자등록번호 {site.business.bizNo} · 학원등록번호 {site.business.academyNo}
            </p>
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
