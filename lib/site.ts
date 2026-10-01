// 사이트에 들어가는 학원 정보의 "기본값".
// 실제 사이트에는 관리자 화면에서 저장한 내용(Supabase site_content 표)이 우선 표시되고,
// 저장된 내용이 없거나 비어 있는 칸만 이 기본값으로 채운다 (lib/content.ts 참고).

export type Rule = { title: string; body: string };
export type Step = { title: string; body: string };
// enrolled/capacity: 현재 수강 인원 / 정원. capacity가 0이면 사이트에 인원 표시를 하지 않는다.
// point: 카드 안에 크게 강조할 한 줄(예: 고등 선행 포함) — 비우면 안 보임
export type Program = { badge: string; highlight: boolean; title: string; body: string; point: string; schedule: string; fee: string; enrolled: number; capacity: number };

// 교습비 등 게시표(학원법에 따라 홈페이지에도 표시) — 교육청에 등록한 값 그대로
export type TuitionRow = { subject: string; schedule: string; minutes: string; fee: string };
export type Tuition = { rows: TuitionRow[]; appliedFrom: string; note: string };
export type Teacher = { name: string; grades: string; career: string; photo: string };
export type Review = { quote: string; who: string };
// 성적 향상 사례: 누가(학교·학년) / 어떤 시험 / 이전 → 이후 / 걸린 기간 / 한마디
// link: 자세한 글(블로그 등) 주소 — 있으면 카드에 "자세히 보기"
// 자주 묻는 질문(입학 안내 아래)
export type Faq = { q: string; a: string };

export type Case = { who: string; exam: string; before: string; after: string; period: string; note: string; link: string };

// 학원 소개: 제목(큰 글씨), 부제, 본문(빈 줄로 문단 구분), 강조 문장(본문 중 크게 따로 보여줄 한 줄)
// 강사진 맨 위 이야기(누가 가르치나): 제목·본문·핵심 사실 몇 줄·자세히 보기 링크
export type TeacherStory = { title: string; body: string; facts: string[]; link: string };

export type About = { headline: string; subtitle: string; body: string; highlight: string };

export type SiteContent = {
  about: About;
  teacherStory: TeacherStory;
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
  faqs: Faq[];
  tuition: Tuition;
};

export const defaultContent: SiteContent = {
  about: {
    headline: "확실한 개념과 지독한 연습이 만점을 만듭니다.",
    subtitle: "중·고등부 (최)상위권 수학 전문 — 메딕수학",
    body: "국어·영어·수학·과학, 여러 과목을 배우지만 정작 '공부하는 법'은 배운 적 있으신가요?\n\n상위권과 하위권을 가르는 건 머리가 아니라 공부의 효율입니다.\n\n메딕수학은 적게 공부하고 최상의 결과를 내는 것, 학습 능력 자체를 키우는 데서 시작합니다.",
    highlight: "효율의 차이가 곧 성적의 차이입니다.",
  },
  teacherStory: {
    title: "원장에게 6년을 배운 아들이, 이제 함께 가르칩니다.",
    body: "이은상 선생님은 이진 원장에게 6년 동안 수학을 배웠습니다. 고3 6월 모의평가 84점에서 다시 시작해, 4개월 뒤 수능 수학 96점(백분위 99)을 받았습니다.\n\n서울대 통계학과·포스텍·제주의대에 합격했고, 지금은 제주의대에 다니며 메딕수학 고등부를 가르칩니다. 가르치는 방법이 결과로 증명된 학원입니다.",
    facts: ["이진 원장 — 25년 직강 · 누적 수강생 1,000명 돌파", "이은상 선생님 — 수능 수학 96점 · 백분위 99", "서울대 통계학과 · 포스텍 · 제주의대 합격"],
    link: "https://blog.naver.com/yijean/224308616199",
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
  business: { owner: "이진", bizNo: "538-97-02143", academyNo: "제2979호" },
  // 2026-10-01: 원장님 네이버 블로그(메딕차트 홍보 배너와 같은 주소). DB 값이 있으면 그 값을 쓴다.
  links: { blog: "https://blog.naver.com/yijean", instagram: "", kakao: "" },
  rules: [
    { title: "과제는 예외 없이", body: "과제는 양보다 '끝까지'가 기준입니다. 해 오지 못한 과제는 학원에 남아 끝내고 귀가하며, 풀이 과정 없이 답만 적은 과제는 한 것으로 보지 않습니다." },
    { title: "틀린 문제는 그날 끝낸다", body: "틀린 문제는 해설을 읽는 것으로 끝내지 않습니다. 해설을 덮고 다시 풀어 맞힐 때까지가 그날의 수업이고, 반복해서 틀리는 단원은 메딕차트로 따로 모아 관리합니다." },
    { title: "태도가 실력보다 먼저", body: "지각·결석·수업 중 휴대폰 사용은 그날 바로 학부모님께 알립니다. 실력은 시간이 걸려도 오르지만, 태도가 바뀌지 않으면 점수는 오르지 않습니다." },
  ],
  steps: [
    { title: "입학 테스트", body: "학년별 맞춤 테스트를 진행하며 전체적인 학습 수준을 평가합니다." },
    { title: "학생/학부모 면담", body: "입학 테스트 진단 결과(심화·표준·기초)를 함께 보며 지금 실력과 목표를 확인합니다. 무엇보다 학생 본인이 정말 공부하기로 결심했는지 직접 묻고, 결심이 확인된 학생만 등록합니다." },
    { title: "등록 · 수업 시작", body: "따로 적응 기간 없이, 등록한 날부터 바로 정규 수업과 과제에 들어갑니다. 첫 시험부터 메딕차트로 결과를 분석해 다음 시험까지 무엇을 할지 정해 드립니다." },
  ],
  programs: [
    { badge: "중1 과정", highlight: false, title: "정확한 개념 · 어려운 문제를 대하는 태도", body: "시험 기간에는 학교 시험 범위를 확실하게 대비합니다. 다만 중학교 수학은 그 기간에 바짝 준비하면 원하는 점수가 나오는 시험이라, 메딕수학 중등부는 내신 점수에서 멈추지 않습니다. 평소에는 정의와 원리부터 정확히 세우는 개념 수업, 그리고 처음 보는 어려운 문제 앞에서도 쉽게 답지를 펴지 않고 끝까지 붙잡는 태도를 기릅니다. 고등학교에서 성적을 가르는 힘은 여기서 만들어집니다.", point: "", schedule: "", fee: "", enrolled: 0, capacity: 0 },
    { badge: "중2 과정", highlight: false, title: "정확한 개념 · 어려운 문제를 대하는 태도", body: "시험 기간에는 학교 시험 범위를 확실하게 대비합니다. 다만 중학교 수학은 그 기간에 바짝 준비하면 원하는 점수가 나오는 시험이라, 메딕수학 중등부는 내신 점수에서 멈추지 않습니다. 평소에는 정의와 원리부터 정확히 세우는 개념 수업, 그리고 처음 보는 어려운 문제 앞에서도 쉽게 답지를 펴지 않고 끝까지 붙잡는 태도를 기릅니다. 고등학교에서 성적을 가르는 힘은 여기서 만들어집니다.", point: "", schedule: "", fee: "", enrolled: 0, capacity: 0 },
    { badge: "중3 과정", highlight: false, title: "정확한 개념 + 고등 선행", body: "시험 기간에는 학교 내신을 확실하게 대비하고, 평소에는 중학교 개념을 정확히 마무리하면서 고등 과정을 선행합니다. 고등학교 시험지는 어려운 문항의 비중이 크게 늘어나기 때문에, 어려운 문제를 끝까지 붙잡는 습관을 고등학교에 올라가기 전에 만들어 둡니다.", point: "고등 선행 포함", schedule: "", fee: "", enrolled: 0, capacity: 0 },
    { badge: "고1", highlight: false, title: "학교별 내신 완성", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "주말 5시간씩", schedule: "토·일 · 회당 5시간", fee: "", enrolled: 0, capacity: 0 },
    { badge: "고2", highlight: false, title: "학교별 내신 완성", body: "메딕수학 자체 제작교재 및 매쓰플랫을 통한 학생 개별관리 시스템으로 정확한 개념 진도를 나가며, 메딕수학 자체 개발 학교별 기출분석 시스템인 '메딕차트'를 이용하여 학교별 기출문제 학습", point: "주말 5시간씩", schedule: "토·일 · 회당 5시간", fee: "", enrolled: 0, capacity: 0 },
    { badge: "고3", highlight: true, title: "4개월 수능대비 특강", body: "기출문제들을 정확하게 분석하여 수능에서 가져야할 관점들을 새워주고 연습시킵니다.", point: "주말 5시간씩", schedule: "토·일 · 회당 5시간", fee: "", enrolled: 0, capacity: 0 },
  ],
  teachers: [
    { name: "이진 원장", grades: "초등학교 6학년, 중학교 1~3학년", career: "멘토아카데미 원장(직강)\n잇츠학원 원장(직강)\n메딕수학 원장(직강)\n누적 수강생 1,000명 돌파", photo: "" },
    { name: "이은상 선생님", grades: "고등학교 1~3학년", career: "제주의대 재학\n이진 원장에게 6년간 수학을 배움\n수능 수학 96점(백분위 99)\n서울대 통계학과·포스텍·제주의대 합격", photo: "" },
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
  faqs: [
    { q: "입학 테스트는 어떻게 보나요?", a: "제주 학교들의 실제 기출 문항으로, 학년에 맞춰 쉬운 문제부터 어려운 문제까지 고르게 섞어 출제합니다. 결과는 점수만이 아니라 심화·표준·기초 중 어디에서 시작하면 좋을지 진단으로 알려 드리고, 면담 때 함께 봅니다." },
    { q: "중학교 내신 대비는 어떻게 하나요?", a: "시험 기간에는 학교 시험 범위와 기출로 확실하게 대비합니다. 다만 중학교 수학은 시험 기간에 바짝 준비하면 원하는 점수가 나오는 시험이라, 메딕수학은 내신 점수만으로 실력을 판단하지 않습니다. 평소에는 개념을 정확히 이해했는지, 처음 보는 어려운 문제를 끝까지 붙잡는지를 봅니다. 고등학교에 올라가 성적이 갈리는 건 바로 그 차이입니다." },
    { q: "숙제는 얼마나 나오나요?", a: "양보다 '끝까지 해 오는 것'을 봅니다. 그날 배운 내용을 스스로 손으로 풀어 보는 분량이 나오고, 해 오지 못하면 학원에 남아 끝내고 갑니다. 처음엔 버겁게 느껴질 수 있지만, 점수가 오르는 시간은 바로 이 시간입니다." },
    { q: "결석하면 보강이 있나요?", a: "미리 연락 주시면 빠진 진도와 과제를 따로 챙겨 드립니다. 다만 무단 결석·지각은 그날 바로 학부모님께 알립니다." },
    { q: "시험 기간에는 어떻게 수업하나요?", a: "중등부·고등부 모두 시험 기간에는 학교 시험 범위에 맞춰 내신 대비를 합니다. 특히 고등학교 내신은 학교마다 자주 나오는 단원과 어려운 문항 유형이 달라, 메딕차트에 정리된 우리 학교 기출로 학교별로 준비합니다. 시험이 끝나면 개별 성적 보고서로 결과와 다음 시험까지의 복습 순서를 알려 드립니다." },
    { q: "성적 결과는 학부모도 볼 수 있나요?", a: "네. 시험마다 영역·단원·난이도별 결과와 '다시 볼 단원'이 담긴 개별 성적 보고서를 드립니다. 찍어서 맞힌 점수를 뺀 실질 점수도 함께 보여 드려, 진짜 실력이 어디쯤인지 정확히 알 수 있습니다." },
    { q: "중학생도 고등 과정을 미리 배우나요?", a: "중3 과정은 고등 선행을 포함합니다. 중1·중2 과정은 진도를 서두르기보다 개념을 정확히 세우고 어려운 문제를 끝까지 푸는 힘을 기르는 데 집중합니다. 이 힘이 있어야 선행도 제대로 남습니다." },
    { q: "고등부 수업 시간은 어떻게 되나요?", a: "고등부는 토·일 주말에 회당 5시간씩 수업합니다. 자세한 반 시간과 교습비는 상담 때 안내해 드리며, 교습비 게시표는 이 페이지 맨 아래에 있습니다." },
  ],
  tuition: {
    rows: [
      { subject: "중등보습(수학)", schedule: "주 5회", minutes: "2,410분", fee: "350,000원" },
      { subject: "고등보습(수학)", schedule: "주 5회", minutes: "2,730분", fee: "450,000원" },
      { subject: "고등보습(수학)", schedule: "주 2회", minutes: "2,730분", fee: "450,000원" },
    ],
    appliedFrom: "2026-05-08",
    note: "교습비 외의 기타 경비(모의고사비, 재료비, 급식비 등)는 징수하지 않습니다.",
  },
};

export const nav = [
  { href: "#teachers", label: "강사진" },
  { href: "#medicchart", label: "메딕차트" },
  { href: "#cases", label: "향상 사례" },
  { href: "#rules", label: "학원 원칙" },
  { href: "#programs", label: "수업 안내" },
  { href: "#admission", label: "입학 안내" },
  { href: "#location", label: "오시는 길" },
];
