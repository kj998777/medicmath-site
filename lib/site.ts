// 사이트에 들어가는 학원 정보는 전부 이 파일에서 고친다.
// [대괄호]로 된 값은 아직 정해지지 않은 자리 — 실제 내용으로 바꿔 주세요.

export const site = {
  name: "메딕수학",
  nameEn: "MEDIC MATH ACADEMY",
  tagline: "제주시 중·고등 수학 전문",
  address: "제주특별자치도 제주시 중앙로 312, 2층",
  // 전화번호가 정해지면 "064-000-0000" 형식으로 넣으면 전화 버튼이 자동으로 켜진다.
  phone: "",
  hours: "[운영 시간 — 예: 평일 00:00–00:00]",
  replyWithin: "[영업일 기준 1일]",
  // 네이버/카카오 지도 링크 (없으면 주소 검색 링크를 쓴다)
  mapUrl: "https://map.naver.com/p/search/" + encodeURIComponent("제주시 중앙로 312"),
  business: {
    owner: "[이름]",
    bizNo: "[000-00-00000]",
    academyNo: "[제0000호]",
  },
  links: [
    { label: "블로그", href: "" },
    { label: "인스타그램", href: "" },
    { label: "카카오톡 채널", href: "" },
  ],
};

export const rules = [
  { no: "01", title: "과제는 예외 없이", body: "[과제 미이행 시 원칙 — 예: 당일 남아서 완료 후 귀가]" },
  { no: "02", title: "틀린 문제는 그날 끝낸다", body: "[오답 관리 방식 — 예: 오답 재시험 통과 전까지 다음 진도 없음]" },
  { no: "03", title: "태도가 실력보다 먼저", body: "[출결·수업 태도 관리 기준 — 예: 무단결석 누적 시 퇴원]" },
];

export const admissionSteps = [
  { step: "STEP 1", title: "입학 테스트", body: "[테스트 방식·소요 시간]" },
  { step: "STEP 2", title: "학생 단독 면담", body: "[면담에서 확인하는 것]" },
  { step: "STEP 3", title: "학부모 상담", body: "[학습 계획·반 배정 안내]" },
  { step: "STEP 4", title: "등록 · 수업 시작", body: "[첫 달 적응 기간 등 안내]" },
];

export const programs = [
  { badge: "중등부", highlight: false, title: "[과정명 — 예: 내신 + 선행]", body: "[대상 학년, 수업 목표, 교재·진도]", schedule: "주 [0]회 · [000]분" },
  { badge: "고1 · 고2", highlight: false, title: "[과정명 — 예: 학교별 내신 완성]", body: "[대상 학교, 수업 목표, 시험 대비 방식]", schedule: "주 [0]회 · [000]분" },
  { badge: "고3 · 수능", highlight: true, title: "[과정명 — 예: 수능 실전반]", body: "[선택과목, 모의고사 운영, 목표 등급]", schedule: "주 [0]회 · [000]분" },
];

// photo: public 폴더에 넣은 사진 파일 경로 (예: "/teachers/kim.jpg"). 비워 두면 자리만 표시된다.
export const teachers = [
  { name: "[이름] 원장", grades: "[담당 학년]", career: "[학력·주요 약력]", photo: "" },
  { name: "[이름] 선생님", grades: "[담당 학년]", career: "[학력·주요 약력]", photo: "" },
  { name: "[이름] 선생님", grades: "[담당 학년]", career: "[학력·주요 약력]", photo: "" },
];

export const reviews = [
  { quote: "[실제 수강 후기]", who: "[학교 · 학년] 학생" },
  { quote: "[실제 수강 후기]", who: "[학교 · 학년] 학생" },
  { quote: "[실제 수강 후기]", who: "[학교 · 학년] 학부모" },
];

export const nav = [
  { href: "#rules", label: "학원 원칙" },
  { href: "#admission", label: "입학 안내" },
  { href: "#programs", label: "수업 안내" },
  { href: "#teachers", label: "강사진" },
  { href: "#location", label: "오시는 길" },
];
