// =====================================================
// 1. 이미지 경로
//    디자인 팀 그림이 오면 여기 경로만 바꾸면 돼요!
// =====================================================
const images = {
  logo: "assets/ui/logo.svg",
  map: "assets/ui/map-bg.svg",
  roulette: "assets/ui/roulette.svg",
  tiles: {
    good: "assets/tiles/good.svg",
    bad: "assets/tiles/bad.svg",
    normal: "assets/tiles/normal.svg",
    event: "assets/tiles/event.svg",
    pay: "assets/tiles/pay.svg",
    love: "assets/tiles/love.svg",
    work: "assets/tiles/work.svg",
    card: "assets/tiles/card.svg",
    lucky: "assets/tiles/lucky.svg",
    treasure: "assets/tiles/treasure.svg",
    fork: "assets/tiles/fork.svg",
    start: "assets/tiles/start.svg",
    goal: "assets/tiles/goal.svg"
  },
  life: {
    talent: "assets/tiles/talent.svg",
    kinder: "assets/tiles/kinder.svg",
    elem: "assets/tiles/elem.svg",
    middle: "assets/tiles/middle.svg",
    high: "assets/tiles/high.svg",
    exam: "assets/tiles/exam.svg",
    college: "assets/tiles/college.svg",
    job: "assets/tiles/job.svg",
    marry: "assets/tiles/marry.svg",
    house: "assets/tiles/house.svg",
    retire: "assets/tiles/retire.svg"
  }
};

// 캐릭터 목록
const characters = [
  { name: "토리",   img: "assets/characters/char1.svg", color: "#f06595" },
  { name: "블루",   img: "assets/characters/char2.svg", color: "#339af0" },
  { name: "새싹이", img: "assets/characters/char3.svg", color: "#40c057" },
  { name: "삐약이", img: "assets/characters/char4.svg", color: "#fab005" }
];

// 능력치 이름 (3대 능력치)
const statNames = { int: "🧠지력", str: "💪체력", sense: "✨센스" };

// 능력치 등급 : 이 값 이상이면 그 등급 (F → S)
const gradeLines = [
  { min: 80, grade: "S", color: "#f03e3e" },
  { min: 65, grade: "A", color: "#f76707" },
  { min: 50, grade: "B", color: "#f59f00" },
  { min: 35, grade: "C", color: "#37b24d" },
  { min: 20, grade: "D", color: "#1c7ed6" },
  { min: 10, grade: "E", color: "#7048e8" },
  { min: 0,  grade: "F", color: "#868e96" }
];

// 재능 능력치는 이 배수로 올라요
const talentBonus = 1.5;

// 🏦 대출 : 돈이 마이너스가 되면 자동으로 1건씩 (만원)
const debtUnit = 100;     // 1건에 받는 돈
const debtInterest = 10;  // 월급날마다 1건당 내는 이자
const debtPenalty = 150;  // 마지막 정산 때 1건당 갚는 돈 (원금의 1.5배)

// 🤝 인연 : 수락하면 두 사람 모두 지력 · 센스가 이만큼
const meetBonus = 15;

// 칸 종류별 팝업 제목
const typeTitles = { good: "😆 좋은 일!", bad: "😱 나쁜 일...", normal: "🙂 평범한 하루" };

// 골인 순서별 보너스 (1등, 2등, 3등, 4등)
const goalBonus = [300, 200, 100, 50];

// 미니게임 : 몇 바퀴마다 할지
const minigameEvery = 1;
// 🎁 상금 룰렛 10칸 (money = 성인 1등 상금(만원), stat = 미성년자 1등 능력치)
const miniPrizes = [
  { money: 5, stat: 5 }, { money: 5, stat: 5 }, { money: 5, stat: 5 },
  { money: 10, stat: 10 }, { money: 10, stat: 10 }, { money: 10, stat: 10 }, { money: 10, stat: 10 },
  { money: 15, stat: 15 }, { money: 20, stat: 15 }, { money: 30, stat: 25 }
];
const miniShare = [1, 0.5, 0.3, 0]; // 등수별로 1등 상금의 몇 배를 받는지

// 🎁 축의금 룰렛 10칸 (다른 사람 한 명마다 받는 돈, 만원)
const giftAmounts = [5, 5, 10, 10, 15, 15, 20, 20, 30, 50];
// 🎰 골인한 사람의 보너스 룰렛 10칸 (만원)
const bonusAmounts = [10, 10, 20, 20, 30, 40, 40, 60, 80, 100];
// ⭐ 럭키 칸 룰렛 10칸 (성인 : 만원)
const luckyAmounts = [10, 10, 20, 20, 30, 30, 50, 50, 80, 100];

// 결혼 후 연애 칸 : 특별한 데이트 비용, 최대 자녀 수
const specialDateCost = 20;
const maxKids = 4;

// 🎡 확률 룰렛 칸 색깔 (X 실패, O 성공, ◎ 대성공)
const slotColors = { "X": "#ff8787", "O": "#4dabf7", "◎": "#fcc419" };
const otherColors = ["#ffa94d", "#69db7c", "#b197fc", "#f783ac", "#38d9a9", "#ffd43b", "#748ffc", "#ff8787", "#4dabf7", "#a9e34b"];


// =====================================================
// 2. 게임 상태 변수
// =====================================================
let players = [];      // 플레이어 목록
let turn = 0;          // 지금 차례인 플레이어 번호
let finishCount = 0;   // 골인한 사람 수
let spinCount = 0;     // 룰렛 돌린 횟수 (회전 각도 계산용)
let busy = false;      // 말이 움직이는 중이면 true (버튼 막기)
let zoomedOut = false; // 전체 지도 보기 중인지

// 설정 화면에서 쓰는 변수
let humanCount = 1;                 // 사람 수
let botCount = 1;                   // 컴퓨터 수 (0 ~ 4-사람 수)
let setupCount = 2;                 // 전체 인원 (사람 + 체크된 컴퓨터)
let setupChars = [0, 1, 2, 3];
let setupNames = ["", "", "", ""];
let setupCpu = [false, false, false, false]; // 각 자리가 컴퓨터인지
let setupGender = ["M", "F", "M", "F"];      // 각 자리 성별 (M 남자 / F 여자)
let setupMode = 0;                          // 고른 게임 모드 (events.js 의 modes 번호)
let gameMode = modes[0];                    // 지금 게임 모드

let popupCount = 0;    // 팝업이 몇 번 열렸는지 (컴퓨터 자동 선택용)
let round = 0;         // 몇 바퀴 돌았는지 (미니게임용)
let mini = null;       // 진행 중인 미니게임 정보
let miniPending = false;       // 이번에 미니게임 할 차례인지

let topStage = 0;              // 지금까지 누군가 도착한 가장 높은 나이대
let checkpointPending = false; // 중간 집계 할 차례인지
let history = [];              // 중간 집계 기록 (순위 그래프용)
let metPairs = {};             // 인연 이벤트를 이미 한 두 사람 (어린 시절 / 어른 한 번씩)


// =====================================================
// 3. HTML 요소 가져오기
// =====================================================
const mapWrap = document.getElementById("mapWrap");
const mapEl = document.getElementById("map");
const spinBtn = document.getElementById("spinBtn");
const wheelImg = document.getElementById("wheelImg");
const rollText = document.getElementById("rollText");
const cardBox = document.getElementById("cardBox");
const playerList = document.getElementById("playerList");
const logList = document.getElementById("log");
const popup = document.getElementById("popup");


// =====================================================
// 4. 작은 도우미 함수들
// =====================================================

// 배열에서 하나 랜덤으로 뽑기
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// min ~ max 사이 랜덤 정수
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// 3 → "+3",  -2 → "-2"
function signed(n) {
  if (n > 0) {
    return "+" + n;
  }
  return "" + n;
}

// 12500 → "1억 2500만원",  300 → "300만원",  -50 → "-50만원"
function won(amount) {
  let sign = "";
  if (amount < 0) {
    sign = "-";
    amount = -amount;
  }
  const eok = Math.floor(amount / 10000); // 억
  const man = amount % 10000;             // 만
  if (eok == 0) {
    return sign + man + "만원";
  }
  if (man == 0) {
    return sign + eok + "억원";
  }
  return sign + eok + "억 " + man + "만원";
}

// 300 → "+300만원"
function moneyText(amount) {
  if (amount > 0) {
    return "+" + won(amount);
  }
  return won(amount);
}

// 능력치 값 → 등급 글자 정보 { grade: "C", color: ... }
function gradeOf(value) {
  for (const g of gradeLines) {
    if (value >= g.min) {
      return g;
    }
  }
  return gradeLines[gradeLines.length - 1];
}

// 능력치 등급 글자 (색깔 포함) : "지 C"
function gradeHtml(p, key) {
  const g = gradeOf(p[key]);
  return '<b class="grade" style="color:' + g.color + '">' + g.grade + '</b>';
}

// 성별 기호
function genderMark(gender) {
  if (gender == "M") {
    return '<span class="male">♂</span>';
  }
  return '<span class="female">♀</span>';
}

// 카드 한 장 뽑기
function drawCard() {
  return pick(cardTypes);
}

// 결과 글자를 팝업용 상자로 감싸기
function resultHtml(summary) {
  if (summary == "") {
    return "";
  }
  return '<div class="result">' + summary + '</div>';
}


// =====================================================
// 5. 화면 전환 · 타이틀
// =====================================================
function showScreen(id) {
  const screens = ["loginScreen", "titleScreen", "setupScreen", "gameScreen", "resultScreen", "rankingScreen"];
  for (const s of screens) {
    document.getElementById(s).classList.add("hidden");
  }
  document.getElementById(id).classList.remove("hidden");
}

function setupTitle() {
  document.getElementById("logoImg").src = images.logo;
  let html = "";
  for (const c of characters) {
    html += '<img src="' + c.img + '" alt="' + c.name + '">';
  }
  document.getElementById("titleChars").innerHTML = html;
}


// =====================================================
// 6. 플레이어 설정 화면
// =====================================================
// 사람 수 고르기
function setPlayerCount(n) {
  humanCount = n;
  // 자리가 모자라면 컴퓨터 수 줄이기
  if (botCount > 4 - humanCount) {
    botCount = 4 - humanCount;
  }
  drawSetup();
}

// 컴퓨터 수 +1 / -1
function changeBot(amount) {
  botCount += amount;
  if (botCount < 0) {
    botCount = 0;
  }
  if (botCount > 4 - humanCount) {
    botCount = 4 - humanCount;
  }
  drawSetup();
}

// 게임 모드 고르기
function setMode(k) {
  setupMode = k;
  drawSetup();
}

// 성별 바꾸기
function toggleGender(i) {
  if (setupGender[i] == "M") {
    setupGender[i] = "F";
  } else {
    setupGender[i] = "M";
  }
  drawSetup();
}

function drawSetup() {
  // 게임 모드 버튼
  let modeHtml = "";
  for (let k = 0; k < modes.length; k++) {
    let cls = "mode-btn";
    if (k == setupMode) {
      cls += " selected";
    }
    modeHtml += '<button class="' + cls + '" onclick="setMode(' + k + ')">' + modes[k].name + '<small>' + modes[k].turns + '턴</small></button>';
  }
  modeHtml += '<p class="mode-desc">' + modes[setupMode].desc + '</p>';
  document.getElementById("modeBox").innerHTML = modeHtml;

  // 사람 수 버튼 색칠
  for (let n = 1; n <= 4; n++) {
    const btn = document.getElementById("count" + n);
    if (n == humanCount) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  }

  // 컴퓨터 수 : [-] 2명 [+]  (최대 4 - 사람 수)
  const botMax = 4 - humanCount;
  let minusOff = "";
  let plusOff = "";
  if (botCount <= 0) {
    minusOff = " disabled";
  }
  if (botCount >= botMax) {
    plusOff = " disabled";
  }
  document.getElementById("botBox").innerHTML =
    '<span class="setup-label">🤖 컴퓨터</span>' +
    '<button class="bot-btn" onclick="changeBot(-1)"' + minusOff + '>−</button>' +
    '<span class="bot-count">' + botCount + '명</span>' +
    '<button class="bot-btn" onclick="changeBot(1)"' + plusOff + '>+</button>' +
    '<span class="bot-max">(최대 ' + botMax + '명)</span>';

  // 자리 정하기 : 사람 먼저, 그 다음 컴퓨터
  setupCount = humanCount + botCount;
  for (let i = 0; i < setupCount; i++) {
    setupCpu[i] = i >= humanCount;
  }

  let html = "";
  for (let i = 0; i < setupCount; i++) {
    const myChar = characters[setupChars[i]];

    if (setupCpu[i]) {
      html += '<div class="slot cpu">';
      html += '<div class="slot-title">🤖 컴퓨터</div>';
    } else {
      html += '<div class="slot">';
      html += '<div class="slot-title">' + (i + 1) + 'P</div>';
    }

    html += '<img class="slot-big" src="' + myChar.img + '">';
    // 성별 버튼
    let genderText = "♂ 남자";
    if (setupGender[i] == "F") {
      genderText = "♀ 여자";
    }
    html += '<button class="gender-btn ' + setupGender[i] + '" onclick="toggleGender(' + i + ')">' + genderText + '</button>';
    html += '<input type="text" maxlength="6" placeholder="' + myChar.name + '" value="' + setupNames[i] + '"' +
            ' oninput="setupNames[' + i + '] = this.value">';
    html += '<div class="char-list">';
    for (let c = 0; c < characters.length; c++) {
      let cls = "";
      if (setupChars[i] == c) {
        cls = "selected";
      }
      html += '<img class="' + cls + '" src="' + characters[c].img + '" title="' + characters[c].name + '"' +
              ' onclick="pickCharacter(' + i + ', ' + c + ')">';
    }
    html += '</div></div>';
  }
  document.getElementById("slots").innerHTML = html;
}

// 캐릭터 고르기 (다른 사람이 쓰던 캐릭터면 서로 바꿈)
function pickCharacter(slot, c) {
  for (let i = 0; i < 4; i++) {
    if (i != slot && setupChars[i] == c) {
      setupChars[i] = setupChars[slot];
    }
  }
  setupChars[slot] = c;
  drawSetup();
}

function startGame() {
  gameMode = modes[setupMode];

  for (let i = 0; i < setupCount; i++) {
    const ch = characters[setupChars[i]];
    let name = setupNames[i];
    if (name == "") {
      name = ch.name;
    }

    players.push({
      id: i,
      name: name,
      cpu: setupCpu[i],     // 컴퓨터인지
      gender: setupGender[i], // 성별 (M / F)
      img: ch.img,
      color: ch.color,
      money: 0,             // 💰 현금 (만원)
      int: 0,               // 🧠 지력
      str: 0,               // 💪 체력
      sense: 0,             // ✨ 센스
      talent: null,         // 재능 ("int", "str", "sense")
      pos: 0,               // 현재 칸 번호
      area: "baby",         // 현재 지역
      college: false,       // 대학 졸업 여부
      job: null,            // 직업 번호 (jobs 배열의 몇 번째)
      grade: 0,             // 직업 랭크 (0 ~ 4)
      retired: false,       // 퇴직 여부
      date: null,           // 연애 중인 상대
      spouse: null,         // 배우자
      kids: [],             // 자녀들 { name, gender, age, job }
      house: null,          // 산 집
      treasures: [],        // 모은 보물
      debt: 0,              // 🏦 대출 건수
      lastPay: 0,           // 마지막 월급
      stepsLeft: 0,         // 인생 이벤트 칸에서 멈췄을 때 남은 칸 수
      flags: {},            // 지금까지 한 일 기록 (예: flags.piano = true → 나중에 피아노 이벤트)
      pending: [],          // 이동이 끝나면 할 일 (진급 심사, 자녀 직업, 인연)
      meets: 0,             // 인연 횟수 (시상식용)
      miniWins: 0,          // 미니게임 1등 횟수 (시상식용)
      earned: { self: 0, spouse: 0, kids: 0 }, // 번 돈 (인생 보고서용)
      cards: [drawCard()],  // 카드 (처음에 1장)
      finished: false       // 골인 여부
    });
  }

  // 성인부터 모드 : 진로 선택 갈림길에서, 능력치 50 + 기초 자금으로 시작
  if (gameMode.key == "adult") {
    const start = forkTile("f1");
    for (const p of players) {
      p.pos = start.id;
      p.area = start.area;
      p.int = adultStart.stat;
      p.str = adultStart.stat;
      p.sense = adultStart.stat;
      p.money = adultStart.money;
    }
    topStage = areas[start.area].stage;
  }

  showScreen("gameScreen");
  wheelImg.src = images.roulette;
  drawMap();
  drawLegend();
  createPieces();

  busy = true;
  updateScreen();

  let names = "";
  for (const p of players) {
    names += "<b>" + p.name + "</b> ";
  }
  addLog("👶 인생 시작! (" + gameMode.name + ")");

  if (gameMode.key == "adult") {
    showPopup(images.life.job, "👔 성인부터 모드",
      names + "(이)가 어른이 되어 진로 선택 앞에 섰어요!<br>먼저 재능 룰렛으로 재능을 정해요.",
      [{ text: "시작!", action: function () { adultTalents(0); } }]);
    return;
  }
  showPopup(images.tiles.start, "👶 인생의 시작",
    "지금부터 " + names + "(은)는 아기예요!<br>" + gameMode.turns + "턴 동안, 누가 가장 부자가 될까요?",
    [{ text: "시작!", action: startTurn }]);
}

// 갈림길 칸 찾기 (예: "f1" → 진로 선택 갈림길)
function forkTile(key) {
  for (const t of tiles) {
    if (t.fork == key) {
      return t;
    }
  }
  return tiles[0];
}

// 성인부터 모드 : 한 사람씩 재능 룰렛
function adultTalents(i) {
  if (i >= players.length) {
    turn = 0;
    startTurn();
    return;
  }
  turn = i;
  updateScreen();
  talentRoulette(players[i], images.life.talent, function () {
    adultTalents(i + 1);
  });
}


// =====================================================
// 7. 지도 그리기
// =====================================================
function tileImage(t) {
  if (t.type == "life") {
    return images.life[t.life];
  }
  return images.tiles[t.type];
}

function drawMap() {
  mapEl.style.width = MAP_WIDTH + "px";
  mapEl.style.height = MAP_HEIGHT + "px";
  mapEl.style.backgroundImage = "url(" + images.map + ")";
  drawRoads();
  drawTiles();
}

// 칸과 칸 사이를 선(SVG)으로 이어서 길 만들기
function drawRoads() {
  const SVG = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", MAP_WIDTH);
  svg.setAttribute("height", MAP_HEIGHT);
  svg.classList.add("roads");

  // 테두리 → 길 → 점선 순서로 3번 그려야 예쁘게 겹쳐요
  const layers = ["road-edge", "road", "road-line"];
  for (const layer of layers) {
    for (const t of tiles) {
      for (const n of t.next) {
        const line = document.createElementNS(SVG, "line");
        line.setAttribute("x1", t.x);
        line.setAttribute("y1", t.y);
        line.setAttribute("x2", tiles[n].x);
        line.setAttribute("y2", tiles[n].y);
        line.setAttribute("class", layer);
        svg.appendChild(line);
      }
    }
  }
  mapEl.appendChild(svg);
}

function drawTiles() {
  for (const t of tiles) {
    const div = document.createElement("div");
    div.className = "tile";
    div.style.left = t.x + "px";
    div.style.top = t.y + "px";

    let label = "";
    if (t.type == "life") {
      label = "🛑 " + lifeEvents[t.life].label; // 무조건 멈추는 칸
      div.classList.add("big", "life");
    } else if (t.type == "fork") {
      label = "갈림길";
      div.classList.add("big");
    } else if (t.type == "start") {
      label = "탄생";
      div.classList.add("big");
    } else if (t.type == "goal") {
      label = "골인!";
      div.classList.add("big");
    }

    let html = '<img src="' + tileImage(t) + '">';
    if (label != "") {
      html += '<div class="tile-label">' + label + '</div>';
    }
    div.innerHTML = html;
    mapEl.appendChild(div);
  }
}

// 칸 설명
function drawLegend() {
  const items = [
    ["good", "좋은 일"], ["bad", "나쁜 일"], ["normal", "보통"], ["event", "선택 이벤트"],
    ["pay", "월급날"], ["love", "연애"], ["work", "직업"], ["card", "카드"],
    ["lucky", "럭키 칸"], ["treasure", "보물"]
  ];
  let html = "";
  for (const item of items) {
    html += '<div><img src="' + images.tiles[item[0]] + '"> ' + item[1] + '</div>';
  }
  document.getElementById("legend").innerHTML = html;
}


// =====================================================
// 8. 캐릭터 말 · 카메라
// =====================================================
const pieceOffset = [
  { x: -16, y: -6 },
  { x: 16, y: -6 },
  { x: -16, y: 8 },
  { x: 16, y: 8 }
];

function createPieces() {
  for (const p of players) {
    const img = document.createElement("img");
    img.className = "piece";
    img.id = "piece" + p.id;
    img.src = p.img;
    mapEl.appendChild(img);

    // 말 아래 가족 핀 (배우자, 자녀)
    const pins = document.createElement("div");
    pins.className = "pins";
    pins.id = "pins" + p.id;
    mapEl.appendChild(pins);
    placePiece(p);
  }
}

function placePiece(p) {
  const t = tiles[p.pos];
  const piece = document.getElementById("piece" + p.id);
  piece.style.left = (t.x - 24 + pieceOffset[p.id].x) + "px";
  piece.style.top = (t.y - 56 + pieceOffset[p.id].y) + "px";
  const pins = document.getElementById("pins" + p.id);
  pins.style.left = (t.x - 24 + pieceOffset[p.id].x) + "px";
  pins.style.top = (t.y - 6 + pieceOffset[p.id].y) + "px";
}

// 카메라가 플레이어를 따라가기
function follow(p) {
  if (zoomedOut) {
    return;
  }
  const t = tiles[p.pos];
  mapWrap.scrollTo({
    left: t.x - mapWrap.clientWidth / 2,
    top: t.y - mapWrap.clientHeight / 2,
    behavior: "smooth"
  });
}

// 전체 지도 보기 ↔ 크게 보기
function toggleZoom() {
  zoomedOut = !zoomedOut;
  const btn = document.getElementById("zoomBtn");
  if (zoomedOut) {
    mapEl.style.zoom = mapWrap.clientWidth / MAP_WIDTH;
    btn.textContent = "🔍 크게 보기";
  } else {
    mapEl.style.zoom = 1;
    btn.textContent = "🗺️ 전체 지도";
    follow(players[turn]);
  }
}


// =====================================================
// 9. 화면 정보 갱신
// =====================================================
function updateScreen() {
  const p = players[turn];

  document.getElementById("turnImg").src = p.img;
  document.getElementById("turnName").innerHTML = '<span style="color:' + p.color + '">' + p.name + '</span>의 차례';

  if (p.finished) {
    spinBtn.textContent = "🎰 보너스 룰렛";
  } else {
    spinBtn.textContent = "룰렛 돌리기";
  }
  spinBtn.disabled = busy;

  for (const other of players) {
    const piece = document.getElementById("piece" + other.id);
    if (other.id == p.id) {
      piece.classList.add("active");
    } else {
      piece.classList.remove("active");
    }
  }

  drawCards();
  drawPlayerList();
  drawHud();
  follow(p);
}

// 지도 위 상태바 (닌텐도 인생게임처럼 왼쪽 위 / 오른쪽 위)
function drawHud() {
  const p = players[turn];

  let cards = "";
  for (const c of p.cards) {
    cards += '<span class="hud-card" title="' + c.name + '">' + c.name.split(" ")[0] + '</span>';
  }
  let debt = "";
  if (p.debt > 0) {
    debt = '<span class="hud-debt">🏦 대출 ' + p.debt + '건</span>';
  }

  document.getElementById("hud").innerHTML =
    '<img src="' + p.img + '">' +
    '<div class="hud-main">' +
      '<div class="hud-top"><b>' + p.name + '</b> ' + genderMark(p.gender) + '<span class="hud-job">' + jobTitle(p) + '</span></div>' +
      '<div class="hud-bottom">' +
        '<span>지 ' + gradeHtml(p, "int") + ' 체 ' + gradeHtml(p, "str") + ' 센 ' + gradeHtml(p, "sense") + '</span>' +
        '<span class="hud-money">' + won(p.money) + '</span>' +
      '</div>' +
      '<div class="hud-cards">' + cards + debt + '</div>' +
    '</div>';

  // 오른쪽 위 : 턴 + 월급날까지
  let turnNow = round + 1;
  if (turnNow > gameMode.turns) {
    turnNow = gameMode.turns;
  }
  let payText = "";
  const toPay = stepsToPay(p);
  if (toPay > 0 && !p.finished) {
    payText = '<div>💵 월급날까지 <b>' + toPay + '</b>칸</div>';
  }
  document.getElementById("turnHud").innerHTML = '<div>🕐 턴 <b>' + turnNow + '</b> / ' + gameMode.turns + '</div>' + payText;
}

// 다음 월급날 칸까지 몇 칸인지 (못 찾으면 0)
function stepsToPay(p) {
  let id = p.pos;
  for (let n = 1; n <= 60; n++) {
    const t = tiles[id];
    if (t.next.length == 0) {
      return 0;
    }
    id = t.next[0];
    if (tiles[id].type == "pay") {
      return n;
    }
  }
  return 0;
}

// 지금 차례인 사람의 카드 버튼
function drawCards() {
  const p = players[turn];
  let html = "";
  if (!p.finished) {
    for (let i = 0; i < p.cards.length; i++) {
      const c = p.cards[i];
      let disabled = "";
      // 수호 카드는 갖고만 있는 카드, 저격 카드는 앞에 럭키 칸이 있을 때만
      if (busy || c.key == "guard" || (c.key == "snipe" && luckyAhead(p).length == 0)) {
        disabled = " disabled";
      }
      html += '<button class="num-card" onclick="useCard(' + i + ')"' + disabled + ' title="' + c.desc + '">' +
              c.name + '<br><small>' + c.desc + '</small></button>';
    }
  }
  cardBox.innerHTML = html;
}

// 직업 이름 (예: "의사 · 전문의 ★3")
function jobTitle(p) {
  if (p.job == null) {
    return "직업 없음";
  }
  const job = jobs[p.job];
  let text = job.name + " · " + job.grades[p.grade].title + " ★" + (p.grade + 1);
  if (p.retired) {
    text += " (퇴직)";
  }
  return text;
}

function drawPlayerList() {
  let html = "";

  for (const p of players) {
    let nowClass = "";
    if (p.id == turn) {
      nowClass = " now";
    }

    let moneyClass = "money";
    if (p.money < 0) {
      moneyClass += " minus";
    }

    // 능력치 (등급 글자, ×1.5 = 재능)
    let stats = "";
    for (const key in statNames) {
      let mark = "";
      if (p.talent == key) {
        mark = '<b class="x2">×1.5</b>';
      }
      stats += '<span>' + statNames[key] + ' ' + gradeHtml(p, key) + '<small>' + p[key] + '</small>' + mark + '</span>';
    }

    // 연애 / 가족
    let family = "";
    if (p.spouse != null) {
      family += "💍 " + p.spouse.name + " (♥" + p.spouse.love + "%)";
    } else if (p.date != null) {
      family += "💕 " + p.date.name + " (♥" + p.date.love + "%)";
    }
    if (p.kids.length > 0) {
      family += " " + kidIcons(p);
    }
    if (p.house != null) {
      family += " 🏠";
    }
    if (p.treasures.length > 0) {
      family += " 💎×" + p.treasures.length;
    }
    if (p.debt > 0) {
      family += " 🏦" + p.debt;
    }
    if (p.finished) {
      family += " 🏁골인";
    }

    html += '<div class="player' + nowClass + '">';
    html += '<img src="' + p.img + '">';
    html += '<div>';
    let cpuMark = "";
    if (p.cpu) {
      cpuMark = " 🤖";
    }
    html += '<div class="pname" style="color:' + p.color + '">' + p.name + ' ' + genderMark(p.gender) + cpuMark + '</div>';
    html += '<div class="' + moneyClass + '">💰 ' + won(p.money) + '</div>';
    html += '<div>💼 ' + jobTitle(p) + '</div>';
    html += '<div class="stats">' + stats + '</div>';
    html += '<div>' + family + '</div>';
    html += '</div></div>';
  }

  playerList.innerHTML = html;
  updatePins();
}

// 자녀 아이콘 (남자 👦 / 여자 👧, 어른이 되면 🧑)
function kidIcons(p) {
  let text = "";
  for (const kid of p.kids) {
    if (kid.job != null) {
      text += "🧑";
    } else if (kid.gender == "M") {
      text += "👦";
    } else {
      text += "👧";
    }
  }
  return text;
}

// 말 아래 가족 핀 : 배우자 + 자녀
function updatePins() {
  for (const p of players) {
    const pins = document.getElementById("pins" + p.id);
    if (pins == null) {
      continue;
    }
    let text = "";
    if (p.spouse != null) {
      if (p.spouse.gender == "M") {
        text += "👨";
      } else {
        text += "👩";
      }
    }
    text += kidIcons(p);
    pins.textContent = text;
  }
}



// 기록 남기기 (최근 기록이 위로)
function addLog(text) {
  const li = document.createElement("li");
  li.innerHTML = text;
  logList.prepend(li);
}

// 화면 가운데를 지나가는 배너
function showBanner(text, color) {
  const banner = document.createElement("div");
  banner.className = "banner";
  banner.style.background = color;
  banner.innerHTML = text;
  document.body.appendChild(banner);

  setTimeout(function () {
    banner.remove();
  }, 1600);
}

// 캐릭터 머리 위로 글자 띄우기
function floatText(p, text) {
  const piece = document.getElementById("piece" + p.id);
  const div = document.createElement("div");
  div.className = "float-text";
  div.textContent = text;
  div.style.left = piece.style.left;
  div.style.top = piece.style.top;
  mapEl.appendChild(div);

  setTimeout(function () {
    div.remove();
  }, 1600);
}


// =====================================================
// 10. 결과 적용 (돈 · 능력치 바꾸기는 전부 이 함수로!)
//     r = { money: 100, int: 10, ... }
//     돌려주는 값 = 화면에 보여줄 요약 글자
// =====================================================
function applyResult(p, r) {
  const parts = [];

  if (r.money) {
    p.money += r.money;
    parts.push("💰" + moneyText(r.money));
  }

  // 능력치 3개 (재능 능력치는 1.5배로 오름!)
  for (const key in statNames) {
    if (r[key]) {
      let amount = r[key];
      if (amount > 0 && p.talent == key) {
        amount = Math.round(amount * talentBonus);
      }
      p[key] += amount;
      if (p[key] < 0) {
        p[key] = 0;
      }
      parts.push(statNames[key] + " " + signed(amount));
    }
  }

  // 다른 사람들에게서 돈 받기 (마이너스면 주기)
  if (r.all) {
    for (const other of players) {
      if (other.id != p.id) {
        other.money -= r.all;
        p.money += r.all;
      }
    }
    parts.push("모두에게 " + moneyText(r.all) + "씩");
  }

  // 🦹 갈취 / 🪤 함정 (1등을 노려요)
  if (r.steal) {
    parts.push(attack(p, r.steal, true));
  }
  if (r.trap) {
    parts.push(attack(p, r.trap, false));
  }

  // 한 일 기록하기 → 나중에 이 기록에 맞는 이벤트가 나와요
  if (r.flag) {
    p.flags[r.flag] = true;
  }

  // 카드 얻기 (최대 3장)
  if (r.card) {
    if (p.cards.length < 3) {
      const card = drawCard();
      p.cards.push(card);
      parts.push("🎴 " + card.name + " 획득!");
    } else {
      parts.push("🎴 카드가 꽉 찼어요");
    }
  }

  // 돈이 마이너스가 된 사람은 자동 대출
  for (const someone of players) {
    const loan = checkDebt(someone);
    if (loan != "") {
      parts.push(loan);
    }
  }

  if (parts.length > 0) {
    floatText(p, parts.join(" "));
  }
  drawPlayerList();
  return parts.join("<br>");
}

// 🏦 돈이 마이너스면 대출을 받아서 0 이상으로 (1건 = debtUnit 만원, 어른만)
function checkDebt(p) {
  // 미성년자는 대출 대신 부모님이 갚아 주셔요 (0원으로)
  if (p.money < 0 && !isAdult(p)) {
    p.money = 0;
    return "";
  }
  let count = 0;
  while (p.money < 0) {
    p.money += debtUnit;
    p.debt++;
    count++;
  }
  if (count == 0) {
    return "";
  }
  addLog(p.name + " : 🏦 자동 대출 " + count + "건");
  return "🏦 " + p.name + " 자동 대출 " + count + "건 (+" + won(count * debtUnit) + ")";
}

// 수호 카드가 몇 번째에 있는지 (없으면 -1)
function guardIndex(p) {
  for (let i = 0; i < p.cards.length; i++) {
    if (p.cards[i].key == "guard") {
      return i;
    }
  }
  return -1;
}

// 🦹 갈취(steal) / 🪤 함정 : 나 말고 가장 부자인 사람을 노려요
//   상대에게 🛡️ 수호 카드가 있으면 막히고, 나한테 되돌아와요
function attack(p, amount, steal) {
  let target = null;
  for (const other of players) {
    if (other.id != p.id && (target == null || totalOf(other) > totalOf(target))) {
      target = other;
    }
  }
  if (target == null) {
    return "";
  }

  const g = guardIndex(target);
  if (g >= 0) {
    target.cards.splice(g, 1);
    p.money -= amount;
    if (steal) {
      target.money += amount;
    }
    addLog(target.name + " : 🛡️ 수호 카드로 반사!");
    return "🛡️ " + target.name + "의 수호 카드에 막혀서 되돌아왔어요! (" + moneyText(-amount) + ")";
  }

  target.money -= amount;
  if (steal) {
    p.money += amount;
    return "🦹 " + target.name + "에게서 " + won(amount) + " 갈취!";
  }
  return "🪤 " + target.name + "이(가) 함정에 걸려 " + won(amount) + " 잃었어요!";
}


// =====================================================
// 11. 룰렛 · 숫자 카드
// =====================================================

function startTurn() {
  const p = players[turn];
  busy = p.cpu; // 컴퓨터 차례에는 버튼을 막아요
  p.metThisMove = false;
  rollText.textContent = "";
  updateScreen();

  // 황혼기 : 배우자 + 어른이 된 자녀 월급이 매 턴 들어와요
  if (!p.finished && areas[p.area].stage == 9) {
    const income = familyPay(p);
    if (income > 0) {
      p.money += income;
      floatText(p, "👨‍👩‍👧 가족 수입 " + moneyText(income));
      addLog(p.name + " : 👨‍👩‍👧 가족 수입 " + moneyText(income));
      drawPlayerList();
    }
  }

  if (p.cpu) {
    showBanner("🤖 " + p.name + "의 차례!", p.color);
    setTimeout(cpuTurn, 1300);
  } else {
    showBanner(p.name + "의 차례!", p.color);
  }
}

function spin() {
  if (busy) {
    return;
  }
  // 골인한 사람은 이동 대신 보너스 룰렛
  if (players[turn].finished) {
    busy = true;
    updateScreen();
    bonusRoulette(players[turn]);
    return;
  }
  const num = randomInt(1, 10);
  rollWheel(num);
}

function useCard(i) {
  if (busy) {
    return;
  }
  playCard(i);
}

// i번째 카드 쓰기
function playCard(i) {
  const p = players[turn];
  const card = p.cards[i];
  if (card.key == "guard") {
    return; // 수호 카드는 갖고만 있는 카드
  }
  if (card.key == "snipe") {
    snipeCard(p, i);
    return;
  }
  p.cards.splice(i, 1); // 카드 사용 → 손에서 없애기
  addLog(p.name + " : " + card.name + " 사용!");
  showBanner(card.name + "<small>" + card.desc + "</small>", "#845ef7");
  rollWheel(randomInt(card.min, card.max));
}

// 앞 5칸 안의 ⭐ 럭키 칸 찾기 → [{ path: [칸 번호들] }, ...]
//   (🛑 인생 이벤트 칸 너머는 안 봐요)
function luckyAhead(p) {
  const found = [];
  function look(id, path) {
    if (path.length >= 5) {
      return;
    }
    for (const n of tiles[id].next) {
      const route = path.concat([n]);
      if (tiles[n].type == "lucky") {
        found.push(route);
      }
      if (tiles[n].type != "life" && tiles[n].type != "goal") {
        look(n, route);
      }
    }
  }
  look(p.pos, []);
  return found;
}

// 🎯 저격 카드 : 럭키 칸을 골라서 정확히 그 칸으로
function snipeCard(p, i) {
  const targets = luckyAhead(p);
  if (targets.length == 0) {
    return;
  }
  p.cards.splice(i, 1);
  busy = true;
  updateScreen();
  addLog(p.name + " : 🎯 저격 카드 사용!");

  const buttons = [];
  for (const route of targets) {
    buttons.push({
      text: "⭐ " + route.length + "칸 앞 럭키 칸",
      cpuPick: buttons.length == 0,
      action: function () {
        walkPath(p, route);
      }
    });
  }
  showPopup(images.tiles.lucky, "🎯 저격 카드", "어느 럭키 칸으로 갈까요?", buttons);
}

// 정해진 길(route)을 따라 한 칸씩 이동 → 마지막 칸에 도착
function walkPath(p, route) {
  if (route.length == 0) {
    arrive(p);
    return;
  }
  p.pos = route[0];
  placePiece(p);
  follow(p);
  enterTile(p, tiles[route[0]]);
  setTimeout(function () {
    walkPath(p, route.slice(1));
  }, 330);
}

// 룰렛을 돌려서 num 이 위쪽 화살표에 오게 하기
function rollWheel(num) {
  busy = true;
  updateScreen();
  rollText.textContent = "두근두근...";

  spinWheel(num, function () {
    afterRoll(num);
  });
}

// 이동 룰렛판 돌리기 (다 돌면 done 함수 실행)
function spinWheel(num, done) {
  spinCount++;
  // 5바퀴(1800도) 돌고, 한 칸이 36도
  const angle = spinCount * 1800 - (num - 1) * 36;
  wheelImg.style.transform = "rotate(" + angle + "deg)";
  setTimeout(done, 2100);
}

function afterRoll(num) {
  const p = players[turn];
  addLog(p.name + " : 🎯 " + num + " 칸 이동");
  rollText.textContent = "🎯 " + num + "칸 이동!";
  movePlayer(p, num);
}


// =====================================================
// 11-2. 🎡 확률 룰렛
//   게임 속 모든 확률은 이 룰렛으로 정해요! (이동 룰렛만 숫자)
//   룰렛 10칸에 X(실패) / O(성공) / ◎(대성공) 를 나눠 담아요.
//   예) 성공 확률 60% → O 6칸, X 4칸
// =====================================================
const chanceBox = document.getElementById("chance");
const chanceTitle = document.getElementById("chanceTitle");
const chanceText = document.getElementById("chanceText");
const chanceWheel = document.getElementById("chanceWheel");
const chanceResult = document.getElementById("chanceResult");
const chanceBtn = document.getElementById("chanceBtn");

// 확률 → 룰렛 10칸 만들기
// great 가 true 면 3가지(X, O, ◎), false 면 2가지(X, O)
function chanceSlots(chance, great) {
  let win = Math.round(chance * 10); // O 칸 수
  if (chance < 1) {
    // 확률이 1보다 작으면 O도 X도 최소 1칸은 있어요
    if (win < 1) {
      win = 1;
    }
    if (win > 9) {
      win = 9;
    }
  }

  // 대성공(◎) 칸 수 : O 칸이 많을수록 늘어나요
  let best = 0;
  if (great && win >= 2) {
    best = Math.max(1, Math.floor(win / 4));
  }

  const slots = [];
  for (let i = 0; i < 10; i++) {
    if (i < best) {
      slots.push("◎");
    } else if (i < win) {
      slots.push("O");
    } else {
      slots.push("X");
    }
  }
  return slots;
}

// ["◎","O","O","X",...] → "◎ 1칸 · O 2칸 · X 7칸"
function countText(slots) {
  const parts = [];
  for (const mark of ["◎", "O", "X"]) {
    let count = 0;
    for (const s of slots) {
      if (s == mark) {
        count++;
      }
    }
    if (count > 0) {
      parts.push(mark + " " + count + "칸");
    }
  }
  return parts.join(" · ");
}

// 룰렛 결과 글자
function slotText(mark) {
  if (mark == "X") {
    return "❌ 실패...";
  }
  if (mark == "O") {
    return "⭕ 성공!";
  }
  if (mark == "◎") {
    return "🌟 대성공!!";
  }
  return mark;
}

// 룰렛판 그림 (SVG 글자로 만들기) : 1번 칸이 맨 위, 시계 방향
function wheelSvg(slots) {
  let svg = '<svg class="chance-svg" viewBox="0 0 300 300">';
  svg += '<circle cx="150" cy="150" r="146" fill="#fff" stroke="#495057" stroke-width="6"/>';

  for (let k = 0; k < 10; k++) {
    // 칸의 양 끝 각도 (라디안)
    const a1 = (k * 36 - 18) * Math.PI / 180;
    const a2 = (k * 36 + 18) * Math.PI / 180;
    const x1 = 150 + 136 * Math.sin(a1);
    const y1 = 150 - 136 * Math.cos(a1);
    const x2 = 150 + 136 * Math.sin(a2);
    const y2 = 150 - 136 * Math.cos(a2);

    let color = slotColors[slots[k]];
    if (color == undefined) {
      color = otherColors[k];
    }
    svg += '<path d="M150 150 L' + x1 + ' ' + y1 + ' A136 136 0 0 1 ' + x2 + ' ' + y2 + ' Z" fill="' + color + '" stroke="#fff" stroke-width="3"/>';

    // 글자 (긴 글자는 작게)
    let size = 34;
    if (slots[k].length > 2) {
      size = 20;
    }
    svg += '<text x="150" y="58" font-size="' + size + '" transform="rotate(' + (k * 36) + ' 150 150)">' + slots[k] + '</text>';
  }

  svg += '<circle cx="150" cy="150" r="22" fill="#fff" stroke="#495057" stroke-width="6"/>';
  svg += '</svg>';
  return svg;
}

// 룰렛 창 열기
//   p     : 돌리는 사람 (컴퓨터면 자동으로 돌려요, null 이면 사람이 직접)
//   slots : 10칸에 들어갈 글자
//   done  : 다 돌면 실행할 함수 → done(나온 글자, 칸 번호)
function showRoulette(p, title, text, slots, done) {
  chanceTitle.innerHTML = title;
  chanceText.innerHTML = text;
  chanceResult.innerHTML = "";
  chanceWheel.innerHTML = wheelSvg(slots);
  chanceBtn.disabled = false;
  chanceBox.classList.remove("hidden");

  chanceBtn.onclick = function () {
    chanceBtn.disabled = true;
    const k = randomInt(0, 9); // 0 ~ 9번 칸 중 하나 (모든 칸 확률이 같아요)
    // 5바퀴 돌고 k번 칸이 위쪽 화살표에 오게 (칸 안에서 살짝 랜덤 위치)
    const angle = 1800 - k * 36 + randomInt(-12, 12);
    chanceWheel.firstChild.style.transform = "rotate(" + angle + "deg)";

    setTimeout(function () {
      chanceResult.innerHTML = slotText(slots[k]);
      setTimeout(function () {
        chanceBox.classList.add("hidden");
        done(slots[k], k);
      }, 1100);
    }, 2100);
  };

  // 컴퓨터는 알아서 돌려요
  if (p != null && p.cpu) {
    chanceBtn.disabled = true;
    setTimeout(chanceBtn.onclick, 900);
  }
}

// 확률 룰렛 : 확률로 칸을 나눠서 돌리기 → done("X" 또는 "O" 또는 "◎")
function chanceRoulette(p, title, text, chance, great, done) {
  const slots = chanceSlots(chance, great);
  showRoulette(p, title, text + '<div class="slot-info">' + countText(slots) + '</div>', slots, done);
}

// 대성공 : 좋은 결과(+)를 2배로
function doubleResult(r) {
  const big = { text: r.text + " <b>(대성공! 보상 2배)</b>" };
  for (const key of ["money", "int", "str", "sense", "all"]) {
    if (r[key]) {
      big[key] = r[key];
      if (r[key] > 0) {
        big[key] = r[key] * 2;
      }
    }
  }
  big.card = r.card;
  big.flag = r.flag;
  return big;
}

// 🎰 골인한 사람의 보너스 룰렛
function bonusRoulette(p) {
  const labels = [];
  for (const a of bonusAmounts) {
    labels.push(a + "만");
  }
  rollText.textContent = "🎰 보너스 룰렛!";
  showRoulette(p, "🎰 보너스 룰렛", "골인한 사람은 기다리는 동안 보너스 룰렛으로 돈을 벌어요!", labels, function (label, k) {
    const amount = bonusAmounts[k];
    const summary = applyResult(p, { money: amount });
    addLog(p.name + " : 🎰 보너스 " + moneyText(amount));
    showPopup(images.tiles.goal, "🎰 보너스 " + won(amount) + "!", resultHtml(summary));
  });
}


// =====================================================
// 12. 말 이동 (한 칸씩, 갈림길에서는 길 고르기)
// =====================================================
function movePlayer(p, left) {
  if (left == 0) {
    arrive(p);
    return;
  }

  const here = tiles[p.pos];
  if (here.next.length > 1) {
    askFork(p, here, left);
    return;
  }
  stepTo(p, here.next[0], left);
}

// 한 칸 앞으로
function stepTo(p, id, left) {
  p.pos = id;
  const t = tiles[id];
  placePiece(p);
  follow(p);

  const remain = left - 1; // 이 칸으로 온 뒤 남은 칸 수
  rollText.textContent = "남은 칸 : " + remain;

  enterTile(p, t);

  // 아이만 모드 : 진로 선택 갈림길(고등학교 졸업)에 오면 골인
  if (gameMode.key == "junior" && t.fork == "f1") {
    setTimeout(function () {
      arriveGoal(p);
    }, 500);
    return;
  }

  // 골인 칸은 무조건 끝
  if (t.type == "goal") {
    setTimeout(function () {
      arrive(p);
    }, 500);
    return;
  }

  // 인생 이벤트 칸(🛑) : 멈춰서 이벤트 → 끝나면 남은 칸만큼 계속 이동
  if (t.type == "life") {
    p.stepsLeft = remain; // 이벤트가 끝나면 nextTurn 에서 이어서 이동
    if (remain > 0) {
      rollText.textContent = "🛑 STOP! (이벤트 후 " + remain + "칸 더)";
      showBanner("🛑 인생 이벤트!<small>이벤트가 끝나면 남은 " + remain + "칸 더 이동해요</small>", "#e03131");
    }
    setTimeout(function () {
      arrive(p);
    }, 900);
    return;
  }

  setTimeout(function () {
    movePlayer(p, remain);
  }, 330);
}

// 칸을 지나갈 때마다 : 새 지역 배너, 월급날, 인연
function enterTile(p, t) {
  // 새 지역에 들어가면 배너
  if (t.area != p.area) {
    p.area = t.area;
    const area = areas[t.area];
    showBanner(area.name + "<small>" + area.story + "</small>", p.color);
    addLog(p.name + " : " + area.name + " 도착");

    // 누군가 새로운 나이대에 처음 들어가면 → 한 바퀴가 끝난 뒤 중간 집계
    if (area.stage > topStage) {
      topStage = area.stage;
      checkpointPending = true;
    }

    // 🎰 한방역전섬 : 공정성 문제로 카드는 전부 압수!
    if (t.area == "gamble" && p.cards.length > 0) {
      p.cards = [];
      addLog(p.name + " : 🎰 한방역전섬 입장 → 카드 전부 압수");
      floatText(p, "🎴 카드 전부 압수!");
    }
  }

  // 월급날 칸은 지나가기만 해도 월급!
  if (t.type == "pay") {
    paySalary(p);
  }

  // 🤝 다른 플레이어와 같은 칸에서 만나면 인연 (두 사람은 어린 시절 한 번, 어른 한 번)
  if (!p.metThisMove && t.type != "start") {
    for (const other of players) {
      if (other.id != p.id && other.pos == t.id && !other.finished) {
        let phase = "아이";
        if (isAdult(p)) {
          phase = "어른";
        }
        const key = Math.min(p.id, other.id) + "-" + Math.max(p.id, other.id) + "-" + phase;
        if (metPairs[key] != true) {
          metPairs[key] = true;
          p.metThisMove = true;
          p.pending.push({ type: "meet", other: other.id });
          break;
        }
      }
    }
  }
}

// 갈림길 : 어느 길로 갈지 고르기
function askFork(p, here, left) {
  const fork = forks[here.fork];
  const buttons = [];
  const cpuIndex = cpuForkChoice(p, here.fork);

  for (let i = 0; i < fork.routes.length; i++) {
    const route = fork.routes[i];
    buttons.push({
      text: route.label,
      desc: route.desc,
      cpuPick: i == cpuIndex,
      action: function () {
        applyResult(p, route);
        addLog(p.name + " : " + route.label + " 선택");
        stepTo(p, here.next[i], left);
      }
    });
  }

  showPopup(images.tiles.fork, "🪧 " + fork.title, fork.text, buttons);
}

// 💵 월급날 : 내 월급 + 배우자 월급 + 어른이 된 자녀 월급 - 대출 이자
//   그리고 진급 심사 룰렛 (월급날마다 1번)
function paySalary(p) {
  let total = 0;

  if (p.job != null) {
    let salary = jobs[p.job].grades[p.grade].salary;
    if (p.retired) {
      salary = Math.floor(salary / 2); // 퇴직하면 연금 (절반)
    }
    total += salary;
    p.earned.self += salary;
  }

  total += familyPay(p);

  // 자녀는 월급날마다 한 살씩 → 4가 되면 어른! (직업 룰렛)
  for (const kid of p.kids) {
    kid.age++;
    if (kid.age == 4) {
      p.pending.push({ type: "kidjob", kid: kid });
    }
  }

  // 대출 이자
  const interest = p.debt * debtInterest;

  p.lastPay = total;
  p.lastInterest = interest;
  p.money += total - interest;
  checkDebt(p);

  if (total > 0 || interest > 0) {
    floatText(p, "💵 " + moneyText(total - interest));
  }

  // 진급 심사 (직업이 있고 더 올라갈 랭크가 있으면)
  if (p.job != null && !p.retired && p.grade < jobs[p.job].grades.length - 1) {
    p.pending.push({ type: "promo" });
  }
  drawPlayerList();
}

// 가족 수입 : 배우자 월급 + 어른이 된 자녀 월급 (번 돈 기록도 같이)
function familyPay(p) {
  let total = 0;
  if (p.spouse != null) {
    total += p.spouse.salary;
    p.earned.spouse += p.spouse.salary;
  }
  for (const kid of p.kids) {
    if (kid.job != null) {
      total += kid.job.salary;
      p.earned.kids += kid.job.salary;
    }
  }
  return total;
}


// =====================================================
// 13. 도착한 칸의 효과
// =====================================================
function arrive(p) {
  // 이동하면서 생긴 일(진급 심사, 자녀 취업, 인연)부터 하나씩
  if (p.pending.length > 0) {
    const job = p.pending.shift();
    doPending(p, job);
    return;
  }

  const t = tiles[p.pos];
  const img = tileImage(t);
  const pool = events[areas[t.area].pool];

  if (t.type == "good" || t.type == "bad" || t.type == "normal") {
    const ev = pickEvent(p, pool[t.type]);
    const summary = applyResult(p, ev);
    addLog(p.name + " : " + ev.text);
    showPopup(img, typeTitles[t.type], situationTag(ev) + ev.text + resultHtml(summary));
  }
  else if (t.type == "event" && t.area == "gamble") {
    lottery(p, img);
  }
  else if (t.type == "event") {
    eventTile(p, pickEvent(p, pool.event), img);
  }
  else if (t.type == "pay") {
    let text = "아직 수입이 없어요.";
    if (p.lastPay > 0) {
      text = "이번 수입은 <b>" + won(p.lastPay) + "</b>!";
    }
    if (p.lastInterest > 0) {
      text += "<br>🏦 대출 이자 " + won(p.lastInterest) + "를 냈어요.";
    }
    showPopup(img, "💵 월급날!", text);
  }
  else if (t.type == "card") {
    const summary = applyResult(p, { card: true });
    showPopup(img, "🎴 카드", "카드를 한 장 얻었어요!" + resultHtml(summary));
  }
  else if (t.type == "lucky") {
    luckyTile(p, img);
  }
  else if (t.type == "treasure") {
    treasureTile(p, img);
  }
  else if (t.type == "love") {
    loveTile(p, img);
  }
  else if (t.type == "work") {
    workTile(p, img);
  }
  else if (t.type == "life") {
    lifeTile(p, t.life, img);
  }
  else if (t.type == "goal") {
    goalTile(p, img);
  }
  else {
    nextTurn(); // 갈림길 칸에 딱 멈추면 그냥 다음 차례
  }
}

// 이동 중에 생긴 일 처리 → 끝나면 다시 arrive (남은 일 또는 칸 이벤트)
function doPending(p, job) {
  const again = function () {
    arrive(p);
  };
  if (job.type == "promo") {
    promotion(p, again);
  } else if (job.type == "kidjob") {
    kidJobRoulette(p, job.kid, again);
  } else if (job.type == "meet") {
    meeting(p, players[job.other], again);
  } else {
    again();
  }
}

// ★ 진급 심사 (월급날) : 진급 점수 = 룰렛 숫자(1~10) + 주 능력치 × 0.1 → 15 이상이면 진급
//   룰렛 10칸 중 15를 넘는 숫자 칸이 O 칸이 돼요
function promotion(p, after) {
  // 이미 최고 랭크거나 퇴직했으면 (월급날을 두 번 지나는 경우) 그냥 넘어가요
  if (p.job == null || p.retired || p.grade >= jobs[p.job].grades.length - 1) {
    after();
    return;
  }
  const job = jobs[p.job];
  const next = job.grades[p.grade + 1];
  const bonus = Math.floor(p[job.main] * 0.1);

  let win = 0;
  for (let n = 1; n <= 10; n++) {
    if (n + bonus >= 15) {
      win++;
    }
  }
  const slots = [];
  for (let k = 0; k < 10; k++) {
    if (k < win) {
      slots.push("O");
    } else {
      slots.push("X");
    }
  }

  const text = "<b>" + next.title + "</b> 진급 심사!<br>" +
    "진급 점수 = 룰렛(1~10) + " + statNames[job.main] + " " + p[job.main] + "×0.1 (+" + bonus + ") → 15 이상" +
    '<div class="slot-info">' + countText(slots) + '</div>';

  showRoulette(p, "★ 진급 심사 (월급날)", text, slots, function (mark) {
    const img = images.tiles.work;
    if (mark == "X") {
      showPopup(img, "😢 진급 실패", "진급 점수가 모자랐어요. 다음 월급날에 다시!", [{ text: "확인", action: after }]);
      return;
    }
    if (!meetsNeed(p, next.need)) {
      showPopup(img, "🚫 진급 거부", "점수는 넘었지만 능력치가 모자라요.<br>(" + needText(next.need) + " 필요)", [{ text: "확인", action: after }]);
      return;
    }

    const before = job.grades[p.grade].salary;
    p.grade++;
    addLog(p.name + " : 🎉 RANK UP! " + next.title);
    drawPlayerList();

    let nextInfo = "최고 랭크 달성! 👑";
    if (p.grade < job.grades.length - 1) {
      const after2 = job.grades[p.grade + 1];
      nextInfo = "다음 랭크 ▶ " + after2.title + " (" + needText(after2.need) + ")";
    }
    showPopup(img, "🎉 RANK UP!",
      '<div class="rankup">' + job.name + "<br><b>" + next.title + " ★" + (p.grade + 1) + "</b>" +
      "<br>월급 " + won(next.salary) + ' <span class="cp-up">(+' + won(next.salary - before) + ")</span>" +
      '<br><small>' + nextInfo + '</small></div>',
      [{ text: "확인", action: after }]);
  });
}

// 🧑 자녀가 어른이 되면 직업 룰렛 → 월급날마다 돈을 보태 줘요
function kidJobRoulette(p, kid, after) {
  const labels = [];
  for (const j of kidJobs) {
    labels.push(j.name);
  }
  showRoulette(p, "🧑 " + kid.name + " 어른이 됐어요!", kid.name + "(이)는 어떤 직업을 가질까요?", labels, function (label, k) {
    kid.job = kidJobs[k];
    addLog(p.name + " : 🧑 " + kid.name + " → " + kid.job.name);
    drawPlayerList();
    showPopup(images.tiles.pay, "🧑 " + kid.name + "의 취업!",
      kid.name + "(이)가 <b>" + kid.job.name + "</b>(이)가 됐어요!<br>앞으로 월급날마다 <b>" + won(kid.job.salary) + "</b>씩 보태 줘요.",
      [{ text: "확인", action: after }]);
  });
}

// 🤝 인연 : 수락하면 두 사람 모두 지력 · 센스 UP
function meeting(p, other, after) {
  const text = pick(encounters).replace("{a}", other.name).replace("{b}", p.name);
  showPopup(other.img, "🤝 인연 발생!",
    text + "<br>함께하면 두 사람 모두 " + statNames.int + " · " + statNames.sense + " +" + meetBonus + "!",
    [
      {
        text: "🤝 수락",
        cpuPick: true,
        action: function () {
          applyResult(p, { int: meetBonus, sense: meetBonus });
          applyResult(other, { int: meetBonus, sense: meetBonus });
          p.meets++;
          other.meets++;
          addLog("🤝 " + p.name + " & " + other.name + " 인연!");
          after();
        }
      },
      { text: "거절", action: after }
    ]);
}

// ⭐ 럭키 칸 : 럭키 룰렛 (어른은 돈, 어린이는 능력치)
function luckyTile(p, img) {
  if (isAdult(p)) {
    const labels = [];
    for (const a of luckyAmounts) {
      labels.push(a + "만");
    }
    showRoulette(p, "⭐ 럭키 칸!", "럭키 룰렛으로 보너스를 받아요!", labels, function (label, k) {
      const summary = applyResult(p, { money: luckyAmounts[k] });
      addLog(p.name + " : ⭐ 럭키 " + moneyText(luckyAmounts[k]));
      showPopup(img, "⭐ 럭키!", resultHtml(summary));
    });
    return;
  }
  const slots = ["🧠", "🧠", "🧠", "💪", "💪", "💪", "✨", "✨", "✨", "🌟"];
  showRoulette(p, "⭐ 럭키 칸!", "나온 능력치가 +10! (🌟 는 모두 +5)", slots, function (mark) {
    let r = { int: 5, str: 5, sense: 5 };
    if (mark == "🧠") {
      r = { int: 10 };
    } else if (mark == "💪") {
      r = { str: 10 };
    } else if (mark == "✨") {
      r = { sense: 10 };
    }
    const summary = applyResult(p, r);
    showPopup(img, "⭐ 럭키!", resultHtml(summary));
  });
}

// 💎 보물 칸 : 보물 룰렛 → 마지막에 보물 값만큼 자산에 더해져요
function treasureTile(p, img) {
  const labels = [];
  for (const t of treasures) {
    labels.push(t.icon);
  }
  showRoulette(p, "💎 보물 발견!", "어떤 보물일까요?", labels, function (label, k) {
    const t = treasures[k];
    p.treasures.push(t);
    addLog(p.name + " : 💎 " + t.name);
    drawPlayerList();
    showPopup(img, "💎 " + t.icon + " " + t.name, "보물을 모았어요! (가치 " + won(t.value) + ")<br>게임이 끝나면 자산에 더해져요.");
  });
}

// 🎰 한방역전섬 복권 : 현금 절반을 걸고 룰렛! 7번 칸 ×2, 10번 칸 ×5, 나머지는 꽝
function lottery(p, img) {
  const stake = Math.floor(p.money / 2);
  if (stake <= 0) {
    showPopup(img, "🎰 인생 복권", "걸 돈이 없어서 구경만 했어요...");
    return;
  }
  const slots = ["X", "X", "X", "X", "X", "X", "×2", "X", "X", "×5"];
  showPopup(img, "🎰 인생 복권",
    "현금 절반 <b>" + won(stake) + "</b>을 걸어 볼까요?<br>룰렛 7번 칸 ×2, 10번 칸 ×5 (나머지는 꽝!)",
    [
      {
        text: "🎰 건다!",
        cpuPick: rankOf(p) > 1, // 컴퓨터는 1등이 아니면 도전
        action: function () {
          showRoulette(p, "🎰 인생 복권", "건 돈 " + won(stake), slots, function (mark) {
            let gain = -stake;
            if (mark == "×2") {
              gain = stake;
            } else if (mark == "×5") {
              gain = stake * 4;
            }
            const summary = applyResult(p, { money: gain });
            addLog(p.name + " : 🎰 복권 " + moneyText(gain));
            let title = "😭 꽝...";
            if (gain > 0) {
              title = "🎉 " + mark + " 대박!!";
            }
            showPopup(img, title, resultHtml(summary));
          });
        }
      },
      { text: "안 건다", cpuPick: rankOf(p) == 1, action: nextTurn }
    ]);
}

// ----- 내 상황에 맞는 이벤트 -----
// 이벤트에 when 이 있으면, 그 상황일 때만 나와요 (events.js 맨 위 설명 참고)
function matches(p, when) {
  if (when == undefined) {
    return true; // 조건 없는 이벤트는 언제나
  }
  if (when == "single") {
    return p.spouse == null && p.date == null;
  }
  if (when == "dating") {
    return p.date != null;
  }
  if (when == "married") {
    return p.spouse != null;
  }
  if (when == "kids") {
    return p.kids.length > 0;
  }
  if (when == "house") {
    return p.house != null;
  }
  if (when == "nohouse") {
    return p.house == null;
  }
  if (when == "job") {
    return p.job != null && !p.retired;
  }
  if (when == "nojob") {
    return p.job == null;
  }
  if (when == "rich") {
    return p.money >= 1000;
  }
  if (when == "poor") {
    return p.debt > 0;
  }
  if (when == "college") {
    return p.college;
  }
  // "int", "str", "sense" : 그 재능을 가진 사람
  if (when == "int" || when == "str" || when == "sense") {
    return p.talent == when;
  }
  // 나머지는 예전에 한 일 (flags) : 예) "piano" → 피아노를 배웠던 사람
  return p.flags[when] == true;
}

// 이벤트 목록에서 하나 뽑기 (내 상황에 맞는 이벤트는 3배 더 잘 나와요)
function pickEvent(p, list) {
  const candidates = [];
  for (const ev of list) {
    if (matches(p, ev.when)) {
      candidates.push(ev);
      if (ev.when != undefined) {
        candidates.push(ev);
        candidates.push(ev);
      }
    }
  }
  return pick(candidates);
}

// 상황 이벤트면 팝업 위에 작은 표시
function situationTag(ev) {
  if (ev.when == undefined) {
    return "";
  }
  return '<div class="situ">📌 지금 내 상황 때문에 생긴 일</div>';
}

// 선택 이벤트 (?)
function eventTile(p, ev, img) {
  const buttons = [];
  const cpuIndex = cpuEventChoice(p, ev.choices);

  for (let i = 0; i < ev.choices.length; i++) {
    const choice = ev.choices[i];
    let desc = "";
    if (choice.chance < 1) {
      desc = "🎡 " + countText(chanceSlots(successChance(p, choice.chance), true));
    }
    buttons.push({
      text: choice.label,
      desc: desc,
      cpuPick: i == cpuIndex,
      action: function () {
        resolveChoice(p, choice, img);
      }
    });
  }
  showPopup(img, "❓ 선택 이벤트", situationTag(ev) + ev.text, buttons);
}

// 성공 확률 (최대 95%)
function successChance(p, chance) {
  if (chance >= 1) {
    return 1;
  }
  if (chance > 0.95) {
    return 0.95;
  }
  return chance;
}

// 선택한 뒤 : 확률이 있으면 룰렛 (◎ 대성공 / O 성공 / X 실패)
function resolveChoice(p, choice, img) {
  if (choice.chance >= 1) {
    finishChoice(p, choice.win, "결과", img);
    return;
  }

  const chance = successChance(p, choice.chance);
  chanceRoulette(p, "🎡 " + choice.label, "운명의 룰렛!", chance, true, function (mark) {
    if (mark == "◎") {
      finishChoice(p, doubleResult(choice.win), "🌟 대성공!", img);
    } else if (mark == "O") {
      finishChoice(p, choice.win, "🎉 성공!", img);
    } else {
      finishChoice(p, choice.lose, "😢 실패...", img);
    }
  });
}

function finishChoice(p, result, title, img) {
  const summary = applyResult(p, result);
  addLog(p.name + " : " + result.text);
  showPopup(img, title, result.text + resultHtml(summary));
}


// =====================================================
// 14. 연애 칸 (♥)
//     결혼 전 : 만남 → 데이트 룰렛(호감도 UP) → 고백 룰렛(호감도만큼 O 칸) → 결혼
//     결혼 후 : 데이트(호감도 70%) 또는 특별한 데이트(돈 내고 100%)
//              → 👶 아기 룰렛 (호감도만큼 O 칸)
// =====================================================
function loveTile(p, img) {
  // 1) 결혼한 상태 : 데이트 → 아기 룰렛
  if (p.spouse != null) {
    marriedDate(p, img);
    return;
  }

  // 2) 연애 중 : 데이트 룰렛 → 고백할지 고르기
  if (p.date != null) {
    datingDate(p, img);
    return;
  }

  // 3) 솔로 : 새로운 만남
  meetPartners(p, img);
}

// 상대 카드 등급 : 직업 랭크 + 재산이 높을수록 좋은 상대
function partnerTier(p) {
  let tier = 0;
  if (p.job != null && p.grade >= 2) {
    tier = 1;
  }
  if (p.job != null && p.grade >= 4) {
    tier = 2;
  }
  if (totalOf(p) >= 1000 && tier < 2) {
    tier++;
  }
  return tier;
}

// 💘 이성 상대 카드 3장 중에서 고르기
function meetPartners(p, img) {
  const cards = [];
  for (const partner of partners[partnerTier(p)]) {
    if (partner.gender != p.gender) {
      cards.push(partner);
    }
  }

  // 컴퓨터는 월급이 가장 많은 상대
  let best = cards[0];
  for (const c of cards) {
    if (c.salary > best.salary) {
      best = c;
    }
  }

  const buttons = [];
  for (const partner of cards) {
    buttons.push({
      text: "💕 " + partner.name,
      desc: "결혼하면 월급날마다 " + won(partner.salary),
      cpuPick: partner == best,
      action: function () {
        p.date = { name: partner.name, gender: partner.gender, salary: partner.salary, love: 10 + Math.floor(p.sense / 5) };
        if (p.date.love > 100) {
          p.date.love = 100;
        }
        addLog(p.name + " : 💕 " + partner.name + "와(과) 연애 시작");
        drawPlayerList();
        nextTurn();
      }
    });
  }
  buttons.push({ text: "관심 없어요", action: nextTurn });
  showPopup(img, "💘 운명의 만남?", "누구와 연애를 시작할까요?<br>(내 직업 랭크와 재산이 높을수록 좋은 상대가 나와요)", buttons);
}

// 연애 중 데이트 : 룰렛 결과만큼 호감도 UP (✨센스가 높으면 O 칸이 늘어요)
function datingDate(p, img) {
  const chance = successChance(p, 0.5 + p.sense * 0.004);

  chanceRoulette(p, "💕 " + p.date.name + "와(과) 데이트",
    pick(dates) + "<br>◎ 호감도 +40% · O +25% · X +10%",
    chance, true, function (mark) {
      let gain = 10;
      if (mark == "O") {
        gain = 25;
      }
      if (mark == "◎") {
        gain = 40;
      }
      p.date.love += gain;
      if (p.date.love > 100) {
        p.date.love = 100;
      }
      drawPlayerList();

      // 고백 룰렛 미리보기 (호감도만큼 O 칸)
      const slots = chanceSlots(confessChance(p), true);
      showPopup(img, "💕 데이트 " + slotText(mark),
        "호감도 +" + gain + "% (현재 <b>" + p.date.love + "%</b>)",
        [
          // 컴퓨터는 고백 룰렛이 충분히 유리하면 고백 (나이 들수록 과감하게)
          { text: "💌 고백하기", desc: "🎡 " + countText(slots), cpuPick: cpuWillConfess(p), action: function () { confess(p, img); } },
          { text: "다음에", cpuPick: !cpuWillConfess(p), action: nextTurn }
        ]);
    });
}

// 컴퓨터 : 고백할까?
function cpuWillConfess(p) {
  let need = 0.6;
  if (areas[p.area].stage >= 8) {
    need = 0.45; // 성인 후반부터는 시간이 없으니 과감하게
  }
  return confessChance(p) >= need;
}

// 고백 성공 확률 = 호감도 (+운세)
function confessChance(p) {
  return successChance(p, p.date.love / 100);
}

// 💌 고백 룰렛 : ◎ 대성공(축의금 2배) / O 결혼 / X 실패
function confess(p, img) {
  chanceRoulette(p, "💌 " + p.date.name + "에게 고백!", "호감도 " + p.date.love + "% 만큼 O 칸이 있어요!",
    confessChance(p), true, function (mark) {
      if (mark == "X") {
        p.date.love -= 30;
        let text = "아직 마음의 준비가 안 됐대요... (호감도 -30%)";
        if (p.date.love <= 0) {
          text = p.date.name + "와(과) 헤어졌어요... 💔";
          addLog(p.name + " : 💔 이별");
          p.date = null;
        }
        drawPlayerList();
        showPopup(img, "😢 고백 실패", text);
        return;
      }

      let times = 1;
      let text = "";
      if (mark == "◎") {
        times = 2;
      }
      p.spouse = p.date;
      p.spouse.love = 0;
      p.date = null;
      addLog(p.name + " : 💍 " + p.spouse.name + "와(과) 결혼!");
      drawPlayerList();

      text = p.spouse.name + "와(과) 결혼해요!<br>축의금 룰렛을 돌려서 모두에게 축의금을 받아요!";
      if (times == 2) {
        text += "<br>🌟 <b>대성공 프러포즈! 축의금 2배!</b>";
      }
      showPopup(img, "💍 고백 성공! 결혼!", text,
        [{ text: "🎁 축의금 룰렛!", action: function () { giftRoulette(p, "💍 결혼 축하", times); } }]);
    });
}

// 결혼 후 데이트 : 고른 데이트로 호감도 채우기 → 👶 아기 룰렛
function marriedDate(p, img) {
  // 아이가 많으면 가족 나들이만
  if (p.kids.length >= maxKids) {
    const summary = applyResult(p, { sense: 5 });
    showPopup(img, "👨‍👩‍👧 가족 나들이", pick(dates) + "<br>아이들과 즐거운 시간을 보냈어요!" + resultHtml(summary));
    return;
  }

  const rich = p.money >= specialDateCost * 5; // 컴퓨터는 돈이 넉넉하면 특별한 데이트
  showPopup(img, "💑 " + p.spouse.name + "와(과) 데이트",
    "어떤 데이트를 할까요?<br>호감도만큼 <b>👶 아기 룰렛</b>의 O 칸이 생겨요!",
    [
      { text: "🚶 데이트", desc: "호감도 70%", cpuPick: !rich, action: function () { babyRoulette(p, img, 70, 0); } },
      { text: "💎 특별한 데이트", desc: won(specialDateCost) + " · 호감도 100%", cpuPick: rich, action: function () { babyRoulette(p, img, 100, specialDateCost); } }
    ]);
}

// 👶 아기 룰렛 : O 아기 탄생 / X 다음 기회에 (2가지)
function babyRoulette(p, img, love, cost) {
  p.spouse.love = love;
  if (cost > 0) {
    applyResult(p, { money: -cost });
  }
  drawPlayerList();

  chanceRoulette(p, "👶 아기 룰렛", pick(dates) + "<br>호감도 <b>" + love + "%</b>", love / 100, false, function (mark) {
    if (mark == "O") {
      genderRoulette(p, img);
    } else {
      showPopup(img, "👶 아직은...", "이번에는 아기 소식이 없어요.<br>다음 연애 칸에서 다시 도전!");
    }
  });
}

// 👦👧 성별 룰렛 → 아기 탄생 → 축의금 룰렛
function genderRoulette(p, img) {
  const slots = ["👦", "👧", "👦", "👧", "👦", "👧", "👦", "👧", "👦", "👧"];
  showRoulette(p, "👶 새로운 가족!", "아들일까, 딸일까?", slots, function (mark) {
    let gender = "F";
    if (mark == "👦") {
      gender = "M";
    }
    const name = pick(kidNames[gender]);
    p.kids.push({ name: name, gender: gender, age: 0, job: null });
    p.spouse.love = 0;
    addLog(p.name + " : 👶 " + name + " 탄생!");
    drawPlayerList();

    let who = "딸";
    if (gender == "M") {
      who = "아들";
    }
    showPopup(img, "👶 " + who + " " + name + " 탄생!",
      p.spouse.name + "와(과)의 사이에 새로운 가족이 늘었어요!<br>(월급날 4번이 지나면 어른이 되어 직업을 갖고 돈을 벌어 와요)",
      [{ text: "🎁 축의금 룰렛!", action: function () { giftRoulette(p, "👶 출산 축하", 1); } }]);
  });
}


// 🎁 축의금 룰렛 : 나온 금액을 다른 사람 "한 명마다" 받아요 (times = 배수)
function giftRoulette(p, reason, times) {
  if (players.length == 1) {
    showPopup(images.tiles.love, reason, "축의금을 줄 사람이 없어요... 😢");
    return;
  }

  const labels = [];
  for (const a of giftAmounts) {
    labels.push(a + "만");
  }
  showRoulette(p, "🎁 " + reason, "나온 금액만큼 다른 사람 한 명마다 받아요!", labels, function (label, k) {
    const amount = giftAmounts[k] * times;
    const summary = applyResult(p, { all: amount });
    addLog(p.name + " : 🎁 축의금 " + won(amount) + "씩 받음");
    showPopup(images.tiles.love, "🎁 " + reason + "!",
      "모두에게 <b>" + won(amount) + "</b>씩 받았어요!" + resultHtml(summary));
  });
}


// =====================================================
// 15. 직업 칸 (★) : 능력치 UP (진급 심사는 월급날!)
// =====================================================
function workTile(p, img) {
  if (p.job == null) {
    const summary = applyResult(p, { int: 5, str: 5, sense: 5 });
    showPopup(img, "★ 자기계발", "아직 직업이 없어서 자기계발을 했어요." + resultHtml(summary));
    return;
  }
  if (p.retired) {
    const summary = applyResult(p, { sense: 5 });
    showPopup(img, "★ 은퇴 생활", "일은 쉬고 취미 생활을 즐겨요." + resultHtml(summary));
    return;
  }

  const ev = pick(workEvents);
  const summary = applyResult(p, ev);
  let text = ev.text + resultHtml(summary) + "<br>";

  const job = jobs[p.job];
  const next = p.grade + 1;
  if (next >= job.grades.length) {
    text += "이미 최고 랭크예요! 👑";
  } else {
    text += "다음 랭크 ▶ " + job.grades[next].title + " (" + needText(job.grades[next].need) + ")<br><small>진급 심사는 💵 월급날에!</small>";
  }
  showPopup(img, "★ 직업 이벤트", text);
}


// 능력치 조건을 만족하는지 검사
function meetsNeed(p, need) {
  for (const key in need) {
    if (p[key] < need[key]) {
      return false;
    }
  }
  return true;
}

// { int: 12 } → "🧠지력 12 이상"
function needText(need) {
  const parts = [];
  for (const key in need) {
    parts.push(statNames[key] + " " + need[key]);
  }
  if (parts.length == 0) {
    return "조건 없음";
  }
  return parts.join(", ") + " 이상";
}


// =====================================================
// 16. 인생 이벤트 칸 (무조건 멈추는 칸)
// =====================================================
function lifeTile(p, key, img) {
  const ev = lifeEvents[key];

  // 🌟 재능 발견 : 재능 룰렛
  if (key == "talent") {
    talentRoulette(p, img, nextTurn);
  }

  // ✏️ 수능 룰렛 : 지력이 높을수록 O 칸이 많아요 (◎ 만점 / O 대박 / X 아쉬움)
  else if (key == "exam") {
    let chance = 0.2 + p.int * 0.008;
    chance = successChance(p, Math.min(chance, 0.95));
    chanceRoulette(p, ev.title, "🧠지력이 높을수록 O 칸이 많아요!", chance, true, function (mark) {
      if (mark == "◎") {
        const summary = applyResult(p, { int: 20, sense: 10 });
        showPopup(img, "✏️ 수능 만점!!", "전국 뉴스에 나왔어요!" + resultHtml(summary));
      } else if (mark == "O") {
        const summary = applyResult(p, { int: 10, sense: 5 });
        showPopup(img, "✏️ 수능 대박!", "노력한 만큼 결과가 나왔어요!" + resultHtml(summary));
      } else {
        const summary = applyResult(p, { sense: -5 });
        showPopup(img, "✏️ 수능... 아쉬워요", "실수를 좀 했어요." + resultHtml(summary));
      }
    });
  }

  // 🎓 대학 입학
  else if (key == "college") {
    p.college = true;
    const summary = applyResult(p, ev);
    showPopup(img, ev.title, ev.text + resultHtml(summary));
  }

  // 💼 직업 선택
  else if (key == "job") {
    chooseJob(p, img);
  }

  // 💍 결혼 정지 칸
  else if (key == "marry") {
    marryTile(p, img);
  }

  // 🏠 집 사기
  else if (key == "house") {
    const buttons = [];
    const cpuHouse = cpuHouseChoice(p);
    for (const house of houses) {
      buttons.push({
        text: house.name,
        desc: won(house.price) + " → 나중에 " + won(house.sell),
        cpuPick: house == cpuHouse,
        action: function () {
          p.house = house;
          applyResult(p, { money: -house.price });
          addLog(p.name + " : 🏠 " + house.name + " 구입");
          nextTurn();
        }
      });
    }
    buttons.push({ text: "안 산다", cpuPick: cpuHouse == null, action: nextTurn });
    showPopup(img, ev.title, ev.text + "<br><small>(돈이 모자라면 🏦 자동 대출!)</small>", buttons);
  }

  // 🎉 정년 퇴직
  else if (key == "retire") {
    p.retired = true;
    const summary = applyResult(p, ev);
    addLog(p.name + " : 🎉 정년 퇴직");
    showPopup(img, ev.title, ev.text + resultHtml(summary));
  }

  // 나머지 (유치원, 초등학교 입학 ...)
  else {
    const summary = applyResult(p, ev);
    showPopup(img, ev.title, ev.text + resultHtml(summary));
  }
}

// 💍 결혼 정지 칸 : 연인이 있으면 프러포즈 룰렛 (호감도 = 성공 확률)
function marryTile(p, img) {
  if (p.spouse != null) {
    const summary = applyResult(p, { sense: 5 });
    showPopup(img, "💍 결혼기념일", p.spouse.name + "와(과) 행복하게 살고 있어요." + resultHtml(summary));
    return;
  }
  if (p.date != null) {
    showPopup(img, lifeEvents.marry.title,
      p.date.name + "에게 프러포즈! (호감도 " + p.date.love + "% = 성공 확률)",
      [{ text: "💍 프러포즈 룰렛!", action: function () { confess(p, img); } }]);
    return;
  }
  // 솔로 : 결혼식장에서 새로운 만남
  meetPartners(p, img);
}

// 룰렛 기호(🧠 💪 ✨)로 재능 찾기
function findTalent(icon) {
  for (const talent of talents) {
    if (talent.icon == icon) {
      return talent;
    }
  }
  return talents[0];
}

// 재능 주기 (그 능력치 +5, 앞으로 1.5배로 올라요) → 끝나면 after
function giveTalent(p, talent, img, after) {
  p.talent = talent.key;
  const bonus = {};
  bonus[talent.key] = 5; // 예: bonus.int = 5
  const summary = applyResult(p, bonus);
  addLog(p.name + " : 🌟 재능 " + talent.name);
  showPopup(img, lifeEvents.talent.title,
    talent.text + "<br><b>" + talent.name + "</b> 재능을 타고났어요!<br>(이 능력치는 항상 1.5배로 올라요)" + resultHtml(summary),
    [{ text: "확인", action: after }]);
}

// 🌟 재능 룰렛 (🧠 3칸, 💪 3칸, ✨ 3칸, ⭐ 1칸 = 원하는 재능 고르기)
function talentRoulette(p, img, after) {
  const slots = ["⭐", "🧠", "🧠", "🧠", "💪", "💪", "💪", "✨", "✨", "✨"];
  showRoulette(p, lifeEvents.talent.title, "어떤 재능을 타고났을까요?<br>⭐ 칸이 나오면 원하는 재능을 골라요!", slots, function (mark) {
    if (mark != "⭐") {
      giveTalent(p, findTalent(mark), img, after);
      return;
    }
    // ⭐ : 직접 고르기 (컴퓨터는 지금 가장 높은 능력치, 없으면 지력)
    let cpuKey = "int";
    if (p.str > p[cpuKey]) {
      cpuKey = "str";
    }
    if (p.sense > p[cpuKey]) {
      cpuKey = "sense";
    }
    const buttons = [];
    for (const talent of talents) {
      buttons.push({
        text: talent.name,
        cpuPick: talent.key == cpuKey,
        action: function () { giveTalent(p, talent, img, after); }
      });
    }
    showPopup(img, "⭐ 행운의 칸!", "원하는 재능을 골라요!", buttons);
  });
}

// 직업 고르기 : 능력치가 되는 직업만 버튼으로 보여줘요
function chooseJob(p, img) {
  const buttons = [];
  let lockedText = "";

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const first = job.grades[0];

    if (job.college && !p.college) {
      lockedText += "🔒 " + job.name + " (대졸)<br>";
    } else if (!meetsNeed(p, first.need)) {
      lockedText += "🔒 " + job.name + " (" + needText(first.need) + ")<br>";
    } else {
      buttons.push({
        text: job.name,
        desc: first.title + " · 월급 " + won(first.salary) + " → 최고 " + won(job.grades[job.grades.length - 1].salary),
        score: cpuJobScore(p, job),
        action: function () {
          p.job = i;
          p.grade = 0;
          addLog(p.name + " : 💼 " + job.name + " 취업!");
          drawPlayerList();
          nextTurn();
        }
      });
    }
  }

  // 컴퓨터는 점수(월급 + 승진 가능성)가 가장 높은 직업을 골라요
  let best = buttons[0];
  for (const b of buttons) {
    if (b.score > best.score) {
      best = b;
    }
  }
  best.cpuPick = true;

  let text = lifeEvents.job.text;
  if (lockedText != "") {
    text += '<div class="result">' + lockedText + '</div>';
  }
  showPopup(img, lifeEvents.job.title, text, buttons);
}

// 🏁 골인 (도착 순서 보너스)
function goalTile(p, img) {
  const bonus = goalBonus[finishCount];
  finishCount++;
  p.finished = true;
  const summary = applyResult(p, { money: bonus });
  addLog(p.name + " : 🏁 " + finishCount + "등으로 골인!");

  let text = "인생 완주를 축하해요!";
  if (gameMode.key == "junior") {
    text = "고등학교 졸업을 축하해요!";
  }
  showPopup(img, "🏁 " + finishCount + "등으로 골인!",
    text + "<br>모두 끝날 때까지 보너스 룰렛으로 돈을 벌 수 있어요." + resultHtml(summary));
}

// 아이만 모드 : 진로 선택 갈림길에 오면 골인
function arriveGoal(p) {
  p.pending = [];
  p.stepsLeft = 0;
  goalTile(p, images.tiles.goal);
}


// =====================================================
// 17. 팝업 창
//     buttons = [{ text: "글자", desc: "설명", action: 누르면 실행할 함수 }, ...]
//     buttons 를 안 넣으면 [확인] 버튼 → 다음 차례
// =====================================================
function showPopup(img, title, text, buttons) {
  document.getElementById("popupImg").src = img;
  document.getElementById("popupTitle").innerHTML = title;
  document.getElementById("popupText").innerHTML = text;

  if (buttons == undefined) {
    buttons = [{ text: "확인", action: nextTurn }];
  }

  const box = document.getElementById("popupButtons");
  box.innerHTML = "";

  // 컴퓨터 차례인지
  const cpuTurnNow = players.length > 0 && players[turn].cpu;
  // 컴퓨터가 고를 버튼
  let choice = null;
  if (cpuTurnNow) {
    choice = cpuChoose(buttons);
  }

  for (const b of buttons) {
    const btn = document.createElement("button");
    btn.className = "big-btn";
    btn.innerHTML = b.text;
    if (b.desc) {
      btn.innerHTML += "<small>" + b.desc + "</small>";
    }
    btn.onclick = function () {
      popup.classList.add("hidden");
      b.action();
    };
    // 컴퓨터 차례에 선택지가 2개 이상이면 → 보기만 하고 누를 수 없어요 (확인 버튼 1개는 눌러도 OK)
    if (cpuTurnNow && buttons.length > 1) {
      btn.disabled = true;
      btn.classList.add("cpu-lock");
    }
    b.el = btn;
    box.appendChild(btn);
  }

  let cpuNote = "";
  if (cpuTurnNow && buttons.length > 1) {
    cpuNote = '<div class="cpu-think">🤖 ' + players[turn].name + '(이)가 고민 중...</div>';
  }
  document.getElementById("popupText").innerHTML = text + cpuNote;

  popup.classList.remove("hidden");

  // 컴퓨터 차례면 잠깐 보여 준 뒤 → 고른 버튼 표시 → 누르기
  popupCount++;
  const myCount = popupCount;
  if (cpuTurnNow) {
    let wait = 1800;
    if (buttons.length > 1) {
      wait = 2400;
      setTimeout(function () {
        if (myCount == popupCount) {
          choice.el.classList.add("cpu-choice");
        }
      }, 1300);
    }
    setTimeout(function () {
      // 그사이 다른 팝업이 열렸거나 닫혔으면 무시
      if (myCount == popupCount && !popup.classList.contains("hidden")) {
        popup.classList.add("hidden");
        choice.action();
      }
    }, wait);
  }
}


// =====================================================
// 17-2. 컴퓨터(CPU) 두뇌
// =====================================================

// 칸 점수 : 컴퓨터가 "여기 멈추면 좋겠다"를 계산할 때 써요
function tileScore(p, t) {
  if (t.type == "good") {
    return 3;
  }
  if (t.type == "bad") {
    return -3;
  }
  if (t.type == "card") {
    if (p.cards.length < 3) {
      return 2;
    }
    return 0;
  }
  if (t.type == "love") {
    if (p.spouse != null && p.kids.length >= maxKids) {
      return 1;
    }
    return 2;
  }
  if (t.type == "work") {
    return 2;
  }
  if (t.type == "event") {
    return 1;
  }
  if (t.type == "lucky" || t.type == "treasure") {
    return 3;
  }
  return 0;
}

// num 칸 가면 어느 칸에 멈추는지 (🛑 칸, 골인에서는 멈춰요)
function landingTile(p, num) {
  let id = p.pos;
  for (let i = 0; i < num; i++) {
    const t = tiles[id];
    if (t.next.length == 0) {
      break;
    }
    if (t.next.length > 1) {
      id = t.next[cpuForkChoice(p, t.fork)];
    } else {
      id = t.next[0];
    }
    if (tiles[id].type == "life" || tiles[id].type == "goal") {
      break;
    }
  }
  return tiles[id];
}

// min ~ max 칸 이동했을 때 평균 점수
function rangeScore(p, min, max) {
  let total = 0;
  for (let n = min; n <= max; n++) {
    total += tileScore(p, landingTile(p, n));
  }
  return total / (max - min + 1);
}

// 컴퓨터 차례 : 저격할 럭키 칸이 있으면 저격, 룰렛보다 확실히 좋은 숫자 카드가 있으면 카드, 아니면 룰렛
function cpuTurn() {
  const p = players[turn];
  if (p.finished) {
    bonusRoulette(p);
    return;
  }

  for (let i = 0; i < p.cards.length; i++) {
    if (p.cards[i].key == "snipe" && luckyAhead(p).length > 0) {
      playCard(i);
      return;
    }
  }

  let bestCard = -1;
  let bestScore = rangeScore(p, 1, 10) + 0.8; // 카드는 아껴 쓰기 (룰렛보다 0.8점 이상 좋을 때만)
  for (let i = 0; i < p.cards.length; i++) {
    const c = p.cards[i];
    if (c.min == undefined) {
      continue; // 저격 · 수호 카드는 숫자 카드가 아니에요
    }
    const score = rangeScore(p, c.min, c.max);
    if (score > bestScore) {
      bestScore = score;
      bestCard = i;
    }
  }

  if (bestCard >= 0) {
    playCard(bestCard);
  } else {
    rollWheel(randomInt(1, 10));
  }
}

// 버튼 중에서 cpuPick 표시가 있는 걸 고르기 (없으면 랜덤)
function cpuChoose(buttons) {
  for (const b of buttons) {
    if (b.cpuPick) {
      return b;
    }
  }
  return pick(buttons);
}

// 지금 총자산 등수 (1등이면 1)
function rankOf(p) {
  let rank = 1;
  for (const other of players) {
    if (totalOf(other) > totalOf(p)) {
      rank++;
    }
  }
  return rank;
}

// 갈림길 : 몇 번째 길로 갈지
function cpuForkChoice(p, key) {
  if (key == "f0") {
    // 체력이 지력보다 높으면 운동장, 아니면 학원
    if (p.talent == "str" || p.str > p.int) {
      return 1;
    }
    return 0;
  }
  if (key == "f1") {
    // 전문직(의사, 변호사, 개발자)을 노릴 만큼 공부를 잘하면 대학
    if (p.talent == "int" || p.int >= 35) {
      return 0;
    }
    return 1;
  }
  if (key == "f2") {
    // 결혼 안 했거나 아이가 적으면 연애 집중, 아니면 일 집중
    if (p.spouse == null || p.kids.length < 2) {
      return 0;
    }
    return 1;
  }
  if (key == "f3") {
    // 1등이면 안전하게 바닷길, 뒤처져 있으면 한방역전섬으로 역전!
    if (rankOf(p) == 1) {
      return 0;
    }
    return 1;
  }
  return 0;
}

// 결과의 가치 (컴퓨터가 비교할 때 쓰는 점수)
//   돈은 어릴 때 2만원, 어른이면 10만원을 능력치 1점 정도로 봐요
function resultValue(p, r) {
  if (r == undefined) {
    return 0;
  }
  let value = 0;
  let moneyUnit = 2;
  if (isAdult(p)) {
    moneyUnit = 10;
  }
  if (r.money) {
    value += r.money / moneyUnit;
  }
  if (r.all) {
    value += (r.all * (players.length - 1)) / moneyUnit;
  }
  for (const key in statNames) {
    if (r[key]) {
      let amount = r[key];
      if (amount > 0 && p.talent == key) {
        amount = amount * talentBonus; // 재능 능력치는 1.5배로 오르니까 더 좋아요
      }
      value += amount;
    }
  }
  if (r.card) {
    value += 1;
  }
  return value;
}

// 선택 이벤트 : 룰렛 칸 수까지 계산해서 "평균적으로 가장 이득"인 선택
function cpuEventChoice(p, choices) {
  let best = 0;
  let bestValue = -99999;
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    let value = resultValue(p, c.win);
    if (c.chance < 1) {
      // 룰렛 10칸 : ◎(보상 2배) / O / X 칸 수로 평균 내기
      const slots = chanceSlots(successChance(p, c.chance), true);
      let total = 0;
      for (const mark of slots) {
        if (mark == "◎") {
          total += resultValue(p, doubleResult(c.win));
        } else if (mark == "O") {
          total += resultValue(p, c.win);
        } else {
          total += resultValue(p, c.lose);
        }
      }
      value = total / 10;
    }
    if (value > bestValue) {
      bestValue = value;
      best = i;
    }
  }
  return best;
}

// 집 : 사고 나서도 100만원은 남는 집 중 가장 비싼 집 (없으면 null = 안 삼)
function cpuHouseChoice(p) {
  let best = null;
  for (const house of houses) {
    if (house.price + 100 <= p.money) {
      best = house;
    }
  }
  return best;
}

// 직업 : 첫 월급 + 나중에 오를 월급 + 진급에 쓰는 능력치가 재능과 맞는지까지 생각해서 고르기
function cpuJobScore(p, job) {
  const last = job.grades[job.grades.length - 1];
  let score = job.grades[0].salary + last.salary * 0.3;
  // 진급 점수에 쓰는 주 능력치가 높을수록 진급하기 쉬워요
  score += p[job.main] * 0.2;
  if (p.talent == job.main) {
    score += 10;
  }
  return score;
}


// =====================================================
// 18. 다음 차례
// =====================================================
function nextTurn() {
  // 인생 이벤트 칸에서 멈췄다면 → 남은 칸만큼 이어서 이동 (차례는 그대로)
  const now = players[turn];
  if (now.stepsLeft > 0) {
    const left = now.stepsLeft;
    now.stepsLeft = 0;
    rollText.textContent = "▶ 남은 " + left + "칸 이동!";
    addLog(now.name + " : ▶ 남은 " + left + "칸 이어서 이동");
    setTimeout(function () {
      movePlayer(now, left);
    }, 400);
    return;
  }

  // 모두 골인했으면 게임 끝
  if (finishCount == players.length) {
    endGame();
    return;
  }
  // 골인한 사람도 차례가 와요 (보너스 룰렛)
  turn = (turn + 1) % players.length;

  // 모두 한 번씩 했으면 (= 한 턴 끝)
  if (turn == 0) {
    round++;
    // 모드의 턴 수를 다 쓰면 게임 끝 (닌텐도 인생게임처럼)
    if (round >= gameMode.turns) {
      endGame();
      return;
    }
    if (round % minigameEvery == 0) {
      miniPending = true;
    }
  }
  continueGame();
}

// 차례 사이에 할 일 : 중간 집계 → 미니게임 → 다음 사람 차례
// (중간 집계, 미니게임 창을 닫으면 다시 이 함수가 불려요)
function continueGame() {
  // 중간 집계은 한 바퀴가 다 끝났을 때(turn == 0)만
  if (checkpointPending && turn == 0) {
    checkpointPending = false;
    showCheckpoint();
    return;
  }
  if (miniPending) {
    miniPending = false;
    startMinigame();
    return;
  }
  startTurn();
}


// =====================================================
// 18-2. 미니게임
//   한 바퀴마다 열려요. 사람은 직접 하고, 컴퓨터는 점수가 자동!
//   시작 전에 🎁 상금 룰렛으로 1등 상금을 정하고, 순위대로 나눠 받아요
// =====================================================
// stat : 미성년자가 이기면 오르는 능력치
const minigames = [
  { name: "⚡ 연타 대결", desc: "5초 동안 버튼을 최대한 많이 누르세요!", play: playMash, stat: "str", cpuMin: 20, cpuMax: 40 },
  { name: "🎯 타이밍 대결", desc: "움직이는 막대를 초록색 가운데에서 멈추세요!", play: playTiming, stat: "sense", cpuMin: 50, cpuMax: 95 },
  { name: "🍀 행운의 상자", desc: "상자 3개 중 하나를 고르세요! (0점 / 50점 / 100점)", play: playBox, stat: "sense", cpuMin: 0, cpuMax: 100 },
  { name: "🎡 룰렛 대결", desc: "한 명씩 숫자 룰렛을 돌려요! 가장 큰 숫자가 나온 사람이 1등!", play: playSpin, stat: "int", cpuMin: 1, cpuMax: 10 }
];

// 성인인지 (대학 / 바로 취업 길부터 성인)
function isAdult(p) {
  return areas[p.area].adult == true;
}

// 등수(0, 1, 2, 3)에 맞는 보상 : 미성년자는 능력치, 성인은 돈
// 1등 상금(mini.prize) × 등수별 비율(miniShare)
function miniReward(p, rank) {
  const r = {};
  if (isAdult(p)) {
    r.money = Math.round(mini.prize.money * miniShare[rank]);
  } else {
    r[mini.game.stat] = Math.round(mini.prize.stat * miniShare[rank]);
  }
  return r;
}

// 1등 상품 글자 (미성년자는 능력치, 성인이 되면 자동으로 돈)
function rewardText(p) {
  if (isAdult(p)) {
    return "💰 " + won(mini.prize.money);
  }
  return statNames[mini.game.stat] + " +" + mini.prize.stat;
}

const miniBox = document.getElementById("mini");
const miniTitle = document.getElementById("miniTitle");
const miniBody = document.getElementById("miniBody");

// 미니게임 창에 내용 보여주기
function showMini(title, html) {
  miniTitle.innerHTML = title;
  miniBody.innerHTML = html;
  miniBox.classList.remove("hidden");
}

function startMinigame() {
  busy = true;
  updateScreen();

  const game = pick(minigames);
  mini = { game: game, index: 0, scores: [], prize: null };

  showMini("🎮 미니게임 : " + game.name,
    game.desc + "<br><br>먼저 <b>🎁 상금 룰렛</b>으로 1등 상금을 정해요!" +
    '<br><br><button class="big-btn" onclick="spinPrize()">🎁 상금 룰렛 돌리기</button>');
}

// 🎁 상금 룰렛 : 1등 상금 정하기 (2등은 절반, 3등은 30%)
function spinPrize() {
  const labels = [];
  for (const prize of miniPrizes) {
    labels.push(prize.money + "만");
  }
  showRoulette(null, "🎁 상금 룰렛", "이번 미니게임의 1등 상금은?<br>(미성년자는 능력치로 받아요)", labels, function (label, k) {
    mini.prize = miniPrizes[k];
    showMini("🎮 미니게임 : " + mini.game.name,
      mini.game.desc +
      '<div class="prize-box">🥇 1등 상금 <b>' + won(mini.prize.money) + '</b> (미성년자 능력치 +' + mini.prize.stat + ')' +
      '<br><small>🥈 2등 절반 · 🥉 3등 30%</small></div>' +
      '<button class="big-btn" onclick="miniNextPlayer()">시작!</button>');
  });
}

// 다음 사람 차례
function miniNextPlayer() {
  if (mini.index >= players.length) {
    miniFinish();
    return;
  }
  const p = players[mini.index];

  // 컴퓨터는 점수 자동
  if (p.cpu) {
    const score = randomInt(mini.game.cpuMin, mini.game.cpuMax);
    miniDone(p, score);
    return;
  }

  showMini(mini.game.name,
    '<img src="' + p.img + '" width="80"><br><b style="color:' + p.color + '">' + p.name + '</b>의 차례!' +
    '<br>🎁 1등 상품 : ' + rewardText(p) +
    '<br><br><button class="big-btn" onclick="mini.game.play(players[mini.index])">준비 완료!</button>');
}

// 한 사람 끝 → 점수 보여주고 다음 사람
function miniDone(p, score) {
  mini.scores[p.id] = score;
  let who = p.name;
  if (p.cpu) {
    who = "🤖 " + p.name;
  }
  showMini(mini.game.name,
    who + "의 점수<br><div class='big-num'>" + score + "점</div>" +
    '<button class="big-btn" onclick="mini.index++; miniNextPlayer()">다음</button>');
}

// 모두 끝 → 순위 + 상금 (점수가 같으면 같은 등수)
function miniFinish() {
  const ranked = players.slice();
  ranked.sort(function (a, b) {
    return mini.scores[b.id] - mini.scores[a.id];
  });

  const medals = ["🥇", "🥈", "🥉", "4등"];
  let html = "";
  for (const p of ranked) {
    // 등수 = 나보다 점수가 높은 사람 수
    let rank = 0;
    for (const other of players) {
      if (mini.scores[other.id] > mini.scores[p.id]) {
        rank++;
      }
    }

    if (rank == 0) {
      p.miniWins++; // 🎮 미니게임 킹 칭호용
    }
    let summary = applyResult(p, miniReward(p, rank));
    if (summary == "") {
      summary = "보상 없음";
    }
    html += '<div class="mini-rank">' +
            '<span>' + medals[rank] + ' <img src="' + p.img + '"> ' + p.name + '</span>' +
            '<span>' + mini.scores[p.id] + '점 · ' + summary + '</span>' +
            '</div>';
  }
  addLog("🎮 미니게임 1등 : " + ranked[0].name);

  html += '<br><button class="big-btn" onclick="closeMini()">계속하기</button>';
  showMini("🏆 미니게임 결과", html);
}

function closeMini() {
  miniBox.classList.add("hidden");
  miniBox.classList.remove("wide");
  mini = null;
  continueGame();
}


// ----- 미니게임 1 : 연타 대결 -----
function playMash(p) {
  let count = 0;
  let timeLeft = 5;

  showMini("⚡ 연타 대결",
    '남은 시간 <b id="mashTime">5</b>초<br>' +
    '<button class="big-btn mash-btn" id="mashBtn">0</button>');

  const btn = document.getElementById("mashBtn");
  btn.onclick = function () {
    count++;
    btn.textContent = count;
  };

  const timer = setInterval(function () {
    timeLeft--;
    document.getElementById("mashTime").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      miniDone(p, count);
    }
  }, 1000);
}


// ----- 미니게임 2 : 타이밍 대결 -----
function playTiming(p) {
  let pos = 0;        // 막대 위치 (0 ~ 100)
  let speed = 2;      // 한 번에 움직이는 양

  showMini("🎯 타이밍 대결",
    '<div class="timing-track"><div class="timing-target"></div><div class="timing-bar" id="timingBar"></div></div>' +
    '<button class="big-btn" id="timingBtn">멈춰!</button>');

  const bar = document.getElementById("timingBar");
  const timer = setInterval(function () {
    pos += speed;
    if (pos >= 100 || pos <= 0) {
      speed = -speed; // 끝에 닿으면 반대로
    }
    bar.style.left = pos + "%";
  }, 16);

  document.getElementById("timingBtn").onclick = function () {
    clearInterval(timer);
    // 가운데(50)에 가까울수록 높은 점수
    let score = 100 - Math.abs(pos - 50) * 2;
    if (score < 0) {
      score = 0;
    }
    miniDone(p, Math.round(score));
  };
}


// ----- 미니게임 3 : 행운의 상자 -----
function playBox(p) {
  // 점수 3개를 섞어서 상자에 넣기
  const prizes = [0, 50, 100];
  prizes.sort(function () {
    return Math.random() - 0.5;
  });

  let html = "";
  for (let i = 0; i < 3; i++) {
    html += '<button class="box-btn" onclick="openBox(' + prizes[i] + ')">🎁</button>';
  }
  showMini("🍀 행운의 상자", "하나를 골라 보세요!<br>" + html);
}

function openBox(score) {
  miniDone(players[mini.index], score);
}


// ----- 미니게임 4 : 룰렛 대결 -----
// 숫자 룰렛(이동 룰렛과 같은 그림)을 돌려서 나온 숫자가 점수
function playSpin(p) {
  showMini("🎡 룰렛 대결",
    '<div class="wheel-wrap"><div class="wheel-pointer"></div><img id="duelWheel" src="' + images.roulette + '"></div>' +
    '<button class="big-btn" id="duelBtn">돌려라!</button>');

  document.getElementById("duelBtn").onclick = function () {
    this.disabled = true;
    const num = randomInt(1, 10);
    // 1이 맨 위, 시계 방향으로 한 칸 36도
    document.getElementById("duelWheel").style.transform = "rotate(" + (1800 - (num - 1) * 36) + "deg)";
    setTimeout(function () {
      miniDone(p, num);
    }, 2300);
  };
}


// =====================================================
// 18-3. 📋 중간 집계
//   누군가 새로운 나이대에 처음 들어가면 열려요.
//   순위(지난번과 비교) + 순위 그래프 + 캐릭터별 현재 상태
// =====================================================

// 총자산 = 현금 + 집 판 돈 + 보물 값 - 대출 갚을 돈 (대출 1건 = 원금의 1.5배)
function totalOf(p) {
  let total = p.money + treasureValue(p) - p.debt * debtPenalty;
  if (p.house != null) {
    total += p.house.sell;
  }
  return total;
}

// 모은 보물 값 합계
function treasureValue(p) {
  let sum = 0;
  for (const t of p.treasures) {
    sum += t.value;
  }
  return sum;
}

function showCheckpoint() {
  busy = true;
  updateScreen();

  // 1) 지금 순위 계산 : ranks[플레이어 번호] = 등수
  const ranked = players.slice();
  ranked.sort(function (a, b) {
    return totalOf(b) - totalOf(a);
  });
  const ranks = [];
  for (let i = 0; i < ranked.length; i++) {
    ranks[ranked[i].id] = i + 1;
  }

  // 2) 지난번 중간 집계 순위 (처음이면 없음)
  let before = null;
  if (history.length > 0) {
    before = history[history.length - 1].ranks;
  }
  history.push({ stage: topStage, ranks: ranks });

  // 3) 순위표 (▲ 올라감 / ▼ 내려감)
  let html = '<div class="cp-section"><h3>🏆 순위</h3>';
  for (const p of ranked) {
    const now = ranks[p.id];
    let change = '<span class="cp-same">-</span>';
    if (before != null) {
      const diff = before[p.id] - now; // 양수면 순위가 오른 것
      if (diff > 0) {
        change = '<span class="cp-up">▲' + diff + '</span>';
      } else if (diff < 0) {
        change = '<span class="cp-down">▼' + (-diff) + '</span>';
      }
    }
    html += '<div class="mini-rank">' +
            '<span>' + now + '등 <img src="' + p.img + '"> ' + p.name + ' ' + change + '</span>' +
            '<span>💰 ' + won(totalOf(p)) + '</span>' +
            '</div>';
  }
  html += '</div>';

  // 4) 순위 그래프
  html += '<div class="cp-section"><h3>📈 순위 변화</h3>' + rankGraph() + '</div>';

  // 5) 캐릭터별 현재 상태
  html += '<div class="cp-section"><h3>🧑 현재 상태</h3><div class="cp-status">';
  for (const p of players) {
    html += statusCard(p);
  }
  html += '</div></div>';

  html += '<button class="big-btn" onclick="closeMini()">계속하기</button>';

  miniBox.classList.add("wide");
  showMini("📋 중간 집계 : " + stages[topStage], html);
  addLog("📋 중간 집계 : " + stages[topStage]);
}

// ----- 순위 그래프 (SVG 선 그래프) -----
// 가로 = 중간 집계 순서, 세로 = 등수 (1등이 맨 위)
const GRAPH_W = 560;
const GRAPH_H = 220;

// i번째 점검의 x 위치
function graphX(i) {
  const n = history.length;
  if (n == 1) {
    return GRAPH_W / 2;
  }
  return 60 + i * (GRAPH_W - 110) / (n - 1);
}

// r등의 y 위치
function graphY(r) {
  const count = players.length;
  if (count == 1) {
    return GRAPH_H / 2;
  }
  return 25 + (r - 1) * (GRAPH_H - 70) / (count - 1);
}

function rankGraph() {
  let svg = '<svg class="rank-graph" viewBox="0 0 ' + GRAPH_W + ' ' + GRAPH_H + '">';

  // 등수 가로줄 + 글자
  for (let r = 1; r <= players.length; r++) {
    svg += '<line x1="45" y1="' + graphY(r) + '" x2="' + (GRAPH_W - 20) + '" y2="' + graphY(r) + '" class="grid"/>';
    svg += '<text x="8" y="' + (graphY(r) + 5) + '" class="axis">' + r + '등</text>';
  }

  // 아래쪽 : 나이대 이름 (이모지만)
  for (let i = 0; i < history.length; i++) {
    const emoji = stages[history[i].stage].split(" ")[0];
    svg += '<text x="' + graphX(i) + '" y="' + (GRAPH_H - 12) + '" class="axis" text-anchor="middle">' + emoji + '</text>';
  }

  // 플레이어마다 선 + 점 + 마지막에 캐릭터 그림
  for (const p of players) {
    let points = "";
    for (let i = 0; i < history.length; i++) {
      points += graphX(i) + "," + graphY(history[i].ranks[p.id]) + " ";
    }
    svg += '<polyline points="' + points + '" fill="none" stroke="' + p.color + '" stroke-width="4" stroke-linejoin="round"/>';

    for (let i = 0; i < history.length; i++) {
      svg += '<circle cx="' + graphX(i) + '" cy="' + graphY(history[i].ranks[p.id]) + '" r="6" fill="' + p.color + '" stroke="white" stroke-width="2"/>';
    }

    const last = history.length - 1;
    svg += '<image href="' + p.img + '" x="' + (graphX(last) + 8) + '" y="' + (graphY(history[last].ranks[p.id]) - 16) + '" width="28" height="30"/>';
  }

  svg += '</svg>';
  return svg;
}

// ----- 캐릭터 상태 카드 -----
function statusCard(p) {
  // 능력치 등급 (×1.5 = 재능)
  let stats = "";
  for (const key in statNames) {
    let mark = "";
    if (p.talent == key) {
      mark = "(×1.5)";
    }
    stats += statNames[key] + " " + gradeHtml(p, key) + mark + " ";
  }

  // 연애 · 가족
  let family = "🙋 싱글";
  if (p.spouse != null) {
    family = "💍 " + p.spouse.name;
  } else if (p.date != null) {
    family = "💕 " + p.date.name + " (연애 중)";
  }
  if (p.kids.length > 0) {
    family += " · " + kidIcons(p);
  }

  let extra = "";
  if (p.house != null) {
    extra += "<br>🏠 " + p.house.name;
  }
  if (p.treasures.length > 0) {
    extra += "<br>💎 보물 " + p.treasures.length + "개 (" + won(treasureValue(p)) + ")";
  }
  if (p.debt > 0) {
    extra += "<br>🏦 대출 " + p.debt + "건";
  }

  return '<div class="cp-card" style="border-color:' + p.color + '">' +
         '<div class="cp-name"><img src="' + p.img + '"> ' + p.name + ' ' + genderMark(p.gender) + '</div>' +
         '📍 ' + areas[p.area].name + '<br>' +
         '💰 ' + won(p.money) + '<br>' +
         '💼 ' + jobTitle(p) + '<br>' +
         '<span class="cp-stats">' + stats + '</span><br>' +
         family + extra +
         '</div>';
}


// =====================================================
// 19. 시상식 + 인생 보고서
// =====================================================

// 게임 끝 : 🏆 시상식 → 📜 인생 보고서
function endGame() {
  busy = true;
  updateScreen();
  showAwards();
}

// 🏆 시상식 : 칭호마다 가장 잘한 사람에게 상금 (같으면 모두)
function showAwards() {
  const awards = [
    { name: "💎 보물 수집가", desc: "보물을 가장 많이 모았다", value: function (p) { return p.treasures.length; } },
    { name: "🎮 미니게임 킹", desc: "미니게임에서 가장 많이 이겼다", value: function (p) { return p.miniWins; } },
    { name: "🤝 인연 부자", desc: "다른 사람과 가장 많이 인연을 맺었다", value: function (p) { return p.meets; } },
    { name: "👨‍👩‍👧 대가족", desc: "아이를 가장 많이 키웠다", value: function (p) { return p.kids.length; } },
    { name: "💼 월급왕", desc: "직업 랭크가 가장 높다", value: function (p) { if (p.job == null) { return 0; } return p.grade + 1; } }
  ];

  let html = "";
  for (const award of awards) {
    let best = 0;
    for (const p of players) {
      if (award.value(p) > best) {
        best = award.value(p);
      }
    }
    if (best == 0) {
      continue; // 아무도 못 했으면 칭호 없음
    }

    let winners = "";
    for (const p of players) {
      if (award.value(p) == best) {
        applyResult(p, { money: awardPrize });
        winners += '<img src="' + p.img + '"> ' + p.name + " ";
        addLog("🏆 " + award.name + " : " + p.name);
      }
    }
    html += '<div class="mini-rank award">' +
            '<span><b>' + award.name + '</b><br><small>' + award.desc + '</small></span>' +
            '<span>' + winners + '<br><b class="cp-up">+' + won(awardPrize) + '</b></span>' +
            '</div>';
  }
  if (html == "") {
    html = "<p>이번에는 칭호를 받은 사람이 없어요.</p>";
  }

  html += '<br><button class="big-btn" onclick="showResult()">📜 인생 보고서 보기</button>';
  miniBox.classList.add("wide");
  showMini("🏆 시상식", html);
}

// 📜 인생 보고서 : 총자산 = 현금 + 집 + 보물 - 대출×1.5 (골인 보너스 · 칭호 상금은 현금에 포함)
function showResult() {
  miniBox.classList.add("hidden");
  miniBox.classList.remove("wide");

  for (const p of players) {
    p.houseValue = 0;
    if (p.house != null) {
      p.houseValue = p.house.sell;
    }
    p.total = totalOf(p);
  }

  // 1P 기록 저장용으로 미리 기억
  const me = players[0];

  // 총자산이 많은 순서로 정렬
  const ranked = players.slice();
  ranked.sort(function (a, b) {
    return b.total - a.total;
  });

  const medals = ["🥇", "🥈", "🥉", "4등"];
  let html = "";
  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    let cls = "rank-card";
    if (i == 0) {
      cls += " first";
    }

    // 인생 칭호 (직업마다)
    let title = "자유로운 영혼";
    if (p.job != null) {
      title = jobs[p.job].title;
    }

    // 인생 이야기
    let story = jobTitle(p) + "(으)로 살았어요.";
    if (p.spouse != null) {
      story += "<br>" + p.spouse.name + "님과 결혼해서 <b>" + p.kids.length + "명</b>의 아이를 키웠어요!";
    } else {
      story += "<br>🙋 자유로운 싱글 라이프!";
    }

    html += '<div class="' + cls + '">';
    html += '<div class="medal">' + medals[i] + '</div>';
    html += '<img src="' + p.img + '">';
    html += '<h3 style="color:' + p.color + '">' + p.name + '</h3>';
    html += '<div class="life-title">' + title + '</div>';
    html += '<div class="detail">' + story + '</div>';
    html += '<div class="report">';
    html += '<div>인생에서 번 돈 <b>' + won(p.earned.self) + '</b></div>';
    if (p.spouse != null) {
      html += '<div>배우자가 번 돈 <b>' + won(p.earned.spouse) + '</b></div>';
    }
    if (p.kids.length > 0) {
      html += '<div>아이들이 번 돈 <b>' + won(p.earned.kids) + '</b></div>';
    }
    html += '<hr>';
    html += '<div>현금 ' + won(p.money) + '</div>';
    html += '<div>🏠 집 ' + won(p.houseValue) + ' · 💎 보물 ' + won(treasureValue(p)) + '</div>';
    if (p.debt > 0) {
      html += '<div class="minus">🏦 대출 상환 -' + won(p.debt * debtPenalty) + '</div>';
    }
    html += '</div>';
    html += '<div class="total">총 ' + won(p.total) + '</div>';
    html += '</div>';
  }

  document.getElementById("ranking").innerHTML = html;
  showScreen("resultScreen");

  // 로그인했다면 1P 기록을 DB에 저장 (api.js)
  saveRecord({
    total: me.total,
    rank: ranked.indexOf(me) + 1,
    players: players.length,
    job: jobTitle(me)
  });
}


// =====================================================
// 20. 키보드 : 스페이스바로 룰렛 돌리기
// =====================================================
document.addEventListener("keydown", function (e) {
  // 확률 룰렛 창이 열려 있으면 그 룰렛 돌리기
  if (e.code == "Space" && !chanceBox.classList.contains("hidden")) {
    e.preventDefault();
    if (!chanceBtn.disabled) {
      chanceBtn.onclick();
    }
    return;
  }
  const inGame = !document.getElementById("gameScreen").classList.contains("hidden");
  const noWindow = popup.classList.contains("hidden") && miniBox.classList.contains("hidden");
  if (e.code == "Space" && inGame && noWindow) {
    e.preventDefault();
    spin();
  }
});


// =====================================================
// 처음 실행
// =====================================================
setupTitle();
drawSetup();
initLogin(); // api.js : 서버에 연결해서 로그인 상태 확인
