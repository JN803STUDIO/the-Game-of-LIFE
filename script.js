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

// 능력치 이름
const statNames = { int: "🧠지력", str: "💪체력", sense: "✨센스", luck: "🍀운세" };

// 칸 종류별 팝업 제목
const typeTitles = { good: "😆 좋은 일!", bad: "😱 나쁜 일...", normal: "🙂 평범한 하루" };

// 골인 순서별 보너스 (1등, 2등, 3등, 4등)
const goalBonus = [10000, 5000, 3000, 1000];

// 미니게임 : 몇 바퀴마다 할지, 순위별 보상 (1등, 2등, 3등, 4등)
const minigameEvery = 1;
const miniMoney = [10, 5, 3, 0]; // 성인 : 돈 (만원)
const miniStat = [3, 2, 1, 0];   // 미성년자 : 능력치


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

let popupCount = 0;    // 팝업이 몇 번 열렸는지 (컴퓨터 자동 선택용)
let round = 0;         // 몇 바퀴 돌았는지 (미니게임용)
let mini = null;       // 진행 중인 미니게임 정보
let miniPending = false;       // 이번에 미니게임 할 차례인지

let topStage = 0;              // 지금까지 누군가 도착한 가장 높은 나이대
let checkpointPending = false; // 중간점검 할 차례인지
let history = [];              // 중간점검 기록 (순위 그래프용)


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

// 300 → "+300만원"
function moneyText(amount) {
  return signed(amount) + "만원";
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

function drawSetup() {
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
  for (let i = 0; i < setupCount; i++) {
    const ch = characters[setupChars[i]];
    let name = setupNames[i];
    if (name == "") {
      name = ch.name;
    }

    players.push({
      id: i,
      name: name,
      cpu: setupCpu[i], // 컴퓨터인지
      img: ch.img,
      color: ch.color,
      money: 0,         // 💰 자산 (만원)
      int: 0,           // 🧠 지력
      str: 0,           // 💪 체력
      sense: 0,         // ✨ 센스
      luck: 0,          // 🍀 운세
      talent: null,     // 재능 ("int", "str", "sense")
      pos: 0,           // 현재 칸 번호
      area: "baby",     // 현재 지역
      college: false,   // 대학 졸업 여부
      job: null,        // 직업 번호 (jobs 배열의 몇 번째)
      grade: 0,         // 직업 등급 (0, 1, 2)
      retired: false,   // 퇴직 여부
      date: null,       // 연애 중인 상대
      spouse: null,     // 배우자
      kids: [],         // 자녀들 (숫자 = 나이, 4살 이상이면 어른)
      house: null,      // 산 집
      lastPay: 0,       // 마지막 월급
      stepsLeft: 0,     // 인생 이벤트 칸에서 멈췄을 때 남은 칸 수
      cards: [pick(numberCards)], // 숫자 카드 (처음에 1장)
      finished: false   // 골인 여부
    });
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
  addLog("👶 인생 시작!");
  showPopup(images.tiles.start, "👶 인생의 시작",
    "오늘 " + names + "(이)가 세상에 태어났어요!<br>아기부터 노년까지, 누가 가장 부자가 될까요?",
    [{ text: "시작!", action: startTurn }]);
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
    ["pay", "월급날"], ["love", "연애"], ["work", "직업"], ["card", "숫자 카드"]
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
    placePiece(p);
  }
}

function placePiece(p) {
  const t = tiles[p.pos];
  const piece = document.getElementById("piece" + p.id);
  piece.style.left = (t.x - 24 + pieceOffset[p.id].x) + "px";
  piece.style.top = (t.y - 56 + pieceOffset[p.id].y) + "px";
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
  follow(p);
}

// 지금 차례인 사람의 숫자 카드 버튼
function drawCards() {
  const p = players[turn];
  let html = "";
  if (!p.finished) {
    for (let i = 0; i < p.cards.length; i++) {
      const c = p.cards[i];
      let disabled = "";
      if (busy) {
        disabled = " disabled";
      }
      html += '<button class="num-card" onclick="useCard(' + i + ')"' + disabled + '>' +
              c.name + '<br>' + c.min + '~' + c.max + '</button>';
    }
  }
  cardBox.innerHTML = html;
}

// 직업 이름 (예: "의사 · 전문의")
function jobTitle(p) {
  if (p.job == null) {
    return "직업 없음";
  }
  const job = jobs[p.job];
  let text = job.name + " · " + job.grades[p.grade].title;
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

    // 능력치 (재능은 ⭐ 표시)
    let stats = "";
    for (const key in statNames) {
      let cls = "";
      let star = "";
      if (p.talent == key) {
        cls = "talent";
        star = "⭐";
      }
      stats += '<span class="' + cls + '">' + statNames[key] + ' ' + p[key] + star + '</span>';
    }

    // 연애 / 가족
    let family = "";
    if (p.spouse != null) {
      family += "💍 " + p.spouse.name + " (♥" + p.spouse.love + "%)";
    } else if (p.date != null) {
      family += "💕 " + p.date.name + " (♥" + p.date.love + "%)";
    }
    if (p.kids.length > 0) {
      family += " 👶×" + p.kids.length;
    }
    if (p.house != null) {
      family += " 🏠";
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
    html += '<div class="pname" style="color:' + p.color + '">' + p.name + cpuMark + '</div>';
    html += '<div class="' + moneyClass + '">💰 ' + p.money + '만원</div>';
    html += '<div>💼 ' + jobTitle(p) + '</div>';
    html += '<div class="stats">' + stats + '</div>';
    html += '<div>' + family + '</div>';
    html += '</div></div>';
  }

  playerList.innerHTML = html;
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
//     r = { money: 100, int: 2, ... }
//     돌려주는 값 = 화면에 보여줄 요약 글자
// =====================================================
function applyResult(p, r) {
  const parts = [];

  if (r.money) {
    p.money += r.money;
    parts.push("💰" + moneyText(r.money));
  }

  // 능력치 4개 (재능 능력치는 2배로 오름!)
  for (const key in statNames) {
    if (r[key]) {
      let amount = r[key];
      if (amount > 0 && p.talent == key) {
        amount = amount * 2;
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

  // 숫자 카드 얻기 (최대 3장)
  if (r.card) {
    if (p.cards.length < 3) {
      const card = pick(numberCards);
      p.cards.push(card);
      parts.push("🎴 " + card.name + " 획득!");
    } else {
      parts.push("🎴 카드가 꽉 찼어요");
    }
  }

  if (parts.length > 0) {
    floatText(p, parts.join(" "));
  }
  drawPlayerList();
  return parts.join("<br>");
}


// =====================================================
// 11. 룰렛 · 숫자 카드
// =====================================================

// 차례 시작
function startTurn() {
  const p = players[turn];
  busy = p.cpu; // 컴퓨터 차례에는 버튼을 막아요
  rollText.textContent = "";
  updateScreen();

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
  const num = randomInt(1, 10);
  rollWheel(num);
}

function useCard(i) {
  if (busy) {
    return;
  }
  playCard(i);
}

// i번째 숫자 카드 쓰기
function playCard(i) {
  const p = players[turn];
  const card = p.cards[i];
  p.cards.splice(i, 1); // 카드 사용 → 손에서 없애기
  addLog(p.name + " : " + card.name + " 사용!");
  rollWheel(randomInt(card.min, card.max));
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

// 룰렛판만 돌리기 (다 돌면 done 함수 실행)
// 이동할 때도, 축의금 룰렛 때도 같이 써요
function spinWheel(num, done) {
  spinCount++;
  // 5바퀴(1800도) 돌고, 한 칸이 36도
  const angle = spinCount * 1800 - (num - 1) * 36;
  wheelImg.style.transform = "rotate(" + angle + "deg)";
  setTimeout(done, 2100);
}

function afterRoll(num) {
  const p = players[turn];

  // 골인한 사람은 보너스 룰렛 : 숫자 × 500만원
  if (p.finished) {
    rollText.textContent = "🎰 " + num + " × 500만원!";
    const summary = applyResult(p, { money: num * 500 });
    addLog(p.name + " : 🎰 보너스 " + moneyText(num * 500));
    showPopup(images.tiles.goal, "🎰 보너스 룰렛 " + num + "!", resultHtml(summary));
    return;
  }

  addLog(p.name + " : 🎯 " + num + " 칸 이동");
  rollText.textContent = "🎯 " + num + "칸 이동!";
  movePlayer(p, num);
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

  // 새 지역에 들어가면 배너
  if (t.area != p.area) {
    p.area = t.area;
    const area = areas[t.area];
    showBanner(area.name + "<small>" + area.story + "</small>", p.color);
    addLog(p.name + " : " + area.name + " 도착");

    // 누군가 새로운 나이대에 처음 들어가면 → 한 바퀴가 끝난 뒤 중간점검
    if (area.stage > topStage) {
      topStage = area.stage;
      checkpointPending = true;
    }
  }

  // 월급날 칸은 지나가기만 해도 월급!
  if (t.type == "pay") {
    paySalary(p);
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

// 월급 계산 : 내 월급 + 배우자 월급 + 어른이 된 자식 월급
function paySalary(p) {
  let total = 0;

  if (p.job != null) {
    let salary = jobs[p.job].grades[p.grade].salary;
    if (p.retired) {
      salary = Math.floor(salary / 2); // 퇴직하면 연금 (절반)
    }
    total += salary;
  }

  if (p.spouse != null) {
    total += p.spouse.salary;
  }

  // 자식은 월급날마다 한 살씩 (4 이상이면 어른 → 200만원씩 보탬)
  for (let i = 0; i < p.kids.length; i++) {
    p.kids[i]++;
    if (p.kids[i] >= 4) {
      total += 200;
    }
  }

  p.lastPay = total;
  if (total > 0) {
    p.money += total;
    floatText(p, "💵 " + moneyText(total));
    drawPlayerList();
  }
}


// =====================================================
// 13. 도착한 칸의 효과
// =====================================================
function arrive(p) {
  const t = tiles[p.pos];
  const img = tileImage(t);
  const pool = events[areas[t.area].pool];

  if (t.type == "good" || t.type == "bad" || t.type == "normal") {
    const ev = pick(pool[t.type]);
    const summary = applyResult(p, ev);
    addLog(p.name + " : " + ev.text);
    showPopup(img, typeTitles[t.type], ev.text + resultHtml(summary));
  }
  else if (t.type == "event") {
    eventTile(p, pick(pool.event), img);
  }
  else if (t.type == "pay") {
    if (p.lastPay > 0) {
      showPopup(img, "💵 월급날!", "이번 수입은 <b>" + p.lastPay + "만원</b>!");
    } else {
      showPopup(img, "💵 월급날", "아직 수입이 없어요.");
    }
  }
  else if (t.type == "card") {
    const summary = applyResult(p, { card: true });
    showPopup(img, "🎴 숫자 카드", "룰렛 대신 쓸 수 있는 카드예요!" + resultHtml(summary));
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

// 선택 이벤트 (?)
function eventTile(p, ev, img) {
  const buttons = [];
  const cpuIndex = cpuEventChoice(p, ev.choices);

  for (let i = 0; i < ev.choices.length; i++) {
    const choice = ev.choices[i];
    let desc = "";
    if (choice.chance < 1) {
      desc = "성공 확률 " + Math.round(successChance(p, choice.chance) * 100) + "%";
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
  showPopup(img, "❓ 선택 이벤트", ev.text, buttons);
}

// 운세가 높을수록 성공 확률 UP (최대 95%)
function successChance(p, chance) {
  if (chance >= 1) {
    return 1;
  }
  let result = chance + p.luck * 0.03;
  if (result > 0.95) {
    result = 0.95;
  }
  return result;
}

function resolveChoice(p, choice, img) {
  let result = choice.win;
  let title = "🎉 성공!";
  if (Math.random() >= successChance(p, choice.chance)) {
    result = choice.lose;
    title = "😢 실패...";
  }
  if (choice.chance >= 1) {
    title = "결과";
  }

  const summary = applyResult(p, result);
  addLog(p.name + " : " + result.text);
  showPopup(img, title, result.text + resultHtml(summary));
}


// =====================================================
// 14. 연애 칸 (♥)
//     만남 → 데이트(애정도 UP) → 고백(애정도% 확률) → 결혼
//     결혼 후 애정도 100% → 아기 탄생!
// =====================================================
function loveTile(p, img) {
  // 1) 결혼한 상태 : 부부 데이트
  if (p.spouse != null) {
    const gain = randomInt(20, 40) + p.sense;
    p.spouse.love += gain;
    let text = pick(dates) + "<br>애정도 +" + gain + "%";

    if (p.spouse.love >= 100) {
      p.kids.push(0);
      p.spouse.love = 0;
      text += "<br><br>👶 <b>아기가 태어났어요!</b><br>(월급날 4번이 지나면 어른이 되어 돈을 벌어요)";
      addLog(p.name + " : 👶 아기 탄생!");
      drawPlayerList();
      // 아기가 태어나면 축의금 룰렛!
      showPopup(img, "💑 " + p.spouse.name + "와(과) 데이트", text,
        [{ text: "🎁 축의금 룰렛!", action: function () { giftRoulette(p, "👶 출산 축하"); } }]);
      return;
    }

    text += " (현재 " + p.spouse.love + "%)";
    drawPlayerList();
    showPopup(img, "💑 " + p.spouse.name + "와(과) 데이트", text);
    return;
  }

  // 2) 연애 중 : 데이트하고 고백할지 고르기
  if (p.date != null) {
    const gain = randomInt(15, 30) + p.sense;
    p.date.love += gain;
    if (p.date.love > 100) {
      p.date.love = 100;
    }
    drawPlayerList();

    const chance = successChance(p, p.date.love / 100);
    showPopup(img, "💕 " + p.date.name + "와(과) 데이트",
      pick(dates) + "<br>애정도 +" + gain + "% (현재 " + p.date.love + "%)",
      [
        // 컴퓨터는 성공 확률 60% 이상이면 고백
        { text: "💌 고백하기", desc: "성공 확률 " + Math.round(chance * 100) + "%", cpuPick: chance >= 0.6, action: function () { confess(p, img); } },
        { text: "다음에", cpuPick: chance < 0.6, action: nextTurn }
      ]);
    return;
  }

  // 3) 솔로 : 새로운 만남 (직업 등급이 높을수록 좋은 상대!)
  let tier = 0;
  if (p.job != null) {
    tier = p.grade;
  }
  const partner = pick(partners[tier]);

  showPopup(img, "💘 운명의 만남?",
    "<b>" + partner.name + "</b>을(를) 만났어요!<br>(결혼하면 월급 " + partner.salary + "만원을 같이 벌어요)",
    [
      {
        text: "💕 연애 시작",
        cpuPick: true,
        action: function () {
          p.date = { name: partner.name, salary: partner.salary, love: 10 + p.sense };
          addLog(p.name + " : 💕 " + partner.name + "와(과) 연애 시작");
          drawPlayerList();
          nextTurn();
        }
      },
      { text: "관심 없어요", action: nextTurn }
    ]);
}

function confess(p, img) {
  const chance = successChance(p, p.date.love / 100);

  if (Math.random() < chance) {
    p.spouse = p.date;
    p.spouse.love = 30;
    p.date = null;
    addLog(p.name + " : 💍 " + p.spouse.name + "와(과) 결혼!");
    drawPlayerList();
    // 결혼하면 축의금 룰렛!
    showPopup(img, "💍 고백 성공! 결혼!",
      p.spouse.name + "와(과) 결혼해요!<br>축의금 룰렛을 돌려서 모두에게 축의금을 받아요!",
      [{ text: "🎁 축의금 룰렛!", action: function () { giftRoulette(p, "💍 결혼 축하"); } }]);
  } else {
    p.date.love -= 30;
    let text = "아직 마음의 준비가 안 됐대요... (애정도 -30%)";
    if (p.date.love <= 0) {
      text = p.date.name + "와(과) 헤어졌어요... 💔";
      addLog(p.name + " : 💔 이별");
      p.date = null;
    }
    drawPlayerList();
    showPopup(img, "😢 고백 실패", text);
  }
}


// 🎁 축의금 룰렛 : 나온 숫자 × 100만원을 다른 사람 "한 명마다" 받아요
function giftRoulette(p, reason) {
  const num = randomInt(1, 10);
  const amount = num * 100;
  rollText.textContent = "🎁 축의금 룰렛...";

  spinWheel(num, function () {
    rollText.textContent = "🎁 " + num + " × 100만원!";

    if (players.length == 1) {
      showPopup(images.tiles.love, reason, "축의금을 줄 사람이 없어요... 😢");
      return;
    }

    const summary = applyResult(p, { all: amount });
    addLog(p.name + " : 🎁 축의금 " + amount + "만원씩 받음");
    showPopup(images.tiles.love, "🎁 " + reason + "!",
      "룰렛 <b>" + num + "</b>! 모두에게 <b>" + amount + "만원</b>씩 받았어요!" + resultHtml(summary));
  });
}


// =====================================================
// 15. 직업 칸 (★) : 능력치 UP + 조건이 되면 승진
// =====================================================
function workTile(p, img) {
  if (p.job == null) {
    const summary = applyResult(p, { int: 1, str: 1, sense: 1 });
    showPopup(img, "★ 자기계발", "아직 직업이 없어서 자기계발을 했어요." + resultHtml(summary));
    return;
  }
  if (p.retired) {
    const summary = applyResult(p, { luck: 1 });
    showPopup(img, "★ 은퇴 생활", "일은 쉬고 취미 생활을 즐겨요." + resultHtml(summary));
    return;
  }

  const ev = pick(workEvents);
  const summary = applyResult(p, ev);
  let text = ev.text + resultHtml(summary) + "<br>";

  const job = jobs[p.job];
  const next = p.grade + 1;
  if (next >= job.grades.length) {
    text += "이미 최고 등급이에요! 👑";
  } else if (meetsNeed(p, job.grades[next].need)) {
    p.grade = next;
    text += "🎉 <b>승진! " + job.grades[next].title + "</b> (월급 " + job.grades[next].salary + "만원)";
    addLog(p.name + " : 🎉 " + job.grades[next].title + " 승진!");
  } else {
    text += "승진하려면 " + needText(job.grades[next].need) + " 필요해요.";
  }

  drawPlayerList();
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

  // 🌟 재능 발견 : 지력 / 체력 / 센스 중 하나
  if (key == "talent") {
    const talent = pick(talents);
    p.talent = talent.key;
    const bonus = {};
    bonus[talent.key] = 1; // 예: bonus.int = 1
    const summary = applyResult(p, bonus);
    addLog(p.name + " : 🌟 재능 " + talent.name);
    showPopup(img, ev.title,
      talent.text + "<br><b>" + talent.name + "</b> 재능을 타고났어요!<br>(이 능력치는 항상 2배로 올라요)" + resultHtml(summary));
  }

  // ✏️ 수능 : 지력이 높을수록 성공
  else if (key == "exam") {
    let chance = 0.2 + p.int * 0.05;
    chance = successChance(p, Math.min(chance, 0.95));
    if (Math.random() < chance) {
      const summary = applyResult(p, { int: 2, luck: 1 });
      showPopup(img, "✏️ 수능 대박!", "노력한 만큼 결과가 나왔어요!" + resultHtml(summary));
    } else {
      const summary = applyResult(p, { luck: -1 });
      showPopup(img, "✏️ 수능... 아쉬워요", "실수를 좀 했어요." + resultHtml(summary));
    }
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

  // 🏠 집 사기
  else if (key == "house") {
    const buttons = [];
    const cpuHouse = cpuHouseChoice(p);
    for (const house of houses) {
      buttons.push({
        text: house.name,
        desc: house.price + "만원 → 나중에 " + house.sell + "만원",
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
    showPopup(img, ev.title, ev.text, buttons);
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
        desc: first.title + " · 월급 " + first.salary,
        salary: first.salary,
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

  // 컴퓨터는 월급이 가장 많은 직업을 골라요
  let best = buttons[0];
  for (const b of buttons) {
    if (b.salary > best.salary) {
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

// 🏁 골인
function goalTile(p, img) {
  const bonus = goalBonus[finishCount];
  finishCount++;
  p.finished = true;
  const summary = applyResult(p, { money: bonus });
  addLog(p.name + " : 🏁 " + finishCount + "등으로 골인!");
  showPopup(img, "🏁 " + finishCount + "등으로 골인!",
    "인생 완주를 축하해요!<br>모두 골인할 때까지 보너스 룰렛으로 돈을 벌 수 있어요." + resultHtml(summary));
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
    box.appendChild(btn);
  }

  popup.classList.remove("hidden");

  // 컴퓨터 차례면 잠깐 보여 준 뒤 알아서 버튼 누르기
  popupCount++;
  const myCount = popupCount;
  if (players.length > 0 && players[turn].cpu) {
    const choice = cpuChoose(buttons);
    setTimeout(function () {
      // 그사이 다른 팝업이 열렸거나 닫혔으면 무시
      if (myCount == popupCount && !popup.classList.contains("hidden")) {
        popup.classList.add("hidden");
        choice.action();
      }
    }, 1800);
  }
}


// =====================================================
// 17-2. 컴퓨터(CPU) 두뇌
// =====================================================

// 컴퓨터 차례 : 가끔 숫자 카드를 쓰고, 아니면 룰렛
function cpuTurn() {
  const p = players[turn];
  if (!p.finished && p.cards.length > 0 && Math.random() < 0.3) {
    playCard(0);
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

// 갈림길 : 몇 번째 길로 갈지
function cpuForkChoice(p, key) {
  if (key == "f0") {
    // 체력 재능이면 운동장, 아니면 학원
    if (p.talent == "str") {
      return 1;
    }
    return 0;
  }
  if (key == "f1") {
    // 공부를 잘하면 대학, 아니면 바로 취업
    if (p.int >= 6 || p.talent == "int") {
      return 0;
    }
    return 1;
  }
  if (key == "f2") {
    // 결혼 안 했으면 연애 집중, 했으면 일 집중
    if (p.spouse == null) {
      return 0;
    }
    return 1;
  }
  if (key == "f3") {
    // 돈이 부족하면 한방역전섬으로 역전 노리기!
    if (p.money < 5000) {
      return 1;
    }
    return 0;
  }
  return 0;
}

// 선택 이벤트 : 성공 확률 50% 이상이면 도전, 아니면 안전한 선택
function cpuEventChoice(p, choices) {
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    if (c.chance < 1 && successChance(p, c.chance) >= 0.5) {
      return i;
    }
  }
  for (let i = 0; i < choices.length; i++) {
    if (choices[i].chance >= 1) {
      return i;
    }
  }
  return 0;
}

// 집 : 살 수 있는 것 중 가장 비싼 집 (돈이 없으면 null = 안 삼)
function cpuHouseChoice(p) {
  let best = null;
  for (const house of houses) {
    if (house.price <= p.money) {
      best = house;
    }
  }
  return best;
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
    showResult();
    return;
  }
  // 골인한 사람도 차례가 와요 (보너스 룰렛)
  turn = (turn + 1) % players.length;

  // 모두 한 번씩 했으면 (= 한 바퀴) 미니게임!
  if (turn == 0) {
    round++;
    if (round % minigameEvery == 0) {
      miniPending = true;
    }
  }
  continueGame();
}

// 차례 사이에 할 일 : 중간점검 → 미니게임 → 다음 사람 차례
// (중간점검, 미니게임 창을 닫으면 다시 이 함수가 불려요)
function continueGame() {
  // 중간점검은 한 바퀴가 다 끝났을 때(turn == 0)만
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
//   점수 순위대로 상금 (miniPrize)
// =====================================================
// stat : 미성년자가 이기면 오르는 능력치
const minigames = [
  { name: "⚡ 연타 대결", desc: "5초 동안 버튼을 최대한 많이 누르세요!", play: playMash, stat: "str", cpuMin: 20, cpuMax: 40 },
  { name: "🎯 타이밍 대결", desc: "움직이는 막대를 초록색 가운데에서 멈추세요!", play: playTiming, stat: "sense", cpuMin: 50, cpuMax: 95 },
  { name: "🍀 행운의 상자", desc: "상자 3개 중 하나를 고르세요! (0점 / 50점 / 100점)", play: playBox, stat: "luck", cpuMin: 0, cpuMax: 100 }
];

// 성인인지 (대학 / 바로 취업 길부터 성인)
function isAdult(p) {
  return areas[p.area].adult == true;
}

// 순위(0, 1, 2, 3)에 맞는 보상 : 미성년자는 능력치, 성인은 돈
function miniReward(p, rank) {
  const r = {};
  if (isAdult(p)) {
    r.money = miniMoney[rank];
  } else {
    r[mini.game.stat] = miniStat[rank];
  }
  return r;
}

// 1등 상품 글자 (미성년자는 능력치, 성인이 되면 자동으로 돈)
function rewardText(p) {
  if (isAdult(p)) {
    return "💰 " + miniMoney[0] + "만원";
  }
  return statNames[mini.game.stat] + " +" + miniStat[0];
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
  mini = { game: game, index: 0, scores: [] };

  showMini("🎮 미니게임 : " + game.name,
    game.desc + "<br><br>🥇🥈🥉 순위대로 상품을 받아요!" +
    '<br><br><button class="big-btn" onclick="miniNextPlayer()">시작!</button>');
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

// 모두 끝 → 순위 + 상금
function miniFinish() {
  const ranked = players.slice();
  ranked.sort(function (a, b) {
    return mini.scores[b.id] - mini.scores[a.id];
  });

  const medals = ["🥇", "🥈", "🥉", "4등"];
  let html = "";
  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    let summary = applyResult(p, miniReward(p, i));
    if (summary == "") {
      summary = "보상 없음";
    }
    html += '<div class="mini-rank">' +
            '<span>' + medals[i] + ' <img src="' + p.img + '"> ' + p.name + '</span>' +
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


// =====================================================
// 18-3. 📋 중간점검
//   누군가 새로운 나이대에 처음 들어가면 열려요.
//   순위(지난번과 비교) + 순위 그래프 + 캐릭터별 현재 상태
// =====================================================

// 총자산 = 현금 + 집 판 돈
function totalOf(p) {
  let total = p.money;
  if (p.house != null) {
    total += p.house.sell;
  }
  return total;
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

  // 2) 지난번 중간점검 순위 (처음이면 없음)
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
            '<span>💰 ' + totalOf(p) + '만원</span>' +
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
  showMini("📋 중간점검 : " + stages[topStage], html);
  addLog("📋 중간점검 : " + stages[topStage]);
}

// ----- 순위 그래프 (SVG 선 그래프) -----
// 가로 = 중간점검 순서, 세로 = 등수 (1등이 맨 위)
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
  // 능력치 (재능은 ⭐)
  let stats = "";
  for (const key in statNames) {
    let star = "";
    if (p.talent == key) {
      star = "⭐";
    }
    stats += statNames[key] + " " + p[key] + star + " ";
  }

  // 연애 · 가족
  let family = "🙋 싱글";
  if (p.spouse != null) {
    family = "💍 " + p.spouse.name;
  } else if (p.date != null) {
    family = "💕 " + p.date.name + " (연애 중)";
  }
  if (p.kids.length > 0) {
    family += " · 👶×" + p.kids.length;
  }

  let house = "";
  if (p.house != null) {
    house = "<br>🏠 " + p.house.name;
  }

  return '<div class="cp-card" style="border-color:' + p.color + '">' +
         '<div class="cp-name"><img src="' + p.img + '"> ' + p.name + '</div>' +
         '📍 ' + areas[p.area].name + '<br>' +
         '💰 ' + p.money + '만원<br>' +
         '💼 ' + jobTitle(p) + '<br>' +
         '<span class="cp-stats">' + stats + '</span><br>' +
         family + house +
         '</div>';
}


// =====================================================
// 19. 최종 결과 (총자산 = 돈 + 집 판 돈)
// =====================================================
function showResult() {
  for (const p of players) {
    p.houseValue = 0;
    if (p.house != null) {
      p.houseValue = p.house.sell;
    }
    p.total = p.money + p.houseValue;
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

    // 인생 요약
    let life = jobTitle(p);
    if (p.spouse != null) {
      life += "<br>💍 " + p.spouse.name + "와(과) 결혼";
    } else {
      life += "<br>🙋 싱글 라이프";
    }
    life += "<br>👶 자녀 " + p.kids.length + "명";

    html += '<div class="' + cls + '">';
    html += '<div class="medal">' + medals[i] + '</div>';
    html += '<img src="' + p.img + '">';
    html += '<h3 style="color:' + p.color + '">' + p.name + '</h3>';
    html += '<div class="total">' + p.total + '만원</div>';
    html += '<div class="detail">';
    html += '현금 ' + p.money + ' + 집 ' + p.houseValue + '<br>';
    html += life;
    html += '</div></div>';
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
