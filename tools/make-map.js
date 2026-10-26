// 지도 데이터(map.js) + 지도 배경 + 칸 아이콘 생성기
const fs = require("fs");
const path = require("path");
const game = process.argv[2];
const assets = path.join(game, "assets");
for (const d of ["characters", "tiles", "ui"]) fs.mkdirSync(path.join(assets, d), { recursive: true });
const save = (p, s) => fs.writeFileSync(path.join(assets, p), s, "utf8");
const EMOJI = 'font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif"';

// 지도 크기 배율 (구간을 길게 하려고 지도 전체를 키움)
const SCALE = 2.6;
const W = Math.round(2300 * SCALE), H = Math.round(1540 * SCALE);
// 칸 사이 간격 (px). 칸이 많은 구간은 길이 구불구불해져서 이 간격을 맞춰요
const SPACING = 95;

// ---------------- 지도 설계 ----------------
const A = {
  START: { p: [110, 200], type: "start", area: "baby" },
  WALK: { p: [520, 200], type: "life", area: "toddler", life: "talent" },
  KINDER: { p: [980, 200], type: "life", area: "kinder", life: "kinder" },
  ELEM: { p: [1440, 200], type: "life", area: "elem", life: "elem" },
  F0: { p: [1680, 200], type: "fork", area: "elem", fork: "f0" },
  MIDDLE: { p: [2050, 580], type: "life", area: "middle", life: "middle" },
  HIGH: { p: [1450, 600], type: "life", area: "high", life: "high" },
  F1: { p: [760, 600], type: "fork", area: "high", fork: "f1" },
  JOB: { p: [260, 960], type: "life", area: "young", life: "job" },
  F2: { p: [1380, 940], type: "fork", area: "young", fork: "f2" },
  HOUSE: { p: [1980, 960], type: "life", area: "late", life: "house" },
  RETIRE: { p: [1400, 1320], type: "life", area: "senior", life: "retire" },
  F3: { p: [1220, 1320], type: "fork", area: "senior", fork: "f3" },
  SJOIN: { p: [720, 1320], type: "pay", area: "senior" },
  GOAL: { p: [160, 1260], type: "goal", area: "senior" },
};
const N = "normal", G = "good", B = "bad", E = "event", P = "pay", LV = "love", WK = "work", C = "card";

// pattern 을 반복해서 n 칸짜리 목록 만들기
function fill(n, pattern) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(pattern[i % pattern.length]);
  return out;
}
const CHILD = [N, G, E, B, N, G, C, B, E, G];        // 어린 시절 (월급 없음)
const STUDENT = [N, E, G, LV, B, N, G, C, E, LV];    // 대학 / 취업 준비

// 나이대마다 25칸 이상 (갈림길은 짧은 길 기준)
// wave : 길이 휘어지는 방향 (1 또는 -1)
const segs = [
  { name: "아기", from: "START", to: "WALK", via: [], area: "baby", wave: 1, types: fill(24, CHILD) },
  { name: "유아", from: "WALK", to: "KINDER", via: [[750, 150]], area: "toddler", wave: -1, types: fill(24, [G, N, B, E, C, N, G, E, B, N]) },
  { name: "유치원", from: "KINDER", to: "ELEM", via: [[1210, 250]], area: "kinder", wave: 1, types: fill(24, [E, G, N, B, G, C, N, E, B, G]) },
  { name: "초등학교", from: "ELEM", to: "F0", via: [], area: "elem", wave: -1, types: fill(6, [N, G, E]) },
  { name: "초등학교 - 학원 길", from: "F0", to: "MIDDLE", via: [[1900, 130], [2180, 330]], area: "academy", wave: 1, types: fill(24, [E, N, B, G, N, C, G, N, E, B]) },
  { name: "초등학교 - 운동장 길", from: "F0", to: "MIDDLE", via: [[1800, 420]], area: "play", wave: 1, types: fill(17, [G, N, E, G, B, N, C]) },
  { name: "중학교", from: "MIDDLE", to: "HIGH", via: [[2010, 720], [1720, 700]], area: "middle", wave: 1, types: fill(24, [N, G, E, B, C, G, N, E, B, G]) },
  { name: "고등학교", from: "HIGH", to: "F1", via: [[1100, 660]], area: "high", wave: -1, types: [...fill(23, [N, B, E, G, N, C, G, B, E]), "L:exam"] },
  { name: "대학교 길", from: "F1", to: "JOB", via: [[480, 480], [200, 620]], area: "college", wave: 1, types: ["L:college", ...fill(27, STUDENT)] },
  { name: "바로 취업 길", from: "F1", to: "JOB", via: [[500, 800]], area: "work", wave: -1, types: fill(25, STUDENT) },
  { name: "성인 초반", from: "JOB", to: "F2", via: [[330, 1080], [650, 1010], [1000, 1010]], area: "young", wave: 1, types: fill(31, [P, WK, LV, G, E, B, N, WK, LV, P, C, G, E, B, N, LV]) },
  { name: "성인 초반 - 연애 집중 길", from: "F2", to: "HOUSE", via: [[1680, 830]], area: "lovepath", wave: -1, types: fill(17, [LV, P, LV, G, LV, E, LV, B]) },
  { name: "성인 초반 - 일 집중 길", from: "F2", to: "HOUSE", via: [[1680, 1080]], area: "workpath", wave: 1, types: fill(16, [WK, G, WK, P, WK, E, WK, B]) },
  { name: "성인 후반", from: "HOUSE", to: "RETIRE", via: [[2180, 1120], [2000, 1340]], area: "late", wave: 1, types: fill(30, [P, LV, G, B, E, WK, N, C, G, P, B, E]) },
  { name: "황혼기", from: "RETIRE", to: "F3", via: [], area: "senior", wave: 1, types: [N, G, E, N] },
  { name: "황혼기 - 평온한 바닷길", from: "F3", to: "SJOIN", via: [[1100, 1470], [860, 1470]], area: "sea", wave: 1, types: fill(17, [G, N, E, G, LV, P]) },
  { name: "황혼기 - 한방역전섬", from: "F3", to: "SJOIN", via: [[970, 1180]], area: "gamble", wave: -1, types: fill(14, [E]) },
  { name: "노년", from: "SJOIN", to: "GOAL", via: [[450, 1400]], area: "senior", wave: 1, types: fill(16, [N, G, E, B, P, LV]) },
];

// 모든 좌표를 SCALE 배로 키우기
for (const key in A) {
  A[key].p = [A[key].p[0] * SCALE, A[key].p[1] * SCALE];
}
for (const s of segs) {
  s.via = s.via.map((v) => [v[0] * SCALE, v[1] * SCALE]);
}

// 폴리라인 길이
function polyLen(pts) {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return total;
}

// 폴리라인을 step 간격의 촘촘한 점들로 바꾸기
function resample(pts, step) {
  const total = polyLen(pts);
  const count = Math.max(2, Math.round(total / step));
  const out = [];
  for (let i = 0; i <= count; i++) out.push(pointAt(pts, i / count));
  return out;
}

// 칸 n개가 SPACING 간격으로 들어가도록, 모자란 길이만큼 사인파로 구불구불하게
function wiggle(pts, n, sign) {
  const target = (n + 1) * SPACING;
  const L = polyLen(pts);
  if (target <= L * 1.05) return pts;

  const base = resample(pts, 8);
  const halfWaves = Math.max(1, Math.round(L / 220));
  const K = 15; // 방향을 부드럽게 계산하려고 앞뒤 15개 점 사용
  const normals = base.map((q, i) => {
    const a = base[Math.max(0, i - K)], b = base[Math.min(base.length - 1, i + K)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });
  const make = (amp) => base.map((q, i) => {
    const s = i / (base.length - 1);
    const off = amp * sign * Math.sin(Math.PI * halfWaves * s);
    return [q[0] + normals[i][0] * off, q[1] + normals[i][1] * off];
  });

  // 길이가 target 이 되는 진폭 찾기 (이분 탐색)
  let lo = 0, hi = 1500;
  for (let it = 0; it < 40; it++) {
    const mid = (lo + hi) / 2;
    if (polyLen(make(mid)) < target) lo = mid; else hi = mid;
  }
  return make(lo);
}

// 폴리라인 위 t(0~1) 지점
function pointAt(pts, t) {
  const lens = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lens.push(l); total += l;
  }
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const r = lens[i] === 0 ? 0 : d / lens[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    d -= lens[i];
  }
}

// 번호 매기기 순서
const order = ["START", 0, "WALK", 1, "KINDER", 2, "ELEM", 3, "F0", 4, 5, "MIDDLE", 6, "HIGH", 7, "F1", 8, 9,
  "JOB", 10, "F2", 11, 12, "HOUSE", 13, "RETIRE", 14, "F3", 15, 16, "SJOIN", 17, "GOAL"];
const tiles = [];
const anchorId = {};
const segIds = {};
const comments = {};
for (const o of order) {
  if (typeof o === "string") {
    anchorId[o] = tiles.length;
    const a = A[o];
    const t = { id: tiles.length, x: a.p[0], y: a.p[1], type: a.type, area: a.area, next: [] };
    if (a.life) t.life = a.life;
    if (a.fork) t.fork = a.fork;
    tiles.push(t);
  } else {
    const s = segs[o];
    const pts = wiggle([A[s.from].p, ...s.via, A[s.to].p], s.types.length, s.wave);
    segIds[o] = [];
    comments[tiles.length] = s.name;
    s.types.forEach((ty, i) => {
      const [x, y] = pointAt(pts, (i + 1) / (s.types.length + 1));
      const t = { id: tiles.length, x: Math.round(x), y: Math.round(y), type: ty, area: s.area, next: [] };
      if (ty.startsWith("L:")) { t.type = "life"; t.life = ty.slice(2); }
      segIds[o].push(t.id);
      tiles.push(t);
    });
  }
}
// 연결
segs.forEach((s, i) => {
  const ids = segIds[i];
  tiles[anchorId[s.from]].next.push(ids[0]);
  for (let k = 0; k < ids.length - 1; k++) tiles[ids[k]].next.push(ids[k + 1]);
  tiles[ids[ids.length - 1]].next.push(anchorId[s.to]);
});

// ---------------- map.js 출력 ----------------
let js = `// =====================================================
// 지도 데이터 (자동 생성 + 직접 수정 가능)
//   x, y  : 칸의 위치 (지도 왼쪽 위가 0, 0)
//   type  : 칸 종류 (good 좋은 일 / bad 나쁜 일 / normal 보통 / event 선택 이벤트
//           pay 월급날 / fork 갈림길 / life 인생 이벤트(무조건 멈춤) / start / goal)
//   area  : 지역 (어떤 지역 이야기가 나올지 정함 → events.js)
//   next  : 다음 칸 번호 (2개면 갈림길)
// =====================================================
const MAP_WIDTH = ${W};
const MAP_HEIGHT = ${H};

const tiles = [
`;
for (const t of tiles) {
  if (comments[t.id]) js += `\n  // ----- ${comments[t.id]} -----\n`;
  let extra = "";
  if (t.life) extra += `, life: "${t.life}"`;
  if (t.fork) extra += `, fork: "${t.fork}"`;
  js += `  { id: ${t.id}, x: ${t.x}, y: ${t.y}, type: "${t.type}", area: "${t.area}"${extra}, next: [${t.next.join(", ")}] },\n`;
}
js += `];\n`;
fs.writeFileSync(path.join(game, "map.js"), js, "utf8");

// ---------------- 지도 배경 ----------------
const roads = [];
for (const t of tiles) for (const n of t.next) roads.push([t.x, t.y, tiles[n].x, tiles[n].y]);
function distSeg(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
const placed = [];
function free(x, y, r) {
  if (x < 40 || y < 40 || x > W - 40 || y > H - 40) return false;
  for (const t of tiles) if (Math.hypot(x - t.x, y - t.y) < r + 40) return false;
  for (const rd of roads) if (distSeg(x, y, rd) < r + 22) return false;
  for (const p of placed) if (Math.hypot(x - p[0], y - p[1]) < r + p[2]) return false;
  return true;
}
let seed = 11;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

let land = "", sand = "";
for (const t of tiles) {
  sand += `<circle cx="${t.x}" cy="${t.y}" r="168" fill="#f6e3a8"/>`;
  if (t.area !== "sea") land += `<circle cx="${t.x}" cy="${t.y}" r="150" fill="#86d97f"/>`;
}

const areaStyle = {
  baby: { label: "👶 아기", deco: ["🍼", "🧸", "🌷"] },
  toddler: { label: "🧸 유아", deco: ["🧸", "🎈", "🌼"] },
  kinder: { label: "🎒 유치원", deco: ["🎨", "🖍️", "🌳"] },
  elem: { label: "🏫 초등학교", deco: ["🏫", "⚽", "🌳"] },
  academy: { label: "✏️ 학원 길", deco: ["📚", "✏️", "🏢"] },
  play: { label: "⚽ 운동장 길", deco: ["🛝", "⚽", "🌳"] },
  middle: { label: "📘 중학교", deco: ["🏫", "🏀", "🌲"] },
  high: { label: "📝 고등학교", deco: ["🏫", "📚", "🌳"] },
  college: { label: "🎓 대학교", deco: ["🏛️", "📚", "🌳"] },
  work: { label: "💼 바로 취업", deco: ["🏭", "🌳"] },
  young: { label: "🏙️ 성인 초반", deco: ["🏢", "🏬", "🚕", "🏢"] },
  lovepath: { label: "💕 연애 집중 길", deco: ["🌸", "💐", "🎡"] },
  workpath: { label: "💼 일 집중 길", deco: ["🏢", "💻", "🏗️"] },
  late: { label: "🏡 성인 후반", deco: ["🏡", "🌳", "🏠", "🌲"] },
  sea: { label: "🌊 평온한 바닷길", deco: ["🐚", "🦀", "⛵"] },
  gamble: { label: "🎰 한방역전섬", deco: ["🎰", "💎", "🎲"] },
  senior: { label: "🏝️ 황혼기", deco: ["🌴", "⛱️", "🌺"] },
};

let labels = "", deco = "";
for (const area in areaStyle) {
  const at = tiles.filter((t) => t.area === area);
  const cx = at.reduce((s, t) => s + t.x, 0) / at.length;
  const cy = at.reduce((s, t) => s + t.y, 0) / at.length;
  // 라벨
  const text = areaStyle[area].label;
  const w = text.length * 22 + 20;
  let done = false;
  for (let r = 50; r < 380 && !done; r += 10) {
    for (let a = 0; a < 360 && !done; a += 20) {
      const x = cx + r * Math.cos((a * Math.PI) / 180), y = cy + r * Math.sin((a * Math.PI) / 180);
      let ok = true;
      for (let dx = -w / 2; dx <= w / 2 && ok; dx += 15) ok = free(x + dx, y, 6);
      if (ok) {
        for (let dx = -w / 2; dx <= w / 2; dx += 15) placed.push([x + dx, y, 22]);
        labels += `<g><rect x="${(x - w / 2).toFixed(0)}" y="${(y - 20).toFixed(0)}" width="${w}" height="40" rx="20" fill="#fff" stroke="#495057" stroke-width="3" opacity="0.92"/>
<text x="${x.toFixed(0)}" y="${(y + 8).toFixed(0)}" font-size="22" font-weight="700" text-anchor="middle" font-family="Malgun Gothic, sans-serif" fill="#343a40">${text}</text></g>`;
        done = true;
      }
    }
  }
  // 장식
  let count = 0;
  for (let tries = 0; tries < 1500 && count < 14; tries++) {
    const t = at[Math.floor(rnd() * at.length)];
    const a = rnd() * Math.PI * 2, r = 60 + rnd() * 100;
    const x = t.x + r * Math.cos(a), y = t.y + r * Math.sin(a);
    if (free(x, y, 22)) {
      placed.push([x, y, 22]);
      const e = areaStyle[area].deco[count % areaStyle[area].deco.length];
      deco += `<text x="${x.toFixed(0)}" y="${(y + 14).toFixed(0)}" font-size="${(32 + rnd() * 10).toFixed(0)}" text-anchor="middle" ${EMOJI}>${e}</text>`;
      count++;
    }
  }
}
let waves = "";
for (let i = 0; i < 260; i++) {
  const x = rnd() * W, y = rnd() * H;
  if (free(x, y, 30) && tiles.every((t) => Math.hypot(x - t.x, y - t.y) > 200)) {
    waves += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q8 -8 16 0 t16 0" stroke="#fff" stroke-width="3" fill="none" opacity="0.6"/>`;
  }
}
save("ui/map-bg.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#74c0fc"/><stop offset="1" stop-color="#4dabf7"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sea)"/>
${waves}
${sand}
${land}
${deco}
${labels}
</svg>`);

// ---------------- 칸 아이콘 ----------------
function icon(symbol, c1, c2, isEmoji) {
  const font = isEmoji ? EMOJI : 'font-family="Arial Black, sans-serif" font-weight="900" fill="#fff" stroke="rgba(0,0,0,0.25)" stroke-width="2"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs><radialGradient id="g" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
  <circle cx="50" cy="54" r="44" fill="rgba(0,0,0,0.22)"/>
  <circle cx="50" cy="50" r="44" fill="url(#g)" stroke="#fff" stroke-width="6"/>
  <text x="50" y="${isEmoji ? 66 : 68}" font-size="${isEmoji ? 42 : 50}" text-anchor="middle" ${font}>${symbol}</text>
</svg>`;
}
const icons = {
  good: ["+", "#a5d8ff", "#1c7ed6", false],
  bad: ["!", "#ffc9c9", "#e03131", false],
  normal: ["•", "#fff3bf", "#f59f00", false],
  event: ["?", "#e5dbff", "#7048e8", false],
  pay: ["$", "#b2f2bb", "#2f9e44", false],
  love: ["♥", "#ffdeeb", "#e64980", false],
  work: ["★", "#c5f6fa", "#1098ad", false],
  card: ["🎴", "#f3f0ff", "#845ef7", true],
  fork: ["🪧", "#ffe8cc", "#f76707", true],
  start: ["👶", "#fff3bf", "#fab005", true],
  goal: ["🏁", "#fff9db", "#fcc419", true],
  talent: ["🌟", "#fff3bf", "#f59f00", true],
  kinder: ["🎒", "#fff3bf", "#f59f00", true],
  elem: ["🏫", "#fff3bf", "#f59f00", true],
  middle: ["📘", "#fff3bf", "#f59f00", true],
  high: ["📝", "#fff3bf", "#f59f00", true],
  exam: ["✏️", "#fff3bf", "#f59f00", true],
  college: ["🎓", "#fff3bf", "#f59f00", true],
  job: ["💼", "#fff3bf", "#f59f00", true],
  house: ["🏠", "#fff3bf", "#f59f00", true],
  retire: ["🎉", "#fff3bf", "#f59f00", true],
};
for (const k in icons) save(`tiles/${k}.svg`, icon(...icons[k]));
// 룰렛 (1~10)
{
  const colors = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#38d9a9", "#4dabf7", "#748ffc", "#b197fc", "#f783ac", "#ff8787"];
  const pt = (deg, r) => {
    const a = (deg * Math.PI) / 180;
    return [(150 + r * Math.sin(a)).toFixed(2), (150 - r * Math.cos(a)).toFixed(2)];
  };
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <circle cx="150" cy="150" r="146" fill="#fff" stroke="#495057" stroke-width="6"/>`;
  for (let k = 0; k < 10; k++) {
    const c = k * 36;
    const [x1, y1] = pt(c - 18, 136), [x2, y2] = pt(c + 18, 136), [tx, ty] = pt(c, 100);
    s += `<path d="M150 150 L${x1} ${y1} A136 136 0 0 1 ${x2} ${y2} Z" fill="${colors[k]}" stroke="#fff" stroke-width="3"/>
  <text x="${tx}" y="${ty}" font-size="34" font-weight="900" font-family="Arial Black, sans-serif" fill="#fff" stroke="#495057" stroke-width="2" text-anchor="middle" dominant-baseline="central" transform="rotate(${c} ${tx} ${ty})">${k + 1}</text>`;
  }
  s += `<circle cx="150" cy="150" r="26" fill="#fff" stroke="#495057" stroke-width="6"/><circle cx="150" cy="150" r="10" fill="#495057"/></svg>`;
  save("ui/roulette.svg", s);
}

for (const old of ["plus", "minus", "invest", "baby", "walk", "marry"]) {
  const f = path.join(assets, "tiles", old + ".svg");
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
const oldBg = path.join(assets, "ui", "board-bg.svg");
if (fs.existsSync(oldBg)) fs.unlinkSync(oldBg);

console.log("tiles:", tiles.length);
