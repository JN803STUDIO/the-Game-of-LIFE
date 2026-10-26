// =====================================================
// 지도 데이터 (자동 생성 + 직접 수정 가능)
//   x, y  : 칸의 위치 (지도 왼쪽 위가 0, 0)
//   type  : 칸 종류 (good 좋은 일 / bad 나쁜 일 / normal 보통 / event 선택 이벤트
//           pay 월급날 / fork 갈림길 / life 인생 이벤트(무조건 멈춤) / start / goal)
//   area  : 지역 (어떤 지역 이야기가 나올지 정함 → events.js)
//   next  : 다음 칸 번호 (2개면 갈림길)
// =====================================================
const MAP_WIDTH = 2300;
const MAP_HEIGHT = 1540;

const tiles = [
  { id: 0, x: 110, y: 200, type: "start", area: "baby", next: [1] },

  // ----- 아기 -----
  { id: 1, x: 192, y: 200, type: "normal", area: "baby", next: [2] },
  { id: 2, x: 274, y: 200, type: "good", area: "baby", next: [3] },
  { id: 3, x: 356, y: 200, type: "card", area: "baby", next: [4] },
  { id: 4, x: 438, y: 200, type: "normal", area: "baby", next: [5] },
  { id: 5, x: 520, y: 200, type: "life", area: "toddler", life: "talent", next: [6] },

  // ----- 유아 -----
  { id: 6, x: 597, y: 183, type: "normal", area: "toddler", next: [7] },
  { id: 7, x: 673, y: 167, type: "good", area: "toddler", next: [8] },
  { id: 8, x: 750, y: 150, type: "event", area: "toddler", next: [9] },
  { id: 9, x: 827, y: 167, type: "bad", area: "toddler", next: [10] },
  { id: 10, x: 903, y: 183, type: "normal", area: "toddler", next: [11] },
  { id: 11, x: 980, y: 200, type: "life", area: "kinder", life: "kinder", next: [12] },

  // ----- 유치원 -----
  { id: 12, x: 1057, y: 217, type: "good", area: "kinder", next: [13] },
  { id: 13, x: 1133, y: 233, type: "normal", area: "kinder", next: [14] },
  { id: 14, x: 1210, y: 250, type: "event", area: "kinder", next: [15] },
  { id: 15, x: 1287, y: 233, type: "bad", area: "kinder", next: [16] },
  { id: 16, x: 1363, y: 217, type: "card", area: "kinder", next: [17] },
  { id: 17, x: 1440, y: 200, type: "life", area: "elem", life: "elem", next: [18] },

  // ----- 초등학교 -----
  { id: 18, x: 1520, y: 200, type: "normal", area: "elem", next: [19] },
  { id: 19, x: 1600, y: 200, type: "good", area: "elem", next: [20] },
  { id: 20, x: 1680, y: 200, type: "fork", area: "elem", fork: "f0", next: [21, 29] },

  // ----- 초등학교 - 학원 길 -----
  { id: 21, x: 1771, y: 171, type: "event", area: "academy", next: [22] },
  { id: 22, x: 1861, y: 142, type: "normal", area: "academy", next: [23] },
  { id: 23, x: 1945, y: 162, type: "bad", area: "academy", next: [24] },
  { id: 24, x: 2022, y: 217, type: "good", area: "academy", next: [25] },
  { id: 25, x: 2099, y: 272, type: "normal", area: "academy", next: [26] },
  { id: 26, x: 2177, y: 328, type: "card", area: "academy", next: [27] },
  { id: 27, x: 2138, y: 411, type: "good", area: "academy", next: [28] },
  { id: 28, x: 2094, y: 496, type: "normal", area: "academy", next: [33] },

  // ----- 초등학교 - 운동장 길 -----
  { id: 29, x: 1732, y: 296, type: "good", area: "play", next: [30] },
  { id: 30, x: 1785, y: 392, type: "normal", area: "play", next: [31] },
  { id: 31, x: 1866, y: 462, type: "event", area: "play", next: [32] },
  { id: 32, x: 1958, y: 521, type: "good", area: "play", next: [33] },
  { id: 33, x: 2050, y: 580, type: "life", area: "middle", life: "middle", next: [34] },

  // ----- 중학교 -----
  { id: 34, x: 1964, y: 563, type: "normal", area: "middle", next: [35] },
  { id: 35, x: 1877, y: 545, type: "good", area: "middle", next: [36] },
  { id: 36, x: 1791, y: 528, type: "event", area: "middle", next: [37] },
  { id: 37, x: 1705, y: 532, type: "bad", area: "middle", next: [38] },
  { id: 38, x: 1620, y: 555, type: "card", area: "middle", next: [39] },
  { id: 39, x: 1535, y: 577, type: "good", area: "middle", next: [40] },
  { id: 40, x: 1450, y: 600, type: "life", area: "high", life: "high", next: [41] },

  // ----- 고등학교 -----
  { id: 41, x: 1351, y: 617, type: "normal", area: "high", next: [42] },
  { id: 42, x: 1253, y: 634, type: "bad", area: "high", next: [43] },
  { id: 43, x: 1154, y: 651, type: "event", area: "high", next: [44] },
  { id: 44, x: 1056, y: 652, type: "good", area: "high", next: [45] },
  { id: 45, x: 957, y: 635, type: "normal", area: "high", next: [46] },
  { id: 46, x: 859, y: 617, type: "life", area: "high", life: "exam", next: [47] },
  { id: 47, x: 760, y: 600, type: "fork", area: "high", fork: "f1", next: [48, 56] },

  // ----- 대학교 길 -----
  { id: 48, x: 662, y: 558, type: "life", area: "college", life: "college", next: [49] },
  { id: 49, x: 563, y: 516, type: "normal", area: "college", next: [50] },
  { id: 50, x: 465, y: 487, type: "event", area: "college", next: [51] },
  { id: 51, x: 370, y: 535, type: "good", area: "college", next: [52] },
  { id: 52, x: 274, y: 583, type: "love", area: "college", next: [53] },
  { id: 53, x: 204, y: 644, type: "normal", area: "college", next: [54] },
  { id: 54, x: 223, y: 749, type: "good", area: "college", next: [55] },
  { id: 55, x: 241, y: 855, type: "event", area: "college", next: [61] },

  // ----- 바로 취업 길 -----
  { id: 56, x: 679, y: 663, type: "normal", area: "work", next: [57] },
  { id: 57, x: 597, y: 725, type: "bad", area: "work", next: [58] },
  { id: 58, x: 516, y: 788, type: "good", area: "work", next: [59] },
  { id: 59, x: 431, y: 846, type: "event", area: "work", next: [60] },
  { id: 60, x: 345, y: 903, type: "card", area: "work", next: [61] },
  { id: 61, x: 260, y: 960, type: "life", area: "young", life: "job", next: [62] },

  // ----- 성인 초반 -----
  { id: 62, x: 347, y: 942, type: "pay", area: "young", next: [63] },
  { id: 63, x: 434, y: 924, type: "work", area: "young", next: [64] },
  { id: 64, x: 521, y: 907, type: "love", area: "young", next: [65] },
  { id: 65, x: 607, y: 889, type: "bad", area: "young", next: [66] },
  { id: 66, x: 693, y: 895, type: "event", area: "young", next: [67] },
  { id: 67, x: 777, y: 923, type: "pay", area: "young", next: [68] },
  { id: 68, x: 861, y: 952, type: "normal", area: "young", next: [69] },
  { id: 69, x: 944, y: 981, type: "work", area: "young", next: [70] },
  { id: 70, x: 1030, y: 995, type: "love", area: "young", next: [71] },
  { id: 71, x: 1117, y: 981, type: "bad", area: "young", next: [72] },
  { id: 72, x: 1205, y: 968, type: "pay", area: "young", next: [73] },
  { id: 73, x: 1292, y: 954, type: "card", area: "young", next: [74] },
  { id: 74, x: 1380, y: 940, type: "fork", area: "young", fork: "f2", next: [75, 82] },

  // ----- 성인 초반 - 연애 집중 길 -----
  { id: 75, x: 1456, y: 912, type: "love", area: "lovepath", next: [76] },
  { id: 76, x: 1532, y: 884, type: "pay", area: "lovepath", next: [77] },
  { id: 77, x: 1608, y: 857, type: "love", area: "lovepath", next: [78] },
  { id: 78, x: 1683, y: 831, type: "good", area: "lovepath", next: [79] },
  { id: 79, x: 1758, y: 864, type: "love", area: "lovepath", next: [80] },
  { id: 80, x: 1832, y: 896, type: "pay", area: "lovepath", next: [81] },
  { id: 81, x: 1906, y: 928, type: "love", area: "lovepath", next: [88] },

  // ----- 성인 초반 - 일 집중 길 -----
  { id: 82, x: 1465, y: 980, type: "work", area: "workpath", next: [83] },
  { id: 83, x: 1549, y: 1019, type: "good", area: "workpath", next: [84] },
  { id: 84, x: 1634, y: 1059, type: "work", area: "workpath", next: [85] },
  { id: 85, x: 1720, y: 1064, type: "pay", area: "workpath", next: [86] },
  { id: 86, x: 1806, y: 1029, type: "work", area: "workpath", next: [87] },
  { id: 87, x: 1893, y: 995, type: "event", area: "workpath", next: [88] },
  { id: 88, x: 1980, y: 960, type: "life", area: "late", life: "house", next: [89] },

  // ----- 성인 후반 -----
  { id: 89, x: 2069, y: 1031, type: "pay", area: "late", next: [90] },
  { id: 90, x: 2158, y: 1103, type: "love", area: "late", next: [91] },
  { id: 91, x: 2125, y: 1187, type: "good", area: "late", next: [92] },
  { id: 92, x: 2053, y: 1275, type: "bad", area: "late", next: [93] },
  { id: 93, x: 1970, y: 1339, type: "event", area: "late", next: [94] },
  { id: 94, x: 1856, y: 1335, type: "pay", area: "late", next: [95] },
  { id: 95, x: 1742, y: 1331, type: "work", area: "late", next: [96] },
  { id: 96, x: 1628, y: 1328, type: "bad", area: "late", next: [97] },
  { id: 97, x: 1514, y: 1324, type: "card", area: "late", next: [98] },
  { id: 98, x: 1400, y: 1320, type: "life", area: "senior", life: "retire", next: [99] },

  // ----- 황혼기 -----
  { id: 99, x: 1310, y: 1320, type: "normal", area: "senior", next: [100] },
  { id: 100, x: 1220, y: 1320, type: "fork", area: "senior", fork: "f3", next: [101, 107] },

  // ----- 황혼기 - 평온한 바닷길 -----
  { id: 101, x: 1163, y: 1391, type: "good", area: "sea", next: [102] },
  { id: 102, x: 1106, y: 1462, type: "normal", area: "sea", next: [103] },
  { id: 103, x: 1019, y: 1470, type: "event", area: "sea", next: [104] },
  { id: 104, x: 928, y: 1470, type: "good", area: "sea", next: [105] },
  { id: 105, x: 844, y: 1453, type: "love", area: "sea", next: [106] },
  { id: 106, x: 782, y: 1387, type: "good", area: "sea", next: [111] },

  // ----- 황혼기 - 한방역전섬 -----
  { id: 107, x: 1120, y: 1264, type: "event", area: "gamble", next: [108] },
  { id: 108, x: 1020, y: 1208, type: "event", area: "gamble", next: [109] },
  { id: 109, x: 920, y: 1208, type: "event", area: "gamble", next: [110] },
  { id: 110, x: 820, y: 1264, type: "event", area: "gamble", next: [111] },
  { id: 111, x: 720, y: 1320, type: "pay", area: "senior", next: [112] },

  // ----- 노년 -----
  { id: 112, x: 637, y: 1344, type: "normal", area: "senior", next: [113] },
  { id: 113, x: 555, y: 1369, type: "good", area: "senior", next: [114] },
  { id: 114, x: 472, y: 1393, type: "event", area: "senior", next: [115] },
  { id: 115, x: 393, y: 1372, type: "bad", area: "senior", next: [116] },
  { id: 116, x: 315, y: 1335, type: "normal", area: "senior", next: [117] },
  { id: 117, x: 238, y: 1297, type: "pay", area: "senior", next: [118] },
  { id: 118, x: 160, y: 1260, type: "goal", area: "senior", next: [] },
];
