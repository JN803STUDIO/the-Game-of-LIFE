// 인생게임 메인 코드
// 데이터는 events.js, 지도는 map.js, 소리는 sound.js

// ----- 그림 (디자인팀 그림 오면 경로만 바꾸기) -----
const images = {
  logo: "assets/ui/logo.svg",
  map: "assets/ui/map-bg.svg",
  roulette: "assets/ui/roulette.svg",
  tiles: {},
  life: {}
};
for (const name of ["good", "bad", "normal", "event", "pay", "love", "work", "card", "lucky", "treasure", "shop", "fork", "start", "goal"]) {
  images.tiles[name] = "assets/tiles/" + name + ".svg";
}
for (const name of ["talent", "kinder", "elem", "middle", "high", "exam", "college", "job", "marry", "house", "retire"]) {
  images.life[name] = "assets/tiles/" + name + ".svg";
}

const characters = [
  { name: "토리", img: "assets/characters/char1.svg", color: "#f06595" },
  { name: "블루", img: "assets/characters/char2.svg", color: "#339af0" },
  { name: "새싹이", img: "assets/characters/char3.svg", color: "#40c057" },
  { name: "삐약이", img: "assets/characters/char4.svg", color: "#fab005" }
];

// ----- 규칙 숫자 (돈은 만원 단위) -----
const statNames = { int: "🧠지력", str: "💪체력", sense: "✨센스" };
const gradeLines = [
  { min: 80, grade: "S", color: "#f03e3e" },
  { min: 65, grade: "A", color: "#f76707" },
  { min: 50, grade: "B", color: "#f59f00" },
  { min: 35, grade: "C", color: "#37b24d" },
  { min: 20, grade: "D", color: "#1c7ed6" },
  { min: 10, grade: "E", color: "#7048e8" },
  { min: 0, grade: "F", color: "#868e96" }
];
const talentBonus = 1.5;   // 재능 능력치는 1.5배로 오름
const debtUnit = 100;      // 대출 1건
const debtInterest = 10;   // 월급날 이자 (1건당)
const debtPenalty = 150;   // 마지막에 갚는 돈 (1건당)
const meetBonus = 15;      // 인연 보너스
const goalBonus = [300, 200, 100, 50];
const specialDateCost = 20;
const maxKids = 4;
const typeTitles = { good: "😆 좋은 일!", bad: "😱 나쁜 일...", normal: "🙂 평범한 하루" };

// 룰렛 10칸 값
const miniPrizes = [
  { money: 5, stat: 5 }, { money: 5, stat: 5 }, { money: 5, stat: 5 },
  { money: 10, stat: 10 }, { money: 10, stat: 10 }, { money: 10, stat: 10 }, { money: 10, stat: 10 },
  { money: 15, stat: 15 }, { money: 20, stat: 15 }, { money: 30, stat: 25 }
];
const miniShare = [1, 0.5, 0.3, 0]; // 등수별 비율
const giftAmounts = [5, 5, 10, 10, 15, 15, 20, 20, 30, 50];
const bonusAmounts = [10, 10, 20, 20, 30, 40, 40, 60, 80, 100];
const luckyAmounts = [10, 10, 20, 20, 30, 30, 50, 50, 80, 100];

const slotColors = { "X": "#ff8787", "O": "#4dabf7", "◎": "#fcc419" };
const otherColors = ["#ffa94d", "#69db7c", "#b197fc", "#f783ac", "#38d9a9", "#ffd43b", "#748ffc", "#ff8787", "#4dabf7", "#a9e34b"];

// ----- 게임 상태 -----
let players = [];
let turn = 0;          // 지금 차례인 플레이어 번호
let round = 0;         // 모두 한 번씩 하면 1 증가
let finishCount = 0;   // 골인한 사람 수
let spinCount = 0;     // 이동 룰렛 돌린 횟수 (각도 계산용)
let busy = false;      // true면 버튼 막기
let zoomedOut = false;
let popupCount = 0;
let mini = null;       // 진행 중인 미니게임
let miniPending = false;
let topStage = 0;      // 누군가 도착한 가장 높은 나이대
let checkpointPending = false;
let rankHistory = [];  // 중간 집계 순위 기록 (그래프용)
let marketMult = { estate: 1, stock: 1, collect: 1 };
let metPairs = {};     // 이미 인연을 맺은 두 사람
let guardNews = "";    // 수호 카드가 쓰였을 때 다음 팝업에 보여 줄 안내

// 설정 화면
let humanCount = 1;
let botCount = 1;
let setupCount = 2;
let setupChars = [0, 1, 2, 3];
let setupNames = ["", "", "", ""];
let setupCpu = [false, true, true, true];
let setupGender = ["M", "F", "M", "F"];
let setupPhotos = ["", "", "", ""];   // + 버튼으로 넣은 사진 (없으면 "")
let photoSlot = 0;
let setupMode = 0;
let gameMode = modes[0];

const mapWrap = document.getElementById("mapWrap");
const mapEl = document.getElementById("map");
const spinBtn = document.getElementById("spinBtn");
const wheelImg = document.getElementById("wheelImg");
const rollText = document.getElementById("rollText");
const cardMenuBtn = document.getElementById("cardMenuBtn");
const menuPanel = document.getElementById("menuPanel");
const playerList = document.getElementById("playerList");
const logList = document.getElementById("log");
const popup = document.getElementById("popup");
const chanceBox = document.getElementById("chance");
const chanceBtn = document.getElementById("chanceBtn");
const miniBox = document.getElementById("mini");


// ----- 자주 쓰는 함수 -----
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// 목록에서 겹치지 않게 n개 뽑기 (전부 뽑으면 섞는 거랑 같음)
function pickSome(list, n) {
  const pool = list.slice();
  const result = [];
  while (result.length < n && pool.length > 0) {
    const i = randomInt(0, pool.length - 1);
    result.push(pool[i]);
    pool.splice(i, 1);
  }
  return result;
}

function signed(n) {
  if (n > 0) return "+" + n;
  return "" + n;
}

// 예) 12500이면 1억 2500만원
function won(amount) {
  let sign = "";
  if (amount < 0) {
    sign = "-";
    amount = -amount;
  }
  const eok = Math.floor(amount / 10000);
  const man = amount % 10000;
  if (eok == 0) return sign + man + "만원";
  if (man == 0) return sign + eok + "억원";
  return sign + eok + "억 " + man + "만원";
}

function moneyText(amount) {
  if (amount > 0) return "+" + won(amount);
  return won(amount);
}

function gradeHtml(p, key) {
  let g = gradeLines[gradeLines.length - 1];
  for (const line of gradeLines) {
    if (p[key] >= line.min) {
      g = line;
      break;
    }
  }
  return '<b class="grade" style="color:' + g.color + '">' + g.grade + '</b>';
}

// 능력치 3개 (등급, 숫자, 재능)
function statsHtml(p) {
  let html = "";
  for (const key in statNames) {
    let mark = "";
    if (p.talent == key) mark = '<b class="x2">×1.5</b>';
    html += '<span>' + statNames[key] + ' ' + gradeHtml(p, key) + '<small>' + p[key] + '</small>' + mark + '</span>';
  }
  return html;
}

function genderMark(gender) {
  if (gender == "M") return '<span class="male">♂</span>';
  return '<span class="female">♀</span>';
}

function resultHtml(summary) {
  if (summary == "") return "";
  return '<div class="result">' + summary + '</div>';
}

// 룰렛 칸 글자 (10이면 10만)
function moneyLabels(list) {
  const labels = [];
  for (const a of list) {
    labels.push(a + "만");
  }
  return labels;
}

function isAdult(p) {
  return areas[p.area].adult == true;
}

function jobTitle(p) {
  if (p.job == null) return "직업 없음";
  const job = jobs[p.job];
  let text = job.name + " · " + job.grades[p.grade].title + " ★" + (p.grade + 1);
  if (p.retired) text += " (퇴직)";
  return text;
}

function kidIcons(p) {
  let text = "";
  for (const kid of p.kids) {
    if (kid.job != null) text += "🧑";
    else if (kid.gender == "M") text += "👦";
    else text += "👧";
  }
  return text;
}

function addLog(text) {
  const li = document.createElement("li");
  li.innerHTML = text;
  logList.prepend(li);
}

// 가운데 배너
function showBanner(text, color) {
  const banner = document.createElement("div");
  banner.className = "banner";
  banner.style.background = color;
  banner.innerHTML = text;
  document.body.appendChild(banner);
  sfx("whoosh");
  setTimeout(function () { banner.remove(); }, 1600);
}

// 말 위에 글자 띄우기
function floatText(p, text) {
  const piece = document.getElementById("piece" + p.id);
  const div = document.createElement("div");
  div.className = "float-text";
  div.textContent = text;
  div.style.left = piece.style.left;
  div.style.top = piece.style.top;
  mapEl.appendChild(div);
  setTimeout(function () { div.remove(); }, 1600);
}


// ----- 화면 전환 -----
function showScreen(id) {
  for (const s of ["loginScreen", "titleScreen", "setupScreen", "gameScreen", "resultScreen", "rankingScreen"]) {
    document.getElementById(s).classList.add("hidden");
  }
  document.getElementById(id).classList.remove("hidden");
  // 결과 화면 빼고는 같은 음악 계속
  if (id == "resultScreen") playBgm("result");
  else playBgm("menu");
}

function setupTitle() {
  document.getElementById("logoImg").src = images.logo;
  let html = "";
  for (const c of characters) {
    html += '<img src="' + c.img + '" alt="' + c.name + '">';
  }
  document.getElementById("titleChars").innerHTML = html;
}


// ----- 설정 화면 -----
function setPlayerCount(n) {
  humanCount = n;
  changeBot(0);
}

function changeBot(amount) {
  botCount = Math.max(0, Math.min(botCount + amount, 4 - humanCount));
  drawSetup();
}

function setMode(k) {
  setupMode = k;
  drawSetup();
}

function toggleGender(i) {
  if (setupGender[i] == "M") setupGender[i] = "F";
  else setupGender[i] = "M";
  drawSetup();
}

function setName(i) {
  setupNames[i] = document.getElementById("name" + i).value;
}

// 다른 사람이 쓰던 캐릭터면 서로 바꿈
function pickCharacter(slot, c) {
  for (let i = 0; i < 4; i++) {
    if (setupChars[i] == c) setupChars[i] = setupChars[slot];
  }
  setupChars[slot] = c;
  setupPhotos[slot] = "";
  drawSetup();
}

// + 버튼 : 사진 파일 고르기 창 열기
function choosePhoto(slot) {
  photoSlot = slot;
  document.getElementById("photoInput").click();
}

// 고른 사진을 가운데만 정사각형으로 잘라서 160x160 으로 줄여 저장 (큰 사진은 게임이 느려져서)
function loadPhoto() {
  const input = document.getElementById("photoInput");
  if (input.files.length == 0) return;
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const size = Math.min(img.width, img.height);
    canvas.getContext("2d").drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 160, 160);
    setupPhotos[photoSlot] = canvas.toDataURL("image/png");
    input.value = "";   // 같은 사진을 다시 골라도 되게
    drawSetup();
  };
  img.src = URL.createObjectURL(input.files[0]);
}

function drawSetup() {
  // 다시 그리면 키보드로 고른 버튼이 사라지니까 id 를 기억해 뒀다가 다시 고름
  const focusId = document.activeElement.id;
  let modeHtml = "";
  for (let k = 0; k < modes.length; k++) {
    let cls = "mode-btn";
    if (k == setupMode) cls += " selected";
    modeHtml += '<button class="' + cls + '" id="mode' + k + '" onclick="setMode(' + k + ')">' + modes[k].name + '<small>약 ' + modes[k].turns + '턴</small></button>';
  }
  document.getElementById("modeBox").innerHTML = modeHtml + '<p class="mode-desc">' + modes[setupMode].desc + '</p>';

  for (let n = 1; n <= 4; n++) {
    document.getElementById("count" + n).classList.toggle("selected", n == humanCount);
  }

  const botMax = 4 - humanCount;
  let minusOff = "";
  let plusOff = "";
  if (botCount <= 0) minusOff = " disabled";
  if (botCount >= botMax) plusOff = " disabled";
  document.getElementById("botBox").innerHTML =
    '<span class="setup-label">🤖 컴퓨터</span>' +
    '<button class="bot-btn" id="botMinus" onclick="changeBot(-1)"' + minusOff + '>−</button>' +
    '<span class="bot-count">' + botCount + '명</span>' +
    '<button class="bot-btn" id="botPlus" onclick="changeBot(1)"' + plusOff + '>+</button>' +
    '<span class="bot-max">(최대 ' + botMax + '명)</span>';

  setupCount = humanCount + botCount;
  let html = "";
  for (let i = 0; i < setupCount; i++) {
    setupCpu[i] = i >= humanCount;
    const myChar = characters[setupChars[i]];
    let myImg = myChar.img;
    if (setupPhotos[i] != "") myImg = setupPhotos[i];
    if (setupCpu[i]) html += '<div class="slot cpu"><div class="slot-title">🤖 컴퓨터</div>';
    else html += '<div class="slot"><div class="slot-title">' + (i + 1) + 'P</div>';

    let genderText = "♂ 남자";
    if (setupGender[i] == "F") genderText = "♀ 여자";
    html += '<img class="slot-big" src="' + myImg + '">' +
      '<button class="gender-btn ' + setupGender[i] + '" id="gender' + i + '" onclick="toggleGender(' + i + ')">' + genderText + '</button>' +
      '<input type="text" id="name' + i + '" maxlength="6" placeholder="' + myChar.name + '" value="' + setupNames[i] + '" oninput="setName(' + i + ')">' +
      '<div class="char-list">';
    for (let c = 0; c < characters.length; c++) {
      let cls = "";
      if (setupChars[i] == c && setupPhotos[i] == "") cls = "selected";
      html += '<button class="' + cls + '" id="char' + i + "_" + c + '" title="' + characters[c].name + '" onclick="pickCharacter(' + i + ', ' + c + ')"><img src="' + characters[c].img + '"></button>';
    }
    // + 버튼 (사진을 넣었으면 그 사진이 보임)
    if (setupPhotos[i] == "") html += '<button class="add-photo" id="photo' + i + '" title="내 사진 넣기" onclick="choosePhoto(' + i + ')">+</button>';
    else html += '<button class="selected" id="photo' + i + '" title="다른 사진으로 바꾸기" onclick="choosePhoto(' + i + ')"><img class="photo" src="' + setupPhotos[i] + '"></button>';
    html += '</div></div>';
  }
  document.getElementById("slots").innerHTML = html;
  if (focusId != "" && document.getElementById(focusId) != null) document.getElementById(focusId).focus();
}

function startGame() {
  gameMode = modes[setupMode];

  for (let i = 0; i < setupCount; i++) {
    const ch = characters[setupChars[i]];
    let img = ch.img;
    if (setupPhotos[i] != "") img = setupPhotos[i];
    let name = setupNames[i];
    if (name == "") name = ch.name;

    players.push({
      id: i, name: name, cpu: setupCpu[i], gender: setupGender[i], img: img, color: ch.color,
      money: 0, int: 0, str: 0, sense: 0, talent: null,
      pos: 0, area: "baby", stepsLeft: 0, finished: false,
      college: false, job: null, grade: 0, retired: false,
      date: null, spouse: null, kids: [], house: null,
      treasures: [], assets: [], cards: [pick(cardTypes)], debt: 0,
      lastPay: 0, lastInterest: 0,
      flags: {},     // 한 일 기록 (나중에 관련 이벤트 나옴)
      pending: [],   // 이동 끝나고 할 일
      meets: 0, miniWins: 0, serves: 0,
      earned: { self: 0, spouse: 0, kids: 0 }
    });
  }

  // 성인부터 모드는 진로 선택부터 시작
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
  createPieces();
  busy = true;
  updateScreen();
  addLog("👶 인생 시작! (" + gameMode.name + ")");

  let names = "";
  for (const p of players) {
    names += "<b>" + p.name + "</b> ";
  }
  if (gameMode.key == "adult") {
    showPopup(images.life.job, "👔 성인부터 모드",
      names + "(이)가 어른이 되어 진로 선택 앞에 섰어요!<br>먼저 재능 룰렛으로 재능을 정해요.",
      [{ text: "시작!", action: function () { adultTalents(0); } }]);
  } else {
    showPopup(images.tiles.start, "👶 인생의 시작",
      "지금부터 " + names + "(은)는 아기예요!<br>골인까지 약 " + gameMode.turns + "턴! 누가 가장 부자가 될까요?",
      [{ text: "시작!", action: startTurn }]);
  }
}

function forkTile(key) {
  for (const t of tiles) {
    if (t.fork == key) return t;
  }
  return tiles[0];
}

// 성인부터 모드 재능 룰렛 (한 명씩)
function adultTalents(i) {
  if (i >= players.length) {
    turn = 0;
    startTurn();
    return;
  }
  turn = i;
  updateScreen();
  talentRoulette(players[i], images.life.talent, function () { adultTalents(i + 1); });
}


// ----- 지도 -----
function tileImage(t) {
  if (t.type == "life") return images.life[t.life];
  return images.tiles[t.type];
}

function drawMap() {
  mapEl.style.width = MAP_WIDTH + "px";
  mapEl.style.height = MAP_HEIGHT + "px";
  mapEl.style.backgroundImage = "url(" + images.map + ")";

  // 길 그리기 (테두리, 길, 점선 순으로 겹침)
  let svg = '<svg class="roads" width="' + MAP_WIDTH + '" height="' + MAP_HEIGHT + '">';
  for (const layer of ["road-edge", "road", "road-line"]) {
    for (const t of tiles) {
      for (const n of t.next) {
        svg += '<line class="' + layer + '" x1="' + t.x + '" y1="' + t.y + '" x2="' + tiles[n].x + '" y2="' + tiles[n].y + '"/>';
      }
    }
  }
  let html = svg + '</svg>';

  // 칸 그리기
  const bigLabels = { fork: "갈림길", start: "탄생", goal: "골인!" };
  for (const t of tiles) {
    let label = bigLabels[t.type];
    let cls = "tile";
    if (t.type == "life") {
      label = "🛑 " + lifeEvents[t.life].label;
      cls += " big life";
    } else if (label != undefined) {
      cls += " big";
    }
    html += '<div class="' + cls + '" style="left:' + t.x + 'px; top:' + t.y + 'px"><img src="' + tileImage(t) + '">';
    if (label != undefined) html += '<div class="tile-label">' + label + '</div>';
    html += '</div>';
  }
  mapEl.innerHTML = html;

  // 칸 설명
  const legend = [
    ["good", "좋은 일"], ["bad", "나쁜 일"], ["normal", "보통"], ["event", "선택 이벤트"],
    ["pay", "월급날"], ["love", "연애"], ["work", "직업"], ["card", "카드"],
    ["lucky", "럭키 칸"], ["treasure", "보물"], ["shop", "상점"]
  ];
  let legendHtml = "";
  for (const item of legend) {
    legendHtml += '<div><img src="' + images.tiles[item[0]] + '"> ' + item[1] + '</div>';
  }
  document.getElementById("legend").innerHTML = legendHtml;
}

// 같은 칸에서 안 겹치게
const pieceOffset = [{ x: -16, y: -6 }, { x: 16, y: -6 }, { x: -16, y: 8 }, { x: 16, y: 8 }];

function createPieces() {
  for (const p of players) {
    mapEl.innerHTML += '<img class="piece" id="piece' + p.id + '" src="' + p.img + '"><div class="pins" id="pins' + p.id + '"></div>';
  }
  for (const p of players) {
    placePiece(p);
  }
}

function placePiece(p) {
  const t = tiles[p.pos];
  const x = t.x - 24 + pieceOffset[p.id].x;
  const y = t.y + pieceOffset[p.id].y;
  const piece = document.getElementById("piece" + p.id);
  piece.style.left = x + "px";
  piece.style.top = (y - 56) + "px";
  const pins = document.getElementById("pins" + p.id);
  pins.style.left = x + "px";
  pins.style.top = (y - 6) + "px";
}

// 카메라 이동
function follow(p) {
  if (zoomedOut) return;
  const t = tiles[p.pos];
  mapWrap.scrollTo({ left: t.x - mapWrap.clientWidth / 2, top: t.y - mapWrap.clientHeight / 2, behavior: "smooth" });
}

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


// ----- 화면 갱신 -----
function updateScreen() {
  const p = players[turn];
  document.getElementById("turnImg").src = p.img;
  document.getElementById("turnName").innerHTML = '<span style="color:' + p.color + '">' + p.name + '</span>의 차례';

  if (p.finished) spinBtn.textContent = "🎰 보너스 룰렛";
  else spinBtn.textContent = "🎡 룰렛";
  spinBtn.disabled = busy;

  for (const other of players) {
    document.getElementById("piece" + other.id).classList.toggle("active", other.id == p.id);
  }
  drawCards();
  drawPlayerList();
  drawHud();
  follow(p);
}

// 지도 위 상태바
function drawHud() {
  const p = players[turn];
  let cards = "";
  for (const c of p.cards) {
    cards += '<span class="hud-card" title="' + c.name + '">' + c.name.split(" ")[0] + '</span>';
  }
  if (p.debt > 0) cards += '<span class="hud-debt">🏦 대출 ' + p.debt + '건</span>';

  document.getElementById("hud").innerHTML =
    '<img src="' + p.img + '">' +
    '<div class="hud-main">' +
      '<div class="hud-top"><b>' + p.name + '</b> ' + genderMark(p.gender) + '<span class="hud-job">' + jobTitle(p) + '</span></div>' +
      '<div class="hud-bottom">' +
        '<span>지 ' + gradeHtml(p, "int") + ' 체 ' + gradeHtml(p, "str") + ' 센 ' + gradeHtml(p, "sense") + '</span>' +
        '<span class="hud-money">' + won(p.money) + '</span>' +
      '</div>' +
      '<div class="hud-cards">' + cards + '</div>' +
    '</div>';

  let html = '<div>🕐 턴 <b>' + (round + 1) + '</b> <small>(약 ' + gameMode.turns + '턴)</small></div>';
  const toPay = stepsToPay(p);
  if (toPay > 0 && !p.finished) html += '<div>💵 월급날까지 <b>' + toPay + '</b>칸</div>';
  document.getElementById("turnHud").innerHTML = html;
}

// 다음 월급날까지 남은 칸
function stepsToPay(p) {
  let id = p.pos;
  for (let n = 1; n <= 60; n++) {
    if (tiles[id].next.length == 0) return 0;
    id = tiles[id].next[0];
    if (tiles[id].type == "pay") return n;
  }
  return 0;
}

function drawCards() {
  const p = players[turn];
  cardMenuBtn.textContent = "🎴 카드 " + p.cards.length;
  cardMenuBtn.disabled = busy || p.finished || p.cards.length == 0;
}

function drawPlayerList() {
  let html = "";
  for (const p of players) {
    let family = "";
    if (p.spouse != null) family += "💍 " + p.spouse.name + " (♥" + p.spouse.love + "%)";
    else if (p.date != null) family += "💕 " + p.date.name + " (♥" + p.date.love + "%)";
    family += " " + kidIcons(p);
    if (p.house != null) family += " 🏠";
    if (p.treasures.length > 0) family += " 💎×" + p.treasures.length;
    if (p.assets.length > 0) family += " 📈×" + p.assets.length;
    if (p.debt > 0) family += " 🏦" + p.debt;
    if (p.finished) family += " 🏁골인";

    let cls = "player";
    if (p.id == turn) cls += " now";
    let cpuMark = "";
    if (p.cpu) cpuMark = " 🤖";
    html += '<div class="' + cls + '"><img src="' + p.img + '"><div>' +
      '<div class="pname" style="color:' + p.color + '">' + p.name + ' ' + genderMark(p.gender) + cpuMark + '</div>' +
      '<div class="money">💰 ' + won(p.money) + '</div>' +
      '<div>💼 ' + jobTitle(p) + '</div>' +
      '<div class="stats">' + statsHtml(p) + '</div>' +
      '<div>' + family + '</div>' +
      '</div></div>';

    // 가족 핀
    let pins = "";
    if (p.spouse != null && p.spouse.gender == "M") pins = "👨";
    if (p.spouse != null && p.spouse.gender == "F") pins = "👩";
    const pinBox = document.getElementById("pins" + p.id);
    if (pinBox != null) pinBox.textContent = pins + kidIcons(p);
  }
  playerList.innerHTML = html;
}


// ----- 메뉴 (카드, 상태, 기타) -----
let panelCard = 0;    // 카드 메뉴에서 고른 카드
let panelPlayer = 0;  // 상태 메뉴에서 보는 사람

function openPanel(kind) {
  panelCard = 0;
  panelPlayer = turn;
  if (kind == "card") drawCardPanel();
  else if (kind == "status") drawStatusPanel();
  else drawEtcPanel();
  menuPanel.classList.remove("hidden");
}

function closePanel() {
  menuPanel.classList.add("hidden");
  document.activeElement.blur();   // 메뉴 버튼에 남은 선택 없애기 (스페이스바가 룰렛으로 가게)
}

function panelHead(title) {
  return '<div class="panel-head">' + title + ' <button class="panel-close" onclick="closePanel()">✕</button></div>';
}

// 카드를 못 쓰는 이유 (쓸 수 있으면 빈 글자)
function cardProblem(p, card) {
  if (card.key == "guard") return "갖고만 있으면 자동으로 지켜 주는 카드예요";
  if (card.key == "snipe" && luckyAhead(p).length == 0) return "앞 5칸 안에 ⭐ 럭키 칸이 없어요";
  return "";
}

function selectCard(i) {
  panelCard = i;
  drawCardPanel();
}

function drawCardPanel() {
  const p = players[turn];
  let list = "";
  for (let i = 0; i < p.cards.length; i++) {
    let cls = "panel-item";
    if (i == panelCard) cls += " selected";
    list += '<button class="' + cls + '" onclick="selectCard(' + i + ')">' + p.cards[i].name + '</button>';
  }
  const card = p.cards[panelCard];
  const words = card.name.split(" ");   // ["", "작은", "숫자", "카드"]
  const problem = cardProblem(p, card);
  let desc = card.desc;
  let useBtn = '<button class="big-btn" onclick="askUseCard()">사용하기</button>';
  if (problem != "") {
    desc += '<br><small>⚠️ ' + problem + '</small>';
    useBtn = '<button class="big-btn" disabled>사용 못 해요</button>';
  }
  menuPanel.innerHTML = panelHead("🎴 카드") +
    '<div class="panel-body"><div class="panel-list">' + list + '</div>' +
    '<div class="card-big card-' + card.key + '"><div class="card-emoji">' + words[0] + '</div><div>' + words.slice(1).join(" ") + '</div></div></div>' +
    '<div class="panel-desc">' + desc + '</div>' +
    '<div class="panel-foot">' + useBtn + '</div>';
}

function askUseCard() {
  menuPanel.innerHTML = '<div class="panel-ask"><p><b>' + players[turn].cards[panelCard].name + '</b>을(를) 사용할까요?</p>' +
    '<button class="big-btn" onclick="closePanel(); playCard(panelCard)">네</button>' +
    '<button class="big-btn gray" onclick="drawCardPanel()">아니오</button></div>';
}

function selectPlayer(i) {
  panelPlayer = i;
  drawStatusPanel();
}

function drawStatusPanel() {
  const p = players[panelPlayer];
  let tabs = "";
  for (const other of players) {
    let cls = "panel-tab";
    if (other.id == p.id) cls += " selected";
    tabs += '<button class="' + cls + '" onclick="selectPlayer(' + other.id + ')"><img src="' + other.img + '"> ' + other.name + '</button>';
  }

  // 직업
  let jobBox = "<p>아직 직업이 없어요.<br><small>💼 취업 칸에서 골라요</small></p>";
  if (p.job != null) {
    const job = jobs[p.job];
    let next = '<small>최고 랭크! 👑</small>';
    if (p.grade < job.grades.length - 1) {
      const n = job.grades[p.grade + 1];
      next = '<small>다음 랭크 ▶ ' + n.title + '<br>' + needText(n.need) + '<br>진급 심사 : 월급날 룰렛 + ' + statNames[job.main] + '×0.1 ≥ 15</small>';
    }
    jobBox = '<p>' + job.name + '<br><b>' + job.grades[p.grade].title + '</b></p>' +
      '<div class="rank-num">' + (p.grade + 1) + '<span>' + "★".repeat(p.grade + 1) + '</span></div>' +
      '<p>월급 ' + won(job.grades[p.grade].salary) + '</p>' + next;
  }

  // 연애
  let loveBox = "<p>🙋 솔로<br><small>♥ 연애 칸에서 만나요</small></p>";
  let partner = p.date;
  if (p.spouse != null) partner = p.spouse;
  if (partner != null) {
    let heart = partner.love + "%";
    if (partner.love >= 100) heart = "MAX";
    let mark = "💕 ";
    if (partner == p.spouse) mark = "💍 ";
    loveBox = '<p>' + mark + partner.name + '</p><div class="heart">' + heart + '</div>';
  }
  if (p.kids.length > 0) {
    let kids = "";
    for (const kid of p.kids) {
      let job = "어린이";
      if (kid.job != null) job = kid.job.name;
      kids += kid.name + "(" + job + ") ";
    }
    loveBox += '<small>' + kidIcons(p) + ' ' + kids + '</small>';
  }

  // 집, 산 물건
  let houseBox = "<p>내 집 마련 칸에서<br>마련해요</p>";
  if (p.house != null) houseBox = '<p>🏠 ' + p.house.name + '</p><p>팔 때 <b>' + won(p.house.sell) + '</b></p>';
  if (p.assets.length > 0) {
    houseBox += '<p class="owned">';
    for (const a of p.assets) {
      houseBox += '<small>' + a.icon + ' ' + a.name + ' (' + won(assetValue(a)) + ')</small><br>';
    }
    houseBox += '</p>';
  }

  let icons = "";
  for (const t of p.treasures) {
    icons += t.icon;
  }
  let debt = "";
  if (p.debt > 0) debt = '<span class="minus">🏦 대출 ' + p.debt + '건</span>';

  menuPanel.innerHTML = panelHead("📋 상태") +
    '<div class="panel-tabs">' + tabs + '</div>' +
    '<div class="panel-stats">' + statsHtml(p) + '<span>💰 ' + won(p.money) + '</span>' + debt + '</div>' +
    '<div class="status-grid">' +
      '<div class="status-box"><h4>직업</h4>' + jobBox + '</div>' +
      '<div class="status-box love"><h4>연애</h4>' + loveBox + '</div>' +
      '<div class="status-box"><h4>내집</h4>' + houseBox + '</div>' +
      '<div class="status-box"><h4>보물</h4><p>' + p.treasures.length + '개 ' + icons + '</p><p><b>' + won(treasureValue(p)) + '</b></p></div>' +
    '</div>';
}

function drawEtcPanel() {
  let log = "";
  const items = logList.children;
  for (let i = 0; i < items.length && i < 12; i++) {
    log += '<li>' + items[i].innerHTML + '</li>';
  }
  menuPanel.innerHTML = panelHead("⚙️ 기타") +
    '<h4>칸 설명</h4><div class="legend-grid">' + document.getElementById("legend").innerHTML + '</div>' +
    '<h4>최근 기록</h4><ul class="panel-log">' + log + '</ul>' +
    '<div class="panel-foot"><button class="big-btn" onclick="closePanel(); toggleZoom()">🗺️ 전체 지도 보기 / 크게 보기</button></div>';
}


// ----- 결과 적용 -----
// 돈, 능력치 바꾸는 건 전부 여기서 함. 예) r = { money: 100, int: 10 }
function applyResult(p, r) {
  const parts = [];

  if (r.money) {
    p.money += r.money;
    parts.push("💰" + moneyText(r.money));
    if (r.money > 0) sfx("coin");
    else sfx("lose");
  }

  for (const key in statNames) {
    if (r[key]) {
      let amount = r[key];
      if (amount > 0 && p.talent == key) amount = Math.round(amount * talentBonus);
      p[key] = Math.max(0, p[key] + amount);
      parts.push(statNames[key] + " " + signed(amount));
    }
  }

  // 모두에게 받기 (마이너스면 주기)
  if (r.all) {
    for (const other of players) {
      if (other.id != p.id) {
        other.money -= r.all;
        p.money += r.all;
      }
    }
    parts.push("모두에게 " + moneyText(r.all) + "씩");
  }

  if (r.service) parts.push(useService(p, r.service.job, r.service.fee));
  if (r.collect) parts.push(collectItem(p, r.collect));
  if (r.steal) parts.push(attack(p, r.steal, true));
  if (r.trap) parts.push(attack(p, r.trap, false));
  if (r.flag) p.flags[r.flag] = true;

  if (r.card) {
    if (p.cards.length < 3) {
      const card = pick(cardTypes);
      p.cards.push(card);
      parts.push("🎴 " + card.name + " 획득!");
      sfx("card");
    } else {
      parts.push("🎴 카드가 꽉 찼어요");
    }
  }

  // 돈이 마이너스면 자동 대출
  for (const someone of players) {
    const loan = checkDebt(someone);
    if (loan != "") parts.push(loan);
  }

  if (parts.length > 0) floatText(p, parts.join(" "));
  drawPlayerList();
  return parts.join("<br>");
}

// 그 직업인 다른 플레이어 찾기 (없으면 null)
function providerOf(job, p) {
  let best = null;
  for (const other of players) {
    if (other.id != p.id && other.job != null && jobs[other.job].name == job && !other.retired) {
      if (best == null || other.grade > best.grade) best = other;
    }
  }
  return best;
}

// 그 직업 플레이어에게 돈 내기 (거절 불가)
function useService(p, job, fee) {
  if (p.job != null && jobs[p.job].name == job) return "🤝 내가 " + job + "라서 직접 해결! (공짜)";
  p.money -= fee;
  const pro = providerOf(job, p);
  if (pro == null) return "🤝 " + job + " 비용 " + moneyText(-fee);

  pro.money += fee;
  pro.earned.self += fee;
  pro.serves++;
  addLog("🤝 " + p.name + " → " + job + " " + pro.name + " " + won(fee));
  floatText(pro, "🤝 " + moneyText(fee));
  if (fee < 0) return "🤝 " + job + " " + pro.name + "에게서 " + won(-fee) + " 받았어요!";
  return "🤝 " + job + " <b>" + pro.name + "</b>에게 " + won(fee) + "를 냈어요!";
}

// 그 직업 플레이어 물건 소장, 값은 base x 랭크
function collectItem(p, c) {
  const pro = providerOf(c.job, p);
  let owner = "유명 " + c.job;
  let rank = 1;
  if (pro != null) {
    owner = pro.name;
    rank = pro.grade + 1;
  }
  const item = { kind: "collect", icon: c.icon, name: owner + "의 " + c.item, base: c.base * rank };
  p.assets.push(item);
  return "🖼️ " + item.icon + " " + item.name + " 소장! (지금 가치 " + won(item.base) + ", 마지막에 시세 정산)";
}

function assetValue(a) {
  return Math.round(a.base * marketMult[a.kind]);
}

function assetsValue(p) {
  let sum = 0;
  for (const a of p.assets) {
    sum += assetValue(a);
  }
  return sum;
}

function treasureValue(p) {
  let sum = 0;
  for (const t of p.treasures) {
    sum += t.value;
  }
  return sum;
}

// 총자산 (대출은 1.5배로 갚음)
function totalOf(p) {
  let total = p.money + treasureValue(p) + assetsValue(p) - p.debt * debtPenalty;
  if (p.house != null) total += p.house.sell;
  return total;
}

// 자동 대출, 아이는 그냥 0원으로
function checkDebt(p) {
  if (p.money >= 0) return "";
  if (!isAdult(p)) {
    p.money = 0;
    return "";
  }
  let count = 0;
  while (p.money < 0) {
    p.money += debtUnit;
    p.debt++;
    count++;
  }
  addLog(p.name + " : 🏦 자동 대출 " + count + "건");
  sfx("bad");
  return "🏦 " + p.name + " 자동 대출 " + count + "건 (+" + won(count * debtUnit) + ")";
}

// 갈취, 함정은 1등을 노림
// 수호 카드가 있으면 막히고 나한테 돌아옴
function attack(p, amount, steal) {
  let target = null;
  for (const other of players) {
    if (other.id != p.id && (target == null || totalOf(other) > totalOf(target))) target = other;
  }
  if (target == null) return "";

  let guard = -1;
  for (let i = 0; i < target.cards.length; i++) {
    if (target.cards[i].key == "guard") guard = i;
  }

  if (guard >= 0) {
    target.cards.splice(guard, 1);
    p.money -= amount;
    let what = "함정을";
    let moneyLine = p.name + " " + moneyText(-amount);
    if (steal) {
      target.money += amount;
      what = "갈취를";
      moneyLine += " → " + target.name + " " + moneyText(amount);
    }
    addLog(target.name + " : 🛡️ 수호 카드로 반사!");
    guardNews += '<div class="guard-box">🛡️ <b>수호 카드 발동!</b><br>' +
      target.name + "(이)가 " + p.name + "의 " + what + " 막고 되돌려 보냈어요!<br>" +
      moneyLine + "<br><small>" + target.name + "의 수호 카드 1장을 썼어요</small></div>";
    sfx("guard");
    floatText(target, "🛡️ 수호 카드 발동!");
    drawCards();
    return "🛡️ " + target.name + "의 수호 카드에 막혀서 되돌아왔어요! (" + moneyText(-amount) + ")";
  }

  target.money -= amount;
  if (steal) {
    p.money += amount;
    return "🦹 " + target.name + "에게서 " + won(amount) + " 갈취!";
  }
  return "🪤 " + target.name + "이(가) 함정에 걸려 " + won(amount) + " 잃었어요!";
}


// ----- 차례 시작 -----
function startTurn() {
  const p = players[turn];
  closePanel();
  busy = p.cpu;   // 컴퓨터 차례면 버튼 막기
  p.metThisMove = false;
  rollText.textContent = "";
  updateScreen();

  // 황혼기에는 가족 수입이 매 턴 들어옴
  if (!p.finished && areas[p.area].stage == 9) {
    const income = familyPay(p);
    if (income > 0) {
      p.money += income;
      floatText(p, "👨‍👩‍👧 가족 수입 " + moneyText(income));
      addLog(p.name + " : 👨‍👩‍👧 가족 수입 " + moneyText(income));
      drawPlayerList();
    }
  }

  sfx("turn");
  if (p.cpu) {
    showBanner("🤖 " + p.name + "의 차례!", p.color);
    setTimeout(cpuTurn, 1300);
  } else {
    showBanner(p.name + "의 차례!", p.color);
  }
}

function spin() {
  if (busy) return;
  if (players[turn].finished) {
    busy = true;
    updateScreen();
    bonusRoulette(players[turn]);
    return;
  }
  rollWheel(randomInt(1, 10));
}

function playCard(i) {
  const p = players[turn];
  const card = p.cards[i];
  if (card.key == "guard") return;
  if (card.key == "snipe") {
    snipeCard(p, i);
    return;
  }
  p.cards.splice(i, 1);
  addLog(p.name + " : " + card.name + " 사용!");
  sfx("card");
  showBanner(card.name + "<small>" + card.desc + "</small>", "#845ef7");
  rollWheel(randomInt(card.min, card.max));
}

// 앞 5칸 안 럭키 칸 찾기
// 길을 한 칸씩 늘려 가면서 찾음 (인생 이벤트 칸은 못 넘어감)
function luckyAhead(p) {
  const found = [];
  let routes = [[]];
  for (let step = 0; step < 5; step++) {
    const longer = [];
    for (const route of routes) {
      let last = p.pos;
      if (route.length > 0) last = route[route.length - 1];
      for (const n of tiles[last].next) {
        const newRoute = route.concat([n]);
        if (tiles[n].type == "lucky") found.push(newRoute);
        if (tiles[n].type != "life" && tiles[n].type != "goal") longer.push(newRoute);
      }
    }
    routes = longer;
  }
  return found;
}

// 저격 카드
function snipeCard(p, i) {
  const targets = luckyAhead(p);
  if (targets.length == 0) return;
  p.cards.splice(i, 1);
  busy = true;
  updateScreen();
  addLog(p.name + " : 🎯 저격 카드 사용!");

  const buttons = [];
  for (const route of targets) {
    buttons.push({ text: "⭐ " + route.length + "칸 앞 럭키 칸", action: function () { walkPath(p, route); } });
  }
  buttons[0].cpuPick = true;
  showPopup(images.tiles.lucky, "🎯 저격 카드", "어느 럭키 칸으로 갈까요?", buttons);
}

// 길 따라 한 칸씩 이동
function walkPath(p, route) {
  if (route.length == 0) {
    arrive(p);
    return;
  }
  p.pos = route[0];
  placePiece(p);
  follow(p);
  enterTile(p, tiles[p.pos]);
  setTimeout(function () { walkPath(p, route.slice(1)); }, 330);
}

// 5바퀴(1800도) 돌고 num이 위로 오게, 한 칸은 36도
function rollWheel(num) {
  busy = true;
  updateScreen();
  rollText.textContent = "두근두근...";
  spinCount++;
  wheelImg.style.transform = "rotate(" + (spinCount * 1800 - (num - 1) * 36) + "deg)";
  sfx("spin");

  setTimeout(function () {
    sfx("ding");
    const p = players[turn];
    addLog(p.name + " : 🎯 " + num + " 칸 이동");
    rollText.textContent = "🎯 " + num + "칸 이동!";
    movePlayer(p, num);
  }, 2100);
}


// ----- 확률 룰렛 -----
// 확률만큼 O칸 만들기 (60%면 O 6칸, X 4칸)
// great가 true면 대성공 칸도 넣음
function chanceSlots(chance, great) {
  let win = Math.round(chance * 10);
  if (chance < 1) win = Math.max(1, Math.min(win, 9));   // 최소 1칸씩은 있게
  let best = 0;
  if (great && win >= 2) best = Math.max(1, Math.floor(win / 4));

  const slots = [];
  for (let i = 0; i < 10; i++) {
    if (i < best) slots.push("◎");
    else if (i < win) slots.push("O");
    else slots.push("X");
  }
  return slots;
}

// 칸 개수 글자 (예: O 6칸 · X 4칸)
function countText(slots) {
  const parts = [];
  for (const mark of ["◎", "O", "X"]) {
    let count = 0;
    for (const s of slots) {
      if (s == mark) count++;
    }
    if (count > 0) parts.push(mark + " " + count + "칸");
  }
  return parts.join(" · ");
}

function slotText(mark) {
  if (mark == "X") return "❌ 실패...";
  if (mark == "O") return "⭕ 성공!";
  if (mark == "◎") return "🌟 대성공!!";
  return mark;
}

// 룰렛판 그림
function wheelSvg(slots) {
  let svg = '<svg class="chance-svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="146" fill="#fff" stroke="#495057" stroke-width="6"/>';
  for (let k = 0; k < 10; k++) {
    // 칸 양쪽 각도
    const a1 = (k * 36 - 18) * Math.PI / 180;
    const a2 = (k * 36 + 18) * Math.PI / 180;
    let color = slotColors[slots[k]];
    if (color == undefined) color = otherColors[k];
    svg += '<path d="M150 150 L' + (150 + 136 * Math.sin(a1)) + ' ' + (150 - 136 * Math.cos(a1)) +
      ' A136 136 0 0 1 ' + (150 + 136 * Math.sin(a2)) + ' ' + (150 - 136 * Math.cos(a2)) + ' Z" fill="' + color + '" stroke="#fff" stroke-width="3"/>';
    let size = 34;
    if (slots[k].length > 2) size = 20;
    svg += '<text x="150" y="58" font-size="' + size + '" transform="rotate(' + (k * 36) + ' 150 150)">' + slots[k] + '</text>';
  }
  return svg + '<circle cx="150" cy="150" r="22" fill="#fff" stroke="#495057" stroke-width="6"/></svg>';
}

// 룰렛 창. p가 컴퓨터면 자동으로 돌림
// 다 돌면 done(나온 글자, 칸 번호) 실행
function showRoulette(p, title, text, slots, done) {
  document.getElementById("chanceTitle").innerHTML = title;
  document.getElementById("chanceText").innerHTML = text;
  const result = document.getElementById("chanceResult");
  const wheel = document.getElementById("chanceWheel");
  result.innerHTML = "";
  wheel.innerHTML = wheelSvg(slots);
  chanceBtn.disabled = false;
  chanceBox.classList.remove("hidden");
  sfx("open");

  chanceBtn.onclick = function () {
    chanceBtn.disabled = true;
    const k = randomInt(0, 9);
    wheel.firstChild.style.transform = "rotate(" + (1800 - k * 36 + randomInt(-12, 12)) + "deg)";
    sfx("spin");
    setTimeout(function () {
      result.innerHTML = slotText(slots[k]);
      markSound(slots[k]);
      setTimeout(function () {
        chanceBox.classList.add("hidden");
        done(slots[k], k);
      }, 1100);
    }, 2100);
  };

  if (p != null && p.cpu) {
    chanceBtn.disabled = true;
    setTimeout(chanceBtn.onclick, 900);
  }
}

function chanceRoulette(p, title, text, chance, great, done) {
  const slots = chanceSlots(chance, great);
  showRoulette(p, title, text + '<div class="slot-info">' + countText(slots) + '</div>', slots, done);
}

// 대성공이면 좋은 결과만 2배
function doubleResult(r) {
  const big = { text: r.text + " <b>(대성공! 보상 2배)</b>", card: r.card, flag: r.flag };
  for (const key of ["money", "int", "str", "sense", "all"]) {
    if (r[key] > 0) big[key] = r[key] * 2;
    else if (r[key]) big[key] = r[key];
  }
  return big;
}

// 골인한 사람 보너스 룰렛
function bonusRoulette(p) {
  rollText.textContent = "🎰 보너스 룰렛!";
  showRoulette(p, "🎰 보너스 룰렛", "골인한 사람은 기다리는 동안 보너스 룰렛으로 돈을 벌어요!", moneyLabels(bonusAmounts), function (label, k) {
    const summary = applyResult(p, { money: bonusAmounts[k] });
    addLog(p.name + " : 🎰 보너스 " + moneyText(bonusAmounts[k]));
    showPopup(images.tiles.goal, "🎰 보너스 " + won(bonusAmounts[k]) + "!", resultHtml(summary));
  });
}


// ----- 이동 -----
function movePlayer(p, left) {
  if (left == 0) {
    arrive(p);
    return;
  }
  const here = tiles[p.pos];
  if (here.next.length > 1) askFork(p, here, left);
  else stepTo(p, here.next[0], left);
}

function stepTo(p, id, left) {
  p.pos = id;
  const t = tiles[id];
  placePiece(p);
  follow(p);
  sfx("step");
  const remain = left - 1;
  rollText.textContent = "남은 칸 : " + remain;
  enterTile(p, t);

  // 아이만 모드는 고등학교 졸업하면 끝
  if (gameMode.key == "junior" && t.fork == "f1") {
    p.pending = [];
    p.stepsLeft = 0;
    setTimeout(function () { goalTile(p, images.tiles.goal); }, 500);
    return;
  }
  if (t.type == "goal") {
    setTimeout(function () { arrive(p); }, 500);
    return;
  }
  // 인생 이벤트 칸은 무조건 멈춤. 남은 칸은 이벤트 끝나고 감
  if (t.type == "life") {
    p.stepsLeft = remain;
    if (remain > 0) {
      rollText.textContent = "🛑 STOP! (이벤트 후 " + remain + "칸 더)";
      showBanner("🛑 인생 이벤트!<small>이벤트가 끝나면 남은 " + remain + "칸 더 이동해요</small>", "#e03131");
    }
    setTimeout(function () { arrive(p); }, 900);
    return;
  }
  setTimeout(function () { movePlayer(p, remain); }, 330);
}

// 지나가는 칸 처리 (지역, 월급, 인연)
function enterTile(p, t) {
  if (t.area != p.area) {
    p.area = t.area;
    const area = areas[t.area];
    showBanner(area.name + "<small>" + area.story + "</small>", p.color);
    addLog(p.name + " : " + area.name + " 도착");
    // 새 나이대에 처음 오면 중간 집계
    if (area.stage > topStage) {
      topStage = area.stage;
      checkpointPending = true;
    }
    // 한방역전섬은 카드 압수
    if (t.area == "gamble" && p.cards.length > 0) {
      p.cards = [];
      addLog(p.name + " : 🎰 한방역전섬 입장 → 카드 전부 압수");
      floatText(p, "🎴 카드 전부 압수!");
    }
  }

  if (t.type == "pay") paySalary(p);

  // 같은 칸에서 만나면 인연 (아이 때 1번, 어른 때 1번)
  if (p.metThisMove || t.type == "start") return;
  for (const other of players) {
    if (other.id == p.id || other.pos != t.id || other.finished) continue;
    let phase = "아이";
    if (isAdult(p)) phase = "어른";
    const key = Math.min(p.id, other.id) + "-" + Math.max(p.id, other.id) + "-" + phase;
    if (metPairs[key] != true) {
      metPairs[key] = true;
      p.metThisMove = true;
      p.pending.push({ type: "meet", other: other.id });
      return;
    }
  }
}

function askFork(p, here, left) {
  const fork = forks[here.fork];
  const cpuIndex = cpuForkChoice(p, here.fork);
  const buttons = [];
  for (let i = 0; i < fork.routes.length; i++) {
    const route = fork.routes[i];
    buttons.push({
      text: route.label, desc: route.desc, cpuPick: i == cpuIndex,
      action: function () {
        applyResult(p, route);
        addLog(p.name + " : " + route.label + " 선택");
        stepTo(p, here.next[i], left);
      }
    });
  }
  showPopup(images.tiles.fork, "🪧 " + fork.title, fork.text, buttons);
}

// 월급날 (지나가기만 해도 받음)
function paySalary(p) {
  let total = familyPay(p);
  if (p.job != null) {
    let salary = jobs[p.job].grades[p.grade].salary;
    if (p.retired) salary = Math.floor(salary / 2);   // 퇴직하면 절반
    total += salary;
    p.earned.self += salary;
  }

  // 월급날 4번 지나면 자녀가 어른이 됨
  for (const kid of p.kids) {
    kid.age++;
    if (kid.age == 4) p.pending.push({ type: "kidjob", kid: kid });
  }

  p.lastPay = total;
  p.lastInterest = p.debt * debtInterest;
  p.money += total - p.lastInterest;
  checkDebt(p);
  if (total > 0 || p.lastInterest > 0) floatText(p, "💵 " + moneyText(total - p.lastInterest));

  if (p.job != null && !p.retired && p.grade < jobs[p.job].grades.length - 1) p.pending.push({ type: "promo" });
  drawPlayerList();
}

// 배우자, 자녀 월급
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


// ----- 도착한 칸 -----
function arrive(p) {
  // 이동 중에 생긴 일 먼저 처리
  if (p.pending.length > 0) {
    const job = p.pending.shift();
    const again = function () { arrive(p); };
    if (job.type == "promo") promotion(p, again);
    else if (job.type == "kidjob") kidJobRoulette(p, job.kid, again);
    else meeting(p, players[job.other], again);
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
  else if (t.type == "event" && t.area == "gamble") lottery(p, img);
  else if (t.type == "event") eventTile(p, pickEvent(p, pool.event), img);
  else if (t.type == "pay") {
    let text = "아직 수입이 없어요.";
    if (p.lastPay > 0) text = "이번 수입은 <b>" + won(p.lastPay) + "</b>!";
    if (p.lastInterest > 0) text += "<br>🏦 대출 이자 " + won(p.lastInterest) + "를 냈어요.";
    showPopup(img, "💵 월급날!", text);
  }
  else if (t.type == "card") showPopup(img, "🎴 카드", "카드를 한 장 얻었어요!" + resultHtml(applyResult(p, { card: true })));
  else if (t.type == "lucky") luckyTile(p, img);
  else if (t.type == "treasure") treasureTile(p, img);
  else if (t.type == "shop") shopTile(p, img);
  else if (t.type == "love") loveTile(p, img);
  else if (t.type == "work") workTile(p, img);
  else if (t.type == "life") lifeTile(p, t.life, img);
  else if (t.type == "goal") goalTile(p, img);
  else nextTurn();   // 갈림길에 멈추면 그냥 넘어감
}

// 진급 심사 : 룰렛(1~10) + 주 능력치x0.1 이 15 이상이면 진급
function promotion(p, after) {
  // 이미 최고 랭크면 넘어감
  if (p.job == null || p.retired || p.grade >= jobs[p.job].grades.length - 1) {
    after();
    return;
  }
  const job = jobs[p.job];
  const next = job.grades[p.grade + 1];
  const bonus = Math.floor(p[job.main] * 0.1);
  const slots = [];
  for (let n = 1; n <= 10; n++) {
    if (n + bonus >= 15) slots.push("O");
    else slots.push("X");
  }
  const text = "<b>" + next.title + "</b> 진급 심사!<br>진급 점수 = 룰렛(1~10) + " + statNames[job.main] + " " + p[job.main] +
    "×0.1 (+" + bonus + ") → 15 이상" + '<div class="slot-info">' + countText(slots) + '</div>';

  showRoulette(p, "★ 진급 심사 (월급날)", text, slots, function (mark) {
    const img = images.tiles.work;
    const ok = [{ text: "확인", action: after }];
    if (mark == "X") {
      showPopup(img, "😢 진급 실패", "진급 점수가 모자랐어요. 다음 월급날에 다시!", ok);
      return;
    }
    if (!meetsNeed(p, next.need)) {
      showPopup(img, "🚫 진급 거부", "점수는 넘었지만 능력치가 모자라요.<br>(" + needText(next.need) + " 필요)", ok);
      return;
    }
    const before = job.grades[p.grade].salary;
    p.grade++;
    addLog(p.name + " : 🎉 RANK UP! " + next.title);
    sfx("fanfare");
    drawPlayerList();

    let nextInfo = "최고 랭크 달성! 👑";
    if (p.grade < job.grades.length - 1) {
      const n = job.grades[p.grade + 1];
      nextInfo = "다음 랭크 ▶ " + n.title + " (" + needText(n.need) + ")";
    }
    showPopup(img, "🎉 RANK UP!", '<div class="rankup">' + job.name + "<br><b>" + next.title + " ★" + (p.grade + 1) + "</b>" +
      "<br>월급 " + won(next.salary) + ' <span class="cp-up">(+' + won(next.salary - before) + ")</span>" +
      '<br><small>' + nextInfo + '</small></div>', ok);
  });
}

// 자녀 직업 룰렛
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

// 인연
function meeting(p, other, after) {
  const text = pick(encounters).replace("{a}", other.name).replace("{b}", p.name);
  showPopup(other.img, "🤝 인연 발생!", text + "<br>함께하면 두 사람 모두 " + statNames.int + " · " + statNames.sense + " +" + meetBonus + "!", [
    {
      text: "🤝 수락", cpuPick: true,
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

// 럭키 칸 (어른은 돈, 아이는 능력치)
function luckyTile(p, img) {
  if (isAdult(p)) {
    showRoulette(p, "⭐ 럭키 칸!", "럭키 룰렛으로 보너스를 받아요!", moneyLabels(luckyAmounts), function (label, k) {
      addLog(p.name + " : ⭐ 럭키 " + moneyText(luckyAmounts[k]));
      showPopup(img, "⭐ 럭키!", resultHtml(applyResult(p, { money: luckyAmounts[k] })));
    });
    return;
  }
  const slots = ["🧠", "🧠", "🧠", "💪", "💪", "💪", "✨", "✨", "✨", "🌟"];
  showRoulette(p, "⭐ 럭키 칸!", "나온 능력치가 +10! (🌟 는 모두 +5)", slots, function (mark) {
    let r = { int: 5, str: 5, sense: 5 };
    if (mark == "🧠") r = { int: 10 };
    if (mark == "💪") r = { str: 10 };
    if (mark == "✨") r = { sense: 10 };
    showPopup(img, "⭐ 럭키!", resultHtml(applyResult(p, r)));
  });
}

// 상점 칸 (3개 중 하나 사기)
function shopTile(p, img) {
  const offers = pickSome(shopItems, 3);
  const kindName = { estate: "🏢 부동산", stock: "📈 투자", collect: "🖼️ 수집품", card: "🎴 카드 1장 랜덤" };
  const cpuItem = cpuShopChoice(p, offers);
  const buttons = [];
  for (const item of offers) {
    const b = { text: item.icon + " " + item.name, desc: kindName[item.kind] + " · " + won(item.price), cpuPick: item == cpuItem };
    if (p.money < item.price) {
      b.desc += " (돈 부족)";
      b.action = function () { showPopup(img, "🏪 돈이 모자라요", won(item.price) + "이 필요해요."); };
    } else {
      b.action = function () { buyItem(p, item, img); };
    }
    buttons.push(b);
  }
  buttons.push({ text: "그냥 나가기", cpuPick: cpuItem == null, action: nextTurn });
  showPopup(img, "🏪 상점", "오늘의 상품! 하나 살 수 있어요.<br><small>부동산 · 투자 · 수집품은 게임이 끝날 때 📈 시세 룰렛으로 값이 정해져요</small>", buttons);
}

function buyItem(p, item, img) {
  p.money -= item.price;
  addLog(p.name + " : 🏪 " + item.name + " 구입 (" + won(item.price) + ")");
  sfx("shop");
  if (item.kind == "card") {
    showPopup(img, "🎴 카드 뽑기!", "어떤 카드가 나왔을까요?" + resultHtml(applyResult(p, { card: true })));
    return;
  }
  p.assets.push({ kind: item.kind, icon: item.icon, name: item.name, base: item.base });
  drawPlayerList();
  showPopup(img, "🏪 " + item.icon + " " + item.name + " 구입!", won(item.price) + "에 샀어요.<br>게임이 끝날 때 📈 시세 룰렛으로 가치가 정해져요!");
}

// 보물 칸
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

// 한방역전섬 복권 (현금 절반 걸기)
function lottery(p, img) {
  const stake = Math.floor(p.money / 2);
  if (stake <= 0) {
    showPopup(img, "🎰 인생 복권", "걸 돈이 없어서 구경만 했어요...");
    return;
  }
  const slots = ["X", "X", "X", "X", "X", "X", "×2", "X", "X", "×5"];
  showPopup(img, "🎰 인생 복권", "현금 절반 <b>" + won(stake) + "</b>을 걸어 볼까요?<br>룰렛 7번 칸 ×2, 10번 칸 ×5 (나머지는 꽝!)", [
    {
      text: "🎰 건다!", cpuPick: rankOf(p) > 1,   // 컴퓨터는 1등이 아니면 도전
      action: function () {
        showRoulette(p, "🎰 인생 복권", "건 돈 " + won(stake), slots, function (mark) {
          let gain = -stake;
          let title = "😭 꽝...";
          if (mark == "×2") gain = stake;
          if (mark == "×5") gain = stake * 4;
          if (gain > 0) title = "🎉 " + mark + " 대박!!";
          addLog(p.name + " : 🎰 복권 " + moneyText(gain));
          showPopup(img, title, resultHtml(applyResult(p, { money: gain })));
        });
      }
    },
    { text: "안 건다", cpuPick: rankOf(p) == 1, action: nextTurn }
  ]);
}

// when 조건 확인 (events.js 위쪽 설명 참고)
function matches(p, when) {
  switch (when) {
    case undefined: return true;
    case "single": return p.spouse == null && p.date == null;
    case "dating": return p.date != null;
    case "married": return p.spouse != null;
    case "kids": return p.kids.length > 0;
    case "house": return p.house != null;
    case "nohouse": return p.house == null;
    case "job": return p.job != null && !p.retired;
    case "nojob": return p.job == null;
    case "rich": return p.money >= 1000;
    case "poor": return p.debt > 0;
    case "college": return p.college;
    case "int": case "str": case "sense": return p.talent == when;
  }
  return p.flags[when] == true;   // 나머지는 flags에 기록된 일
}

// 이벤트 뽑기. 상황에 맞는 이벤트는 3번 넣어서 더 잘 나오게 함
function pickEvent(p, list) {
  const candidates = [];
  for (const ev of list) {
    if (!matches(p, ev.when)) continue;
    let times = 1;
    if (ev.when != undefined) times = 3;
    if (ev.service && providerOf(ev.service.job, p) != null) times = 3;
    if (ev.collect && providerOf(ev.collect.job, p) != null) times = 3;
    for (let i = 0; i < times; i++) {
      candidates.push(ev);
    }
  }
  return pick(candidates);
}

function situationTag(ev) {
  if (ev.service || ev.collect) return '<div class="situ link">🤝 플레이어 연결 이벤트 (강제!)</div>';
  if (ev.when != undefined) return '<div class="situ">📌 지금 내 상황 때문에 생긴 일</div>';
  return "";
}

// 선택 이벤트
function eventTile(p, ev, img) {
  const cpuIndex = cpuEventChoice(p, ev.choices);
  const buttons = [];
  for (let i = 0; i < ev.choices.length; i++) {
    const choice = ev.choices[i];
    let desc = "";
    if (choice.chance < 1) desc = "🎡 " + countText(chanceSlots(Math.min(choice.chance, 0.95), true));
    buttons.push({ text: choice.label, desc: desc, cpuPick: i == cpuIndex, action: function () { resolveChoice(p, choice, img); } });
  }
  showPopup(img, "❓ 선택 이벤트", situationTag(ev) + ev.text, buttons);
}

function resolveChoice(p, choice, img) {
  if (choice.chance >= 1) {
    finishChoice(p, choice.win, "결과", img);
    return;
  }
  chanceRoulette(p, "🎡 " + choice.label, "운명의 룰렛!", Math.min(choice.chance, 0.95), true, function (mark) {
    if (mark == "◎") finishChoice(p, doubleResult(choice.win), "🌟 대성공!", img);
    else if (mark == "O") finishChoice(p, choice.win, "🎉 성공!", img);
    else finishChoice(p, choice.lose, "😢 실패...", img);
  });
}

function finishChoice(p, result, title, img) {
  const summary = applyResult(p, result);
  addLog(p.name + " : " + result.text);
  showPopup(img, title, result.text + resultHtml(summary));
}


// ----- 연애 칸 -----
function loveTile(p, img) {
  if (p.spouse != null) marriedDate(p, img);
  else if (p.date != null) datingDate(p, img);
  else meetPartners(p, img);
}

// 상대 등급 (직업 랭크, 재산 높으면 좋은 상대)
function partnerTier(p) {
  let tier = 0;
  if (p.job != null && p.grade >= 2) tier = 1;
  if (p.job != null && p.grade >= 4) tier = 2;
  if (totalOf(p) >= 1000 && tier < 2) tier++;
  return tier;
}

// 이성 3명 중 고르기
function meetPartners(p, img) {
  const buttons = [];
  let best = null;
  for (const partner of partners[partnerTier(p)]) {
    if (partner.gender == p.gender) continue;
    if (best == null || partner.salary > best.salary) best = partner;
    buttons.push({
      text: "💕 " + partner.name, desc: "결혼하면 월급날마다 " + won(partner.salary), partner: partner,
      action: function () {
        p.date = { name: partner.name, gender: partner.gender, salary: partner.salary, love: Math.min(100, 10 + Math.floor(p.sense / 5)) };
        addLog(p.name + " : 💕 " + partner.name + "와(과) 연애 시작");
        drawPlayerList();
        nextTurn();
      }
    });
  }
  for (const b of buttons) {
    b.cpuPick = b.partner == best;
  }
  buttons.push({ text: "관심 없어요", action: nextTurn });
  showPopup(img, "💘 운명의 만남?", "누구와 연애를 시작할까요?<br>(내 직업 랭크와 재산이 높을수록 좋은 상대가 나와요)", buttons);
}

// 데이트 (센스 높으면 O칸 많음)
function datingDate(p, img) {
  const chance = Math.min(0.5 + p.sense * 0.004, 0.95);
  chanceRoulette(p, "💕 " + p.date.name + "와(과) 데이트", pick(dates) + "<br>◎ 호감도 +40% · O +25% · X +10%", chance, true, function (mark) {
    let gain = 10;
    if (mark == "O") gain = 25;
    if (mark == "◎") gain = 40;
    p.date.love = Math.min(100, p.date.love + gain);
    drawPlayerList();

    // 컴퓨터는 확률 높으면 고백, 성인 후반부터는 기준 낮춤
    let need = 0.6;
    if (areas[p.area].stage >= 8) need = 0.45;
    const cpuConfess = confessChance(p) >= need;
    showPopup(img, "💕 데이트 " + slotText(mark), "호감도 +" + gain + "% (현재 <b>" + p.date.love + "%</b>)", [
      { text: "💌 고백하기", desc: "🎡 " + countText(chanceSlots(confessChance(p), true)), cpuPick: cpuConfess, action: function () { confess(p, img); } },
      { text: "다음에", cpuPick: !cpuConfess, action: nextTurn }
    ]);
  });
}

// 고백 성공 확률 = 호감도
function confessChance(p) {
  return Math.min(p.date.love / 100, 0.95);
}

// 고백 룰렛
function confess(p, img) {
  chanceRoulette(p, "💌 " + p.date.name + "에게 고백!", "호감도 " + p.date.love + "% 만큼 O 칸이 있어요!", confessChance(p), true, function (mark) {
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
    p.spouse = p.date;
    p.spouse.love = 0;
    p.date = null;
    addLog(p.name + " : 💍 " + p.spouse.name + "와(과) 결혼!");
    sfx("wedding");
    drawPlayerList();

    let times = 1;
    let text = p.spouse.name + "와(과) 결혼해요!<br>축의금 룰렛을 돌려서 모두에게 축의금을 받아요!";
    if (mark == "◎") {
      times = 2;
      text += "<br>🌟 <b>대성공 프러포즈! 축의금 2배!</b>";
    }
    showPopup(img, "💍 고백 성공! 결혼!", text, [{ text: "🎁 축의금 룰렛!", action: function () { giftRoulette(p, "💍 결혼 축하", times); } }]);
  });
}

// 결혼 후 데이트 (일반 70%, 특별 100%)
function marriedDate(p, img) {
  if (p.kids.length >= maxKids) {
    showPopup(img, "👨‍👩‍👧 가족 나들이", pick(dates) + "<br>아이들과 즐거운 시간을 보냈어요!" + resultHtml(applyResult(p, { sense: 5 })));
    return;
  }
  const rich = p.money >= specialDateCost * 5;   // 컴퓨터는 돈이 넉넉하면 특별한 데이트
  showPopup(img, "💑 " + p.spouse.name + "와(과) 데이트", "어떤 데이트를 할까요?<br>호감도만큼 <b>👶 아기 룰렛</b>의 O 칸이 생겨요!", [
    { text: "🚶 데이트", desc: "호감도 70%", cpuPick: !rich, action: function () { babyRoulette(p, img, 70, 0); } },
    { text: "💎 특별한 데이트", desc: won(specialDateCost) + " · 호감도 100%", cpuPick: rich, action: function () { babyRoulette(p, img, 100, specialDateCost); } }
  ]);
}

// 아기 룰렛
function babyRoulette(p, img, love, cost) {
  p.spouse.love = love;
  if (cost > 0) applyResult(p, { money: -cost });
  drawPlayerList();
  chanceRoulette(p, "👶 아기 룰렛", pick(dates) + "<br>호감도 <b>" + love + "%</b>", love / 100, false, function (mark) {
    if (mark == "O") genderRoulette(p, img);
    else showPopup(img, "👶 아직은...", "이번에는 아기 소식이 없어요.<br>다음 연애 칸에서 다시 도전!");
  });
}

// 성별 룰렛
function genderRoulette(p, img) {
  const slots = ["👦", "👧", "👦", "👧", "👦", "👧", "👦", "👧", "👦", "👧"];
  showRoulette(p, "👶 새로운 가족!", "아들일까, 딸일까?", slots, function (mark) {
    let gender = "F";
    let who = "딸";
    if (mark == "👦") {
      gender = "M";
      who = "아들";
    }
    const name = pick(kidNames[gender]);
    p.kids.push({ name: name, gender: gender, age: 0, job: null });
    p.spouse.love = 0;
    addLog(p.name + " : 👶 " + name + " 탄생!");
    sfx("baby");
    drawPlayerList();
    showPopup(img, "👶 " + who + " " + name + " 탄생!",
      p.spouse.name + "와(과)의 사이에 새로운 가족이 늘었어요!<br>(월급날 4번이 지나면 어른이 되어 직업을 갖고 돈을 벌어 와요)",
      [{ text: "🎁 축의금 룰렛!", action: function () { giftRoulette(p, "👶 출산 축하", 1); } }]);
  });
}

// 축의금 룰렛 (다른 사람 1명마다 받음)
function giftRoulette(p, reason, times) {
  if (players.length == 1) {
    showPopup(images.tiles.love, reason, "축의금을 줄 사람이 없어요... 😢");
    return;
  }
  showRoulette(p, "🎁 " + reason, "나온 금액만큼 다른 사람 한 명마다 받아요!", moneyLabels(giftAmounts), function (label, k) {
    const amount = giftAmounts[k] * times;
    const summary = applyResult(p, { all: amount });
    addLog(p.name + " : 🎁 축의금 " + won(amount) + "씩 받음");
    showPopup(images.tiles.love, "🎁 " + reason + "!", "모두에게 <b>" + won(amount) + "</b>씩 받았어요!" + resultHtml(summary));
  });
}


// ----- 직업 칸 -----
function workTile(p, img) {
  if (p.job == null) {
    showPopup(img, "★ 자기계발", "아직 직업이 없어서 자기계발을 했어요." + resultHtml(applyResult(p, { int: 5, str: 5, sense: 5 })));
    return;
  }
  if (p.retired) {
    showPopup(img, "★ 은퇴 생활", "일은 쉬고 취미 생활을 즐겨요." + resultHtml(applyResult(p, { sense: 5 })));
    return;
  }
  const ev = pick(workEvents);
  let text = ev.text + resultHtml(applyResult(p, ev)) + "<br>";
  const grades = jobs[p.job].grades;
  if (p.grade + 1 >= grades.length) {
    text += "이미 최고 랭크예요! 👑";
  } else {
    const next = grades[p.grade + 1];
    text += "다음 랭크 ▶ " + next.title + " (" + needText(next.need) + ")<br><small>진급 심사는 💵 월급날에!</small>";
  }
  showPopup(img, "★ 직업 이벤트", text);
}

function meetsNeed(p, need) {
  for (const key in need) {
    if (p[key] < need[key]) return false;
  }
  return true;
}

// 조건 글자 (예: 지력 12 이상)
function needText(need) {
  const parts = [];
  for (const key in need) {
    parts.push(statNames[key] + " " + need[key]);
  }
  if (parts.length == 0) return "조건 없음";
  return parts.join(", ") + " 이상";
}


// ----- 인생 이벤트 칸 -----
function lifeTile(p, key, img) {
  const ev = lifeEvents[key];

  if (key == "talent") {
    talentRoulette(p, img, nextTurn);
  }
  else if (key == "exam") {
    // 수능 (지력 높으면 O칸 많음)
    const chance = Math.min(0.2 + p.int * 0.008, 0.95);
    chanceRoulette(p, ev.title, "🧠지력이 높을수록 O 칸이 많아요!", chance, true, function (mark) {
      if (mark == "◎") showPopup(img, "✏️ 수능 만점!!", "전국 뉴스에 나왔어요!" + resultHtml(applyResult(p, { int: 20, sense: 10 })));
      else if (mark == "O") showPopup(img, "✏️ 수능 대박!", "노력한 만큼 결과가 나왔어요!" + resultHtml(applyResult(p, { int: 10, sense: 5 })));
      else showPopup(img, "✏️ 수능... 아쉬워요", "실수를 좀 했어요." + resultHtml(applyResult(p, { sense: -5 })));
    });
  }
  else if (key == "job") {
    chooseJob(p, img);
  }
  else if (key == "marry") {
    marryTile(p, img);
  }
  else if (key == "house") {
    const cpuHouse = cpuHouseChoice(p);
    const buttons = [];
    for (const house of houses) {
      buttons.push({
        text: house.name, desc: won(house.price) + " → 나중에 " + won(house.sell), cpuPick: house == cpuHouse,
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
  else {
    // 나머지는 능력치나 돈만 바뀜
    if (key == "college") p.college = true;
    if (key == "retire") {
      p.retired = true;
      addLog(p.name + " : 🎉 정년 퇴직");
    }
    showPopup(img, ev.title, ev.text + resultHtml(applyResult(p, ev)));
  }
}

// 결혼 칸
function marryTile(p, img) {
  if (p.spouse != null) {
    showPopup(img, "💍 결혼기념일", p.spouse.name + "와(과) 행복하게 살고 있어요." + resultHtml(applyResult(p, { sense: 5 })));
  } else if (p.date != null) {
    showPopup(img, lifeEvents.marry.title, p.date.name + "에게 프러포즈! (호감도 " + p.date.love + "% = 성공 확률)",
      [{ text: "💍 프러포즈 룰렛!", action: function () { confess(p, img); } }]);
  } else {
    meetPartners(p, img);
  }
}

// 재능 주기 (+5, 앞으로 1.5배)
function giveTalent(p, talent, img, after) {
  p.talent = talent.key;
  const bonus = {};
  bonus[talent.key] = 5;
  const summary = applyResult(p, bonus);
  addLog(p.name + " : 🌟 재능 " + talent.name);
  showPopup(img, lifeEvents.talent.title, talent.text + "<br><b>" + talent.name + "</b> 재능을 타고났어요!<br>(이 능력치는 항상 1.5배로 올라요)" + resultHtml(summary),
    [{ text: "확인", action: after }]);
}

// 재능 룰렛 (별 칸 나오면 직접 고르기)
function talentRoulette(p, img, after) {
  const slots = ["⭐", "🧠", "🧠", "🧠", "💪", "💪", "💪", "✨", "✨", "✨"];
  showRoulette(p, lifeEvents.talent.title, "어떤 재능을 타고났을까요?<br>⭐ 칸이 나오면 원하는 재능을 골라요!", slots, function (mark) {
    // 컴퓨터는 제일 높은 능력치로
    let cpuKey = "int";
    if (p.str > p[cpuKey]) cpuKey = "str";
    if (p.sense > p[cpuKey]) cpuKey = "sense";

    const buttons = [];
    for (const talent of talents) {
      if (talent.icon == mark) {
        giveTalent(p, talent, img, after);
        return;
      }
      buttons.push({ text: talent.name, cpuPick: talent.key == cpuKey, action: function () { giveTalent(p, talent, img, after); } });
    }
    showPopup(img, "⭐ 행운의 칸!", "원하는 재능을 골라요!", buttons);
  });
}

// 직업 고르기 (조건 되는 직업만)
function chooseJob(p, img) {
  const buttons = [];
  let locked = "";
  let best = null;
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const first = job.grades[0];
    if (job.college && !p.college) {
      locked += "🔒 " + job.name + " (대졸)<br>";
      continue;
    }
    if (!meetsNeed(p, first.need)) {
      locked += "🔒 " + job.name + " (" + needText(first.need) + ")<br>";
      continue;
    }
    const b = {
      text: job.name, score: cpuJobScore(p, job),
      desc: first.title + " · 월급 " + won(first.salary) + " → 최고 " + won(job.grades[job.grades.length - 1].salary),
      action: function () {
        p.job = i;
        p.grade = 0;
        addLog(p.name + " : 💼 " + job.name + " 취업!");
        drawPlayerList();
        nextTurn();
      }
    };
    if (best == null || b.score > best.score) best = b;
    buttons.push(b);
  }
  best.cpuPick = true;

  let text = lifeEvents.job.text;
  if (locked != "") text += '<div class="result">' + locked + '</div>';
  showPopup(img, lifeEvents.job.title, text, buttons);
}

// 골인
function goalTile(p, img) {
  const bonus = goalBonus[finishCount];
  finishCount++;
  p.finished = true;
  const summary = applyResult(p, { money: bonus });
  addLog(p.name + " : 🏁 " + finishCount + "등으로 골인!");
  sfx("goal");
  let text = "인생 완주를 축하해요!";
  if (gameMode.key == "junior") text = "고등학교 졸업을 축하해요!";
  showPopup(img, "🏁 " + finishCount + "등으로 골인!", text + "<br>모두 끝날 때까지 보너스 룰렛으로 돈을 벌 수 있어요." + resultHtml(summary));
}


// ----- 팝업 -----
// buttons 안 넣으면 확인 버튼 하나 (누르면 다음 차례)
// 컴퓨터 차례면 고른 버튼 표시하고 자동으로 누름
function showPopup(img, title, text, buttons) {
  if (buttons == undefined) buttons = [{ text: "확인", action: nextTurn }];
  const cpuNow = players.length > 0 && players[turn].cpu;
  const locked = cpuNow && buttons.length > 1;

  let choice = buttons[0];
  for (const b of buttons) {
    if (b.cpuPick) choice = b;
  }

  const box = document.getElementById("popupButtons");
  box.innerHTML = "";
  for (const b of buttons) {
    const btn = document.createElement("button");
    btn.className = "big-btn";
    btn.innerHTML = b.text;
    if (b.desc) btn.innerHTML += "<small>" + b.desc + "</small>";
    btn.onclick = function () {
      popup.classList.add("hidden");
      b.action();
    };
    if (locked) {
      btn.disabled = true;
      btn.classList.add("cpu-lock");
    }
    if (b == choice) choice.el = btn;
    box.appendChild(btn);
  }

  if (locked) text += '<div class="cpu-think">🤖 ' + players[turn].name + '(이)가 고민 중...</div>';
  document.getElementById("popupImg").src = img;
  document.getElementById("popupTitle").innerHTML = title;
  document.getElementById("popupText").innerHTML = guardNews + text;
  guardNews = "";
  popup.classList.remove("hidden");
  sfx("pop");

  // 그 사이에 다른 팝업이 열렸으면 무시하려고 번호 저장
  popupCount++;
  const myCount = popupCount;
  if (!cpuNow) return;
  let wait = 1800;
  if (locked) {
    wait = 2400;
    setTimeout(function () {
      if (myCount == popupCount) choice.el.classList.add("cpu-choice");
    }, 1300);
  }
  setTimeout(function () {
    if (myCount == popupCount && !popup.classList.contains("hidden")) {
      popup.classList.add("hidden");
      choice.action();
    }
  }, wait);
}


// ----- 컴퓨터 -----
// 칸 점수 (멈추면 좋은 칸일수록 높음)
function tileScore(p, t) {
  const scores = { good: 3, bad: -3, work: 2, event: 1, lucky: 3, treasure: 3, love: 2 };
  if (t.type == "card" && p.cards.length < 3) return 2;
  if (t.type == "shop" && p.money >= 200) return 2;
  if (t.type == "love" && p.kids.length >= maxKids) return 1;
  if (scores[t.type] == undefined) return 0;
  return scores[t.type];
}

// num칸 가면 어디에 멈추는지
function landingTile(p, num) {
  let id = p.pos;
  for (let i = 0; i < num; i++) {
    const t = tiles[id];
    if (t.next.length == 0) break;
    if (t.next.length > 1) id = t.next[cpuForkChoice(p, t.fork)];
    else id = t.next[0];
    if (tiles[id].type == "life" || tiles[id].type == "goal") break;
  }
  return tiles[id];
}

// min~max 평균 점수
function rangeScore(p, min, max) {
  let total = 0;
  for (let n = min; n <= max; n++) {
    total += tileScore(p, landingTile(p, n));
  }
  return total / (max - min + 1);
}

// 컴퓨터 차례 : 저격 > 좋은 카드 > 룰렛
function cpuTurn() {
  const p = players[turn];
  if (p.finished) {
    bonusRoulette(p);
    return;
  }
  let best = -1;
  let bestScore = rangeScore(p, 1, 10) + 0.8;   // 카드는 아껴 쓰기
  for (let i = 0; i < p.cards.length; i++) {
    const c = p.cards[i];
    if (c.key == "snipe" && luckyAhead(p).length > 0) {
      playCard(i);
      return;
    }
    if (c.min != undefined && rangeScore(p, c.min, c.max) > bestScore) {
      bestScore = rangeScore(p, c.min, c.max);
      best = i;
    }
  }
  if (best >= 0) playCard(best);
  else rollWheel(randomInt(1, 10));
}

// 등수
function rankOf(p) {
  let rank = 1;
  for (const other of players) {
    if (totalOf(other) > totalOf(p)) rank++;
  }
  return rank;
}

// 갈림길 선택
function cpuForkChoice(p, key) {
  if (key == "f0" && (p.talent == "str" || p.str > p.int)) return 1;        // 운동장
  if (key == "f1" && !(p.talent == "int" || p.int >= 35)) return 1;         // 공부 못하면 바로 취업
  if (key == "f2" && p.spouse != null && p.kids.length >= 2) return 1;      // 가족이 있으면 출세 길
  if (key == "f3" && rankOf(p) > 1) return 1;                               // 뒤처지면 한방역전섬
  return 0;
}

// 결과 점수 (어른은 10만원 = 능력치 1 정도)
function resultValue(p, r) {
  if (r == undefined) return 0;
  let unit = 2;
  if (isAdult(p)) unit = 10;
  let value = 0;
  if (r.money) value += r.money / unit;
  if (r.all) value += r.all * (players.length - 1) / unit;
  if (r.card) value += 1;
  for (const key in statNames) {
    if (r[key] > 0 && p.talent == key) value += r[key] * talentBonus;
    else if (r[key]) value += r[key];
  }
  return value;
}

// 선택 이벤트에서 평균 점수 제일 높은 거
function cpuEventChoice(p, choices) {
  let best = 0;
  let bestValue = -99999;
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    let value = resultValue(p, c.win);
    if (c.chance < 1) {
      value = 0;
      for (const mark of chanceSlots(Math.min(c.chance, 0.95), true)) {
        if (mark == "◎") value += resultValue(p, doubleResult(c.win)) / 10;
        else if (mark == "O") value += resultValue(p, c.win) / 10;
        else value += resultValue(p, c.lose) / 10;
      }
    }
    if (value > bestValue) {
      bestValue = value;
      best = i;
    }
  }
  return best;
}

// 사고도 100만원 남는 집 중 제일 비싼 집
function cpuHouseChoice(p) {
  let best = null;
  for (const house of houses) {
    if (house.price + 100 <= p.money) best = house;
  }
  return best;
}

// 상점 (부동산, 수집품, 투자, 카드 순)
function cpuShopChoice(p, offers) {
  for (const kind of ["estate", "collect", "stock", "card"]) {
    for (const item of offers) {
      if (item.kind == kind && p.money >= item.price + 100 && !(kind == "card" && p.cards.length >= 3)) return item;
    }
  }
  return null;
}

// 직업 점수
function cpuJobScore(p, job) {
  let score = job.grades[0].salary + job.grades[job.grades.length - 1].salary * 0.3 + p[job.main] * 0.2;
  if (p.talent == job.main) score += 10;
  return score;
}


// ----- 다음 차례 -----
function nextTurn() {
  // 인생 이벤트 칸에서 남은 칸이 있으면 이어서 이동
  const now = players[turn];
  if (now.stepsLeft > 0) {
    const left = now.stepsLeft;
    now.stepsLeft = 0;
    rollText.textContent = "▶ 남은 " + left + "칸 이동!";
    addLog(now.name + " : ▶ 남은 " + left + "칸 이어서 이동");
    setTimeout(function () { movePlayer(now, left); }, 400);
    return;
  }
  if (finishCount == players.length) {
    endGame();
    return;
  }
  // 골인한 사람도 차례는 옴 (보너스 룰렛)
  turn = (turn + 1) % players.length;
  if (turn == 0) {
    round++;
    miniPending = true;   // 한 바퀴마다 미니게임
  }
  continueGame();
}

// 중간 집계, 미니게임 있으면 먼저
function continueGame() {
  if (checkpointPending && turn == 0) {
    checkpointPending = false;
    showCheckpoint();
  } else if (miniPending) {
    miniPending = false;
    startMinigame();
  } else {
    startTurn();
  }
}


// ----- 미니게임 -----
// stat : 아이 때 받는 능력치, cpu : 컴퓨터가 게임하는 함수 (점수를 돌려줌)
const minigames = [
  { name: "🎯 타이밍 대결", desc: "왔다 갔다 하는 막대를 초록색 가운데에서 멈추세요!", play: playTiming, stat: "sense", cpu: cpuTiming },
  { name: "🍀 행운의 상자", desc: "상자 5개 중 하나를 고르세요! (0 ~ 100점)", play: playBox, stat: "sense", cpu: cpuBox },
  { name: "🎡 룰렛 대결", desc: "숫자 룰렛을 돌려서 가장 큰 숫자가 나온 사람이 1등!", play: playSpin, stat: "int", cpu: cpuSpin },
  { name: "⏱️ 5초 맞추기", desc: "시작을 누르고 마음속으로 5초를 센 뒤 멈추세요! (가까울수록 높은 점수)", play: playStopwatch, stat: "sense", cpu: cpuStopwatch },
  { name: "🧮 암산 대결", desc: "덧셈 5문제! 맞힌 개수만큼 점수를 받아요.", play: playMath, stat: "int", cpu: cpuMath },
  { name: "🃏 업다운", desc: "다음 숫자가 더 클까요, 작을까요? 5번 맞혀 보세요!", play: playUpDown, stat: "sense", cpu: cpuUpDown },
  { name: "🍎 순서 기억", desc: "과일 4개가 딱 1초 나와요! 순서를 기억했다가 똑같이 누르세요!", play: playMemory, stat: "int", cpu: cpuMemory },
  { name: "✊ 가위바위보", desc: "컴퓨터와 가위바위보 3판! 이기면 30점, 비기면 10점", play: playRps, stat: "str", cpu: cpuRps },
  { name: "🔢 숫자 빨리 누르기", desc: "1부터 9까지 순서대로 최대한 빨리 누르세요!", play: playNumbers, stat: "str", cpu: cpuNumbers }
];

function showMini(title, html) {
  document.getElementById("miniTitle").innerHTML = title;
  document.getElementById("miniBody").innerHTML = html;
  miniBox.classList.remove("hidden");
  sfx("pop");
}

function startMinigame() {
  busy = true;
  updateScreen();
  mini = { game: pick(minigames), index: 0, scores: [], prize: null };
  playBgm("mini");
  sfx("start");
  showMini("🎮 미니게임 : " + mini.game.name, mini.game.desc + "<br><br>먼저 <b>🎁 상품 룰렛</b>으로 1등 상품을 정해요!" +
    '<br><br><button class="big-btn" onclick="spinPrize()">🎁 상품 룰렛 돌리기</button>');
}

// 1등 상품 글자
function rewardText() {
  if (mini.statPrize) return statNames[mini.game.stat] + " +" + mini.prize.stat;
  return "💰 " + won(mini.prize.money);
}

function spinPrize() {
  let kids = 0;
  for (const p of players) {
    if (!isAdult(p)) kids++;
  }
  mini.statPrize = kids * 2 >= players.length;

  const labels = [];
  for (const prize of miniPrizes) {
    if (mini.statPrize) labels.push("+" + prize.stat);
    else labels.push(prize.money + "만");
  }
  let title = "🎁 상금 룰렛";
  let text = "이번 미니게임의 1등 상금은?";
  if (mini.statPrize) {
    title = "🎁 능력치 룰렛";
    text = "이번 미니게임 1등은 <b>" + statNames[mini.game.stat] + "</b>이(가) 얼마나 오를까요?";
  }
  showRoulette(null, title, text, labels, function (label, k) {
    mini.prize = miniPrizes[k];
    showMini("🎮 미니게임 : " + mini.game.name, mini.game.desc +
      '<div class="prize-box">🥇 1등 상품 <b>' + rewardText() + '</b><br><small>🥈 2등 절반 · 🥉 3등 30%</small></div>' +
      '<button class="big-btn" onclick="miniNextPlayer()">시작!</button>');
  });
}

function miniNextPlayer() {
  if (mini.index >= players.length) {
    miniFinish();
    return;
  }
  const p = players[mini.index];
  if (p.cpu) {
    miniDone(p, mini.game.cpu());
    return;
  }
  showMini(mini.game.name, '<img src="' + p.img + '" width="80"><br><b style="color:' + p.color + '">' + p.name + '</b>의 차례!' +
    '<br>🎁 1등 상품 : ' + rewardText() + '<br><br><button class="big-btn" onclick="miniPlay()">준비 완료!</button>');
}

function miniPlay() {
  mini.game.play();
}

// 점수 보여주기
function miniDone(p, score) {
  mini.scores[p.id] = score;
  let who = p.name;
  if (p.cpu) who = "🤖 " + p.name;
  showMini(mini.game.name, who + "의 점수<br><div class='big-num'>" + score + "점</div>" +
    '<button class="big-btn" onclick="miniNext()">다음</button>');
}

function miniNext() {
  mini.index++;
  miniNextPlayer();
}

// 순위, 상품 (같은 점수면 같은 등수)
function miniFinish() {
  const ranked = players.slice();
  ranked.sort(function (a, b) { return mini.scores[b.id] - mini.scores[a.id]; });

  const medals = ["🥇", "🥈", "🥉", "4등"];
  let html = "";
  for (const p of ranked) {
    let rank = 0;   // 나보다 점수가 높은 사람 수
    for (const other of players) {
      if (mini.scores[other.id] > mini.scores[p.id]) rank++;
    }
    if (rank == 0) p.miniWins++;

    const r = {};
    if (mini.statPrize) r[mini.game.stat] = Math.round(mini.prize.stat * miniShare[rank]);
    else r.money = Math.round(mini.prize.money * miniShare[rank]);
    let summary = applyResult(p, r);
    if (summary == "") summary = "보상 없음";
    html += '<div class="mini-rank"><span>' + medals[rank] + ' <img src="' + p.img + '"> ' + p.name + '</span><span>' + mini.scores[p.id] + '점 · ' + summary + '</span></div>';
  }
  addLog("🎮 미니게임 1등 : " + ranked[0].name);
  sfx("fanfare");
  showMini("🏆 미니게임 결과", html + '<br><button class="big-btn" onclick="closeMini()">계속하기</button>');
}

function closeMini() {
  miniBox.classList.add("hidden");
  miniBox.classList.remove("wide");
  mini = null;
  playBgm("menu");
  continueGame();
}

// 지금 미니게임 하는 사람
function miniPlayer() {
  return players[mini.index];
}

// 1. 타이밍 (가운데 가까울수록 점수 높음)
function playTiming() {
  mini.pos = 0;
  mini.speed = 2;
  showMini("🎯 타이밍 대결", '<div class="timing-track"><div class="timing-target"></div><div class="timing-bar" id="timingBar"></div></div>' +
    '<button class="big-btn" onclick="timingStop()">멈춰!</button>');
  mini.timer = setInterval(timingMove, 16);
}

function timingMove() {
  mini.pos += mini.speed;
  if (mini.pos >= 100 || mini.pos <= 0) mini.speed = -mini.speed;
  document.getElementById("timingBar").style.left = mini.pos + "%";
}

function timingStop() {
  clearInterval(mini.timer);
  miniDone(miniPlayer(), timingScore(mini.pos));
}

// 2. 행운의 상자
function playBox() {
  let html = "";
  for (const score of pickSome([0, 25, 50, 75, 100], 5)) {
    html += '<button class="box-btn" onclick="miniDone(miniPlayer(), ' + score + ')">🎁</button>';
  }
  showMini("🍀 행운의 상자", "하나를 골라 보세요!<br>" + html);
}

// 3. 룰렛 대결
function playSpin() {
  showMini("🎡 룰렛 대결", '<div class="wheel-wrap"><div class="wheel-pointer"></div><img id="duelWheel" src="' + images.roulette + '"></div>' +
    '<button class="big-btn" id="duelBtn" onclick="duelSpin()">돌려라!</button>');
}

function duelSpin() {
  document.getElementById("duelBtn").disabled = true;
  const num = randomInt(1, 10);
  document.getElementById("duelWheel").style.transform = "rotate(" + (1800 - (num - 1) * 36) + "deg)";
  sfx("spin");
  setTimeout(function () { miniDone(miniPlayer(), num); }, 2300);
}

// 4. 5초 맞추기 (1초 지나면 시간 숨김)
function playStopwatch() {
  mini.start = 0;
  showMini("⏱️ 5초 맞추기", '<div class="big-num" id="watch">0.0</div><button class="big-btn" id="watchBtn" onclick="stopwatchClick()">시작!</button>');
}

function stopwatchClick() {
  const btn = document.getElementById("watchBtn");
  if (mini.start == 0) {
    mini.start = Date.now();
    btn.textContent = "멈춰!";
    mini.timer = setInterval(stopwatchShow, 50);
    return;
  }
  clearInterval(mini.timer);
  btn.disabled = true;
  const sec = (Date.now() - mini.start) / 1000;
  document.getElementById("watch").textContent = sec.toFixed(2) + "초";
  setTimeout(function () { miniDone(miniPlayer(), stopwatchScore(sec)); }, 1200);
}

function stopwatchShow() {
  const sec = (Date.now() - mini.start) / 1000;
  if (sec < 1) document.getElementById("watch").textContent = sec.toFixed(1);
  else document.getElementById("watch").textContent = "?";
}

// 5. 암산 (5문제, 1문제 20점)
function playMath() {
  mini.count = 0;
  mini.correct = 0;
  mathQuestion();
}

function mathQuestion() {
  if (mini.count == 5) {
    miniDone(miniPlayer(), mini.correct * 20);
    return;
  }
  mini.count++;
  const a = randomInt(10, 49);
  const b = randomInt(10, 49);
  mini.answer = a + b;
  let html = "<b>" + mini.count + "번.</b> " + a + " + " + b + " = ?<br>";
  for (const n of pickSome([a + b, a + b + 10, a + b - 1], 3)) {
    html += '<button class="big-btn choice" onclick="mathAnswer(' + n + ')">' + n + '</button>';
  }
  showMini("🧮 암산 대결 (" + mini.correct + "개 맞힘)", html);
}

function mathAnswer(n) {
  if (n == mini.answer) mini.correct++;
  mathQuestion();
}

// 6. 업다운 (5번, 1번 20점)
function playUpDown() {
  mini.count = 0;
  mini.correct = 0;
  mini.num = randomInt(1, 9);
  upDownQuestion("");
}

function upDownQuestion(text) {
  if (mini.count == 5) {
    miniDone(miniPlayer(), mini.correct * 20);
    return;
  }
  showMini("🃏 업다운 (" + mini.correct + "번 맞힘)", text + '<div class="big-num">' + mini.num + '</div>다음 숫자(1~9)는?<br>' +
    '<button class="big-btn choice" onclick="upDownGuess(true)">⬆️ 더 크다</button>' +
    '<button class="big-btn choice" onclick="upDownGuess(false)">⬇️ 더 작다</button>');
}

function upDownGuess(up) {
  const next = nextNumber(mini.num);
  let text = "❌ 틀렸어요! ";
  if ((next > mini.num) == up) {
    mini.correct++;
    text = "⭕ 맞았어요! ";
  }
  mini.count++;
  mini.num = next;
  upDownQuestion(text + "(나온 숫자 " + next + ")<br>");
}

// 7. 순서 기억 (1개 25점)
const fruits = ["🍎", "🍌", "🍇", "🍓", "🍑", "🍒"];

function playMemory() {
  mini.answer = [];
  mini.mine = [];
  for (let i = 0; i < 4; i++) {
    mini.answer.push(pick(fruits));
  }
  showMini("🍎 순서 기억", '잘 기억하세요!<div class="big-num">' + mini.answer.join(" ") + '</div>');
  setTimeout(memoryInput, 1000);   // 1초만 보여 줌
}

function memoryInput() {
  let html = '순서대로 눌러요!<div class="big-num" id="mine">❔❔❔❔</div>';
  for (let i = 0; i < fruits.length; i++) {
    html += '<button class="box-btn" onclick="memoryPick(' + i + ')">' + fruits[i] + '</button>';
  }
  showMini("🍎 순서 기억", html);
}

function memoryPick(i) {
  mini.mine.push(fruits[i]);
  document.getElementById("mine").textContent = mini.mine.join(" ");
  if (mini.mine.length < 4) return;
  let score = 0;
  for (let k = 0; k < 4; k++) {
    if (mini.mine[k] == mini.answer[k]) score += 25;
  }
  miniDone(miniPlayer(), score);
}

// 8. 가위바위보 3판 (승 30, 무 10)
// 가위, 바위, 보 순서. 다음 손이 앞 손을 이김
const hands = ["✌️", "✊", "🖐️"];

function playRps() {
  mini.count = 0;
  mini.correct = 0;
  rpsQuestion("");
}

function rpsQuestion(text) {
  if (mini.count == 3) {
    miniDone(miniPlayer(), mini.correct);
    return;
  }
  let html = text + "<br>무엇을 낼까요? (" + (mini.count + 1) + "판째)<br>";
  for (let i = 0; i < 3; i++) {
    html += '<button class="box-btn" onclick="rpsPlay(' + i + ')">' + hands[i] + '</button>';
  }
  showMini("✊ 가위바위보 (" + mini.correct + "점)", html);
}

function rpsPlay(me) {
  const com = randomInt(0, 2);
  const score = rpsScore(me, com);
  let result = "😢 졌어요";
  if (score == 10) result = "😐 비겼어요 +10";
  if (score == 30) result = "😆 이겼어요 +30";
  mini.correct += score;
  mini.count++;
  rpsQuestion('<div class="big-num">' + hands[me] + " vs " + hands[com] + "</div>" + result);
}

// 9. 숫자 빨리 누르기 (틀리면 +1초)
// 3초면 100점, 1초마다 -10점
function playNumbers() {
  mini.next = 1;
  mini.penalty = 0;
  mini.start = Date.now();
  let html = '<div id="numInfo">1부터 누르세요!</div><div class="num-grid">';
  for (const n of pickSome([1, 2, 3, 4, 5, 6, 7, 8, 9], 9)) {
    html += '<button class="box-btn" id="num' + n + '" onclick="numberPick(' + n + ')">' + n + '</button>';
  }
  showMini("🔢 숫자 빨리 누르기", html + '</div>');
}

function numberPick(n) {
  if (n != mini.next) {
    mini.penalty++;
    document.getElementById("numInfo").textContent = "앗! " + mini.next + "부터 눌러야 해요 (+1초)";
    return;
  }
  document.getElementById("num" + n).disabled = true;
  mini.next++;
  if (mini.next <= 9) return;
  const sec = (Date.now() - mini.start) / 1000 + mini.penalty;
  miniDone(miniPlayer(), numbersScore(sec));
}


// ----- 미니게임 점수 계산 (사람, 컴퓨터 같이 씀) -----
function timingScore(pos) {
  return Math.max(0, Math.round(100 - Math.abs(pos - 50) * 2));
}

function stopwatchScore(sec) {
  return Math.max(0, Math.round(100 - Math.abs(sec - 5) * 50));
}

function numbersScore(sec) {
  return Math.max(0, Math.min(100, Math.round(100 - (sec - 3) * 10)));
}

// 가위바위보 한 판 점수 (이기면 30, 비기면 10, 지면 0)
function rpsScore(me, com) {
  if (me == com) return 10;
  if (me == (com + 1) % 3) return 30;
  return 0;
}

// 업다운 다음 숫자 (지금 숫자와 같은 건 다시 뽑기)
function nextNumber(now) {
  let next = randomInt(1, 9);
  while (next == now) {
    next = randomInt(1, 9);
  }
  return next;
}

// 컴퓨터도 사람과 같은 규칙으로 게임을 함 (실력만 랜덤)
function cpuTiming() {
  return timingScore(50 + 2 * randomInt(-12, 12));   // 막대는 2씩 움직임
}

function cpuBox() {
  return pick([0, 25, 50, 75, 100]);
}

function cpuSpin() {
  return randomInt(1, 10);
}

function cpuStopwatch() {
  return stopwatchScore(5 + randomInt(-70, 70) / 100);
}

function cpuMath() {
  let score = 0;
  for (let i = 0; i < 5; i++) {
    if (Math.random() < 0.8) score += 20;   // 한 문제 맞힐 확률 80%
  }
  return score;
}

function cpuUpDown() {
  let score = 0;
  let now = randomInt(1, 9);
  for (let i = 0; i < 5; i++) {
    const up = now < 5 || (now == 5 && Math.random() < 0.5);   // 작은 숫자면 "더 크다"
    const next = nextNumber(now);
    if ((next > now) == up) score += 20;
    now = next;
  }
  return score;
}

function cpuMemory() {
  let score = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.6) score += 25;   // 하나 기억할 확률 60%
  }
  return score;
}

function cpuRps() {
  let score = 0;
  for (let i = 0; i < 3; i++) {
    score += rpsScore(randomInt(0, 2), randomInt(0, 2));
  }
  return score;
}

function cpuNumbers() {
  return numbersScore(randomInt(40, 90) / 10 + randomInt(0, 1));   // 4~9초 + 가끔 틀려서 1초
}


// ----- 중간 집계 -----
function showCheckpoint() {
  busy = true;
  updateScreen();

  // ranks[번호] = 등수
  const ranked = players.slice();
  ranked.sort(function (a, b) { return totalOf(b) - totalOf(a); });
  const ranks = [];
  for (let i = 0; i < ranked.length; i++) {
    ranks[ranked[i].id] = i + 1;
  }
  let before = null;
  if (rankHistory.length > 0) before = rankHistory[rankHistory.length - 1].ranks;
  rankHistory.push({ stage: topStage, ranks: ranks });

  let html = '<div class="cp-section"><h3>🏆 순위</h3>';
  for (const p of ranked) {
    let change = '<span class="cp-same">-</span>';
    if (before != null && before[p.id] > ranks[p.id]) change = '<span class="cp-up">▲' + (before[p.id] - ranks[p.id]) + '</span>';
    if (before != null && before[p.id] < ranks[p.id]) change = '<span class="cp-down">▼' + (ranks[p.id] - before[p.id]) + '</span>';
    html += '<div class="mini-rank"><span>' + ranks[p.id] + '등 <img src="' + p.img + '"> ' + p.name + ' ' + change + '</span><span>💰 ' + won(totalOf(p)) + '</span></div>';
  }
  html += '</div><div class="cp-section"><h3>📈 순위 변화</h3>' + rankGraph() + '</div>';
  html += '<div class="cp-section"><h3>🧑 현재 상태</h3><div class="cp-status">';
  for (const p of players) {
    html += statusCard(p);
  }
  html += '</div></div><button class="big-btn" onclick="closeMini()">계속하기</button>';

  miniBox.classList.add("wide");
  showMini("📋 중간 집계 : " + stages[topStage], html);
  addLog("📋 중간 집계 : " + stages[topStage]);
}

// 순위 그래프
function rankGraph() {
  const W = 560;
  const H = 220;
  const n = rankHistory.length;
  const xs = [];   // i번째 집계의 x 위치
  for (let i = 0; i < n; i++) {
    if (n == 1) xs.push(W / 2);
    else xs.push(60 + i * (W - 110) / (n - 1));
  }
  const ys = [0];  // r등의 y 위치
  for (let r = 1; r <= players.length; r++) {
    if (players.length == 1) ys.push(H / 2);
    else ys.push(25 + (r - 1) * (H - 70) / (players.length - 1));
  }

  let svg = '<svg class="rank-graph" viewBox="0 0 ' + W + ' ' + H + '">';
  for (let r = 1; r <= players.length; r++) {
    svg += '<line x1="45" y1="' + ys[r] + '" x2="' + (W - 20) + '" y2="' + ys[r] + '" class="grid"/><text x="8" y="' + (ys[r] + 5) + '" class="axis">' + r + '등</text>';
  }
  for (let i = 0; i < n; i++) {
    svg += '<text x="' + xs[i] + '" y="' + (H - 12) + '" class="axis" text-anchor="middle">' + stages[rankHistory[i].stage].split(" ")[0] + '</text>';
  }
  for (const p of players) {
    let points = "";
    let dots = "";
    for (let i = 0; i < n; i++) {
      const y = ys[rankHistory[i].ranks[p.id]];
      points += xs[i] + "," + y + " ";
      dots += '<circle cx="' + xs[i] + '" cy="' + y + '" r="6" fill="' + p.color + '" stroke="white" stroke-width="2"/>';
    }
    const lastY = ys[rankHistory[n - 1].ranks[p.id]];
    svg += '<polyline points="' + points + '" fill="none" stroke="' + p.color + '" stroke-width="4" stroke-linejoin="round"/>' + dots +
      '<image href="' + p.img + '" x="' + (xs[n - 1] + 8) + '" y="' + (lastY - 16) + '" width="28" height="30"/>';
  }
  return svg + '</svg>';
}

function statusCard(p) {
  let family = "🙋 싱글";
  if (p.spouse != null) family = "💍 " + p.spouse.name;
  else if (p.date != null) family = "💕 " + p.date.name + " (연애 중)";
  if (p.kids.length > 0) family += " · " + kidIcons(p);
  if (p.house != null) family += "<br>🏠 " + p.house.name;
  if (p.treasures.length > 0) family += "<br>💎 보물 " + p.treasures.length + "개 (" + won(treasureValue(p)) + ")";
  if (p.debt > 0) family += "<br>🏦 대출 " + p.debt + "건";

  return '<div class="cp-card" style="border-color:' + p.color + '">' +
    '<div class="cp-name"><img src="' + p.img + '"> ' + p.name + ' ' + genderMark(p.gender) + '</div>' +
    '📍 ' + areas[p.area].name + '<br>💰 ' + won(p.money) + '<br>💼 ' + jobTitle(p) + '<br>' +
    '<span class="cp-stats">' + statsHtml(p) + '</span><br>' + family + '</div>';
}


// ----- 게임 끝 -----
function endGame() {
  busy = true;
  playBgm("result");
  updateScreen();
  marketSettle(0);
}

// 시세 정산 (가진 사람 있는 종류만)
function marketSettle(i) {
  while (i < markets.length && !someoneOwns(markets[i].kind)) {
    i++;
  }
  if (i >= markets.length) {
    showAwards();
    return;
  }
  const m = markets[i];
  showRoulette(null, "📈 시세 정산 : " + m.name, assetList(m.kind, false), m.slots, function (label) {
    marketMult[m.kind] = Number(label.replace("×", ""));
    addLog("📈 " + m.name + " " + label);
    showMini("📈 " + m.name + " " + label, assetList(m.kind, true) + '<br><button class="big-btn" onclick="marketSettle(' + (i + 1) + ')">다음</button>');
  });
}

function someoneOwns(kind) {
  for (const p of players) {
    for (const a of p.assets) {
      if (a.kind == kind) return true;
    }
  }
  return false;
}

// 물건 목록 (showValue면 값 변화도)
function assetList(kind, showValue) {
  let text = "";
  for (const p of players) {
    for (const a of p.assets) {
      if (a.kind != kind) continue;
      text += a.icon + " " + p.name + " : " + a.name;
      if (showValue) text += " " + won(a.base) + " → <b>" + won(assetValue(a)) + "</b>";
      text += "<br>";
    }
  }
  return text;
}

// 시상식 (같으면 모두 받음)
function showAwards() {
  const awards = [
    { name: "💎 보물 수집가", desc: "보물을 가장 많이 모았다", key: "treasure" },
    { name: "🎮 미니게임 킹", desc: "미니게임에서 가장 많이 이겼다", key: "mini" },
    { name: "🤝 인연 부자", desc: "다른 사람과 가장 많이 인연을 맺었다", key: "meet" },
    { name: "👨‍👩‍👧 대가족", desc: "아이를 가장 많이 키웠다", key: "kids" },
    { name: "💼 월급왕", desc: "직업 랭크가 가장 높다", key: "rank" },
    { name: "🤝 인기 전문가", desc: "다른 플레이어에게 서비스를 가장 많이 해 줬다", key: "serve" },
    { name: "🏢 투자의 신", desc: "부동산 · 투자 · 소장품 가치가 가장 크다", key: "asset" }
  ];

  let html = "";
  for (const award of awards) {
    let best = 0;
    for (const p of players) {
      best = Math.max(best, awardValue(p, award.key));
    }
    if (best == 0) continue;   // 아무도 못 했으면 칭호 없음

    let winners = "";
    for (const p of players) {
      if (awardValue(p, award.key) != best) continue;
      applyResult(p, { money: awardPrize });
      winners += '<img src="' + p.img + '"> ' + p.name + " ";
      addLog("🏆 " + award.name + " : " + p.name);
    }
    html += '<div class="mini-rank award"><span><b>' + award.name + '</b><br><small>' + award.desc + '</small></span>' +
      '<span>' + winners + '<br><b class="cp-up">+' + won(awardPrize) + '</b></span></div>';
  }
  if (html == "") html = "<p>이번에는 칭호를 받은 사람이 없어요.</p>";

  miniBox.classList.add("wide");
  sfx("fanfare");
  showMini("🏆 시상식", html + '<br><button class="big-btn" onclick="showResult()">📜 인생 보고서 보기</button>');
}

function awardValue(p, key) {
  if (key == "treasure") return p.treasures.length;
  if (key == "mini") return p.miniWins;
  if (key == "meet") return p.meets;
  if (key == "kids") return p.kids.length;
  if (key == "serve") return p.serves;
  if (key == "asset") return assetsValue(p);
  if (p.job == null) return 0;
  return p.grade + 1;
}

// 인생 보고서
function showResult() {
  miniBox.classList.add("hidden");
  miniBox.classList.remove("wide");
  for (const p of players) {
    p.total = totalOf(p);
  }
  const ranked = players.slice();
  ranked.sort(function (a, b) { return b.total - a.total; });

  const medals = ["🥇", "🥈", "🥉", "4등"];
  let html = "";
  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    let cls = "rank-card";
    if (i == 0) cls += " first";
    let title = "자유로운 영혼";
    if (p.job != null) title = jobs[p.job].title;
    let story = jobTitle(p) + "(으)로 살았어요.<br>🙋 자유로운 싱글 라이프!";
    if (p.spouse != null) story = jobTitle(p) + "(으)로 살았어요.<br>" + p.spouse.name + "님과 결혼해서 <b>" + p.kids.length + "명</b>의 아이를 키웠어요!";
    let houseValue = 0;
    if (p.house != null) houseValue = p.house.sell;

    html += '<div class="' + cls + '"><div class="medal">' + medals[i] + '</div><img src="' + p.img + '">' +
      '<h3 style="color:' + p.color + '">' + p.name + '</h3><div class="life-title">' + title + '</div>' +
      '<div class="detail">' + story + '</div><div class="report">' +
      '<div>인생에서 번 돈 <b>' + won(p.earned.self) + '</b></div>';
    if (p.spouse != null) html += '<div>배우자가 번 돈 <b>' + won(p.earned.spouse) + '</b></div>';
    if (p.kids.length > 0) html += '<div>아이들이 번 돈 <b>' + won(p.earned.kids) + '</b></div>';
    html += '<hr><div>현금 ' + won(p.money) + '</div><div>🏠 집 ' + won(houseValue) + ' · 💎 보물 ' + won(treasureValue(p)) + '</div>';
    if (p.assets.length > 0) html += '<div>📈 부동산·투자·소장품 ' + won(assetsValue(p)) + '</div>';
    if (p.debt > 0) html += '<div class="minus">🏦 대출 상환 -' + won(p.debt * debtPenalty) + '</div>';
    html += '</div><div class="total">총 ' + won(p.total) + '</div></div>';
  }
  document.getElementById("ranking").innerHTML = html;
  showScreen("resultScreen");

  // 로그인했으면 기록 저장 (api.js)
  saveRecord({ total: players[0].total, rank: ranked.indexOf(players[0]) + 1, players: players.length, job: jobTitle(players[0]) });
}


// ----- 키보드 조작 -----
// 스페이스바 : 버튼 누르기 (버튼이 여러 개면 처음엔 첫 버튼을 고르기만 함)
// 화살표 : 고르는 버튼 바꾸기 / 숫자 1~9 : 숫자 빨리 누르기
function isOpen(el) {
  return !el.classList.contains("hidden");
}

// 지금 맨 위에 떠 있는 창의 버튼들 (누를 수 있는 것만)
function keyButtons() {
  let box = null;
  if (isOpen(chanceBox)) box = chanceBox;
  else if (isOpen(popup)) box = document.getElementById("popupButtons");
  else if (isOpen(miniBox)) box = miniBox;
  else if (isOpen(menuPanel)) box = menuPanel;
  else if (isOpen(document.getElementById("gameScreen"))) box = document.getElementById("mapArea");
  else box = document.querySelector(".screen:not(.hidden)");

  const list = [];
  if (box == null) return list;
  let all = Array.from(box.querySelectorAll("button, input"));
  // 창이 없을 때는 오른쪽 아래 소리 버튼도
  if (box == document.getElementById("mapArea") || box.classList.contains("screen")) {
    all = all.concat(Array.from(document.querySelectorAll("#soundBox button")));
  }
  for (const btn of all) {
    // 누를 수 있고 화면에 보이는 버튼만 (숨겨진 창의 버튼 빼기)
    if (!btn.disabled && btn.getClientRects().length > 0) list.push(btn);
  }
  return list;
}

// 위(-1) / 아래(1) 화살표 : 바로 위나 아래 줄에서 가로로 가장 가까운 버튼으로
function moveFocus(buttons, now, dir) {
  // 오른쪽 아래 소리 버튼은 다른 버튼이 없을 때만
  const normal = [];
  for (const btn of buttons) {
    if (btn.parentElement.id != "soundBox") normal.push(btn);
  }
  let best = closestRow(normal, buttons[now], dir);
  if (best == null) best = closestRow(buttons, buttons[now], dir);
  if (best != null) best.focus();
}

function closestRow(buttons, current, dir) {
  const from = current.getBoundingClientRect();
  let best = null;
  let bestRow = 0;
  let bestGap = 0;
  for (const btn of buttons) {
    const box = btn.getBoundingClientRect();
    const row = (box.top - from.top) * dir;   // 그 방향으로 얼마나 떨어진 줄인지
    if (row < 10) continue;                     // 같은 줄이거나 반대 방향
    const gap = Math.abs((box.left + box.width / 2) - (from.left + from.width / 2));
    // 더 가까운 줄이 먼저, 같은 줄이면 가로로 더 가까운 버튼
    if (best == null || row < bestRow - 10 || (Math.abs(row - bestRow) <= 10 && gap < bestGap)) {
      best = btn;
      bestRow = row;
      bestGap = gap;
    }
  }
  return best;
}

document.addEventListener("keydown", function (e) {
  // 이름 칸에서는 위/아래 화살표만 (나머지 키는 글자 쓰기)
  if (e.target.tagName == "INPUT" && e.code != "ArrowUp" && e.code != "ArrowDown") return;
  if (e.code == "Space") e.preventDefault();   // 화면이 내려가거나 버튼이 두 번 눌리지 않게
  if (e.repeat) return;
  const buttons = keyButtons();
  const now = buttons.indexOf(document.activeElement);

  if (mini != null && e.key >= "1" && e.key <= "9" && document.getElementById("num" + e.key) != null) {
    document.getElementById("num" + e.key).click();
  } else if (buttons.length == 0) {
    return;
  } else if (now < 0 && e.code.startsWith("Arrow")) {
    buttons[0].focus();
  } else if (e.code == "ArrowDown") {
    moveFocus(buttons, now, 1);
  } else if (e.code == "ArrowUp") {
    moveFocus(buttons, now, -1);
  } else if (e.code == "ArrowRight") {
    buttons[(now + 1) % buttons.length].focus();
  } else if (e.code == "ArrowLeft") {
    buttons[(now - 1 + buttons.length) % buttons.length].focus();
  } else if (e.code == "Space" || e.code == "Enter") {
    // 고른 버튼이 없으면 : 룰렛이나 큰 버튼이 하나뿐이면 바로 누르고, 아니면 첫 버튼 고르기
    const big = [];
    for (const btn of buttons) {
      if (btn.classList.contains("big-btn")) big.push(btn);
    }
    if (now >= 0) buttons[now].click();
    else if (buttons[0] == spinBtn || buttons.length == 1) buttons[0].click();
    else if (big.length == 1) big[0].click();
    else buttons[0].focus();
  } else {
    return;
  }
  e.preventDefault();
});

setupTitle();
drawSetup();
initLogin();   // api.js
