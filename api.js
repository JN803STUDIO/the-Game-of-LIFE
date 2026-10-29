// =====================================================
// 서버(FastAPI + MySQL) 연결 : 로그인 · 기록 저장 · 랭킹
//
// async / await 란?
//   서버에 요청을 보내면 답이 오기까지 시간이 걸려요.
//   await 를 붙이면 "답이 올 때까지 기다렸다가" 다음 줄을 실행해요.
//   await 를 쓰는 함수 앞에는 async 를 붙여야 해요.
//
// 서버가 꺼져 있으면(=index.html 을 그냥 열면) 게스트로만 플레이 가능
// =====================================================

let loginUser = null;      // 로그인한 사람 { id, username, nickname }
let serverOnline = false;  // 서버 연결 여부
let loginTab = "login";    // "login" 또는 "register"


// ----- 다른 사람이 쓴 글자를 안전하게 바꾸기 -----
// 닉네임에 <script> 같은 코드를 넣어도 그냥 글자로 보이게 해요 (해킹 방지)
function safeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


// ----- 서버에 요청 보내기 (모든 요청은 이 함수로) -----
async function callApi(method, url, data) {
  const options = {
    method: method,
    headers: { "Content-Type": "application/json" }
  };

  // 로그인 토큰이 있으면 같이 보내기 (서버가 누군지 알 수 있게)
  const token = localStorage.getItem("token");
  if (token) {
    options.headers["Authorization"] = "Bearer " + token;
  }
  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch("/api" + url, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || "서버 오류");
  }
  return json;
}


// ----- 처음 실행 : 서버 확인 + 자동 로그인 -----
async function initLogin() {
  try {
    await callApi("GET", "/health");
    serverOnline = true;
  } catch (e) {
    serverOnline = false;
  }

  if (!serverOnline) {
    document.getElementById("loginMsg").textContent = "서버가 꺼져 있어요. 게스트로 플레이할 수 있어요.";
    document.getElementById("loginBtn").disabled = true;
    return;
  }

  // 전에 로그인했으면 토큰으로 바로 로그인
  if (localStorage.getItem("token")) {
    try {
      loginUser = await callApi("GET", "/me");
      goTitle();
    } catch (e) {
      localStorage.removeItem("token");
    }
  }
}


// ----- 로그인 / 회원가입 탭 바꾸기 -----
function setLoginTab(tab) {
  loginTab = tab;
  document.getElementById("tabLogin").classList.toggle("selected", tab == "login");
  document.getElementById("tabRegister").classList.toggle("selected", tab == "register");
  document.getElementById("loginNick").classList.toggle("hidden", tab == "login");
  if (tab == "login") {
    document.getElementById("loginBtn").textContent = "로그인";
  } else {
    document.getElementById("loginBtn").textContent = "회원가입";
  }
  document.getElementById("loginMsg").textContent = "";
}


// ----- 로그인 / 회원가입 버튼 -----
async function submitLogin() {
  const username = document.getElementById("loginId").value;
  const password = document.getElementById("loginPw").value;
  const nickname = document.getElementById("loginNick").value;
  const msg = document.getElementById("loginMsg");

  try {
    let result;
    if (loginTab == "login") {
      result = await callApi("POST", "/login", { username: username, password: password });
    } else {
      result = await callApi("POST", "/register", { username: username, password: password, nickname: nickname });
    }
    localStorage.setItem("token", result.token);
    loginUser = result.user;
    goTitle();
  } catch (e) {
    msg.textContent = e.message;
  }
}

function playAsGuest() {
  loginUser = null;
  goTitle();
}

async function logout() {
  try {
    await callApi("POST", "/logout");
  } catch (e) {
    // 서버가 꺼져 있어도 그냥 로그아웃
  }
  localStorage.removeItem("token");
  location.reload();
}


// ----- 타이틀 화면으로 -----
function goTitle() {
  const bar = document.getElementById("userBar");
  if (loginUser != null) {
    bar.innerHTML = "👤 " + safeText(loginUser.nickname) + "님 " +
                    '<button class="small-btn" onclick="logout()">로그아웃</button>';
    setupNames[0] = loginUser.nickname; // 1P 이름 = 내 닉네임
    drawSetup();
  } else {
    bar.innerHTML = "👤 게스트";
  }
  showScreen("titleScreen");
}


// ----- 게임 기록 저장 (로그인한 경우만) -----
async function saveRecord(record) {
  const msg = document.getElementById("saveMsg");
  if (loginUser == null) {
    msg.textContent = "게스트는 기록이 저장되지 않아요.";
    return;
  }
  try {
    await callApi("POST", "/records", record);
    msg.textContent = "✅ " + loginUser.nickname + "님의 기록이 저장됐어요!";
  } catch (e) {
    msg.textContent = "기록 저장 실패 : " + e.message;
  }
}


// ----- 랭킹 보기 -----
async function openRanking() {
  const box = document.getElementById("rankingList");
  showScreen("rankingScreen");

  if (!serverOnline) {
    box.innerHTML = "서버가 꺼져 있어서 랭킹을 볼 수 없어요.";
    return;
  }

  box.innerHTML = "불러오는 중...";
  try {
    const list = await callApi("GET", "/ranking");
    if (list.length == 0) {
      box.innerHTML = "아직 기록이 없어요!";
      return;
    }
    let html = "";
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      html += '<div class="ranking-row">' +
              '<span>' + (i + 1) + '. ' + safeText(r.nickname) + ' <small>(' + safeText(r.job) + ')</small></span>' +
              '<b>' + r.total_money + '만원</b>' +
              '</div>';
    }
    box.innerHTML = html;
  } catch (e) {
    box.innerHTML = "랭킹을 불러오지 못했어요 : " + e.message;
  }
}
