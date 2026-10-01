// 사이트에 들어가는 학원 정보의 "기본값".
// 실제 사이트에는 관리자 화면에서 저장한 내용(Supabase site_content 표)이 우선 표시되고,
// 저장된 내용이 없거나 비어 있는 칸만 이 기본값으로 채운다 (lib/content.ts 참고).

export type Rule = { title: string; body: string };
export type Step = { title: string; body: string };
// enrolled/capacity: 현재 수강 인원 / 정원. capacity가 0이면 사이트에 인원 표시를 하지 않는다.
// point: 카드 안에 크게 강조할 한 줄(예: 고등 선행 포함) — 비우면 안 보임
export type Program = { badge: string; highlight: boolean; title: string; body: string; point: string; schedule: string; enrolled: number; capacity: number };
export type Teacher = { name: string; grades: string; career: string; photo: string };
export type Review = { quote: string; who: string };
// 성적 향상 사례: 누가(학교·학년) / 어떤 시험 / 이전 → 이후 / 걸린 기간 / 한마디
// link: 자세한 글(블로그 등) 주소 — 있으면 카드에 "자세히 보기"
export type Case = { who: string; exam: string; before: string; after: string; period: string; note: string; link: string };

// 학원 소개: 제목(큰 글씨), 부제, 본문(빈 줄로 문단 구분), 강조 문장(본문 중 크게 따로 보여줄 한 줄)
export type About = { headline: string; subtitle: string; body: string; highlight: string };

export type SiteContent = {
  about: About;
  tagline: string;
  phone: string;
  hours: string;
  replyWithin: string;
  address: string;
  mapUrl: string;
  heroPhoto: string; // (예전 1장짜리 — heroPhotos가 비어 있을 때만 사용)
  heroPhotos: string[];
  privacyRetention: string;
  business: { owner: string; bizNo: string; academyNo: string };
  links: { blog: string; instagram: string; kakao: string };
  rules: Rule[];
  steps: Step[];
  programs: Program[];
  teachers: Teacher[];
  reviews: Review[];
  cases: Case[];
};

export const defaultContent: SiteContent = {
  about: {
    headline: "확실한 개념과 지독한 연습이 만점을 만듭니다.",
    subtitle: "중·고등부 (최)상위권 수학 전문 — 메딕수학",
    body: "국어·영어·수학·과학, 여러 과목을 배우지만 정작 '공부하는 법'은 배운 적 있으신가요?\n\n상위권과 하위권을 가르는 건 머리가 아니라 공부의 효율입니다.\n\n메딕수학은 적게 공부하고 최상의 결과를 내는 것, 학습 능력 자체를 키우는 데서 시작합니다.",
    highlight: "효율의 차이가 곧 성적의 차이입니다.",
  },
  tagline: "제주시 중·고등 수학 전문",
  phone: "064-702-3455",
  hours: "평일 13:00–22:00 · 주말 10:00–22:00",
  replyWithin: "[영업일 기준 1일]",
  address: "제주특별자치도 제주시 중앙로 312, 2층",
  mapUrl: "https://map.naver.com/p/search/" + encodeURIComponent("제주시 중앙로 312"),
  heroPhoto: "",
  heroPhotos: [],
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
    { badge: "중1 과정", highlight: false, title: "학교별 내신 완성", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "", schedule: "", enrolled: 0, capacity: 0 },
    { badge: "중2 과정", highlight: false, title: "학교별 내신 완성", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "", schedule: "", enrolled: 0, capacity: 0 },
    { badge: "중3 과정", highlight: false, title: "학교별 내신 완성 + 고등 선행", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "고등 선행 포함", schedule: "", enrolled: 0, capacity: 0 },
    { badge: "고1", highlight: false, title: "학교별 내신 완성", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "", schedule: "주 2회 · 600분", enrolled: 0, capacity: 0 },
    { badge: "고2", highlight: false, title: "학교별 내신 완성", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "", schedule: "주 2회 · 600분", enrolled: 0, capacity: 0 },
    { badge: "고3", highlight: true, title: "4개월 수능대비 특강", body: "기출문제들을 정확하게 분석하여 수능에서 가져야할 관점들을 새워주고 연습시킵니다.", point: "", schedule: "주 2회 · 600분", enrolled: 0, capacity: 0 },
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
  cases: [
    { who: "제주시 중2", exam: "중간고사 → 기말고사", before: "56점", after: "96점", period: "3개월", note: "강의를 더 늘리지 않고, 매일 1시간 스스로 손으로 푸는 시간만 더했습니다.", link: "https://blog.naver.com/yijean/224321902400" },
    { who: "사대부고 고3", exam: "6월 모의평가 → 수능", before: "84점", after: "96점", period: "4개월", note: "평이한 4점 매일 30문제, 킬러는 하루 3문제를 끝까지 분해. 수능 백분위 99, 서울대·포스텍·제주의대 합격.", link: "https://blog.naver.com/yijean/224308616199" },
    { who: "고1", exam: "1학기 내신", before: "중학교 중상위권", after: "1등급", period: "", note: "중학교 때 중상위권이던 학생이 고등학교 첫 학기 내신에서 안정적으로 1등급을 받았습니다.", link: "" },
  ],
};

export const nav = [
  { href: "#about", label: "학원 소개" },
  { href: "#rules", label: "학원 원칙" },
  { href: "#admission", label: "입학 안내" },
  { href: "#programs", label: "수업 안내" },
  { href: "#medicchart", label: "메딕차트" },
  { href: "#cases", label: "향상 사례" },
  { href: "#location", label: "오시는 길" },
];
