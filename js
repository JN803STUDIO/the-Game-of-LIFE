/* =====================================================================
   script.js : 인생게임 - 방 만들기 / 방 참가 / 대기실

   * index.html(메인 화면)과 lobby.html(대기실)이 이 파일을 함께 써요.
   * 서버는 없어요. 방 코드는 브라우저의 localStorage(저장 공간)에 저장해요.
   * 주의! localStorage는 "같은 브라우저" 안에서만 공유돼요.
     그래서 다른 컴퓨터나 다른 브라우저에서는 방 코드로 참가할 수 없어요.
     (같은 브라우저의 새 탭에서는 참가하는 연습을 해볼 수 있어요.)
   ===================================================================== */


/* =====================================================================
   1. 두 페이지에서 같이 쓰는 것들
   ===================================================================== */

// localStorage에 방 코드를 저장할 때 붙이는 이름표(key)예요.
// 오타를 막으려고 한 곳에만 적어 두고 가져다 써요.
const ROOM_CODE_KEY = 'roomCode';

// "4자리 숫자"인지 검사하는 함수예요.
//   "1024" → true,  "12a4" → false,  "123" → false
function isFourDigits(text) {
  // 글자 수가 4개가 아니면 바로 false
  if (text.length !== 4) {
    return false;
  }

  // 글자를 하나씩 꺼내서 0~9 사이의 숫자인지 확인해요.
  for (let i = 0; i < text.length; i++) {
    const oneChar = text.charAt(i);   // i번째 글자 하나
    if (oneChar < '0' || oneChar > '9') {
      return false;                   // 숫자가 아닌 글자를 발견!
    }
  }

  // 끝까지 통과했다면 4자리 숫자가 맞아요.
  return true;
}


/* =====================================================================
   2. 메인 화면 (index.html)
   ===================================================================== */

// 1000 ~ 9999 사이의 랜덤 숫자를 만들어서 "문자열"로 돌려줘요.
function makeRoomCode() {
  // Math.random()          → 0 이상 1 미만의 소수 (예: 0.37)
  // Math.random() * 9000   → 0 이상 9000 미만 (예: 3330.4)
  // Math.floor(...)        → 소수점을 버림     (예: 3330)
  // + 1000                 → 1000 ~ 9999 (항상 4자리!)
  const number = Math.floor(Math.random() * 9000) + 1000;

  // 숫자를 글자로 바꿔요. (localStorage에는 글자로 저장되기 때문이에요)
  return String(number);
}

// [방 만들기] 버튼을 눌렀을 때 실행돼요.
function createRoom() {
  // 1) 새 방 코드를 만들어요.
  const roomCode = makeRoomCode();

  // 2) localStorage에 저장해요.  setItem(이름표, 값)
  //    (이미 저장된 코드가 있으면 새 코드로 덮어써요.)
  localStorage.setItem(ROOM_CODE_KEY, roomCode);

  // 3) 대기실 페이지로 이동해요.
  location.href = 'lobby.html';
}

// [참가하기] 버튼을 눌렀을 때 실행돼요.
function joinRoom() {
  const codeInput = document.getElementById('roomCodeInput');

  // 입력한 값을 가져와요. trim()은 앞뒤 공백을 지워 줘요.
  const enteredCode = codeInput.value.trim();

  // 1) 4자리 숫자가 아니면 안내하고 끝내요.
  if (!isFourDigits(enteredCode)) {
    alert('방 코드는 4자리 숫자예요. 다시 입력해주세요!');
    codeInput.focus();                  // 입력창으로 커서를 돌려놓기
    return;                             // 여기서 함수를 끝내요.
  }

  // 2) 저장된 방 코드를 가져와요.  getItem(이름표)
  //    저장된 게 없으면 null 이 나와요.
  const savedCode = localStorage.getItem(ROOM_CODE_KEY);

  // 3) 아직 만들어진 방이 없는 경우
  if (savedCode === null) {
    alert('아직 만들어진 방이 없어요. 먼저 [방 만들기]를 눌러주세요!');
    return;
  }

  // 4) 입력한 코드와 저장된 코드를 비교해요.
  if (enteredCode === savedCode) {
    location.href = 'lobby.html';       // 같으면 대기실로 이동!
  } else {
    alert('방 코드가 맞지 않아요. 다시 확인해주세요!');
    codeInput.select();                 // 입력한 글자를 선택해 두면 바로 다시 쓸 수 있어요.
  }
}

// 메인 화면이 열렸을 때 버튼들을 연결해요.
function setupMainPage() {
  const createButton = document.getElementById('createRoomBtn');
  const joinButton = document.getElementById('joinRoomBtn');
  const codeInput = document.getElementById('roomCodeInput');

  // 버튼을 클릭하면 위에서 만든 함수가 실행돼요.
  createButton.addEventListener('click', createRoom);
  joinButton.addEventListener('click', joinRoom);

  // 입력창에서 Enter 키를 눌러도 참가할 수 있게 해요.
  codeInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      joinRoom();
    }
  });
}


/* =====================================================================
   3. 대기실 (lobby.html)
   ===================================================================== */

// 캐릭터 목록이에요. 캐릭터를 바꾸거나 늘리고 싶으면 여기를 고치면 돼요.
//   이름표(baby, child ...) : lobby.html 버튼의 data-character 값과 같아야 해요.
//   name   : 화면에 보여줄 이름
//   male   : 남자일 때 보여줄 이모지
//   female : 여자일 때 보여줄 이모지
const CHARACTERS = {
  baby:   { name: '아기',   male: '👶', female: '👶' },   // 아기 이모지는 남/여 구분이 없어요
  child:  { name: '어린이', male: '👦', female: '👧' },
  adult:  { name: '어른',   male: '👨', female: '👩' },
  senior: { name: '어르신', male: '👴', female: '👵' }
};

// 성별 이름표(male, female)를 화면에 보여줄 글자로 바꿔 줘요.
const GENDER_NAMES = { male: '남자', female: '여자' };

// 지금 선택한 값들을 기억하는 변수예요. (처음에는 남자 + 어른)
let selectedGender = 'male';
let selectedCharacter = 'adult';

// 이 방의 코드 (setupLobbyPage에서 채워 줘요)
let currentRoomCode = '';

// "남자 · 어른" 같은 글자를 만들어 줘요.
function getMyCharacterText() {
  return GENDER_NAMES[selectedGender] + ' · ' + CHARACTERS[selectedCharacter].name;
}

// 버튼 하나를 "선택됨 / 선택 안 됨" 상태로 바꿔요.
function setSelected(button, isSelected) {
  if (isSelected) {
    button.classList.add('selected');            // 파란 테두리 (style.css의 .selected)
    button.setAttribute('aria-pressed', 'true'); // 화면 읽기 프로그램용 표시
  } else {
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
  }
}

// ★ 화면을 "지금 선택한 값"에 맞게 다시 그려요. ★
// 성별이나 캐릭터를 바꿀 때마다 이 함수를 불러서 화면을 한꺼번에 갱신해요.
//   (변수를 바꾸고 → 화면 갱신, 이 순서만 기억하면 돼요!)
function updateScreen() {
  const character = CHARACTERS[selectedCharacter];

  // 1) 가운데 미리보기 바꾸기
  //    character[selectedGender] → character['male'] 또는 character['female']
  document.getElementById('previewEmoji').textContent = character[selectedGender];
  document.getElementById('previewText').textContent = getMyCharacterText();

  // 2) 성별 버튼 : 지금 고른 성별 버튼에만 selected 표시
  const genderButtons = document.getElementsByClassName('gender-btn');
  for (let i = 0; i < genderButtons.length; i++) {
    const button = genderButtons[i];
    const buttonGender = button.getAttribute('data-gender');   // 'male' 또는 'female'
    setSelected(button, buttonGender === selectedGender);
  }

  // 3) 캐릭터 버튼 : 이모지·이름을 채우고, 고른 캐릭터에만 selected 표시
  //    성별을 바꾸면 버튼 속 이모지도 같이 바뀌어요. (예: 👦 → 👧)
  const characterButtons = document.getElementsByClassName('character-btn');
  for (let i = 0; i < characterButtons.length; i++) {
    const button = characterButtons[i];
    const characterId = button.getAttribute('data-character'); // 'baby', 'child' ...
    const info = CHARACTERS[characterId];

    button.getElementsByClassName('choice-emoji')[0].textContent = info[selectedGender];
    button.getElementsByClassName('choice-name')[0].textContent = info.name;
    setSelected(button, characterId === selectedCharacter);
  }
}

// 성별 버튼을 눌렀을 때 실행돼요.
function handleGenderClick() {
  // 여기서 this 는 "방금 클릭한 버튼"이에요.
  selectedGender = this.getAttribute('data-gender');
  updateScreen();
}

// 캐릭터 버튼을 눌렀을 때 실행돼요.
function handleCharacterClick() {
  selectedCharacter = this.getAttribute('data-character');
  updateScreen();
}

// [게임 시작] 버튼을 눌렀을 때 실행돼요.
function startGame() {
  const emoji = CHARACTERS[selectedCharacter][selectedGender];

  // \n 은 줄바꿈이에요.
  alert('게임을 시작합니다!\n\n방 코드: ' + currentRoomCode + '\n내 캐릭터: ' + emoji + ' ' + getMyCharacterText());
}

// 대기실이 열렸을 때 필요한 준비를 해요.
function setupLobbyPage() {
  // 1) 저장된 방 코드를 가져와요.
  const roomCode = localStorage.getItem(ROOM_CODE_KEY);

  // 방 코드가 없거나 이상하면(예: 주소창에 lobby.html 을 바로 입력) 처음 화면으로 돌려보내요.
  if (roomCode === null || !isFourDigits(roomCode)) {
    alert('방 코드를 찾을 수 없어요. 처음 화면에서 방을 만들거나 참가해주세요!');
    location.href = 'index.html';
    return;   // 이동을 시작해도 아래 코드가 계속 실행되니까, 여기서 끝내요.
  }

  // 2) 방 코드를 화면 맨 위에 보여줘요.
  currentRoomCode = roomCode;
  document.getElementById('roomCodeText').textContent = roomCode;

  // 3) 성별 버튼 2개에 클릭 기능을 붙여요.
  const genderButtons = document.getElementsByClassName('gender-btn');
  for (let i = 0; i < genderButtons.length; i++) {
    genderButtons[i].addEventListener('click', handleGenderClick);
  }

  // 4) 캐릭터 버튼 4개에 클릭 기능을 붙여요.
  const characterButtons = document.getElementsByClassName('character-btn');
  for (let i = 0; i < characterButtons.length; i++) {
    characterButtons[i].addEventListener('click', handleCharacterClick);
  }

  // 5) [게임 시작] 버튼에 클릭 기능을 붙여요.
  document.getElementById('startGameBtn').addEventListener('click', startGame);

  // 6) 처음 화면(남자 + 어른)을 그려요.
  updateScreen();
}


/* =====================================================================
   4. 시작 지점 : 지금 열린 페이지에 맞는 준비 함수를 실행해요.
      (index.html 의 <body id="mainPage">, lobby.html 의 <body id="lobbyPage">)
   ===================================================================== */

const pageName = document.body.id;

if (pageName === 'mainPage') {
  setupMainPage();
} else if (pageName === 'lobbyPage') {
  setupLobbyPage();
}
