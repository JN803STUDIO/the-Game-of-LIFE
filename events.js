// =====================================================
// 게임 데이터 (스토리 · 밸런스 담당이 마음대로 고쳐도 돼요!)
//
// 돈 단위 : 만원 (10000 이상이면 화면에 "1억 2000만원" 처럼 보여요)
// 능력치 : 🧠 지력(int) · 💪 체력(str) · ✨ 센스(sense)  (0 ~ 100 정도, 등급 F~S)
//
// 이벤트 결과에 쓸 수 있는 값 (필요한 것만 쓰면 됨)
//   money : 💰 돈 (만원)
//   int / str / sense : 능력치
//   all   : 다른 플레이어 1명당 받는 돈 (마이너스면 주는 돈)
//   card  : true 면 카드 1장 획득
//   steal : 🦹 갈취 - 1등(나 말고 가장 부자)에게서 이만큼 뺏어 와요 (🛡️ 수호 카드면 막히고 되돌려 받아요)
//   trap  : 🪤 함정 - 1등(나 말고)이 이만큼 잃어요 (🛡️ 수호 카드면 막히고 내가 잃어요)
//   flag  : 한 일을 기록 (예: flag: "piano") → 나중에 when: "piano" 이벤트가 나와요
//
// 이벤트에 when 을 쓰면 "그 상황인 사람"에게만 나와요 (3배 더 잘 나옴)
//   single 솔로 / dating 연애 중 / married 결혼 / kids 자녀 있음
//   house 집 있음 / nohouse 집 없음 / job 직장인 / nojob 직업 없음
//   rich 돈 1000만원 이상 / poor 빚(대출) 있음 / college 대학 졸업
//   int, str, sense : 그 재능을 가진 사람
//   그 밖의 글자 : flag 로 기록한 일 (예: when: "piano")
//
// 확률(chance)은 전부 🎡 룰렛으로 정해요 (X 실패 / O 성공 / ◎ 대성공 = 보상 2배)
// =====================================================


// ----- 1. 나이대 (중간 집계 할 때 써요) -----
const stages = [
  "👶 아기", "🧸 유아", "🎒 유치원", "🏫 초등학생", "📘 중학생",
  "📝 고등학생", "🎓 대학·사회 첫걸음", "🏙️ 성인 초반", "🏡 성인 후반", "🏝️ 황혼기"
];


// ----- 2. 지역 (인생 단계) -----
// pool  : 이 지역에서 어떤 이야기 묶음(events)을 쓸지
// stage : 나이대 번호 (위 stages 의 몇 번째)
// adult : true 면 성인 (미니게임 보상이 능력치 → 돈으로 바뀜)
const areas = {
  baby:     { name: "👶 아기",           pool: "baby",    stage: 0, story: "응애! 세상에 태어났어요." },
  toddler:  { name: "🧸 유아",           pool: "baby",    stage: 1, story: "아장아장, 세상 모든 게 신기해요!" },
  kinder:   { name: "🎒 유치원",         pool: "kinder",  stage: 2, story: "처음으로 친구들을 만났어요." },
  elem:     { name: "🏫 초등학교",       pool: "elem",    stage: 3, story: "책가방을 메고 초등학교 입학!" },
  academy:  { name: "✏️ 학원 길",        pool: "elem",    stage: 3, story: "학원 뺑뺑이... 힘들지만 머리가 좋아져요." },
  play:     { name: "⚽ 운동장 길",      pool: "elem",    stage: 3, story: "해 질 때까지 뛰어놀며 튼튼해져요!" },
  middle:   { name: "📘 중학교",         pool: "middle",  stage: 4, story: "사춘기가 찾아왔다..." },
  high:     { name: "📝 고등학교",       pool: "high",    stage: 5, story: "수능까지 D-1000!" },
  college:  { name: "🎓 대학교",         pool: "college", stage: 6, story: "꿈에 그리던 캠퍼스 라이프!", adult: true },
  work:     { name: "💼 바로 취업",      pool: "college", stage: 6, story: "남들보다 한 발 먼저 사회로!", adult: true },
  young:    { name: "🏙️ 성인 초반",      pool: "young",   stage: 7, story: "진짜 어른의 삶이 시작됐어요.", adult: true },
  lovepath: { name: "💕 애정·가정 집중 길", pool: "young", stage: 7, story: "사랑과 가족을 찾아 떠나는 길!", adult: true },
  workpath: { name: "💼 출세 집중 길",   pool: "young",   stage: 7, story: "일에 모든 걸 건다!", adult: true },
  late:     { name: "🏡 성인 후반",      pool: "late",    stage: 8, story: "가족과 집을 지키는 든든한 어른.", adult: true },
  senior:   { name: "🏝️ 황혼기",         pool: "senior",  stage: 9, story: "은퇴 후, 인생 2막이 시작됐어요.", adult: true },
  sea:      { name: "🌊 평온한 바닷길",  pool: "senior",  stage: 9, story: "여유롭게 바다를 따라 걸어요.", adult: true },
  gamble:   { name: "🎰 한방역전섬",     pool: "gamble",  stage: 9, story: "인생 마지막 한 방! 대박 아니면 쪽박!", adult: true }
};


// ----- 3. 게임 모드 (닌텐도 인생게임과 같은 턴 수) -----
// turns : 한 사람이 할 수 있는 턴 수 (다 쓰면 게임 끝 → 정산)
const modes = [
  { key: "full",   name: "🌈 평생 모드",     turns: 49, desc: "아기 시절부터 황혼기까지, 평생을 모두 플레이해요. (약 49턴)" },
  { key: "junior", name: "🧒 아이만 모드",   turns: 12, desc: "아기부터 고등학교 졸업(진로 선택)까지만 플레이해요. (12턴)" },
  { key: "adult",  name: "👔 성인부터 모드", turns: 37, desc: "능력치 50, 기초 자금 50만원을 갖고 진로 선택부터 시작해요. (37턴)" }
];
const adultStart = { stat: 50, money: 50 }; // 성인부터 모드 시작 능력치 / 돈


// ----- 4. 재능 (재능 룰렛으로 하나 받음 → 그 능력치는 항상 1.5배로 오름) -----
// icon : 재능 룰렛 칸에 나오는 기호
const talents = [
  { key: "int",   icon: "🧠", name: "🧠 지력", text: "책을 거꾸로 들고도 읽는 천재 아기!" },
  { key: "str",   icon: "💪", name: "💪 체력", text: "기저귀 차고 달리기 1등!" },
  { key: "sense", icon: "✨", name: "✨ 센스", text: "옷 입는 센스가 남다른 아기!" }
];


// ----- 5. 카드 (차례가 시작될 때 쓸 수 있어요, 최대 3장) -----
// min, max : 이번 룰렛이 이 범위에서만 나와요
// snipe : 앞 5칸 안의 ⭐ 럭키 칸을 골라 바로 이동
// guard : 쓰는 카드가 아니라 갖고만 있으면 함정 · 갈취를 1번 막아 줘요
const cardTypes = [
  { key: "low",   name: "🐢 작은 숫자 카드", min: 1, max: 3,  desc: "룰렛이 1~3 에서만 나와요" },
  { key: "high",  name: "🚀 큰 숫자 카드",   min: 7, max: 10, desc: "룰렛이 7~10 에서만 나와요" },
  { key: "five",  name: "5️⃣ 5 카드",         min: 5, max: 5,  desc: "이번 턴은 반드시 5가 나와요" },
  { key: "snipe", name: "🎯 저격 카드",      desc: "앞 5칸 안의 ⭐ 럭키 칸으로 바로 이동" },
  { key: "guard", name: "🛡️ 수호 카드",      desc: "갖고만 있어도 함정·갈취를 1번 막고 되돌려요" }
];


// ----- 6. 갈림길 -----
// routes 순서 = 지도(map.js)의 next 순서
const forks = {
  f0: {
    title: "방과 후 어디로 갈까?",
    text: "학원에 가면 머리가, 운동장에 가면 몸이 튼튼해져요.",
    routes: [
      { label: "✏️ 학원 길", desc: "🧠+10", int: 10, flag: "academy" },
      { label: "⚽ 운동장 길", desc: "💪+10", str: 10, flag: "sports" }
    ]
  },
  f1: {
    title: "진로 선택",
    text: "고등학교 졸업! 이제 어떻게 할까요?",
    routes: [
      { label: "🎓 대학 진학", desc: "등록금이 들지만 전문직(대졸) 가능" },
      { label: "💼 바로 취업", desc: "빨리 사회로!" }
    ]
  },
  f2: {
    title: "서브 맵 선택",
    text: "어느 인생 길로 갈까요?",
    routes: [
      { label: "💕 애정·가정 집중", desc: "♥ 연애 칸이 많아요" },
      { label: "💼 출세 집중", desc: "★ 직업 칸 · 월급날이 많아요" }
    ]
  },
  f3: {
    title: "황혼기의 선택",
    text: "평온하게 갈까, 한방역전섬에서 인생을 걸어 볼까?",
    routes: [
      { label: "🌊 평온한 바닷길", desc: "✨+5 · 좋은 일이 많아요", sense: 5 },
      { label: "🎰 한방역전섬", desc: "카드를 모두 잃어요! 복권으로 최대 5배" }
    ]
  }
};


// ----- 7. 인생 이벤트 칸 (무조건 멈추는 칸) -----
// talent, exam, college, job, marry, house, retire 는 script.js 에서 특별 처리
const lifeEvents = {
  talent:  { label: "재능 발견",     title: "🌟 재능 발견!",     text: "어떤 재능을 타고났을까요?" },
  kinder:  { label: "유치원 입학",   title: "🎒 유치원 입학",    text: "새 친구들이 생겼어요!", sense: 5 },
  elem:    { label: "초등학교 입학", title: "🏫 초등학교 입학",  text: "받아쓰기 100점을 향해!", int: 5, str: 5 },
  middle:  { label: "중학교 입학",   title: "📘 중학교 입학",    text: "처음으로 교복을 입었어요.", int: 5, sense: 5 },
  high:    { label: "고등학교 입학", title: "📝 고등학교 입학",  text: "이제 진짜 공부할 시간!", int: 5, str: 5 },
  exam:    { label: "수능",          title: "✏️ 수능 날",        text: "그동안 공부한 실력을 보여줄 시간!" },
  college: { label: "대학 입학",     title: "🎓 대학 입학",      text: "대학생이 되었어요! 전문직(대졸) 직업을 가질 수 있어요.", money: -60, int: 10 },
  job:     { label: "취업",          title: "💼 성년! 직업 선택", text: "능력치가 모자란 직업은 고를 수 없어요." },
  marry:   { label: "결혼",          title: "💍 결혼 정지 칸",   text: "연인에게 프러포즈할 시간!" },
  house:   { label: "내 집 마련",    title: "🏠 내 집 마련",     text: "집을 사면 게임이 끝날 때 더 비싸게 팔아요!" },
  retire:  { label: "정년 퇴직",     title: "🎉 정년 퇴직",      text: "수고 많으셨어요! 퇴직금을 받고, 월급 대신 연금(절반)을 받아요.", money: 150 }
};


// ----- 8. 직업 -----
// main   : 진급에 쓰는 주 능력치 (진급 점수 = 룰렛 숫자 + 주 능력치 × 0.1 → 15 이상이면 진급)
// grades : 랭크 1 ~ 5 (salary = 월급날마다 받는 돈, need = 그 랭크에 필요한 능력치)
// title  : 인생 보고서에 나오는 칭호
const jobs = [
  { name: "의사", college: true, main: "int", title: "생명을 구하는 명의", grades: [
    { title: "인턴",       salary: 4,  need: { int: 45 } },
    { title: "레지던트",   salary: 9, need: { int: 55 } },
    { title: "전문의",     salary: 23, need: { int: 65 } },
    { title: "교수",       salary: 41, need: { int: 75, sense: 30 } },
    { title: "병원장",     salary: 68, need: { int: 85, sense: 40 } } ] },
  { name: "변호사", college: true, main: "int", title: "정의의 변호사", grades: [
    { title: "수습 변호사", salary: 4,  need: { int: 40 } },
    { title: "변호사",      salary: 8, need: { int: 50, sense: 20 } },
    { title: "에이스 변호사", salary: 21, need: { int: 60, sense: 30 } },
    { title: "파트너 변호사", salary: 38, need: { int: 70, sense: 40 } },
    { title: "대표 변호사", salary: 64, need: { int: 80, sense: 50 } } ] },
  { name: "개발자", college: true, main: "int", title: "세상을 바꾼 천재 개발자", grades: [
    { title: "주니어 개발자", salary: 3,  need: { int: 35 } },
    { title: "개발자",        salary: 8, need: { int: 45 } },
    { title: "시니어 개발자", salary: 19, need: { int: 55, sense: 20 } },
    { title: "팀장",          salary: 34, need: { int: 65, sense: 30 } },
    { title: "CTO",           salary: 56, need: { int: 75, sense: 40 } } ] },
  { name: "운동선수", college: false, main: "str", title: "인기있는 스포츠 스타", grades: [
    { title: "신인 선수",   salary: 2,  need: { str: 35 } },
    { title: "1군 선수",    salary: 5,  need: { str: 45 } },
    { title: "올스타 선수", salary: 15, need: { str: 55 } },
    { title: "국가대표",    salary: 38, need: { str: 70, sense: 20 } },
    { title: "레전드",      salary: 61, need: { str: 85, sense: 30 } } ] },
  { name: "연예인", college: false, main: "sense", title: "모두가 아는 월드스타", grades: [
    { title: "연습생",     salary: 1,  need: { sense: 35 } },
    { title: "신인",       salary: 4,  need: { sense: 45 } },
    { title: "스타",       salary: 17, need: { sense: 60 } },
    { title: "톱스타",     salary: 41, need: { sense: 75, str: 20 } },
    { title: "월드스타",   salary: 71, need: { sense: 90, str: 30 } } ] },
  { name: "요리사", college: false, main: "sense", title: "줄 서서 먹는 맛집 셰프", grades: [
    { title: "주방 보조",  salary: 2,  need: { sense: 20, str: 10 } },
    { title: "요리사",     salary: 5,  need: { sense: 30, str: 15 } },
    { title: "셰프",       salary: 11, need: { sense: 40, str: 20 } },
    { title: "스타 셰프",  salary: 23, need: { sense: 50, str: 25 } },
    { title: "요리 명장",  salary: 38, need: { sense: 60, str: 30 } } ] },
  { name: "회사원", college: false, main: "int", title: "성실한 회사의 기둥", grades: [
    { title: "사원", salary: 2,  need: {} },
    { title: "대리", salary: 5,  need: { int: 20 } },
    { title: "과장", salary: 9, need: { int: 30 } },
    { title: "부장", salary: 19, need: { int: 40, sense: 20 } },
    { title: "사장", salary: 34, need: { int: 55, sense: 30 } } ] },
  { name: "유튜버", college: false, main: "sense", title: "구독자 천만 크리에이터", grades: [
    { title: "새내기 유튜버", salary: 1,  need: {} },
    { title: "유튜버",        salary: 3,  need: { sense: 25 } },
    { title: "인기 유튜버",   salary: 11, need: { sense: 40 } },
    { title: "메가 유튜버",   salary: 30, need: { sense: 55, int: 20 } },
    { title: "전설의 유튜버", salary: 53, need: { sense: 70, int: 30 } } ] }
];


// ----- 9. 연애 상대 (직업 랭크 + 재산이 높을수록 좋은 상대 카드가 나와요) -----
// gender : M 남자 / F 여자 (플레이어와 다른 성별만 나와요)
// salary : 결혼하면 월급날마다 같이 들어오는 돈 (만원)
const partners = [
  [
    { name: "동네 친구 민지", gender: "F", salary: 1 },
    { name: "알바생 하린",    gender: "F", salary: 2 },
    { name: "프리랜서 나기사", gender: "F", salary: 1 },
    { name: "동네 친구 준호", gender: "M", salary: 1 },
    { name: "알바생 도윤",    gender: "M", salary: 2 },
    { name: "취준생 시우",    gender: "M", salary: 1 }
  ],
  [
    { name: "회사원 서연", gender: "F", salary: 6 },
    { name: "간호사 유나", gender: "F", salary: 8 },
    { name: "선생님 지아", gender: "F", salary: 7 },
    { name: "회사원 지훈", gender: "M", salary: 6 },
    { name: "소방관 태오", gender: "M", salary: 8 },
    { name: "선생님 민재", gender: "M", salary: 7 }
  ],
  [
    { name: "배우 하늘",   gender: "F", salary: 25 },
    { name: "CEO 다온",    gender: "F", salary: 30 },
    { name: "건물주 수아", gender: "F", salary: 20 },
    { name: "배우 태양",   gender: "M", salary: 25 },
    { name: "CEO 우진",    gender: "M", salary: 30 },
    { name: "건물주 이안", gender: "M", salary: 20 }
  ]
];

// 데이트 장소
const dates = [
  "놀이공원에서 데이트를 했어요 🎢",
  "한강에서 치킨을 먹었어요 🍗",
  "영화관에서 데이트를 했어요 🎬",
  "같이 맛집 탐방을 했어요 🍝",
  "바닷가에서 노을을 봤어요 🌅"
];


// ----- 10. 자녀 -----
// 아이 이름 (성별마다), 아이가 어른이 되면 직업 룰렛으로 정하는 직업 (salary = 월급날마다 보태 주는 돈)
const kidNames = {
  M: ["하준", "도윤", "서준", "시우", "이안", "로운"],
  F: ["서아", "하윤", "지안", "아린", "채이", "나은"]
};
const kidJobs = [
  { name: "회사원",   salary: 5 },
  { name: "선생님",   salary: 7 },
  { name: "간호사",   salary: 7 },
  { name: "요리사",   salary: 6 },
  { name: "개발자",   salary: 12 },
  { name: "디자이너", salary: 10 },
  { name: "의사",     salary: 20 },
  { name: "야구선수", salary: 22 },
  { name: "유튜버",   salary: 15 },
  { name: "아이돌",   salary: 25 }
];


// ----- 11. 직업 칸(★) 이벤트 (능력치가 올라요. 진급은 월급날!) -----
const workEvents = [
  { text: "밤새 야근을 했어요...", str: 5, money: 5 },
  { text: "중요한 발표를 맡았어요!", sense: 10 },
  { text: "업무 공부를 열심히 했어요.", int: 10 },
  { text: "회사 체육대회 MVP!", str: 10 },
  { text: "큰 프로젝트를 성공시켰어요!", int: 5, sense: 5, money: 20 }
];


// ----- 12. 집 (사면 마지막에 sell 가격으로 자산에 들어가요) -----
const houses = [
  { name: "작은 아파트",   price: 300,  sell: 450 },
  { name: "전원주택",      price: 700,  sell: 1050 },
  { name: "한강뷰 아파트", price: 1500, sell: 2300 }
];


// ----- 13. 💎 보물 (보물 칸에서 보물 룰렛, 마지막에 value 만큼 자산에 더해져요) -----
const treasures = [
  { icon: "🐚", name: "황금 조개",       value: 20 },
  { icon: "🪙", name: "옛날 동전",       value: 30 },
  { icon: "📮", name: "희귀 우표",       value: 40 },
  { icon: "🏺", name: "고려청자",        value: 80 },
  { icon: "🖼️", name: "유명한 그림",     value: 120 },
  { icon: "🦖", name: "공룡 화석",       value: 150 },
  { icon: "👑", name: "왕관",            value: 200 },
  { icon: "💍", name: "다이아 반지",     value: 100 },
  { icon: "🎻", name: "명품 바이올린",   value: 90 },
  { icon: "🗿", name: "신비한 석상",     value: 60 }
];


// ----- 14. 🤝 인연 (다른 플레이어와 같은 칸에서 만나면) -----
// 수락하면 두 사람 모두 지력 · 센스 +15 (두 사람은 어린 시절에 한 번, 어른이 되고 한 번까지)
const encounters = [
  "{a}이(가) {b}에게 요리를 가르쳐 달라고 부탁해요!",
  "{a}이(가) {b}에게 사인을 받으러 찾아왔어요!",
  "{a}와(과) {b}이(가) 같이 공부 모임을 만들자고 해요!",
  "{a}이(가) {b}에게 고민 상담을 부탁해요.",
  "{a}와(과) {b}이(가) 우연히 같은 동호회에서 만났어요!"
];


// ----- 15. 🏆 시상식 (마지막에 칭호와 상금, 만원) -----
const awardPrize = 90;


// ----- 16. 칸에서 일어나는 이야기 -----
// good 좋은 일 / bad 나쁜 일 / normal 보통 / event 선택 이벤트
// event 의 choices : chance 는 성공 확률 (1 = 무조건 성공)
const events = {

  baby: {
    good: [
      { text: "할머니가 용돈을 주셨어요!", money: 5, sense: 5 },
      { text: "돌잡이에서 연필을 잡았어요!", int: 5 },
      { text: "돌잡이에서 돈을 잡았어요! 부자 될 운명?", money: 15, sense: 5 },
      { text: "기어다니기 대회 1등!", str: 5 }
    ],
    bad: [
      { text: "감기에 걸려 병원에 갔어요.", money: -5, str: -5 },
      { text: "장난감을 망가뜨렸어요.", money: -5 },
      { text: "밤새 울어서 온 가족이 잠을 못 잤어요.", sense: -5 }
    ],
    normal: [
      { text: "이유식을 먹었어요. 당근은 싫어!" },
      { text: "엄마가 그림책을 읽어 주셨어요.", int: 5 },
      { text: "동요에 맞춰 춤을 췄어요.", sense: 5 }
    ],
    event: [
      {
        text: "장난감 가게 앞! 떼를 써 볼까?",
        choices: [
          { label: "떼쓰기", chance: 0.5, win: { text: "성공! 블록 장난감 획득", sense: 5 }, lose: { text: "혼만 났어요...", sense: -5 } },
          { label: "참기", chance: 1, win: { text: "착하다고 칭찬받았어요.", sense: 5 } }
        ]
      },
      {
        text: "아기 모델 제의가 들어왔어요!",
        choices: [
          { label: "해 본다", chance: 0.4, win: { text: "광고 대박! 출연료를 받았어요.", money: 50, sense: 5, flag: "model" }, lose: { text: "촬영 내내 울기만 했어요..." } },
          { label: "거절", chance: 1, win: { text: "평범하게 무럭무럭 자라요.", str: 5 } }
        ]
      }
    ]
  },

  kinder: {
    good: [
      { text: "재롱잔치 주인공이 되었어요!", sense: 10 },
      { text: "한글을 다 뗐어요!", int: 10 },
      { text: "세뱃돈을 받았어요!", money: 15 },
      { text: "길에서 숫자 카드를 주웠어요!", card: true },
      { when: "model", text: "아기 모델 경력 덕분에 유치원 광고에 나왔어요!", money: 25, sense: 5 },
      { when: "int", text: "영재 테스트를 통과했어요! (🧠 재능)", int: 10 },
      { when: "str", text: "어린이 달리기 대회 우승! (💪 재능)", str: 10 },
      { when: "sense", text: "어린이 패션쇼 모델로 뽑혔어요! (✨ 재능)", sense: 10 }
    ],
    bad: [
      { text: "친구랑 장난감 때문에 싸웠어요.", sense: -5 },
      { text: "넘어져서 무릎이 까졌어요.", str: -5 },
      { text: "크레파스를 다 부러뜨렸어요.", money: -5 }
    ],
    normal: [
      { text: "소풍을 다녀왔어요.", str: 5 },
      { text: "편식하다 선생님께 혼났어요." },
      { text: "숫자 1부터 100까지 셀 수 있게 됐어요.", int: 5 }
    ],
    event: [
      {
        text: "엄마가 피아노 학원에 다니겠냐고 물어봐요.",
        choices: [
          { label: "다닌다", chance: 1, win: { text: "도레미~ 실력이 늘었어요.", money: -10, sense: 10, flag: "piano" } },
          { label: "태권도!", chance: 1, win: { text: "얍! 노란 띠를 땄어요.", money: -10, str: 10, flag: "taekwondo" } }
        ]
      },
      {
        text: "친구가 내 간식을 나눠 달래요.",
        choices: [
          { label: "나눠 준다", chance: 1, win: { text: "단짝 친구가 생겼어요!", sense: 10 } },
          { label: "혼자 먹는다", chance: 0.5, win: { text: "맛있다!", str: 5 }, lose: { text: "친구가 삐졌어요...", sense: -5 } }
        ]
      }
    ]
  },

  elem: {
    good: [
      { text: "받아쓰기 100점!", int: 10 },
      { text: "반장 선거에서 당선됐어요!", sense: 10 },
      { text: "운동회 계주 1등!", str: 10 },
      { text: "용돈을 모아서 저금했어요.", money: 25 },
      { when: "taekwondo", text: "태권도를 계속해서 검은 띠를 땄어요! 🥋", str: 15 },
      { when: "academy", text: "학원에서 배운 게 시험에 그대로 나왔어요!", int: 10 },
      { when: "sports", text: "운동장에서 뛰어놀다 축구부에 뽑혔어요!", str: 10 }
    ],
    bad: [
      { text: "숙제를 안 해서 혼났어요.", int: -5 },
      { text: "몰래 게임 아이템을 샀다가 걸렸어요.", money: -15, sense: -5 },
      { text: "운동장에서 넘어져 깁스를 했어요.", money: -10, str: -5 }
    ],
    normal: [
      { text: "방학 숙제를 마지막 날 몰아서 했어요." },
      { text: "급식에 좋아하는 반찬이 나왔어요.", sense: 5 },
      { text: "문구점 뽑기에서 숫자 카드가 나왔어요!", money: -5, card: true }
    ],
    event: [
      {
        text: "친구가 PC방에 가자고 해요.",
        choices: [
          { label: "간다", chance: 0.5, win: { text: "게임 실력이 늘었어요!", sense: 10, flag: "gamer" }, lose: { text: "엄마한테 딱 걸렸어요...", sense: -10 } },
          { label: "집에서 공부", chance: 1, win: { text: "착실하게 공부했어요.", int: 5 } }
        ]
      },
      {
        text: "과학 경시대회에 나가 볼까요?",
        choices: [
          { label: "도전!", chance: 0.5, win: { text: "금상 수상! 상금도 받았어요.", int: 10, money: 15, flag: "science" }, lose: { text: "아쉽게 떨어졌어요." } },
          { label: "축구하러 간다", chance: 1, win: { text: "골을 넣었어요!", str: 5 } }
        ]
      },
      {
        when: "piano",
        text: "피아노를 배운 덕분에 콩쿠르에 나갈 수 있대요! 🎹",
        choices: [
          { label: "나간다!", chance: 0.5, win: { text: "콩쿠르 대상!", money: 25, sense: 15, flag: "pianist" }, lose: { text: "너무 떨려서 실수했어요...", sense: 5 } },
          { label: "연습만 할래", chance: 1, win: { text: "실력이 꾸준히 늘어요.", sense: 5 } }
        ]
      }
    ]
  },

  middle: {
    good: [
      { text: "첫사랑이 생겼어요 💕", sense: 10 },
      { text: "중간고사 전교 10등!", int: 10 },
      { text: "농구부 주전으로 뽑혔어요!", str: 10 },
      { text: "부모님이 용돈을 올려 주셨어요.", money: 25 },
      { when: "science", text: "과학 경시대회 경력으로 영재반에 뽑혔어요!", int: 15 },
      { when: "pianist", text: "콩쿠르 대상 덕분에 예술중 특기생!", sense: 15 },
      { when: "trainee", text: "연습생 월말 평가 1등!", sense: 10, money: 25 }
    ],
    bad: [
      { text: "사춘기 반항... 부모님과 크게 싸웠어요.", sense: -5 },
      { text: "게임에 빠져서 성적이 떨어졌어요.", int: -10 },
      { text: "휴대폰 액정이 깨졌어요.", money: -15 }
    ],
    normal: [
      { text: "수학여행을 다녀왔어요.", money: -10, sense: 5 },
      { text: "동아리에 가입했어요.", sense: 5 },
      { text: "교복 줄였다가 선생님께 걸렸어요." }
    ],
    event: [
      {
        text: "친구가 아이돌 오디션을 같이 보자고 해요!",
        choices: [
          { label: "도전!", chance: 0.25, win: { text: "연습생 합격!! 계약금을 받았어요.", money: 100, sense: 15, flag: "trainee" }, lose: { text: "떨어졌지만 좋은 경험이었어요.", sense: 5 } },
          { label: "공부할래", chance: 1, win: { text: "그 시간에 공부했어요.", int: 5 } }
        ]
      },
      {
        text: "시험 전날 밤... 게임 딱 한 판만?",
        choices: [
          { label: "한 판만!", chance: 0.3, win: { text: "그래도 시험을 잘 봤어요!", sense: 5 }, lose: { text: "한 판이 열 판이 됐어요... 시험 망함", int: -10 } },
          { label: "참는다", chance: 1, win: { text: "시험 잘 봤어요!", int: 5 } }
        ]
      },
      {
        when: "gamer",
        text: "PC방에서 갈고닦은 실력! 청소년 게임 대회에 나가 볼까?",
        choices: [
          { label: "출전!", chance: 0.4, win: { text: "우승! 프로팀에서 연락이 왔어요!", money: 50, sense: 10, flag: "progamer" }, lose: { text: "예선 탈락... 공부나 하자.", int: -5 } },
          { label: "공부한다", chance: 1, win: { text: "게임은 취미로만!", int: 5 } }
        ]
      }
    ]
  },

  high: {
    good: [
      { text: "모의고사 1등급!", int: 10 },
      { text: "학교 축제 무대가 대박 났어요!", sense: 10 },
      { text: "체육대회 MVP!", str: 10 },
      { text: "장학금을 받았어요.", money: 50 },
      { when: "academy", text: "학원 선생님의 족집게 강의! 모의고사 대박!", int: 10 },
      { when: "progamer", text: "프로게임단 연습생으로 월급을 받아요!", money: 100, sense: 5 }
    ],
    bad: [
      { text: "야자 땡땡이 치다 걸렸어요.", int: -5, sense: -5 },
      { text: "슬럼프가 왔어요...", int: -5 },
      { text: "독서실 비용을 냈어요.", money: -15 }
    ],
    normal: [
      { text: "급식 먹고 꿀잠.", str: 5 },
      { text: "수행평가를 제출했어요.", int: 5 },
      { text: "친구들과 노래방에 갔어요.", sense: 5 }
    ],
    event: [
      {
        text: "편의점 알바를 해 볼까요?",
        choices: [
          { label: "한다", chance: 1, win: { text: "알바비를 받았어요! 공부 시간은 줄었어요.", money: 50, int: -5, str: 5 } },
          { label: "공부한다", chance: 1, win: { text: "공부에 집중했어요.", int: 5 } }
        ]
      },
      {
        text: "유튜브 채널을 만들어 볼까요?",
        choices: [
          { label: "시작!", chance: 0.3, win: { text: "구독자 10만 돌파!", money: 150, sense: 10, flag: "youtuber" }, lose: { text: "조회수 7... 시간만 날렸어요.", int: -5 } },
          { label: "나중에", chance: 1, win: { text: "수능 끝나고 하자!", int: 5 } }
        ]
      },
      {
        when: "trainee",
        text: "드디어 연습생 데뷔 평가 날!",
        choices: [
          { label: "무대에 선다!", chance: 0.4, win: { text: "아이돌로 데뷔했어요!!", money: 250, sense: 15, flag: "idol" }, lose: { text: "데뷔 조에서 떨어졌어요...", sense: 5 } },
          { label: "공부에 집중", chance: 1, win: { text: "연습생을 그만두고 공부에 집중!", int: 10 } }
        ]
      }
    ]
  },

  college: {
    good: [
      { text: "성적 장학금을 받았어요!", money: 30, int: 5 },
      { text: "동아리 공연 대상!", sense: 10 },
      { text: "인턴에 합격했어요!", int: 5, money: 20 },
      { text: "헬스 1년 완주!", str: 10 },
      { when: "youtuber", text: "유튜브 채널에 광고 협찬이 들어왔어요!", money: 50, sense: 5 },
      { when: "idol", text: "아이돌 활동 정산금이 들어왔어요!", money: 80 },
      { when: "dating", text: "연인이 시험 기간에 도시락을 싸 줬어요 💕", int: 5, sense: 5 }
    ],
    bad: [
      { text: "학자금 대출 이자를 냈어요.", money: -20 },
      { text: "학점이 F... 재수강 확정", int: -10 },
      { text: "자취방 월세를 냈어요.", money: -10 },
      { when: "poor", text: "통장이 마이너스... 알바를 두 개 뛰어요.", str: -5, money: 10 }
    ],
    normal: [
      { text: "MT를 다녀왔어요.", money: -10, sense: 5 },
      { text: "도서관에서 밤을 샜어요.", int: 5 },
      { text: "알바비를 받았어요.", money: 10 }
    ],
    event: [
      {
        text: "친구가 같이 창업하자고 해요!",
        choices: [
          { label: "같이 한다", chance: 0.35, win: { text: "앱이 대박 났어요!", money: 200, sense: 10, flag: "startup" }, lose: { text: "망했어요... 빚만 남았어요.", money: -50 } },
          { label: "거절", chance: 1, win: { text: "안전하게 학교생활을 해요.", int: 5 } }
        ]
      },
      {
        text: "해외 교환학생에 지원할까요?",
        choices: [
          { label: "간다", chance: 1, win: { text: "넓은 세상을 보고 왔어요!", money: -50, int: 10, sense: 10, flag: "abroad" } },
          { label: "안 간다", chance: 1, win: { text: "돈을 아꼈어요." } }
        ]
      }
    ]
  },

  young: {
    good: [
      { text: "회사에서 보너스를 받았어요!", money: 100 },
      { text: "친구가 빌려 간 돈을 갚았어요.", money: 30, sense: 5 },
      { text: "자기계발 책을 10권 읽었어요.", int: 10 },
      { text: "운 좋게 숫자 카드를 얻었어요!", card: true, sense: 5 },
      { when: "startup", text: "대학 때 만든 회사가 투자를 받았어요!", money: 300 },
      { when: "youtuber", text: "구독자 100만! 실버 버튼을 받았어요!", money: 100, sense: 10 },
      { when: "abroad", text: "외국어 실력 덕분에 해외 출장 수당!", money: 50 },
      { when: "married", text: "배우자가 승진해서 한턱냈어요!", money: 30, sense: 5 },
      { when: "college", text: "대학 동기가 좋은 일자리를 소개해 줬어요.", money: 30 }
    ],
    bad: [
      { text: "자동차 사고가 났어요.", money: -80 },
      { text: "보이스피싱을 당했어요...", money: -50, sense: -5 },
      { text: "과로로 몸살이 났어요.", str: -10 },
      { when: "kids", text: "아이 어린이집 비용이 나갔어요.", money: -30 },
      { when: "nohouse", text: "전세 보증금이 올랐어요...", money: -40 },
      { when: "house", text: "집 대출 이자를 냈어요.", money: -30 },
      { when: "poor", text: "카드값 독촉 전화가 왔어요...", sense: -5 }
    ],
    normal: [
      { text: "친구 결혼식에 축의금을 냈어요.", money: -10 },
      { text: "헬스장에 등록했어요.", money: -10, str: 5 },
      { text: "이사를 했어요.", money: -20 },
      { when: "kids", text: "아이 돌잔치! 모두가 축하금을 줬어요.", all: 10 },
      { when: "single", text: "친구들이 소개팅을 시켜 줬어요.", sense: 5 },
      { when: "nojob", text: "취업 준비 학원에 등록했어요.", money: -10, int: 10 }
    ],
    event: [
      {
        text: "주식 투자를 해 볼까요?",
        choices: [
          { label: "투자한다", chance: 0.5, win: { text: "주식이 올랐어요!", money: 200, flag: "stock" }, lose: { text: "주식이 폭락했어요...", money: -100, flag: "stock" } },
          { label: "적금 든다", chance: 1, win: { text: "적금 이자를 받았어요.", money: 20 } }
        ]
      },
      {
        text: "주말에 무엇을 할까요?",
        choices: [
          { label: "자격증 공부", chance: 1, win: { text: "자격증 합격!", int: 10 } },
          { label: "운동", chance: 1, win: { text: "몸이 좋아졌어요!", str: 10 } },
          { label: "취미 생활", chance: 1, win: { text: "센스가 늘었어요!", sense: 10 } }
        ]
      },
      {
        when: "dating",
        text: "연인과 해외여행을 갈까요? ✈️",
        choices: [
          { label: "간다!", chance: 1, win: { text: "평생 잊지 못할 추억!", money: -50, sense: 15 } },
          { label: "다음에", chance: 1, win: { text: "돈을 아꼈어요." } }
        ]
      },
      {
        when: "rich",
        text: "돈이 많다는 소문을 듣고 친구가 투자를 권해요.",
        choices: [
          { label: "투자한다", chance: 0.5, win: { text: "투자 성공!", money: 300 }, lose: { text: "친구가 잠적했어요...", money: -300 } },
          { label: "거절", chance: 1, win: { text: "돈은 지키는 게 최고!" } }
        ]
      },
      {
        when: "poor",
        text: "빚이 쌓였어요... 어떻게 할까요?",
        choices: [
          { label: "투잡 뛰기", chance: 1, win: { text: "몸은 힘들지만 빚을 갚아요.", money: 80, str: -5 } },
          { label: "복권 사기", chance: 0.2, win: { text: "복권 당첨!!!", money: 300 }, lose: { text: "꽝...", money: -10 } }
        ]
      }
    ]
  },

  late: {
    good: [
      { text: "부동산 가격이 올랐어요.", money: 200 },
      { text: "자녀가 대회에서 상을 받았어요!", sense: 5 },
      { text: "건강 관리에 성공했어요!", str: 10 },
      { when: "kids", text: "자녀가 첫 월급으로 선물을 사 왔어요!", money: 30, sense: 5 },
      { when: "house", text: "우리 동네 재건축 소식! 집값이 올랐어요.", money: 150 },
      { when: "stock", text: "오래 들고 있던 주식에서 배당금이 나왔어요!", money: 80 },
      { when: "chicken", text: "치킨집 2호점을 열었어요!", money: 200 }
    ],
    bad: [
      { text: "건강검진에서 이상이... 병원비", money: -100, str: -5 },
      { text: "자녀 학원비가 많이 들었어요.", money: -50 },
      { text: "차가 고장 났어요.", money: -40 },
      { when: "kids", text: "자녀 대학 등록금을 냈어요.", money: -100 },
      { when: "nohouse", text: "월세가 또 올랐어요...", money: -50 }
    ],
    normal: [
      { text: "가족 여행을 다녀왔어요.", money: -30, sense: 5 },
      { text: "오랜만에 동창회에 갔어요.", sense: 5 },
      { text: "부모님께 용돈을 드렸어요.", money: -10, sense: 5 },
      { when: "married", text: "결혼기념일 여행을 다녀왔어요 💑", money: -30, sense: 10 },
      { when: "camper", text: "캠핑카 타고 전국 일주!", sense: 10 },
      { when: "single", text: "혼자만의 취미로 그림을 시작했어요.", sense: 10 }
    ],
    event: [
      {
        text: "캠핑카를 살까요?",
        choices: [
          { label: "산다", chance: 1, win: { text: "주말마다 가족 캠핑!", money: -150, flag: "camper", sense: 10 } },
          { label: "참는다", chance: 1, win: { text: "돈을 아꼈어요." } }
        ]
      },
      {
        text: "친구가 같이 치킨집을 차리자고 해요.",
        choices: [
          { label: "차린다", chance: 0.4, win: { text: "동네 맛집 등극!", money: 300, flag: "chicken" }, lose: { text: "장사가 안 돼요...", money: -200 } },
          { label: "거절", chance: 1, win: { text: "회사에 남았어요." } }
        ]
      }
    ]
  },

  senior: {
    good: [
      { text: "손주가 태어났어요!", sense: 10 },
      { text: "연금 복권 당첨!", money: 100 },
      { text: "건강검진 결과 최고!", str: 5 },
      { when: "kids", text: "자녀들이 용돈을 보내 줬어요!", money: 50 },
      { when: "married", text: "배우자와 황혼 여행을 떠났어요 🌅", sense: 10 },
      { when: "idol", text: "레전드 아이돌 재결합 콘서트!", money: 200 },
      { when: "travel", text: "세계 일주 사진으로 책을 냈어요!", money: 50 },
      { when: "poor", text: "기초연금을 받았어요.", money: 30 }
    ],
    bad: [
      { text: "허리 수술을 받았어요.", money: -80 },
      { text: "보이스피싱 전화에 속았어요...", money: -50 },
      { text: "기억력이 떨어졌어요.", int: -5 },
      { when: "rich", text: "자식들이 유산 때문에 다퉈요...", sense: -10 }
    ],
    normal: [
      { text: "등산을 다녀왔어요.", str: 5 },
      { text: "손주에게 용돈을 줬어요.", money: -10, sense: 5 },
      { text: "텃밭에 상추를 심었어요." },
      { when: "single", text: "실버 댄스 동호회에 가입했어요 💃", sense: 10 }
    ],
    event: [
      {
        text: "세계 일주를 떠나 볼까요?",
        choices: [
          { label: "떠난다", chance: 1, win: { text: "평생의 꿈을 이뤘어요!", money: -150, sense: 20, flag: "travel" } },
          { label: "집에 있는다", chance: 1, win: { text: "집이 최고야." } }
        ]
      },
      {
        text: "모은 돈의 일부를 기부할까요?",
        choices: [
          { label: "기부한다", chance: 1, win: { text: "따뜻한 마음을 나눴어요.", money: -100, sense: 15 } },
          { label: "안 한다", chance: 1, win: { text: "노후 자금을 지켰어요." } }
        ]
      },
      {
        when: "house",
        text: "집을 작은 곳으로 옮기고 남은 돈을 쓸까요?",
        choices: [
          { label: "옮긴다", chance: 1, win: { text: "차액으로 여유가 생겼어요.", money: 100 } },
          { label: "그냥 산다", chance: 1, win: { text: "정든 집이 최고!", sense: 5 } }
        ]
      }
    ]
  },

  // 한방역전섬 : 큰돈이 왔다 갔다!
  gamble: {
    good: [
      { text: "카지노 잭팟!!!", money: 800 },
      { text: "숨겨진 보물을 찾았어요!", money: 500 }
    ],
    bad: [
      { text: "전 재산 투자 실패...", money: -500 },
      { text: "사기꾼에게 당했어요.", money: -300 }
    ],
    normal: [
      { text: "섬에서 낚시를 했어요.", sense: 5 }
    ],
    event: [
      {
        text: "🎰 인생 한 방! 5000만원을 걸어 볼까요?",
        choices: [
          { label: "건다!", chance: 0.45, win: { text: "대박!!! 3배로 돌아왔어요!", money: 1000 }, lose: { text: "쪽박...", money: -500 } },
          { label: "참는다", chance: 1, win: { text: "현명한 선택이에요." } }
        ]
      },
      {
        text: "🎲 주사위 도박! 홀? 짝?",
        choices: [
          { label: "홀!", chance: 0.5, win: { text: "맞혔다!", money: 400 }, lose: { text: "틀렸다...", money: -300 } },
          { label: "짝!", chance: 0.5, win: { text: "맞혔다!", money: 400 }, lose: { text: "틀렸다...", money: -300 } }
        ]
      },
      {
        text: "💎 수상한 상인이 보석을 팔아요.",
        choices: [
          { label: "산다", chance: 0.35, win: { text: "진짜 다이아몬드였어요!", money: 700 }, lose: { text: "가짜였어요...", money: -200 } },
          { label: "안 산다", chance: 1, win: { text: "수상한 건 피하는 게 최고." } }
        ]
      },
      {
        when: "rich",
        text: "💎 부자만 들어가는 VIP 룸에 초대받았어요!",
        choices: [
          { label: "들어간다", chance: 0.4, win: { text: "VIP 잭팟!!!", money: 1200 }, lose: { text: "큰돈을 잃었어요...", money: -800 } },
          { label: "사양한다", chance: 1, win: { text: "부자는 몸을 사려요." } }
        ]
      },
      {
        when: "poor",
        text: "🎲 빚을 갚을 마지막 기회! 인생 역전 주사위!",
        choices: [
          { label: "던진다!", chance: 0.5, win: { text: "역전 성공!!", money: 600 }, lose: { text: "빚이 더 늘었어요...", money: -200 } },
          { label: "포기", chance: 1, win: { text: "조용히 섬을 떠나요." } }
        ]
      }
    ]
  }
};
