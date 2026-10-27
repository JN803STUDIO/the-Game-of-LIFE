// =====================================================
// 🎵 sound.js : 배경음악(BGM) + 🔊 효과음
//   소리 파일 없이, 브라우저의 Web Audio 로 음(도레미)을 직접 만들어요.
//   나중에 디자인팀이 mp3 를 주면 이 파일만 바꾸면 돼요.
//
//   쓰는 법 : sfx("coin")      → 효과음 한 번
//            playBgm("game")  → 배경음악 바꾸기
// =====================================================

let audioCtx = null;   // 소리를 만드는 기계 (처음 클릭할 때 켜져요)
let musicOn = true;    // 🎵 배경음악 켜짐?
let soundOn = true;    // 🔊 효과음 켜짐?
let bgmName = "";      // 지금 나오는 배경음악 이름
let bgmTimer = null;   // 배경음악 박자 타이머
let bgmStep = 0;       // 배경음악 몇 번째 박자인지

// 저장해 둔 설정 불러오기 (없거나 막혀 있으면 그냥 켜진 상태)
try {
  musicOn = localStorage.getItem("musicOn") != "off";
  soundOn = localStorage.getItem("soundOn") != "off";
} catch (e) {
  // 저장소를 못 쓰는 브라우저
}


// ----- 1. 소리 기계 -----
function audio() {
  if (audioCtx == null) {
    if (!window.AudioContext) {
      return null; // 소리를 지원 안 하는 환경
    }
    audioCtx = new AudioContext();
  }
  // 브라우저는 사용자가 한 번 클릭해야 소리를 켜 줘요
  if (audioCtx.state == "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// 음 이름 → 주파수 (예: "A4" = 440Hz, "C#5")
function noteFreq(note) {
  const letters = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  let semi = letters[note[0]];
  let rest = note.slice(1);
  if (rest[0] == "#") {
    semi++;
    rest = rest.slice(1);
  }
  const octave = Number(rest);
  semi += (octave - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

// 음 하나 내기
//   freq : 주파수, delay : 몇 초 뒤에, length : 몇 초 동안
//   type : 소리 모양 ("sine" 부드러움 / "triangle" 맑음 / "square" 게임기 / "sawtooth" 거침)
function tone(freq, delay, length, type, volume) {
  const ctx = audio();
  if (ctx == null) {
    return;
  }
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // 처음엔 크게 → 점점 작게 (뚝 끊기지 않게)
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

// 음이 쭉 올라가거나 내려가는 소리 (휙~)
function sweep(from, to, delay, length, type, volume) {
  const ctx = audio();
  if (ctx == null) {
    return;
  }
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + length);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

// 멜로디 연주 : "C5 E5 G5 - C6" ("-" 는 쉼표), gap = 음 사이 간격(초)
function melody(notes, gap, type, volume) {
  const list = notes.split(" ");
  for (let i = 0; i < list.length; i++) {
    if (list[i] != "-") {
      tone(noteFreq(list[i]), i * gap, gap * 1.5, type, volume);
    }
  }
}


// ----- 2. 🔊 효과음 (종류별로 다른 소리) -----
const sounds = {
  // 버튼 누름 : 짧은 딸깍
  click: function () {
    tone(660, 0, 0.05, "square", 0.04);
  },
  // 한 칸 이동 : 통
  step: function () {
    tone(523, 0, 0.08, "triangle", 0.12);
  },
  // 룰렛 돌아가는 소리 : 따다다닥... 점점 느려져요 (약 2초)
  spin: function () {
    let time = 0;
    for (let i = 0; i < 18; i++) {
      tone(1000, time, 0.03, "square", 0.04);
      time += 0.04 + i * 0.006;
    }
  },
  // 룰렛 결과 (보통) : 띵
  ding: function () {
    tone(1047, 0, 0.4, "sine", 0.15);
  },
  // 성공 (O) : 도미솔도~
  success: function () {
    melody("C5 E5 G5 C6", 0.08, "triangle", 0.15);
  },
  // 대성공 (◎) : 더 높고 반짝반짝
  great: function () {
    melody("C5 E5 G5 C6 E6 G6", 0.06, "triangle", 0.15);
    tone(2093, 0.4, 0.5, "sine", 0.08);
  },
  // 실패 (X) : 뿌우~ 뿌우~
  fail: function () {
    melody("G4 F#4 F4", 0.22, "sawtooth", 0.06);
  },
  // 돈 받기 : 띠링 (동전)
  coin: function () {
    tone(988, 0, 0.08, "square", 0.06);
    tone(1319, 0.08, 0.3, "square", 0.06);
  },
  // 돈 잃기 : 뚜루루 내려가는 소리
  lose: function () {
    sweep(600, 150, 0, 0.35, "triangle", 0.15);
  },
  // 대출 / 나쁜 일 : 부-웅 (낮은 경고음)
  bad: function () {
    tone(110, 0, 0.25, "square", 0.08);
    tone(98, 0.25, 0.4, "square", 0.08);
  },
  // 내 차례 : 띵동
  turn: function () {
    tone(784, 0, 0.2, "triangle", 0.12);
    tone(1047, 0.15, 0.3, "triangle", 0.12);
  },
  // 카드 : 휙!
  card: function () {
    sweep(300, 1500, 0, 0.18, "sine", 0.12);
  },
  // 상점 구입 : 착-칭!
  shop: function () {
    tone(1200, 0, 0.05, "square", 0.05);
    tone(1600, 0.05, 0.05, "square", 0.05);
    tone(2637, 0.12, 0.5, "sine", 0.1);
  },
  // 진급 / 시상식 : 빰빰빰 빠~밤!
  fanfare: function () {
    melody("C5 C5 C5 G5 - E5 G5 C6 - -", 0.11, "square", 0.06);
    tone(523, 0, 1.1, "triangle", 0.08);
  },
  // 결혼 : 딩동댕 종소리
  wedding: function () {
    melody("C6 E6 G6 C7", 0.25, "sine", 0.12);
    melody("C5 - G5 - C6", 0.2, "triangle", 0.05);
  },
  // 아기 탄생 : 오르골
  baby: function () {
    melody("E6 C6 D6 G5 - G5 D6 E6 C6", 0.16, "sine", 0.12);
  },
  // 골인 : 길게 빰빰빠밤~
  goal: function () {
    melody("G4 C5 E5 G5 - E5 G5 - - C6", 0.12, "square", 0.06);
    tone(262, 0, 1.4, "triangle", 0.1);
  },
  // 미니게임 시작 : 준비~ 땅!
  start: function () {
    tone(440, 0, 0.15, "square", 0.06);
    tone(440, 0.4, 0.15, "square", 0.06);
    tone(880, 0.8, 0.4, "square", 0.07);
  }
};

function sfx(name) {
  if (!soundOn || audio() == null) {
    return;
  }
  sounds[name]();
}

// 룰렛 결과 글자에 맞는 효과음 (X 실패 / O 성공 / ◎ 대성공 / 나머지는 띵)
function markSound(mark) {
  if (mark == "X") {
    sfx("fail");
  } else if (mark == "O") {
    sfx("success");
  } else if (mark == "◎") {
    sfx("great");
  } else {
    sfx("ding");
  }
}


// ----- 3. 🎵 배경음악 (화면마다 다른 곡) -----
//   melody : 한 박자에 음 하나 ("-" 쉼표), bass : 4박자마다 낮은 음 하나
//   speed  : 한 박자 길이 (ms, 작을수록 빠름)
const songs = {
  // 타이틀 · 설정 화면 : 잔잔하게
  title: {
    speed: 300, type: "sine",
    melody: "E5 - G5 - C6 - G5 - A5 - G5 - E5 - - - F5 - E5 - D5 - C5 - D5 - - - G4 - - -",
    bass: "C3 C3 A2 A2 F2 F2 G2 G2"
  },
  // 게임 중 : 신나게
  game: {
    speed: 220, type: "triangle",
    melody: "C5 E5 G5 E5 C5 E5 G5 C6 A5 G5 E5 G5 A5 - G5 - F5 A5 C6 A5 G5 E5 C5 E5 D5 E5 F5 D5 C5 - - -",
    bass: "C3 C3 A2 A2 F2 F2 G2 C3"
  },
  // 미니게임 : 빠르고 긴장감 있게
  mini: {
    speed: 160, type: "square",
    melody: "A4 - C5 A4 E5 - C5 A4 G4 - B4 G4 D5 - B4 G4 F4 - A4 F4 C5 - A4 F4 E4 G#4 B4 E5 G#5 - E5 -",
    bass: "A2 A2 G2 G2 F2 F2 E2 E2"
  },
  // 시상식 · 인생 보고서 : 따뜻하게
  result: {
    speed: 340, type: "triangle",
    melody: "C5 - - E5 G5 - - - A5 - G5 - E5 - C5 - F5 - - A5 G5 - E5 - D5 - E5 - C5 - - -",
    bass: "C3 C3 F2 C3 F2 F2 G2 C3"
  }
};

function playBgm(name) {
  if (bgmName == name) {
    return; // 이미 나오는 곡
  }
  bgmName = name;
  bgmStep = 0;
  clearInterval(bgmTimer);
  bgmTimer = null;
  if (musicOn) {
    bgmTimer = setInterval(bgmBeat, songs[name].speed);
  }
}

// 한 박자 연주
function bgmBeat() {
  const ctx = audio();
  if (ctx == null || ctx.state != "running") {
    return; // 아직 클릭 전이라 소리를 못 내요
  }
  const song = songs[bgmName];
  const notes = song.melody.split(" ");
  const bass = song.bass.split(" ");
  const beat = song.speed / 1000; // 초 단위

  const note = notes[bgmStep % notes.length];
  if (note != "-") {
    tone(noteFreq(note), 0, beat * 1.6, song.type, 0.035);
  }
  if (bgmStep % 4 == 0) {
    const low = bass[Math.floor(bgmStep / 4) % bass.length];
    tone(noteFreq(low), 0, beat * 4, "triangle", 0.06);
  }
  bgmStep++;
}


// ----- 4. 켜기 / 끄기 버튼 -----
function toggleMusic() {
  musicOn = !musicOn;
  const name = bgmName;
  bgmName = "";
  clearInterval(bgmTimer);
  bgmTimer = null;
  if (musicOn) {
    playBgm(name); // 같은 곡 처음부터 다시
  } else {
    bgmName = name;
  }
  saveSound();
}

function toggleSound() {
  soundOn = !soundOn;
  saveSound();
  sfx("click");
}

function saveSound() {
  try {
    localStorage.setItem("musicOn", musicOn ? "on" : "off");
    localStorage.setItem("soundOn", soundOn ? "on" : "off");
  } catch (e) {
    // 저장 못 해도 괜찮아요
  }
  drawSoundBtns();
}

function drawSoundBtns() {
  const musicBtn = document.getElementById("musicBtn");
  const sfxBtn = document.getElementById("sfxBtn");
  if (musicBtn == null) {
    return;
  }
  musicBtn.textContent = musicOn ? "🎵" : "🔇";
  musicBtn.title = musicOn ? "배경음악 끄기" : "배경음악 켜기";
  musicBtn.className = musicOn ? "" : "off";
  sfxBtn.textContent = soundOn ? "🔊" : "🔈";
  sfxBtn.title = soundOn ? "효과음 끄기" : "효과음 켜기";
  sfxBtn.className = soundOn ? "" : "off";
}

// 아무 버튼이나 누르면 딸깍 + (처음 클릭 때) 소리 기계 켜기
document.addEventListener("click", function (e) {
  audio();
  if (e.target.closest && e.target.closest("button") && e.target.closest("#soundBox") == null) {
    sfx("click");
  }
});

drawSoundBtns();
playBgm("title");
