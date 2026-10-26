// =====================================================
// 게임 데이터 (스토리 · 밸런스 담당이 마음대로 고쳐도 돼요!)
//
// 이벤트 결과에 쓸 수 있는 값 (필요한 것만 쓰면 됨)
//   money : 💰 자산 (만원)
//   int   : 🧠 지력      str : 💪 체력      sense : ✨ 센스
//   luck  : 🍀 운세 (높을수록 도전 성공 확률 UP)
//   all   : 다른 플레이어 1명당 받는 돈 (마이너스면 주는 돈)
//   card  : true 면 숫자 카드 1장 획득
// =====================================================


// ----- 1. 지역 (인생 단계) -----
// pool : 이 지역에서 어떤 이야기 묶음(events)을 쓸지
const areas = {
  baby:     { name: "👶 아기",           pool: "baby",    story: "응애! 세상에 태어났어요." },
  toddler:  { name: "🧸 유아",           pool: "baby",    story: "아장아장, 세상 모든 게 신기해요!" },
  kinder:   { name: "🎒 유치원",         pool: "kinder",  story: "처음으로 친구들을 만났어요." },
  elem:     { name: "🏫 초등학교",       pool: "elem",    story: "책가방을 메고 초등학교 입학!" },
  academy:  { name: "✏️ 학원 길",        pool: "elem",    story: "학원 뺑뺑이... 힘들지만 머리가 좋아져요." },
  play:     { name: "⚽ 운동장 길",      pool: "elem",    story: "해 질 때까지 뛰어놀며 튼튼해져요!" },
  middle:   { name: "📘 중학교",         pool: "middle",  story: "사춘기가 찾아왔다..." },
  high:     { name: "📝 고등학교",       pool: "high",    story: "수능까지 D-1000!" },
  college:  { name: "🎓 대학교",         pool: "college", story: "꿈에 그리던 캠퍼스 라이프!" },
  work:     { name: "💼 바로 취업",      pool: "college", story: "남들보다 한 발 먼저 사회로!" },
  young:    { name: "🏙️ 성인 초반",      pool: "young",   story: "진짜 어른의 삶이 시작됐어요." },
  lovepath: { name: "💕 연애 집중 길",   pool: "young",   story: "사랑을 찾아 떠나는 길!" },
  workpath: { name: "💼 일 집중 길",     pool: "young",   story: "일에 모든 걸 건다!" },
  late:     { name: "🏡 성인 후반",      pool: "late",    story: "가족과 집을 지키는 든든한 어른." },
  senior:   { name: "🏝️ 황혼기",         pool: "senior",  story: "은퇴 후, 인생 2막이 시작됐어요." },
  sea:      { name: "🌊 평온한 바닷길",  pool: "senior",  story: "여유롭게 바다를 따라 걸어요." },
  gamble:   { name: "🎰 한방역전섬",     pool: "gamble",  story: "인생 마지막 한 방! 대박 아니면 쪽박!" }
};


// ----- 2. 재능 (유아 시절에 하나 받음 → 그 능력치는 2배로 오름) -----
const talents = [
  { key: "int",   name: "🧠 지력", text: "책을 거꾸로 들고도 읽는 천재 아기!" },
  { key: "str",   name: "💪 체력", text: "기저귀 차고 달리기 1등!" },
  { key: "sense", name: "✨ 센스", text: "옷 입는 센스가 남다른 아기!" }
];


// ----- 3. 숫자 카드 (룰렛 대신 사용, min~max 사이에서 이동) -----
const numberCards = [
  { name: "🐢 거북이 카드", min: 1, max: 3 },
  { name: "🚶 산책 카드",   min: 4, max: 6 },
  { name: "🚗 자동차 카드", min: 6, max: 8 },
  { name: "🚀 로켓 카드",   min: 8, max: 10 }
];


// ----- 4. 갈림길 -----
// routes 순서 = 지도(map.js)의 next 순서
const forks = {
  f0: {
    title: "방과 후 어디로 갈까?",
    text: "학원에 가면 머리가, 운동장에 가면 몸이 튼튼해져요.",
    routes: [
      { label: "✏️ 학원 길", desc: "🧠+2 · 긴 길", int: 2 },
      { label: "⚽ 운동장 길", desc: "💪+2 · 짧은 길", str: 2 }
    ]
  },
  f1: {
    title: "진로 선택",
    text: "고등학교 졸업! 이제 어떻게 할까요?",
    routes: [
      { label: "🎓 대학 진학", desc: "등록금이 들지만 대졸 직업 가능 · 긴 길" },
      { label: "💼 바로 취업", desc: "빨리 사회로 · 짧은 길" }
    ]
  },
  f2: {
    title: "무엇에 집중할까?",
    text: "사랑을 찾을까, 일에서 성공할까?",
    routes: [
      { label: "💕 연애 집중", desc: "♥ 연애 칸이 많아요" },
      { label: "💼 일 집중", desc: "★ 직업 칸이 많아요" }
    ]
  },
  f3: {
    title: "황혼기의 선택",
    text: "평온하게 갈까, 한방역전섬에서 인생을 걸어 볼까?",
    routes: [
      { label: "🌊 평온한 바닷길", desc: "🍀+1 · 좋은 일이 많아요", luck: 1 },
      { label: "🎰 한방역전섬", desc: "대박 아니면 쪽박!" }
    ]
  }
};


// ----- 5. 인생 이벤트 칸 (무조건 멈추는 칸) -----
// talent, exam, college, job, house, retire 는 script.js 에서 특별 처리
const lifeEvents = {
  talent:  { label: "재능 발견",     title: "🌟 재능 발견!",     text: "어떤 재능을 타고났을까요?" },
  kinder:  { label: "유치원 입학",   title: "🎒 유치원 입학",    text: "새 친구들이 생겼어요!", sense: 1 },
  elem:    { label: "초등학교 입학", title: "🏫 초등학교 입학",  text: "받아쓰기 100점을 향해!", int: 1, str: 1 },
  middle:  { label: "중학교 입학",   title: "📘 중학교 입학",    text: "처음으로 교복을 입었어요.", int: 1, sense: 1 },
  high:    { label: "고등학교 입학", title: "📝 고등학교 입학",  text: "이제 진짜 공부할 시간!", int: 1, str: 1 },
  exam:    { label: "수능",          title: "✏️ 수능 날",        text: "그동안 공부한 실력을 보여줄 시간!" },
  college: { label: "대학 입학",     title: "🎓 대학 입학",      text: "대학생이 되었어요! 대졸 직업을 가질 수 있어요.", money: -2000, int: 2 },
  job:     { label: "취업",          title: "💼 성년! 직업 선택", text: "능력치가 충분한 직업만 고를 수 있어요." },
  house:   { label: "내 집 마련",    title: "🏠 내 집 마련",     text: "집을 사면 게임이 끝날 때 더 비싸게 팔아요!" },
  retire:  { label: "정년 퇴직",     title: "🎉 정년 퇴직",      text: "수고 많으셨어요! 퇴직금을 받고, 월급 대신 연금(절반)을 받아요.", money: 3000 }
};


// ----- 6. 직업 (등급이 오를수록 월급 UP, need = 필요한 최소 능력치) -----
const jobs = [
  { name: "의사", college: true, grades: [
    { title: "인턴",     salary: 500,  need: { int: 12 } },
    { title: "전문의",   salary: 900,  need: { int: 18 } },
    { title: "병원장",   salary: 1500, need: { int: 24, sense: 8 } } ] },
  { name: "변호사", college: true, grades: [
    { title: "수습 변호사", salary: 450,  need: { int: 10, sense: 4 } },
    { title: "변호사",      salary: 800,  need: { int: 15, sense: 8 } },
    { title: "대표 변호사", salary: 1300, need: { int: 20, sense: 12 } } ] },
  { name: "개발자", college: true, grades: [
    { title: "주니어 개발자", salary: 400,  need: { int: 8 } },
    { title: "시니어 개발자", salary: 700,  need: { int: 13, sense: 6 } },
    { title: "CTO",           salary: 1200, need: { int: 18, sense: 10 } } ] },
  { name: "운동선수", college: false, grades: [
    { title: "신인 선수", salary: 350,  need: { str: 10 } },
    { title: "국가대표",  salary: 700,  need: { str: 16 } },
    { title: "레전드",    salary: 1200, need: { str: 22, sense: 6 } } ] },
  { name: "연예인", college: false, grades: [
    { title: "연습생",   salary: 250,  need: { sense: 10 } },
    { title: "스타",     salary: 700,  need: { sense: 16 } },
    { title: "월드스타", salary: 1400, need: { sense: 22, str: 8 } } ] },
  { name: "요리사", college: false, grades: [
    { title: "주방 보조",  salary: 300,  need: { sense: 5, str: 3 } },
    { title: "셰프",       salary: 550,  need: { sense: 10, str: 6 } },
    { title: "스타 셰프",  salary: 1000, need: { sense: 15, str: 10 } } ] },
  { name: "회사원", college: false, grades: [
    { title: "사원", salary: 300,  need: {} },
    { title: "과장", salary: 500,  need: { int: 6 } },
    { title: "사장", salary: 1000, need: { int: 12, sense: 10 } } ] },
  { name: "유튜버", college: false, grades: [
    { title: "새내기 유튜버", salary: 200,  need: {} },
    { title: "인기 유튜버",   salary: 500,  need: { sense: 8 } },
    { title: "메가 유튜버",   salary: 1100, need: { sense: 14, int: 6 } } ] }
];


// ----- 7. 연애 상대 (내 직업 등급이 높을수록 좋은 상대가 나와요) -----
// [0] 직업 없음/1등급  [1] 2등급  [2] 3등급
// salary : 결혼하면 월급날마다 같이 들어오는 돈
const partners = [
  [
    { name: "동네 친구 민지", salary: 150 },
    { name: "알바생 준호",    salary: 150 },
    { name: "취준생 하린",    salary: 100 }
  ],
  [
    { name: "회사원 서연", salary: 350 },
    { name: "선생님 지훈", salary: 400 },
    { name: "간호사 유나", salary: 400 }
  ],
  [
    { name: "배우 하늘",   salary: 800 },
    { name: "CEO 태양",    salary: 1000 },
    { name: "건물주 다온", salary: 900 }
  ]
];

// 데이트 장소 (애정도 증가)
const dates = [
  "놀이공원에서 데이트를 했어요 🎢",
  "한강에서 치킨을 먹었어요 🍗",
  "영화관에서 데이트를 했어요 🎬",
  "같이 맛집 탐방을 했어요 🍝",
  "바닷가에서 노을을 봤어요 🌅"
];


// ----- 8. 직업 칸(★) 이벤트 (능력치가 오르고, 조건이 되면 승진!) -----
const workEvents = [
  { text: "밤새 야근을 했어요...", str: 1, money: 100 },
  { text: "중요한 발표를 맡았어요!", sense: 2 },
  { text: "업무 공부를 열심히 했어요.", int: 2 },
  { text: "회사 체육대회 MVP!", str: 2 },
  { text: "큰 프로젝트를 성공시켰어요!", int: 1, sense: 1, money: 300 }
];


// ----- 9. 집 -----
const houses = [
  { name: "작은 아파트",   price: 2000, sell: 3000 },
  { name: "전원주택",      price: 4000, sell: 6000 },
  { name: "한강뷰 아파트", price: 8000, sell: 13000 }
];


// ----- 10. 칸에서 일어나는 이야기 -----
// good 좋은 일 / bad 나쁜 일 / normal 보통 / event 선택 이벤트
// event 의 choices : chance 는 성공 확률 (1 = 무조건 성공, 운세가 높으면 UP)
const events = {

  baby: {
    good: [
      { text: "할머니가 용돈을 주셨어요!", money: 10, luck: 1 },
      { text: "돌잡이에서 연필을 잡았어요!", int: 1 },
      { text: "돌잡이에서 돈을 잡았어요! 부자 될 운명?", money: 30, luck: 1 },
      { text: "기어다니기 대회 1등!", str: 1 }
    ],
    bad: [
      { text: "감기에 걸려 병원에 갔어요.", money: -10, str: -1 },
      { text: "장난감을 망가뜨렸어요.", money: -5 },
      { text: "밤새 울어서 온 가족이 잠을 못 잤어요.", luck: -1 }
    ],
    normal: [
      { text: "이유식을 먹었어요. 당근은 싫어!" },
      { text: "엄마가 그림책을 읽어 주셨어요.", int: 1 },
      { text: "동요에 맞춰 춤을 췄어요.", sense: 1 }
    ],
    event: [
      {
        text: "장난감 가게 앞! 떼를 써 볼까?",
        choices: [
          { label: "떼쓰기", chance: 0.5, win: { text: "성공! 블록 장난감 획득", sense: 1 }, lose: { text: "혼만 났어요...", luck: -1 } },
          { label: "참기", chance: 1, win: { text: "착하다고 칭찬받았어요.", luck: 1 } }
        ]
      },
      {
        text: "아기 모델 제의가 들어왔어요!",
        choices: [
          { label: "해 본다", chance: 0.4, win: { text: "광고 대박! 출연료를 받았어요.", money: 100, sense: 1 }, lose: { text: "촬영 내내 울기만 했어요..." } },
          { label: "거절", chance: 1, win: { text: "평범하게 무럭무럭 자라요.", str: 1 } }
        ]
      }
    ]
  },

  kinder: {
    good: [
      { text: "재롱잔치 주인공이 되었어요!", sense: 2 },
      { text: "한글을 다 뗐어요!", int: 2 },
      { text: "세뱃돈을 받았어요!", money: 30 },
      { text: "길에서 숫자 카드를 주웠어요!", card: true }
    ],
    bad: [
      { text: "친구랑 장난감 때문에 싸웠어요.", sense: -1 },
      { text: "넘어져서 무릎이 까졌어요.", str: -1 },
      { text: "크레파스를 다 부러뜨렸어요.", money: -5 }
    ],
    normal: [
      { text: "소풍을 다녀왔어요.", str: 1 },
      { text: "편식하다 선생님께 혼났어요." },
      { text: "숫자 1부터 100까지 셀 수 있게 됐어요.", int: 1 }
    ],
    event: [
      {
        text: "엄마가 피아노 학원에 다니겠냐고 물어봐요.",
        choices: [
          { label: "다닌다", chance: 1, win: { text: "도레미~ 실력이 늘었어요.", money: -20, sense: 2 } },
          { label: "태권도!", chance: 1, win: { text: "얍! 노란 띠를 땄어요.", money: -20, str: 2 } }
        ]
      },
      {
        text: "친구가 내 간식을 나눠 달래요.",
        choices: [
          { label: "나눠 준다", chance: 1, win: { text: "단짝 친구가 생겼어요!", luck: 1, sense: 1 } },
          { label: "혼자 먹는다", chance: 0.5, win: { text: "맛있다!", str: 1 }, lose: { text: "친구가 삐졌어요...", sense: -1 } }
        ]
      }
    ]
  },

  elem: {
    good: [
      { text: "받아쓰기 100점!", int: 2 },
      { text: "반장 선거에서 당선됐어요!", sense: 2 },
      { text: "운동회 계주 1등!", str: 2 },
      { text: "용돈을 모아서 저금했어요.", money: 50 }
    ],
    bad: [
      { text: "숙제를 안 해서 혼났어요.", int: -1 },
      { text: "몰래 게임 아이템을 샀다가 걸렸어요.", money: -30, luck: -1 },
      { text: "운동장에서 넘어져 깁스를 했어요.", money: -20, str: -1 }
    ],
    normal: [
      { text: "방학 숙제를 마지막 날 몰아서 했어요." },
      { text: "급식에 좋아하는 반찬이 나왔어요.", luck: 1 },
      { text: "문구점 뽑기에서 숫자 카드가 나왔어요!", money: -5, card: true }
    ],
    event: [
      {
        text: "친구가 PC방에 가자고 해요.",
        choices: [
          { label: "간다", chance: 0.5, win: { text: "게임 실력이 늘었어요!", sense: 2 }, lose: { text: "엄마한테 딱 걸렸어요...", luck: -2 } },
          { label: "집에서 공부", chance: 1, win: { text: "착실하게 공부했어요.", int: 1 } }
        ]
      },
      {
        text: "과학 경시대회에 나가 볼까요?",
        choices: [
          { label: "도전!", chance: 0.5, win: { text: "금상 수상! 상금도 받았어요.", int: 2, money: 30 }, lose: { text: "아쉽게 떨어졌어요." } },
          { label: "축구하러 간다", chance: 1, win: { text: "골을 넣었어요!", str: 1 } }
        ]
      }
    ]
  },

  middle: {
    good: [
      { text: "첫사랑이 생겼어요 💕", sense: 2 },
      { text: "중간고사 전교 10등!", int: 2 },
      { text: "농구부 주전으로 뽑혔어요!", str: 2 },
      { text: "부모님이 용돈을 올려 주셨어요.", money: 50 }
    ],
    bad: [
      { text: "사춘기 반항... 부모님과 크게 싸웠어요.", luck: -1 },
      { text: "게임에 빠져서 성적이 떨어졌어요.", int: -2 },
      { text: "휴대폰 액정이 깨졌어요.", money: -30 }
    ],
    normal: [
      { text: "수학여행을 다녀왔어요.", money: -20, sense: 1 },
      { text: "동아리에 가입했어요.", sense: 1 },
      { text: "교복 줄였다가 선생님께 걸렸어요." }
    ],
    event: [
      {
        text: "친구가 아이돌 오디션을 같이 보자고 해요!",
        choices: [
          { label: "도전!", chance: 0.25, win: { text: "연습생 합격!! 계약금을 받았어요.", money: 200, sense: 3 }, lose: { text: "떨어졌지만 좋은 경험이었어요.", sense: 1 } },
          { label: "공부할래", chance: 1, win: { text: "그 시간에 공부했어요.", int: 1 } }
        ]
      },
      {
        text: "시험 전날 밤... 게임 딱 한 판만?",
        choices: [
          { label: "한 판만!", chance: 0.3, win: { text: "그래도 시험을 잘 봤어요!", luck: 1 }, lose: { text: "한 판이 열 판이 됐어요... 시험 망함", int: -2 } },
          { label: "참는다", chance: 1, win: { text: "시험 잘 봤어요!", int: 1 } }
        ]
      }
    ]
  },

  high: {
    good: [
      { text: "모의고사 1등급!", int: 2 },
      { text: "학교 축제 무대가 대박 났어요!", sense: 2 },
      { text: "체육대회 MVP!", str: 2 },
      { text: "장학금을 받았어요.", money: 100 }
    ],
    bad: [
      { text: "야자 땡땡이 치다 걸렸어요.", int: -1, luck: -1 },
      { text: "슬럼프가 왔어요...", int: -1 },
      { text: "독서실 비용을 냈어요.", money: -30 }
    ],
    normal: [
      { text: "급식 먹고 꿀잠.", str: 1 },
      { text: "수행평가를 제출했어요.", int: 1 },
      { text: "친구들과 노래방에 갔어요.", sense: 1 }
    ],
    event: [
      {
        text: "편의점 알바를 해 볼까요?",
        choices: [
          { label: "한다", chance: 1, win: { text: "알바비를 받았어요! 공부 시간은 줄었어요.", money: 100, int: -1, str: 1 } },
          { label: "공부한다", chance: 1, win: { text: "공부에 집중했어요.", int: 1 } }
        ]
      },
      {
        text: "유튜브 채널을 만들어 볼까요?",
        choices: [
          { label: "시작!", chance: 0.3, win: { text: "구독자 10만 돌파!", money: 300, sense: 2 }, lose: { text: "조회수 7... 시간만 날렸어요.", int: -1 } },
          { label: "나중에", chance: 1, win: { text: "수능 끝나고 하자!", int: 1 } }
        ]
      }
    ]
  },

  college: {
    good: [
      { text: "성적 장학금을 받았어요!", money: 300, int: 1 },
      { text: "동아리 공연 대상!", sense: 2 },
      { text: "인턴에 합격했어요!", int: 1, money: 200 },
      { text: "헬스 1년 완주!", str: 2 }
    ],
    bad: [
      { text: "학자금 대출 이자를 냈어요.", money: -200 },
      { text: "학점이 F... 재수강 확정", int: -2 },
      { text: "자취방 월세를 냈어요.", money: -150 }
    ],
    normal: [
      { text: "MT를 다녀왔어요.", money: -30, sense: 1 },
      { text: "도서관에서 밤을 샜어요.", int: 1 },
      { text: "알바비를 받았어요.", money: 100 }
    ],
    event: [
      {
        text: "친구가 같이 창업하자고 해요!",
        choices: [
          { label: "같이 한다", chance: 0.35, win: { text: "앱이 대박 났어요!", money: 2000, sense: 2 }, lose: { text: "망했어요... 빚만 남았어요.", money: -500 } },
          { label: "거절", chance: 1, win: { text: "안전하게 학교생활을 해요.", int: 1 } }
        ]
      },
      {
        text: "해외 교환학생에 지원할까요?",
        choices: [
          { label: "간다", chance: 1, win: { text: "넓은 세상을 보고 왔어요!", money: -500, int: 2, sense: 2 } },
          { label: "안 간다", chance: 1, win: { text: "돈을 아꼈어요." } }
        ]
      }
    ]
  },

  young: {
    good: [
      { text: "회사에서 보너스를 받았어요!", money: 1000 },
      { text: "친구가 빌려 간 돈을 갚았어요.", money: 300, luck: 1 },
      { text: "자기계발 책을 10권 읽었어요.", int: 2 },
      { text: "운 좋게 숫자 카드를 얻었어요!", card: true, luck: 1 }
    ],
    bad: [
      { text: "자동차 사고가 났어요.", money: -800 },
      { text: "보이스피싱을 당했어요...", money: -500, luck: -1 },
      { text: "과로로 몸살이 났어요.", str: -2 }
    ],
    normal: [
      { text: "친구 결혼식에 축의금을 냈어요.", money: -50 },
      { text: "헬스장에 등록했어요.", money: -30, str: 1 },
      { text: "이사를 했어요.", money: -200 }
    ],
    event: [
      {
        text: "주식 투자를 해 볼까요?",
        choices: [
          { label: "투자한다", chance: 0.5, win: { text: "주식이 올랐어요!", money: 2000 }, lose: { text: "주식이 폭락했어요...", money: -1000 } },
          { label: "적금 든다", chance: 1, win: { text: "적금 이자를 받았어요.", money: 200 } }
        ]
      },
      {
        text: "주말에 무엇을 할까요?",
        choices: [
          { label: "자격증 공부", chance: 1, win: { text: "자격증 합격!", int: 2 } },
          { label: "운동", chance: 1, win: { text: "몸이 좋아졌어요!", str: 2 } },
          { label: "취미 생활", chance: 1, win: { text: "센스가 늘었어요!", sense: 2 } }
        ]
      }
    ]
  },

  late: {
    good: [
      { text: "부동산 가격이 올랐어요.", money: 2000 },
      { text: "자녀가 대회에서 상을 받았어요!", luck: 1 },
      { text: "건강 관리에 성공했어요!", str: 2 }
    ],
    bad: [
      { text: "건강검진에서 이상이... 병원비", money: -1000, str: -1 },
      { text: "자녀 학원비가 많이 들었어요.", money: -500 },
      { text: "차가 고장 났어요.", money: -400 }
    ],
    normal: [
      { text: "가족 여행을 다녀왔어요.", money: -300, luck: 1 },
      { text: "오랜만에 동창회에 갔어요.", sense: 1 },
      { text: "부모님께 용돈을 드렸어요.", money: -100, luck: 1 }
    ],
    event: [
      {
        text: "캠핑카를 살까요?",
        choices: [
          { label: "산다", chance: 1, win: { text: "주말마다 가족 캠핑!", money: -1500, luck: 2 } },
          { label: "참는다", chance: 1, win: { text: "돈을 아꼈어요." } }
        ]
      },
      {
        text: "친구가 같이 치킨집을 차리자고 해요.",
        choices: [
          { label: "차린다", chance: 0.4, win: { text: "동네 맛집 등극!", money: 3000 }, lose: { text: "장사가 안 돼요...", money: -2000 } },
          { label: "거절", chance: 1, win: { text: "회사에 남았어요." } }
        ]
      }
    ]
  },

  senior: {
    good: [
      { text: "손주가 태어났어요!", luck: 2 },
      { text: "연금 복권 당첨!", money: 1000 },
      { text: "건강검진 결과 최고!", str: 1 }
    ],
    bad: [
      { text: "허리 수술을 받았어요.", money: -800 },
      { text: "보이스피싱 전화에 속았어요...", money: -500 },
      { text: "기억력이 떨어졌어요.", int: -1 }
    ],
    normal: [
      { text: "등산을 다녀왔어요.", str: 1 },
      { text: "손주에게 용돈을 줬어요.", money: -50, luck: 1 },
      { text: "텃밭에 상추를 심었어요." }
    ],
    event: [
      {
        text: "세계 일주를 떠나 볼까요?",
        choices: [
          { label: "떠난다", chance: 1, win: { text: "평생의 꿈을 이뤘어요!", money: -1500, sense: 2, luck: 2 } },
          { label: "집에 있는다", chance: 1, win: { text: "집이 최고야." } }
        ]
      },
      {
        text: "모은 돈의 일부를 기부할까요?",
        choices: [
          { label: "기부한다", chance: 1, win: { text: "따뜻한 마음을 나눴어요.", money: -1000, luck: 3 } },
          { label: "안 한다", chance: 1, win: { text: "노후 자금을 지켰어요." } }
        ]
      }
    ]
  },

  // 한방역전섬 : 큰돈이 왔다 갔다!
  gamble: {
    good: [
      { text: "카지노 잭팟!!!", money: 8000 },
      { text: "숨겨진 보물을 찾았어요!", money: 5000 }
    ],
    bad: [
      { text: "전 재산 투자 실패...", money: -5000 },
      { text: "사기꾼에게 당했어요.", money: -3000 }
    ],
    normal: [
      { text: "섬에서 낚시를 했어요.", luck: 1 }
    ],
    event: [
      {
        text: "🎰 인생 한 방! 5000만원을 걸어 볼까요?",
        choices: [
          { label: "건다!", chance: 0.45, win: { text: "대박!!! 3배로 돌아왔어요!", money: 10000 }, lose: { text: "쪽박...", money: -5000 } },
          { label: "참는다", chance: 1, win: { text: "현명한 선택이에요." } }
        ]
      },
      {
        text: "🎲 주사위 도박! 홀? 짝?",
        choices: [
          { label: "홀!", chance: 0.5, win: { text: "맞혔다!", money: 4000 }, lose: { text: "틀렸다...", money: -3000 } },
          { label: "짝!", chance: 0.5, win: { text: "맞혔다!", money: 4000 }, lose: { text: "틀렸다...", money: -3000 } }
        ]
      },
      {
        text: "💎 수상한 상인이 보석을 팔아요.",
        choices: [
          { label: "산다", chance: 0.35, win: { text: "진짜 다이아몬드였어요!", money: 7000 }, lose: { text: "가짜였어요...", money: -2000 } },
          { label: "안 산다", chance: 1, win: { text: "수상한 건 피하는 게 최고." } }
        ]
      }
    ]
  }
};
