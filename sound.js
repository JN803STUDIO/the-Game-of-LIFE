// 배경음악, 효과음
// 소리 파일 없이 Web Audio 로 음을 직접 만듦 (나중에 mp3 받으면 이 파일만 바꾸면 됨)
// sfx("coin") 효과음 / playBgm("menu") 배경음악 (menu, mini, result)

let audioCtx = null;
let musicOn = true;
let soundOn = true;
let bgmName = "";    // 지금 곡 목록 이름
let bgmSong = 0;     // 목록에서 몇 번째 곡
let bgmStep = 0;     // 몇 번째 박자
let bgmTimer = null;

// 저장해 둔 설정 (못 읽으면 그냥 켜진 상태)
try {
  musicOn = localStorage.getItem("musicOn") != "false";
  soundOn = localStorage.getItem("soundOn") != "false";
} catch (e) {
}

// 소리 기계. 브라우저는 한 번 클릭해야 소리를 켜 줌
function audio() {
  if (audioCtx == null) {
    if (!window.AudioContext) return null;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state == "suspended") audioCtx.resume();
  return audioCtx;
}

// 음 이름을 주파수로 (A4 = 440Hz, 반음 올라갈 때마다 2^(1/12) 배)
function noteFreq(note) {
  const letters = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  let semi = letters[note[0]];
  let rest = note.slice(1);
  if (rest[0] == "#") {
    semi++;
    rest = rest.slice(1);
  }
  semi += (Number(rest) - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

// 음 하나 내기 (delay 초 뒤에 length 초 동안)
// type : sine 부드러움, triangle 맑음, square 게임기 소리, sawtooth 거친 소리
// endFreq 를 넣으면 그 높이까지 미끄러짐 (휙~ 소리)
function tone(freq, delay, length, type, volume, endFreq) {
  const ctx = audio();
  if (ctx == null) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + length);
  // 살짝 커졌다가 점점 작아지게 (뚝 끊기는 소리 방지)
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.05, length / 4));
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

// "C5 E5 - G5" 처럼 적은 음을 차례대로 ("-" 는 쉼표)
function melody(notes, gap, type, volume) {
  const list = notes.split(" ");
  for (let i = 0; i < list.length; i++) {
    if (list[i] != "-") tone(noteFreq(list[i]), i * gap, gap * 1.5, type, volume);
  }
}


// ----- 효과음 -----
const sounds = {
  click: function () { tone(660, 0, 0.05, "square", 0.04); },
  pop: function () { tone(400, 0, 0.1, "sine", 0.15, 900); },
  whoosh: function () { tone(1200, 0, 0.3, "sine", 0.06, 300); },
  step: function () { tone(523, 0, 0.08, "triangle", 0.12); },
  ding: function () { tone(1047, 0, 0.4, "sine", 0.15); },
  card: function () { tone(300, 0, 0.18, "sine", 0.12, 1500); },
  lose: function () { tone(600, 0, 0.35, "triangle", 0.15, 150); },
  open: function () { melody("G3 G3 C4", 0.12, "triangle", 0.15); },
  success: function () { melody("C5 E5 G5 C6", 0.08, "triangle", 0.15); },
  great: function () { melody("C5 E5 G5 C6 E6 G6 - C7", 0.06, "triangle", 0.15); },
  fail: function () { melody("G4 F#4 F4", 0.22, "sawtooth", 0.06); },
  coin: function () { melody("B5 E6", 0.08, "square", 0.06); },
  bad: function () { melody("A2 G2", 0.25, "square", 0.08); },
  turn: function () { melody("G5 B5 D6", 0.15, "triangle", 0.13); },
  shop: function () { melody("D6 G6 - E7", 0.05, "square", 0.05); },
  guard: function () {
    tone(200, 0, 0.12, "square", 0.05, 900);
    melody("- - G6 C7", 0.05, "triangle", 0.12);
  },
  fanfare: function () {
    melody("C5 C5 C5 G5 - E5 G5 C6 - -", 0.11, "square", 0.06);
    tone(523, 0, 1.1, "triangle", 0.08);
  },
  wedding: function () {
    melody("C6 E6 G6 C7", 0.25, "sine", 0.12);
    melody("C5 - G5 - C6", 0.2, "triangle", 0.05);
  },
  baby: function () { melody("E6 C6 D6 G5 - G5 D6 E6 C6", 0.16, "sine", 0.12); },
  goal: function () {
    melody("G4 C5 E5 G5 - E5 G5 - - C6", 0.12, "square", 0.06);
    tone(262, 0, 1.4, "triangle", 0.1);
  },
  start: function () { melody("A4 - - A4 - - A5", 0.13, "square", 0.06); },
  // 룰렛 도는 소리 : 따다닥, 점점 느려짐 (약 2초)
  spin: function () {
    let time = 0;
    for (let i = 0; i < 18; i++) {
      tone(1000, time, 0.03, "square", 0.04);
      time += 0.04 + i * 0.006;
    }
  }
};

function sfx(name) {
  if (soundOn && audio() != null) sounds[name]();
}

// 룰렛 결과에 맞는 소리
function markSound(mark) {
  if (mark == "X") sfx("fail");
  else if (mark == "O") sfx("success");
  else if (mark == "◎") sfx("great");
  else sfx("ding");
}


// ----- 배경음악 -----
// 곡 하나는 16마디, 한 마디는 8박자
// melody : 한 박자에 음 하나, "-" 는 앞 음을 길게 끌기
// chords : 마디마다 반주 화음 하나, speed : 한 박자 길이(ms)
const chordNotes = {
  C: "C4 E4 G4", Am: "A3 C4 E4", F: "F3 A3 C4", G: "G3 B3 D4",
  Dm: "D4 F4 A4", Em: "E4 G4 B4", Bm: "B3 D4 F#4", D: "D4 F#4 A4",
  E: "E4 G#4 B4", Bb: "A#3 D4 F4", Gm: "G3 A#3 D4"
};

const songs = {
  spring: {   // 봄날
    speed: 300, type: "sine",
    chords: "C Am F G C Am Dm G F G Em Am Dm G C C",
    melody: "E5 - G5 - C6 - B5 A5 A5 - - - E5 - - - F5 - A5 - C6 - A5 G5 G5 - - - D5 - - - " +
      "E5 - G5 - C6 - D6 E6 C6 - A5 - E5 - - - F5 - E5 - D5 - F5 - G5 - - - - - - - " +
      "A5 - - G5 F5 - A5 - B5 - - A5 G5 - - - G5 - - F5 E5 - G5 - A5 - - - C6 - - - " +
      "D6 - C6 - A5 - F5 - G5 - A5 - B5 - D6 - C6 - - - G5 - E5 - C5 - - - - - - -"
  },
  walk: {     // 산책
    speed: 260, type: "sine",
    chords: "G Em C D G Em Am D C D Bm Em C D G G",
    melody: "B4 - D5 - G5 - - B4 E5 - D5 - B4 - - - C5 - E5 - G5 - E5 - F#5 - - - D5 - - - " +
      "G5 - F#5 - G5 - B5 - A5 - G5 - E5 - - - C5 - E5 - A5 - G5 - F#5 - - - - - D5 - " +
      "E5 - - - G5 - - - F#5 - - - A5 - - - B5 - A5 - F#5 - D5 - E5 - - - - - - - " +
      "G5 - E5 - C5 - E5 - F#5 - A5 - D6 - C6 - B5 - - - G5 - D5 - G5 - - - - - - -"
  },
  cafe: {     // 오후의 카페
    speed: 320, type: "sine",
    chords: "F Dm Bb C F Dm Gm C Bb C Am Dm Gm C F F",
    melody: "A4 - C5 - F5 - - - D5 - F5 - A5 - - - A#5 - A5 - G5 - F5 - G5 - - - - - E5 - " +
      "F5 - A5 - C6 - - - A5 - F5 - D5 - - - G5 - A#5 - D6 - C6 A#5 A5 - - - G5 - - - " +
      "F5 - - D5 F5 - A#5 - A5 - G5 - E5 - C5 - E5 - - C5 E5 - A5 - F5 - - - D5 - - - " +
      "A#4 - D5 - G5 - F5 - E5 - G5 - C6 - A#5 - A5 - - - C5 - - - F5 - - - - - - -"
  },
  night: {    // 별빛 밤
    speed: 340, type: "sine",
    chords: "Am F C G Am F G E F G C Am Dm E Am Am",
    melody: "A4 - C5 - E5 - A5 - G5 - F5 - E5 - C5 - E5 - - - G5 - - - D5 - - - - - - - " +
      "A4 - C5 - E5 - A5 - C6 - B5 - A5 - F5 - G5 - - - B5 - D6 - B5 - - - G#5 - - - " +
      "A5 - - - F5 - C6 - B5 - - - G5 - D5 - E5 - G5 - C6 - E6 - C6 - - - A5 - - - " +
      "F5 - A5 - D6 - C6 - B5 - G#5 - E5 - B4 - A4 - - - C5 - E5 - A5 - - - - - - -"
  },
  mini: {     // 미니게임 (빠르게)
    speed: 180, type: "triangle",
    chords: "Am G F E Am G F E Dm Am E Am Dm Am E E",
    melody: "A4 C5 E5 C5 A4 C5 E5 A5 G4 B4 D5 B4 G4 B4 D5 G5 F4 A4 C5 A4 F4 A4 C5 F5 E4 G#4 B4 E5 G#5 - E5 - " +
      "A5 - G5 - E5 - C5 - B4 - D5 - G5 - B5 - A5 - F5 - C5 - A4 - G#4 - B4 - E5 - - - " +
      "D5 F5 A5 F5 D5 F5 A5 D6 C6 A5 E5 A5 C6 A5 E5 C5 B4 E5 G#5 B5 G#5 E5 B4 G#4 A4 - C5 - E5 - A5 - " +
      "D6 - A5 - F5 - D5 - E5 - A5 - C6 - E6 - B5 - G#5 - E5 - B4 - G#5 - - - E5 - - -"
  },
  result: {   // 시상식, 인생 보고서
    speed: 340, type: "sine",
    chords: "C F C G Am F G C C F C G Am F G C",
    melody: "C5 - - E5 G5 - - - A5 - G5 - E5 - C5 - F5 - - A5 G5 - E5 - D5 - E5 - D5 - - - " +
      "C5 - E5 - A5 - G5 - F5 - A5 - C6 - A5 - G5 - - - B5 - D6 - C6 - - - - - - - " +
      "E5 - - G5 C6 - - - C6 - A5 - F5 - A5 - G5 - - E5 C5 - E5 - D5 - F5 - B5 - - - " +
      "A5 - G5 - E5 - C5 - F5 - A5 - C6 - D6 - B5 - - - D6 - - - C6 - - - - - - -"
  }
};

// 곡 목록 (한 곡 끝나면 다음 곡)
const playlists = {
  menu: ["spring", "walk", "cafe", "night"],
  mini: ["mini"],
  result: ["result"]
};

function nowSong() {
  const list = playlists[bgmName];
  return songs[list[bgmSong % list.length]];
}

// 같은 목록이 이미 나오고 있으면 끊지 않음
function playBgm(name) {
  if (bgmName == name) return;
  bgmName = name;
  bgmSong = Math.floor(Math.random() * playlists[name].length);
  startSong();
}

function startSong() {
  bgmStep = 0;
  clearInterval(bgmTimer);
  if (musicOn) bgmTimer = setInterval(bgmBeat, nowSong().speed);
}

// 한 박자 연주
function bgmBeat() {
  const ctx = audio();
  if (ctx == null || ctx.state != "running") return;   // 아직 클릭 전
  const song = nowSong();
  const notes = song.melody.split(" ");
  const beat = song.speed / 1000;

  if (bgmStep >= notes.length) {
    bgmSong++;
    startSong();
    return;
  }

  // 뒤에 "-" 가 몇 개 있는지 세서 그만큼 길게
  if (notes[bgmStep] != "-") {
    let length = 1;
    while (notes[bgmStep + length] == "-") {
      length++;
    }
    tone(noteFreq(notes[bgmStep]), 0, length * beat, song.type, 0.05);
  }

  // 마디 첫 박자에 반주 (화음 3개 + 한 옥타브 아래 베이스)
  if (bgmStep % 8 == 0) {
    const chord = chordNotes[song.chords.split(" ")[bgmStep / 8]].split(" ");
    for (const n of chord) {
      tone(noteFreq(n), 0, beat * 8, "sine", 0.018);
    }
    tone(noteFreq(chord[0]) / 2, 0, beat * 8, "triangle", 0.05);
  }
  bgmStep++;
}


// ----- 켜기 / 끄기 버튼 -----
function toggleMusic() {
  musicOn = !musicOn;
  if (musicOn) startSong();
  else clearInterval(bgmTimer);
  saveSound();
}

function toggleSound() {
  soundOn = !soundOn;
  saveSound();
}

function saveSound() {
  try {
    localStorage.setItem("musicOn", musicOn);
    localStorage.setItem("soundOn", soundOn);
  } catch (e) {
  }
  drawSoundBtns();
}

function drawSoundBtns() {
  const musicBtn = document.getElementById("musicBtn");
  const sfxBtn = document.getElementById("sfxBtn");
  musicBtn.textContent = "🎵";
  musicBtn.className = "";
  if (!musicOn) {
    musicBtn.textContent = "🔇";
    musicBtn.className = "off";
  }
  sfxBtn.textContent = "🔊";
  sfxBtn.className = "";
  if (!soundOn) {
    sfxBtn.textContent = "🔈";
    sfxBtn.className = "off";
  }
}

// 버튼 누르면 딸깍 (버튼 안의 글자를 눌러도)
document.addEventListener("click", function (e) {
  audio();
  const target = e.target;
  if (target.tagName == "BUTTON") sfx("click");
  else if (target.parentElement != null && target.parentElement.tagName == "BUTTON") sfx("click");
});

drawSoundBtns();
playBgm("menu");
