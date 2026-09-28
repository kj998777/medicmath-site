// 사이트에 들어가는 학원 정보의 "기본값".
// 실제 사이트에는 관리자 화면에서 저장한 내용(Supabase site_content 표)이 우선 표시되고,
// 저장된 내용이 없거나 비어 있는 칸만 이 기본값으로 채운다 (lib/content.ts 참고).

export type Rule = { title: string; body: string };
export type Step = { title: string; body: string };
export type Program = { badge: string; highlight: boolean; title: string; body: string; schedule: string };
export type Teacher = { name: string; grades: string; career: string; photo: string };
export type Review = { quote: string; who: string };

export type SiteContent = {
  tagline: string;
  phone: string;
  hours: string;
  replyWithin: string;
  address: string;
  mapUrl: string;
  heroPhoto: string;
  privacyRetention: string;
  business: { owner: string; bizNo: string; academyNo: string };
  links: { blog: string; instagram: string; kakao: string };
  rules: Rule[];
  steps: Step[];
  programs: Program[];
  teachers: Teacher[];
  reviews: Review[];
};

export const defaultContent: SiteContent = {
  tagline: "제주시 중·고등 수학 전문",
  phone: "",
  hours: "[운영 시간 — 예: 평일 00:00–00:00]",
  replyWithin: "[영업일 기준 1일]",
  address: "제주특별자치도 제주시 중앙로 312, 2층",
  mapUrl: "https://map.naver.com/p/search/" + encodeURIComponent("제주시 중앙로 312"),
  heroPhoto: "",
  privacyRetention: "[보관 기간]",
  business: { owner: "[이름]", bizNo: "[000-00-00000]", academyNo: "[제0000호]" },
  links: { blog: "", instagram: "", kakao: "" },
  rules: [
    { title: "과제는 예외 없이", body: "[과제 미이행 시 원칙 — 예: 당일 남아서 완료 후 귀가]" },
    { title: "틀린 문제는 그날 끝낸다", body: "[오답 관리 방식 — 예: 오답 재시험 통과 전까지 다음 진도 없음]" },
    { title: "태도가 실력보다 먼저", body: "[출결·수업 태도 관리 기준 — 예: 무단결석 누적 시 퇴원]" },
  ],
  steps: [
    { title: "입학 테스트", body: "[테스트 방식·소요 시간]" },
    { title: "학생 단독 면담", body: "[면담에서 확인하는 것]" },
    { title: "학부모 상담", body: "[학습 계획·반 배정 안내]" },
    { title: "등록 · 수업 시작", body: "[첫 달 적응 기간 등 안내]" },
  ],
  programs: [
    { badge: "중등부", highlight: false, title: "[과정명 — 예: 내신 + 선행]", body: "[대상 학년, 수업 목표, 교재·진도]", schedule: "주 [0]회 · [000]분" },
    { badge: "고1 · 고2", highlight: false, title: "[과정명 — 예: 학교별 내신 완성]", body: "[대상 학교, 수업 목표, 시험 대비 방식]", schedule: "주 [0]회 · [000]분" },
    { badge: "고3 · 수능", highlight: true, title: "[과정명 — 예: 수능 실전반]", body: "[선택과목, 모의고사 운영, 목표 등급]", schedule: "주 [0]회 · [000]분" },
  ],
  teachers: [
    { name: "[이름] 원장", grades: "[담당 학년]", career: "[학력·주요 약력]", photo: "" },
    { name: "[이름] 선생님", grades: "[담당 학년]", career: "[학력·주요 약력]", photo: "" },
    { name: "[이름] 선생님", grades: "[담당 학년]", career: "[학력·주요 약력]", photo: "" },
  ],
  reviews: [
    { quote: "[실제 수강 후기]", who: "[학교 · 학년] 학생" },
    { quote: "[실제 수강 후기]", who: "[학교 · 학년] 학생" },
    { quote: "[실제 수강 후기]", who: "[학교 · 학년] 학부모" },
  ],
};

export const nav = [
  { href: "#rules", label: "학원 원칙" },
  { href: "#admission", label: "입학 안내" },
  { href: "#programs", label: "수업 안내" },
  { href: "#teachers", label: "강사진" },
  { href: "#location", label: "오시는 길" },
];
