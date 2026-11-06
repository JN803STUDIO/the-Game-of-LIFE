// =====================================================
// 서버(FastAPI + MySQL) 연결 : 로그인 · 기록 저장 · 랭킹

// async / await 란?
// 서버에 요청을 보내면 답이 오기까지 시간이 걸려요.
// await 를 붙이면 "답이 올 때까지 기다렸다가" 다음 줄을 실행해요.
// await 를 쓰는 함수 앞에는 async 를 붙여야 해요.

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
    let message = "서버 오류";
    if (json.detail) message = json.detail;
    throw new Error(message);
  }
  return json;
}


// ----- 처음 실행 : 서버 확인 + 자동 로그인 -----
async function initLogin() {
  addEyeButtons();
  // 게임 중 "홈으로" 를 누르고 새로고침한 경우 : 로그인 화면 건너뛰고 타이틀로
  const toTitle = sessionStorage.getItem("goTitle") == "1";
  sessionStorage.removeItem("goTitle");
  try {
    await callApi("GET", "/health");
    serverOnline = true;
  } catch (e) {
    serverOnline = false;
  }

  if (!serverOnline) {
    document.getElementById("loginMsg").textContent = "서버가 꺼져 있어요. 게스트로 플레이할 수 있어요.";
    document.getElementById("loginBtn").disabled = true;
    if (toTitle) goTitle();
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
  if (loginUser == null && toTitle) goTitle();
}


// ----- 로그인 / 회원가입 탭 바꾸기 -----
function setLoginTab(tab) {
  loginTab = tab;
  document.getElementById("tabLogin").classList.toggle("selected", tab == "login");
  document.getElementById("tabRegister").classList.toggle("selected", tab == "register");
  for (const id of ["loginNick", "loginEmailRow", "loginCode", "loginPw2Box"]) {
    document.getElementById(id).classList.toggle("hidden", tab == "login");
  }
  document.getElementById("findLinks").classList.toggle("hidden", tab == "register");
  const idBox = document.getElementById("loginId");
  if (tab == "login") {
    document.getElementById("loginBtn").textContent = "로그인";
    idBox.placeholder = "아이디 또는 이메일";
    idBox.maxLength = 100;
  } else {
    document.getElementById("loginBtn").textContent = "회원가입";
    idBox.placeholder = "아이디";
    idBox.maxLength = 30;
  }
  setMsg("loginMsg", "");
}


// ----- 안내 문구 (ok = true 면 초록색) -----
function setMsg(id, text, ok) {
  const msg = document.getElementById(id);
  msg.textContent = text;
  msg.classList.toggle("ok", ok == true);
}


// ----- 눈 버튼 : 비밀번호 보이기 / 숨기기 -----
// .pw-box 안의 비밀번호 칸마다 회색 선으로 그린 눈 버튼을 붙여요
const EYE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>' +
                '<circle cx="12" cy="12" r="3"/><line class="eye-slash" x1="4" y1="20" x2="20" y2="4"/></svg>';

function addEyeButtons() {
  for (const box of document.querySelectorAll(".pw-box")) {
    const input = box.querySelector("input");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "eye-btn";
    btn.setAttribute("aria-label", "비밀번호 보기");
    btn.innerHTML = EYE_SVG;
    btn.onclick = function () { togglePw(input.id, btn); };
    box.appendChild(btn);
  }
}

function togglePw(id, btn) {
  const box = document.getElementById(id);
  const show = box.type == "password";
  box.type = show ? "text" : "password";
  btn.classList.toggle("shown", show);   // 보일 때는 빗금 없는 눈
  btn.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 보기");
}


// ----- 로그인 / 회원가입 버튼 -----
async function submitLogin() {
  const username = document.getElementById("loginId").value;
  const password = document.getElementById("loginPw").value;
  const nickname = document.getElementById("loginNick").value;
  const email = document.getElementById("loginEmail").value;
  const password2 = document.getElementById("loginPw2").value;
  const code = document.getElementById("loginCode").value;

  if (loginTab == "register" && password != password2) {
    setMsg("loginMsg", "비밀번호가 서로 달라요. 다시 확인해 주세요.");
    return;
  }

  try {
    let result;
    if (loginTab == "login") {
      result = await callApi("POST", "/login", { username: username, password: password });
    } else {
      result = await callApi("POST", "/register", { username: username, email: email, code: code, password: password, nickname: nickname });
    }
    localStorage.setItem("token", result.token);
    loginUser = result.user;
    goTitle();
  } catch (e) {
    setMsg("loginMsg", e.message);
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


// ----- 인증번호 받기 버튼 (보내고 나면 1분 동안 잠그기) -----
async function sendCode(btn, url, data, msgId, after) {
  try {
    btn.disabled = true;
    await callApi("POST", url, data);
    setMsg(msgId, "인증번호를 보냈어요. 메일함을 확인해 주세요. (10분 안에 입력)", true);
    if (after) after();
    let left = 60;
    btn.textContent = left + "초 뒤 다시";
    const timer = setInterval(function () {
      left--;
      btn.textContent = left + "초 뒤 다시";
      if (left <= 0) {
        clearInterval(timer);
        btn.textContent = "인증번호 받기";
        btn.disabled = false;
      }
    }, 1000);
  } catch (e) {
    btn.disabled = false;
    setMsg(msgId, e.message);
  }
}

function sendRegisterCode(btn) {
  sendCode(btn, "/email-code", { email: document.getElementById("loginEmail").value }, "loginMsg");
}


// ----- 아이디 찾기 / 비밀번호 찾기 -----
function openFind(id) {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
  setMsg("findIdMsg", "");
  setMsg("findPwMsg", "");
}

function closeFind() {
  document.getElementById("findIdBox").classList.add("hidden");
  document.getElementById("findPwBox").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

async function findId() {
  try {
    await callApi("POST", "/find-id", { email: document.getElementById("findIdEmail").value });
    setMsg("findIdMsg", "가입한 이메일로 아이디를 보냈어요. 메일함을 확인해 주세요.", true);
  } catch (e) {
    setMsg("findIdMsg", e.message);
  }
}

function sendResetCode(btn) {
  sendCode(btn, "/password-code", {
    username: document.getElementById("findPwId").value,
    email: document.getElementById("findPwEmail").value
  }, "findPwMsg");
}

async function resetPassword() {
  const pw = document.getElementById("findPwNew").value;
  if (pw != document.getElementById("findPwNew2").value) {
    setMsg("findPwMsg", "새 비밀번호가 서로 달라요. 다시 확인해 주세요.");
    return;
  }
  try {
    await callApi("POST", "/password-reset", {
      username: document.getElementById("findPwId").value,
      email: document.getElementById("findPwEmail").value,
      code: document.getElementById("findPwCode").value,
      new_password: pw
    });
    closeFind();
    setLoginTab("login");
    document.getElementById("loginId").value = document.getElementById("findPwId").value;
    setMsg("loginMsg", "비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.", true);
  } catch (e) {
    setMsg("findPwMsg", e.message);
  }
}


// ----- 내 정보 (정보 수정 · 회원탈퇴) -----
function openAccount() {
  document.getElementById("accId").textContent = loginUser.username;
  document.getElementById("accNick").value = loginUser.nickname;
  document.getElementById("accEmail").value = loginUser.email;
  for (const id of ["accCode", "accNewPw", "accNewPw2", "accPw", "delPw"]) {
    document.getElementById(id).value = "";
  }
  accEmailChanged();
  setMsg("accMsg", "");
  setMsg("delMsg", "");
  resetDeleteButton();
  showScreen("accountScreen");
}

// 이메일을 바꾸면 인증번호 버튼과 칸 보이기
function accEmailChanged() {
  const changed = document.getElementById("accEmail").value.trim().toLowerCase() != loginUser.email;
  document.getElementById("accCodeBtn").classList.toggle("hidden", !changed);
  document.getElementById("accCode").classList.toggle("hidden", !changed);
}

function sendChangeCode(btn) {
  sendCode(btn, "/me/email-code", { email: document.getElementById("accEmail").value }, "accMsg");
}

async function saveAccount() {
  const newPw = document.getElementById("accNewPw").value;
  if (newPw != document.getElementById("accNewPw2").value) {
    setMsg("accMsg", "새 비밀번호가 서로 달라요. 다시 확인해 주세요.");
    return;
  }
  try {
    loginUser = await callApi("POST", "/me/update", {
      current_password: document.getElementById("accPw").value,
      nickname: document.getElementById("accNick").value,
      email: document.getElementById("accEmail").value,
      code: document.getElementById("accCode").value,
      new_password: newPw
    });
    drawUserBar();
    openAccount();
    setMsg("accMsg", "저장했어요!", true);
  } catch (e) {
    setMsg("accMsg", e.message);
  }
}

// 탈퇴는 실수로 누르지 않게 두 번 눌러야 해요
function resetDeleteButton() {
  const btn = document.getElementById("delBtn");
  btn.dataset.sure = "";
  btn.textContent = "회원탈퇴";
}

async function deleteAccount() {
  const btn = document.getElementById("delBtn");
  const password = document.getElementById("delPw").value;
  if (!password) {
    setMsg("delMsg", "현재 비밀번호를 입력해 주세요.");
    return;
  }
  if (btn.dataset.sure != "1") {
    btn.dataset.sure = "1";
    btn.textContent = "정말 탈퇴할까요? 한 번 더 누르면 탈퇴돼요";
    return;
  }
  try {
    await callApi("POST", "/me/delete", { password: password });
    localStorage.removeItem("token");
    location.reload();
  } catch (e) {
    resetDeleteButton();
    setMsg("delMsg", e.message);
  }
}


// ----- 위쪽 사용자 표시줄 -----
function drawUserBar() {
  const bar = document.getElementById("userBar");
  if (loginUser != null) {
    bar.innerHTML = "👤 " + safeText(loginUser.nickname) + "님 " +
                    '<button class="small-btn" onclick="openAccount()">내 정보</button> ' +
                    '<button class="small-btn" onclick="logout()">로그아웃</button>';
  } else {
    bar.innerHTML = "👤 게스트";
  }
}


// ----- 타이틀 화면으로 -----
function goTitle() {
  drawUserBar();
  drawSaveList();
  if (loginUser != null) {
    setupNames[0] = loginUser.nickname; // 1P 이름 = 내 닉네임
    drawSetup();
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
