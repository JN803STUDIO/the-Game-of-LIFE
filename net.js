// =====================================================
// 온라인 대전 : 방 만들기 · 참가 · 대기실 · 게임 화면 같이 보기
//
// 방장 컴퓨터가 게임을 진행해요.
//   1) 방장 화면에서 바뀐 부분만 골라서 (patch) 서버를 거쳐 다른 사람에게 보내요.
//   2) 다른 사람은 그 화면을 똑같이 보여 주기만 하고,
//      버튼을 누르면 "몇 번째 버튼인지" (path) 를 방장에게 보내요.
//   3) 방장은 그 사람 차례일 때만 그 버튼을 대신 눌러 줘요.
// 그래서 게임 규칙 코드(script.js)는 거의 고치지 않아도 돼요.
// =====================================================

const net = {
  ws: null,
  role: "",          // "host" (방장) 또는 "guest"
  you: "",           // 내 연결 번호
  code: "",          // 방 코드
  host: "",          // 방장 연결 번호
  members: [],       // 대기실 사람들 [{ cid, name, gender, char }]
  mode: 0,
  started: false,
  playerOf: {},      // 연결 번호 → 플레이어 번호 (방장 = 0번)
  gone: {},          // 게임 중에 나간 사람 연결 번호
  me: { name: "", gender: "M", char: 0 },
  lastClone: null,   // 방장 : 마지막으로 보낸 화면 (비교용 복사본)
  dirty: false,
  remoteClick: false // 방장 : 다른 사람 대신 누르는 중
};

// 화면 같이 보기에서 빼는 것 (각자 따로 쓰는 것)
const NET_SKIP = ["soundBox", "netBar", "netToast"];


// ----- 서버 연결 -----
function netSend(msg) {
  if (net.ws != null && net.ws.readyState == WebSocket.OPEN) net.ws.send(JSON.stringify(msg));
}

function netConnect(first) {
  const scheme = location.protocol == "https:" ? "wss://" : "ws://";
  const ws = new WebSocket(scheme + location.host + "/ws/room");
  net.ws = ws;
  ws.onopen = function () { ws.send(JSON.stringify(first)); };
  ws.onmessage = function (e) { netReceive(JSON.parse(e.data)); };
  ws.onclose = function () {
    if (net.ws != ws) return;
    net.ws = null;
    if (net.started || isOpen(document.getElementById("lobbyScreen"))) netClosed("서버와 연결이 끊겼어요.");
  };
}

function netReceive(msg) {
  if (msg.type == "welcome") {
    net.you = msg.you;
  } else if (msg.type == "error") {
    setMsg(isOpen(document.getElementById("lobbyScreen")) ? "lobbyMsg" : "roomMsg", msg.text);
  } else if (msg.type == "lobby") {
    net.code = msg.code;
    net.host = msg.host;
    net.mode = msg.mode;
    net.members = msg.members;
    net.role = net.host == net.you ? "host" : "guest";
    if (!isOpen(document.getElementById("lobbyScreen"))) showScreen("lobbyScreen");
    drawLobby();
  } else if (msg.type == "start") {
    netStarted(msg);
  } else if (msg.type == "closed") {
    netClosed(msg.text);
  } else if (msg.type == "toast") {
    netToast(msg.text);
  } else if (net.role == "host") {
    if (msg.type == "action") netDoAction(msg.from, msg.path);
    else if (msg.type == "left") netLeft(msg.cid);
  } else {
    // 다른 사람 : 방장 화면 따라 하기
    if (msg.type == "full") netApplyFull(msg.html);
    else if (msg.type == "patch") netApplyPatch(msg.ops);
    else if (msg.type == "cam") netApplyCam(msg);
    else if (msg.type == "sfx") netSfx(msg.name);
    else if (msg.type == "bgm") netBgm(msg.name);
    else if (msg.type == "record") netSaveRecord(msg.record);
  }
}

// 방이 닫히거나 끊기면 안내하고 처음으로
function netClosed(text) {
  net.started = false;
  netToast(text + " 처음 화면으로 돌아가요.");
  setTimeout(function () {
    sessionStorage.setItem("goTitle", "1");
    location.reload();
  }, 2500);
}


// ----- 방 만들기 / 참가 -----
function openRooms() {
  if (!serverOnline) {
    netToast("서버가 꺼져 있어서 온라인 대전을 할 수 없어요.");
    return;
  }
  setMsg("roomMsg", "");
  document.getElementById("roomCodeInput").value = "";
  showScreen("roomScreen");
}

function netDefaultMe() {
  net.me.name = loginUser != null ? loginUser.nickname.slice(0, 6) : "";
  return net.me;
}

function netCreateRoom() {
  setMsg("roomMsg", "방을 만드는 중...", true);
  netConnect({ type: "create", me: netDefaultMe() });
}

function netJoinRoom() {
  const code = document.getElementById("roomCodeInput").value.trim();
  if (!/^[0-9]{4}$/.test(code)) {
    setMsg("roomMsg", "방 코드는 4자리 숫자예요. 다시 입력해 주세요!");
    return;
  }
  setMsg("roomMsg", "참가하는 중...", true);
  netConnect({ type: "join", code: code, me: netDefaultMe() });
}

function netLeave() {
  if (net.ws != null) {
    const ws = net.ws;
    net.ws = null;   // onclose 에서 안내 안 띄우게
    ws.close();
  }
  sessionStorage.setItem("goTitle", "1");
  location.reload();
}


// ----- 대기실 -----
// 팀원(pront) 대기실 화면에 맞춰 채우기 (이모지 자리에 우리 캐릭터 그림)
function drawLobby() {
  document.getElementById("roomCodeText").textContent = net.code;

  let html = "";
  for (const m of net.members) {
    let name = safeText(m.name);
    if (m.cid == net.host) name = "👑 " + name;
    if (m.cid == net.you) name += " (나)";
    html += '<div class="choice-btn member' + (m.cid == net.you ? " selected" : "") + '">' +
            '<span class="choice-emoji"><img src="' + characters[m.char].img + '"></span>' +
            '<span class="choice-name">' + name + '</span>' +
            '<span class="choice-name">' + (m.gender == "F" ? "여자" : "남자") + '</span></div>';
  }
  for (let i = net.members.length; i < 4; i++) {
    html += '<div class="choice-btn member empty"><span class="choice-emoji">·</span><span class="choice-name">빈 자리</span></div>';
  }
  document.getElementById("lobbyMembers").innerHTML = html;

  // 내 캐릭터 (미리보기 + 성별 + 캐릭터 버튼)
  for (const m of net.members) {
    if (m.cid == net.you) {
      net.me.gender = m.gender;
      net.me.char = m.char;
      const nameBox = document.getElementById("lobbyName");
      if (document.activeElement != nameBox) nameBox.value = m.name;
    }
  }
  const genderName = net.me.gender == "F" ? "여자" : "남자";
  document.getElementById("previewEmoji").innerHTML = '<img src="' + characters[net.me.char].img + '">';
  document.getElementById("previewText").textContent = genderName + " · " + characters[net.me.char].name;
  for (const btn of document.querySelectorAll("#lobbyScreen .gender-btn")) {
    btn.classList.toggle("selected", btn.dataset.gender == net.me.gender);
  }
  let chars = "";
  for (let c = 0; c < characters.length; c++) {
    chars += '<button class="choice-btn character-btn' + (c == net.me.char ? " selected" : "") + '" type="button" onclick="netSetMe(\'char\', ' + c + ')">' +
             '<span class="choice-emoji"><img src="' + characters[c].img + '"></span><span class="choice-name">' + characters[c].name + '</span></button>';
  }
  document.getElementById("lobbyChars").innerHTML = chars;

  // 모드는 방장만 바꾸기, 시작도 방장만
  const host = net.role == "host";
  let modesHtml = "";
  for (let k = 0; k < modes.length; k++) {
    modesHtml += '<button class="choice-btn' + (k == net.mode ? " selected" : "") + '" type="button"' + (host ? "" : " disabled") +
                 ' onclick="netSend({ type: \'mode\', mode: ' + k + ' })">' + modes[k].name + '<small>약 ' + modes[k].turns + '턴</small></button>';
  }
  document.getElementById("lobbyModes").innerHTML = modesHtml;
  let wait = "방장이 게임을 시작하기를 기다리는 중...";
  if (host) wait = net.members.length < 2 ? "친구가 들어오면 시작할 수 있어요. (2~4명)" : "";
  document.getElementById("lobbyWait").textContent = wait;
  const start = document.getElementById("startGameBtn");
  start.classList.toggle("hidden", !host);
  start.disabled = net.members.length < 2;
}

function netSetMe(key, value) {
  net.me[key] = value;
  netMeChanged();
}

function netMeChanged() {
  net.me.name = document.getElementById("lobbyName").value.trim();
  netSend({ type: "me", name: net.me.name, gender: net.me.gender, char: net.me.char });
}

function netStart() {
  setMsg("lobbyMsg", "");
  netSend({ type: "start" });
}


// ----- 게임 시작 -----
function netStarted(msg) {
  net.started = true;
  net.playerOf = {};
  for (let i = 0; i < msg.members.length; i++) {
    net.playerOf[msg.members[i].cid] = i;
  }
  const myIndex = net.playerOf[net.you];
  const meName = msg.members[myIndex].name;
  const bar = document.getElementById("netBar");
  bar.innerHTML = "🌐 방 " + net.code + " · 나 : <b>" + safeText(meName) + "</b> (" + (myIndex + 1) + "P)" +
                  (net.role == "host" ? " 👑" : "") + ' <button class="small-btn" onclick="netLeave()">나가기</button>';
  bar.classList.remove("hidden");

  if (net.role == "host") {
    // 대기실 사람들로 플레이어 설정 → 원래 게임 시작 함수 그대로
    setupMode = msg.mode;
    humanCount = msg.members.length;
    botCount = 0;
    setupCount = msg.members.length;
    for (let i = 0; i < msg.members.length; i++) {
      const m = msg.members[i];
      setupChars[i] = m.char;
      setupNames[i] = m.name;
      setupGender[i] = m.gender;
      setupCpu[i] = false;
      setupPhotos[i] = "";
    }
    players = [];
    startGame();
    netStartMirror();
  } else {
    document.body.classList.add("net-guest");
    netToast("방장 화면을 불러오는 중...");
  }
}


// =====================================================
// 화면 같이 보기 : 경로(path) = 몸통(body)부터 몇 번째 자식인지 숫자 목록
// =====================================================
function netKids(node, isBody) {
  const list = [];
  if (isBody) {
    for (const el of node.children) {
      if (el.tagName != "SCRIPT" && !NET_SKIP.includes(el.id)) list.push(el);
    }
  } else {
    for (const n of node.childNodes) {
      if (n.nodeType == 1 || n.nodeType == 3) list.push(n);   // 태그와 글자만 (주석 빼기)
    }
  }
  return list;
}

function netNodeAt(path) {
  let node = document.body;
  for (let d = 0; d < path.length; d++) {
    node = netKids(node, d == 0)[path[d]];
    if (node == undefined) return null;
  }
  return node;
}

function netPathOf(el) {
  const path = [];
  while (el != document.body) {
    const parent = el.parentNode;
    if (parent == null) return null;
    const i = netKids(parent, parent == document.body).indexOf(el);
    if (i < 0) return null;   // 같이 보기에서 빠진 곳
    path.unshift(i);
    el = parent;
  }
  return path;
}


// ----- 방장 : 바뀐 부분 찾아서 보내기 -----
function netStartMirror() {
  // 소리도 같이
  const mySfx = sfx;
  sfx = function (name) {
    mySfx(name);
    netSend({ type: "sfx", name: name });
  };
  const myBgm = playBgm;
  playBgm = function (name) {
    myBgm(name);
    netSend({ type: "bgm", name: name });
  };

  netSendFull();
  new MutationObserver(function () { net.dirty = true; })
    .observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  setInterval(function () {
    if (!net.dirty || !net.started) return;
    net.dirty = false;
    const ops = [];
    netDiffKids(netKids(document.body, true), netKids(net.lastClone, true), [], ops);
    net.lastClone = document.body.cloneNode(true);
    if (ops.length > 0) netSend({ type: "patch", ops: ops });
  }, 80);

  // 카메라 (지도 어디를 보고 있는지, 화면 크기가 달라도 되게 비율로)
  let camTimer = null;
  document.getElementById("mapWrap").addEventListener("scroll", function () {
    if (camTimer != null) return;
    camTimer = setTimeout(function () {
      camTimer = null;
      const w = document.getElementById("mapWrap");
      netSend({ type: "cam", x: (w.scrollLeft + w.clientWidth / 2) / w.scrollWidth, y: (w.scrollTop + w.clientHeight / 2) / w.scrollHeight });
    }, 120);
  });
}

function netSendFull() {
  const html = [];
  for (const el of netKids(document.body, true)) html.push(el.outerHTML);
  netSend({ type: "full", html: html });
  netSend({ type: "bgm", name: bgmName });
  net.lastClone = document.body.cloneNode(true);
}

function netSameKey(a, b) {
  if (a.nodeType != b.nodeType) return false;
  if (a.nodeType == 3) return true;
  return a.tagName == b.tagName && a.id == b.id;
}

function netNodeData(node) {
  if (node.nodeType == 3) return { text: node.data };
  return { html: node.outerHTML };
}

function netDiffNode(live, old, path, ops) {
  if (live.nodeType == 3) {
    if (live.data != old.data) ops.push({ op: "text", path: path, text: live.data });
    return;
  }
  const set = {};
  const del = [];
  for (const a of live.attributes) {
    if (old.getAttribute(a.name) !== a.value) set[a.name] = a.value;
  }
  for (const a of old.attributes) {
    if (!live.hasAttribute(a.name)) del.push(a.name);
  }
  if (Object.keys(set).length > 0 || del.length > 0) ops.push({ op: "attrs", path: path, set: set, del: del });
  netDiffKids(netKids(live, false), netKids(old, false), path, ops);
}

// 자식 목록 비교 : 같은 자리는 안쪽까지 비교, 남으면 빼기, 모자라면 끼우기
// (k = 받는 쪽 화면에서 지금 몇 번째인지)
function netDiffKids(now, before, path, ops) {
  let i = 0;
  let j = 0;
  let k = 0;
  while (i < now.length || j < before.length) {
    const leftNow = now.length - i;
    const leftBefore = before.length - j;
    if (i < now.length && j < before.length && netSameKey(now[i], before[j])) {
      netDiffNode(now[i], before[j], path.concat(k), ops);
      i++; j++; k++;
    } else if (j < before.length && leftNow < leftBefore) {
      ops.push({ op: "remove", path: path.concat(k) });
      j++;
    } else if (j < before.length && leftNow == leftBefore) {
      ops.push(Object.assign({ op: "replace", path: path.concat(k) }, netNodeData(now[i])));
      i++; j++; k++;
    } else {
      ops.push(Object.assign({ op: "insert", path: path.concat(k) }, netNodeData(now[i])));
      i++; k++;
    }
  }
}


// ----- 방장 : 누가 무엇을 누를 수 있는지 -----
// 지금 차례인 사람 (미니게임 중이면 미니게임 하는 사람)
function netActor() {
  if (mini != null && mini.index < players.length) return mini.index;
  return turn;
}

function netCidOf(index) {
  for (const cid in net.playerOf) {
    if (net.playerOf[cid] == index) return cid;
  }
  return null;
}

// 저장 · 홈으로 메뉴, 결과 화면 버튼은 방장만
function netHostOnly(el) {
  return el.closest("#menuPanel .game-menu") != null || el.closest("#resultScreen") != null ||
         (el.getAttribute("onclick") || "").includes("openPanel('game')");
}

function netAllowed(index, el) {
  if (netHostOnly(el)) return index == 0;
  const actor = netActor();
  if (index == actor) return true;
  // 차례인 사람이 나갔으면 방장이 대신 할 수 있어요
  return index == 0 && net.gone[netCidOf(actor)] == true;
}

function netWhyNot(el) {
  if (netHostOnly(el)) return "이 버튼은 방장만 누를 수 있어요.";
  return "지금은 " + players[netActor()].name + "의 차례예요.";
}

function netDoAction(from, path) {
  const index = net.playerOf[from];
  const el = netNodeAt(path);
  if (index == undefined || el == null || el.nodeType != 1) return;
  if (!netAllowed(index, el)) {
    netSend({ type: "to", cid: from, msg: { type: "toast", text: netWhyNot(el) } });
    return;
  }
  net.remoteClick = true;
  try {
    el.click();
  } finally {
    net.remoteClick = false;
  }
}

function netLeft(cid) {
  net.gone[cid] = true;
  const index = net.playerOf[cid];
  const text = players[index].name + "님이 나갔어요. 그 차례는 방장이 대신 할 수 있어요.";
  netToast(text);
  netSend({ type: "toast", text: text });
}

// 게임이 끝나면 각자 자기 기록을 자기 계정에 저장하게 보내 주기
function netSendRecords(ranked) {
  if (!net.started || net.role != "host") return;
  for (const cid in net.playerOf) {
    const index = net.playerOf[cid];
    if (index == 0 || net.gone[cid]) continue;
    netSend({ type: "to", cid: cid, msg: { type: "record", record: recordOf(players[index], ranked) } });
  }
}


// ----- 다른 사람 : 방장 화면 따라 하기 -----
const NET_BAD_TAGS = ["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "BASE", "FORM"];

// 받은 화면 조각에서 실행될 수 있는 것(스크립트, onclick 같은 속성) 지우기
function netSafeAttr(name, value) {
  name = name.toLowerCase();
  if (name.startsWith("on")) return false;
  if (["href", "src", "action", "formaction", "xlink:href"].includes(name) &&
      String(value).trim().toLowerCase().startsWith("javascript:")) return false;
  return true;
}

function netClean(root) {
  for (const el of Array.from(root.querySelectorAll("*"))) {
    if (NET_BAD_TAGS.includes(el.tagName.toUpperCase())) {
      el.remove();
      continue;
    }
    for (const a of Array.from(el.attributes)) {
      if (!netSafeAttr(a.name, a.value)) el.removeAttribute(a.name);
    }
  }
}

function netMakeNode(o) {
  if (o.text != undefined) return document.createTextNode(o.text);
  const t = document.createElement("template");   // template 안은 실행되지 않아요
  t.innerHTML = o.html;
  netClean(t.content);
  return document.importNode(t.content.firstChild || document.createTextNode(""), true);
}

// 지금 화면(cur)을 받은 화면(next)처럼 바꾸기 (같은 칸은 그대로 두고 고쳐서, 움직임 애니메이션이 살아요)
function netMorph(cur, next) {
  if (!netSameKey(cur, next)) {
    cur.replaceWith(next);
    return;
  }
  if (cur.nodeType == 3) {
    if (cur.data != next.data) cur.data = next.data;
    return;
  }
  for (const a of Array.from(cur.attributes)) {
    if (!next.hasAttribute(a.name)) cur.removeAttribute(a.name);
  }
  for (const a of Array.from(next.attributes)) {
    if (cur.getAttribute(a.name) !== a.value) cur.setAttribute(a.name, a.value);
  }
  const A = netKids(cur, false);
  const B = netKids(next, false);
  for (let i = 0; i < B.length; i++) {
    if (i < A.length) netMorph(A[i], B[i]);
    else cur.appendChild(B[i]);
  }
  for (let i = B.length; i < A.length; i++) A[i].remove();
}

function netApplyFull(htmlList) {
  const now = netKids(document.body, true);
  for (let i = 0; i < htmlList.length; i++) {
    const next = netMakeNode({ html: htmlList[i] });
    if (i < now.length) netMorph(now[i], next);
    else document.body.insertBefore(next, document.getElementById("netBar"));
  }
  for (let i = htmlList.length; i < now.length; i++) now[i].remove();
  document.getElementById("netToast").classList.add("hidden");
}

function netApplyPatch(ops) {
  for (const o of ops) {
    if (o.op == "insert") {
      const parentPath = o.path.slice(0, -1);
      const parent = netNodeAt(parentPath);
      if (parent == null) continue;
      const ref = netKids(parent, parentPath.length == 0)[o.path[o.path.length - 1]];
      parent.insertBefore(netMakeNode(o), ref || (parentPath.length == 0 ? document.getElementById("netBar") : null));
      continue;
    }
    const node = netNodeAt(o.path);
    if (node == null) continue;
    if (o.op == "remove") {
      node.remove();
    } else if (o.op == "replace") {
      node.replaceWith(netMakeNode(o));
    } else if (o.op == "text") {
      node.data = o.text;
    } else if (o.op == "attrs") {
      for (const name in o.set) {
        if (netSafeAttr(name, o.set[name])) node.setAttribute(name, o.set[name]);
      }
      for (const name of o.del) node.removeAttribute(name);
    }
  }
}

function netApplyCam(msg) {
  const w = document.getElementById("mapWrap");
  w.scrollTo({ left: msg.x * w.scrollWidth - w.clientWidth / 2, top: msg.y * w.scrollHeight - w.clientHeight / 2, behavior: "smooth" });
}

function netSfx(name) {
  sfx(name);
}

function netBgm(name) {
  if (name) playBgm(name);
}

async function netSaveRecord(record) {
  if (loginUser == null) {
    netToast("게임 끝! 게스트는 기록이 저장되지 않아요.");
    return;
  }
  try {
    await callApi("POST", "/records", record);
    netToast("✅ " + loginUser.nickname + "님의 기록이 저장됐어요!");
  } catch (e) {
    netToast("기록 저장 실패 : " + e.message);
  }
}


// ----- 누르기 가로채기 -----
// 다른 사람 : 화면 속 버튼을 누르면 내 화면에서는 아무 일도 안 하고 방장에게 보내요
// 방장 : 내 차례가 아닐 때는 막아요
function netClickable(target) {
  return target.closest("button, a, input, label, [onclick]") || target;
}

window.addEventListener("click", function (e) {
  if (!net.started || net.remoteClick) return;
  const target = e.target;
  if (target.nodeType != 1 || target.closest("#netBar, #netToast, #soundBox")) return;
  const el = netClickable(target);

  if (net.role == "guest") {
    e.preventDefault();
    e.stopPropagation();
    const path = netPathOf(el);
    if (path != null) netSend({ type: "action", path: path });
  } else if (net.role == "host" && !netAllowed(0, el)) {
    e.preventDefault();
    e.stopPropagation();
    netToast(netWhyNot(el));
  }
}, true);


// ----- 안내 띄우기 -----
let netToastTimer = null;
function netToast(text) {
  const box = document.getElementById("netToast");
  box.textContent = text;
  box.classList.remove("hidden");
  clearTimeout(netToastTimer);
  netToastTimer = setTimeout(function () { box.classList.add("hidden"); }, 2500);
}
