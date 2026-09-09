/** Latin brand/model names — no Hangul/CJK in the catalog UI. */

const BRANDS: Record<string, string> = {
  현대: "Hyundai",
  기아: "Kia",
  제네시스: "Genesis",
  쌍용: "KG Mobility",
  "KG모빌리티(쌍용)": "KG Mobility",
  르노코리아: "Renault Korea",
  쉐보레: "Chevrolet",
  삼성: "Renault Samsung",
  벤츠: "Mercedes-Benz",
  아우디: "Audi",
  폭스바겐: "Volkswagen",
  도요타: "Toyota",
  렉서스: "Lexus",
  혼다: "Honda",
  닛산: "Nissan",
  볼보: "Volvo",
  미니: "MINI",
  포르쉐: "Porsche",
  랜드로버: "Land Rover",
  지프: "Jeep",
  테슬라: "Tesla",
  포드: "Ford",
  재규어: "Jaguar",
  링컨: "Lincoln",
  캐딜락: "Cadillac",
  마세라티: "Maserati",
  페라리: "Ferrari",
  람보르기니: "Lamborghini",
  벤틀리: "Bentley",
  롤스로이스: "Rolls-Royce",
  인피니티: "Infiniti",
  미쓰비시: "Mitsubishi",
  스바루: "Subaru",
  마쯔다: "Mazda",
  마즈다: "Mazda",
  푸조: "Peugeot",
  시트로엥: "Citroen",
  폴스타: "Polestar",
  일론: "Tesla",
  日产: "Nissan",
  丰田: "Toyota",
  本田: "Honda",
  大众: "Volkswagen",
  奥迪: "Audi",
  宝马: "BMW",
  奔驰: "Mercedes-Benz",
  保时捷: "Porsche",
  现代: "Hyundai",
  起亚: "Kia",
  吉利: "Geely",
  比亚迪: "BYD",
  长安: "Changan",
  红旗: "Hongqi",
  理想: "Li Auto",
  特斯拉: "Tesla",
  福特: "Ford",
  雪佛兰: "Chevrolet",
  别克: "Buick",
  马自达: "Mazda",
  雷克萨斯: "Lexus",
  沃尔沃: "Volvo",
  凯迪拉克: "Cadillac",
  路虎: "Land Rover",
  捷豹: "Jaguar",
  斯巴鲁: "Subaru",
  三菱: "Mitsubishi",
  名爵: "MG",
  领克: "Lynk & Co",
  小鹏: "XPeng",
  蔚来: "NIO",
  问界: "AITO",
  极氪: "Zeekr",
  哈弗: "Haval",
  长城: "Great Wall",
  荣威: "Roewe",
  五菱: "Wuling",
  奇瑞: "Chery",
  传祺: "Trumpchi",
  广汽: "GAC",
  东风: "Dongfeng",
  奔腾: "Bestune",
  坦克: "Tank",
  深蓝: "Deepal",
  阿维塔: "Avatr",
  智己: "IM Motors",
  零跑: "Leapmotor",
  哪吒: "Neta",
  极狐: "Arcfox",
  腾势: "Denza",
  方程豹: "Yangwang",
  仰望: "Yangwang",
  银河: "Geely Galaxy",
  岚图: "Voyah",
  飞凡: "Rising Auto",
  智界: "Luxeed",
  享界: "Stelato",
  尚界: "Shangjie",
  合创: "Hyptec",
  高合: "HiPhi",
  威马: "WM Motor",
  一汽: "FAW",
  上汽: "SAIC",
  北汽: "BAIC",
  江淮: "JAC",
  东南: "Soueast",
  中华: "Brilliance",
  宝沃: "Borgward",
  斯柯达: "Skoda",
  雪铁龙: "Citroen",
  标致: "Peugeot",
  欧宝: "Opel",
  菲亚特: "Fiat",
  阿尔法罗密欧: "Alfa Romeo",
  阿斯顿马丁: "Aston Martin",
  迈凯伦: "McLaren",
  劳斯莱斯: "Rolls-Royce",
  宾利: "Bentley",
  玛莎拉蒂: "Maserati",
  捷尼赛思: "Genesis",
  迷你: "MINI",
  宝骏: "Baojun",
};

/** Series / model names only — never put brand words here (宝马/奥迪…). */
const MODELS: Record<string, string> = {
  팰리세이드: "Palisade",
  쏘렌토: "Sorento",
  스포티지: "Sportage",
  아반떼: "Avante",
  쏘나타: "Sonata",
  그랜저: "Grandeur",
  투싼: "Tucson",
  싼타페: "Santa Fe",
  카니발: "Carnival",
  스타리아: "Staria",
  아이오닉: "Ioniq",
  코나: "Kona",
  베뉴: "Venue",
  캐스퍼: "Casper",
  포터: "Porter",
  봉고: "Bongo",
  렉스턴: "Rexton",
  티볼리: "Tivoli",
  코란도: "Korando",
  토레스: "Torres",
  천래: "Teana",
  天籁: "Teana",
  轩逸: "Sylphy",
  奇骏: "X-Trail",
  途观: "Tiguan",
  途昂: "Teramont",
  探岳: "Tayron",
  帕萨特: "Passat",
  迈腾: "Magotan",
  朗逸: "Lavida",
  速腾: "Sagitar",
  宝来: "Bora",
  汉: "Han",
  秦: "Qin",
  宋: "Song",
  唐: "Tang",
  元: "Yuan",
  海豹: "Seal",
  海豚: "Dolphin",
  驱逐舰: "Destroyer",
  凯美瑞: "Camry",
  卡罗拉: "Corolla",
  雷凌: "Levin",
  荣放: "RAV4",
  汉兰达: "Highlander",
  亚洲龙: "Avalon",
  雅阁: "Accord",
  思域: "Civic",
  飞度: "Fit",
  奥德赛: "Odyssey",
  冠道: "Avancier",
  皓影: "CR-V",
  途岳: "Tharu",
  探歌: "T-Roc",
  高尔夫: "Golf",
  迈巴赫: "Maybach",
  星越: "Xingyue",
  博越: "Boyue",
  帝豪: "Emgrand",
  缤瑞: "Binrui",
  影豹: "Emkoo",
  福克斯: "Focus",
  蒙迪欧: "Mondeo",
  锐界: "Edge",
  探险者: "Explorer",
  翼虎: "Kuga",
  嘉年华: "Fiesta",
  锐际: "Escape",
  途胜: "Tucson",
  胜达: "Santa Fe",
  伊兰特: "Elantra",
  领动: "Celesta",
  菲斯塔: "La Festa",
  名图: "Mistra",
  索纳塔: "Sonata",
  嘉华: "Carnival",
  智跑: "Sportage",
  狮跑: "Sportage",
  傲跑: "KX3",
  焕驰: "Pegas",
  奕跑: "KX1",
  福瑞迪: "Forte",
  凯酷: "K5",
  帕杰罗: "Pajero",
  欧蓝德: "Outlander",
  森林人: "Forester",
  力狮: "Legacy",
  昂科威: "Envision",
  君威: "Regal",
  君越: "LaCrosse",
  威朗: "Verano",
  科鲁兹: "Cruze",
  迈锐宝: "Malibu",
  探界者: "Equinox",
  开拓者: "Traverse",
  英朗: "Excelle GT",
  阅朗: "Excelle GX",
  凌渡: "Lamando",
  辉昂: "Phaeton",
  途锐: "Touareg",
  揽胜: "Range Rover",
  发现: "Discovery",
  卫士: "Defender",
  极光: "Evoque",
  星脉: "Velar",
  卡宴: "Cayenne",
  帕拉梅拉: "Panamera",
  迈凯: "Macan",
  泰坎: "Taycan",
  马自达3: "Mazda3",
  马自达6: "Mazda6",
  阿特兹: "Atenza",
  昂克赛拉: "Axela",
  CX: "CX",
  普拉多: "Prado",
  兰德酷路泽: "Land Cruiser",
  埃尔法: "Alphard",
  威尔法: "Vellfire",
  赛那: "Sienna",
  锋兰达: "Frontlander",
  威驰: "Vios",
  致炫: "Yaris L",
  致享: "Yaris L",
  亚洲狮: "Allion",
  凌放: "Harrier",
  威飒: "Wildlander",
  奕泽: "C-HR",
  缤智: "Vezel",
  型格: "Integra",
  英诗派: "Envix",
  享域: "Crider",
  艾力绅: "Elysion",
  URV: "UR-V",
  "UR-V": "UR-V",
  逍客: "Qashqai",
  楼兰: "Murano",
  途乐: "Patrol",
  贵士: "Quest",
  蓝鸟: "Bluebird",
  骐达: "Tiida",
  骊威: "Livina",
  玛驰: "March",
  阳光: "Sunny",
  西玛: "Maxima",
  蔚来ET5: "ET5",
  蔚来ET7: "ET7",
  蔚来ES6: "ES6",
  蔚来ES8: "ES8",
  蔚来EC6: "EC6",
  蔚来EC7: "EC7",
  小鹏G6: "G6",
  小鹏G9: "G9",
  小鹏P7: "P7",
  小鹏P5: "P5",
  小鹏X9: "X9",
  理想L6: "L6",
  理想L7: "L7",
  理想L8: "L8",
  理想L9: "L9",
  理想MEGA: "MEGA",
  问界M5: "M5",
  问界M7: "M7",
  问界M8: "M8",
  问界M9: "M9",
  极氪001: "001",
  极氪007: "007",
  极氪009: "009",
  极氪X: "X",
  坦克300: "300",
  坦克400: "400",
  坦克500: "500",
  坦克700: "700",
  哈弗H6: "H6",
  哈弗H9: "H9",
  哈弗大狗: "Big Dog",
  哈弗猛龙: "Menglong",
  传祺GS: "GS",
  传祺M8: "M8",
  传祺E8: "E8",
  传祺影豹: "Emkoo",
  红旗H5: "H5",
  红旗H6: "H6",
  红旗H9: "H9",
  红旗HS5: "HS5",
  红旗HS7: "HS7",
  红旗E: "E-QM5",
  阿维塔11: "11",
  阿维塔12: "12",
  阿维塔07: "07",
  极狐阿尔法: "Alpha",
  深蓝S7: "S7",
  深蓝SL03: "SL03",
  零跑C11: "C11",
  零跑C10: "C10",
  零跑C16: "C16",
  哪吒X: "X",
  哪吒S: "S",
  哪吒L: "L",
  UNI: "UNI",
};

const CJK = /[\u1100-\u11FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/g;

const LATIN_BRAND_ALIASES = [
  "Mercedes-Benz",
  "Mercedes",
  "Land Rover",
  "Range Rover",
  "Rolls-Royce",
  "Alfa Romeo",
  "Aston Martin",
  "Great Wall",
  "Lynk & Co",
  "Li Auto",
  "IM Motors",
  "Rising Auto",
  "Geely Galaxy",
  "Renault Korea",
  "Renault Samsung",
  "KG Mobility",
  "Chevrolet",
  "Volkswagen",
  "BMW",
  "Audi",
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Genesis",
  "Volvo",
  "Porsche",
  "Lexus",
  "Mazda",
  "Ford",
  "Jeep",
  "Tesla",
  "BYD",
  "NIO",
  "XPeng",
  "Zeekr",
  "AITO",
  "Haval",
  "Tank",
  "Hongqi",
  "Trumpchi",
  "Changan",
  "Geely",
  "Chery",
  "Wuling",
  "Roewe",
  "Buick",
  "Cadillac",
  "Lincoln",
  "Jaguar",
  "Infiniti",
  "Mitsubishi",
  "Subaru",
  "MINI",
  "Mini",
  "McLaren",
  "Bentley",
  "Maserati",
  "Ferrari",
  "Lamborghini",
  "Skoda",
  "Peugeot",
  "Citroen",
  "Opel",
  "Fiat",
  "Polestar",
  "Avatr",
  "Arcfox",
  "Deepal",
  "Leapmotor",
  "Neta",
  "Denza",
  "Voyah",
  "HiPhi",
  "GAC",
  "FAW",
  "SAIC",
  "BAIC",
  "JAC",
  "MG",
].sort((a, b) => b.length - a.length);

export function stripCjk(input: string) {
  return String(input || "")
    .replace(CJK, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function latinBrand(raw: string) {
  const key = String(raw || "").trim();
  if (!key) return "Unknown";
  if (BRANDS[key]) return BRANDS[key];
  for (const [k, v] of Object.entries(BRANDS)) {
    if (key.includes(k)) return v;
  }
  for (const alias of LATIN_BRAND_ALIASES) {
    if (new RegExp(`^${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i").test(key)) return alias === "Mercedes" ? "Mercedes-Benz" : alias === "Mini" ? "MINI" : alias;
    if (new RegExp(`^${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(key)) {
      return alias === "Mercedes" ? "Mercedes-Benz" : alias === "Mini" ? "MINI" : alias;
    }
  }
  const latin = stripCjk(key);
  return latin || "Unknown";
}

function stripBrandPrefix(text: string, brand: string) {
  let t = String(text || "").trim();
  if (!t) return "";
  const candidates = [brand, ...LATIN_BRAND_ALIASES.filter((a) => a.toLowerCase() === brand.toLowerCase() || brand.toLowerCase().includes(a.toLowerCase()))];
  for (const [k, v] of Object.entries(BRANDS)) {
    if (v.toLowerCase() === brand.toLowerCase()) candidates.push(k);
  }
  for (const c of candidates) {
    const re = new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i");
    t = t.replace(re, "").trim();
  }
  return t;
}

/** Map Chinese / Korean series strings to a clean Latin model. */
function mapSeriesPatterns(raw: string): string | null {
  const key = String(raw || "").trim();
  if (!key) return null;

  // Exact / contains dictionary (longest keys first)
  const entries = Object.entries(MODELS).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of entries) {
    if (k.length >= 2 && (key === k || key.includes(k))) return v;
  }

  // BMW: 3系 / 5系 / X5 / iX1
  const bmwSeries = key.match(/(?:^|[^\d])([1-8])\s*系/);
  if (bmwSeries) return `${bmwSeries[1]} Series`;
  const bmwX = key.match(/\b(X[1-7]|Z4|iX[1-3]?|i[457]|iX)\b/i);
  if (bmwX) return bmwX[1].replace(/^ix$/i, "iX");

  // Mercedes: C级 / E级 / GLC
  const mbClass = key.match(/([ACESGV])\s*级/i);
  if (mbClass) return `${mbClass[1].toUpperCase()}-Class`;
  const mbSuv = key.match(/\b(GLA|GLB|GLC|GLE|GLS|GLK|CLA|CLS|EQA|EQB|EQC|EQE|EQS|AMG\s*GT)\b/i);
  if (mbSuv) return mbSuv[1].replace(/\s+/g, " ");

  // Audi: A6L / Q5 / e-tron
  const audi = key.match(/\b(A[1-8]L?|Q[2-8]|e-tron|TT|R8|RS[3-7])\b/i);
  if (audi) return audi[1];

  return null;
}

/** Infer model family from trim badges when series was lost. */
export function inferModelFromTrim(brand: string, trim: string, modelHint = ""): string | null {
  const blob = `${modelHint} ${trim}`.trim();
  if (!blob) return null;
  const b = brand.toLowerCase();

  if (b === "bmw") {
    if (/eDrive|i4/i.test(blob)) return "i4";
    if (/\biX3\b/i.test(blob)) return "iX3";
    if (/\biX1\b/i.test(blob)) return "iX1";
    if (/\biX\b/i.test(blob)) return "iX";
    if (/\bi7\b/i.test(blob)) return "i7";
    if (/\bi5\b/i.test(blob)) return "i5";
    const x = blob.match(/\b(X[1-7]|Z4)\b/i);
    if (x) return x[1].toUpperCase().replace("X", "X");
    // "xDrive20i X" without series — leave null (need series from source)
    if (/\bxDrive\b/i.test(blob) && !/\bX[1-7]\b/i.test(blob) && !/\b([1-8])\d{2}/.test(blob)) return null;
    const n = blob.match(/\b([1-8])\d{2}[a-zA-Z]{0,3}\b/);
    if (n) return `${n[1]} Series`;
  }

  if (b === "mercedes-benz" || b === "mercedes") {
    const suv = blob.match(/\b(GLA|GLB|GLC|GLE|GLS|GLK|CLA|CLS|EQA|EQB|EQC|EQE|EQS)\b/i);
    if (suv) return suv[1].toUpperCase();
    const cls = blob.match(/\b([ACESGV])\s*(\d{2,3})\b/i);
    if (cls) return `${cls[1].toUpperCase()}-Class`;
  }

  if (b === "audi") {
    const m = blob.match(/\b(A[1-8]L?|Q[2-8]|e-tron|TT|R8|RS\s*[3-7]|S[3-8])\b/i);
    if (m) return m[1].replace(/\s+/g, "");
  }

  if (b === "volvo") {
    const m = blob.match(/\b(XC[469]0|S[69]0|V[69]0|C40|EX[39]0)\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "lexus") {
    const m = blob.match(/\b(ES|LS|GS|IS|RX|NX|UX|LX|GX|RC|LC|LM|RZ)\s*\d*/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "toyota") {
    const m = blob.match(
      /\b(Camry|Corolla|RAV4|Highlander|Prado|Land\s*Cruiser|Alphard|Sienna|Avalon|Crown|Harrier|C-HR|Yaris|Vios|Levin)\b/i
    );
    if (m) return m[1];
  }

  if (b === "honda") {
    const m = blob.match(/\b(Accord|Civic|CR-?V|HR-?V|Fit|Odyssey|Elysion|Avancier|UR-?V|Integra|Breeze)\b/i);
    if (m) return m[1];
  }

  if (b === "nissan") {
    const m = blob.match(/\b(Teana|Sylphy|X-?Trail|Qashqai|Murano|Patrol|Altima|Maxima|Tiida|Sunny)\b/i);
    if (m) return m[1];
  }

  if (b === "jeep") {
    if (/Sahara|Rubicon|Wrangler/i.test(blob)) return "Wrangler";
    if (/Grand\s*Cherokee|Cherokee/i.test(blob)) return /Grand/i.test(blob) ? "Grand Cherokee" : "Cherokee";
    if (/Compass/i.test(blob)) return "Compass";
    if (/Renegade/i.test(blob)) return "Renegade";
  }

  if (b === "bentley") {
    if (/\bGT\b|Continental/i.test(blob)) return "Continental GT";
    if (/Flying\s*Spur/i.test(blob)) return "Flying Spur";
    if (/Bentayga/i.test(blob)) return "Bentayga";
    if (/Mulsanne/i.test(blob)) return "Mulsanne";
  }

  if (b === "volkswagen" || b === "vw") {
    if (/380TSI|Magotan|迈腾/i.test(blob)) return "Magotan";
    const m = blob.match(/\b(Tiguan|Passat|Magotan|Lavida|Sagitar|Bora|Golf|Touareg|ID\.?[346]|CC|Teramont|Tayron|Tharu|Lamando)\b/i);
    if (m) return m[1];
  }

  if (b === "hyundai") {
    const m = blob.match(/\b(Tucson|Santa\s*Fe|Sonata|Elantra|Palisade|Ioniq\s*[569]|Kona|Venue|Staria|Mufasa)\b/i);
    if (m) return m[1];
  }

  if (b === "kia") {
    const m = blob.match(/\b(Sportage|Sorento|Carnival|K[358]|EV[69]|Seltos|Telluride|Cerato|K5)\b/i);
    if (m) return m[1];
  }

  if (b === "nio") {
    const m = blob.match(/\b(ET[57]|ES[68]|EC[67]|EL[67]|ET9)\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "xpeng") {
    const m = blob.match(/\b(G[369]|P[57]|X9|Mona)\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "li auto" || b === "li") {
    const m = blob.match(/\b(L[6-9]|MEGA|i[68])\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "aito") {
    const m = blob.match(/\b(M[5-9])\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "zeekr") {
    const m = blob.match(/\b(001|007|009|X|7X)\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "tank") {
    const m = blob.match(/\b(300|400|500|700)\b/);
    if (m) return m[1];
  }

  if (b === "haval") {
    const m = blob.match(/\b(H[69]|Big\s*Dog|Menglong|Dargo|Jolion)\b/i);
    if (m) return m[1];
  }

  if (b === "hongqi") {
    const m = blob.match(/\b(H[569]|HS[57]|E-?QM5|EH7)\b/i);
    if (m) return m[1].toUpperCase();
  }

  if (b === "trumpchi") {
    const m = blob.match(/\b(GS[348]|M[68]|E[89]|Emkoo|Shadow\s*Leopard)\b/i);
    if (m) return m[1];
  }

  if (b === "mini") {
    return "Cooper";
  }

  if (b === "porsche") {
    const m = blob.match(/\b(Cayenne|Macan|Panamera|Taycan|911|718|Boxster|Cayman)\b/i);
    if (m) return m[1];
  }

  if (b === "land rover") {
    const m = blob.match(/\b(Range\s*Rover|Sport|Evoque|Velar|Discovery|Defender|Freelander)\b/i);
    if (m) {
      if (/sport/i.test(m[1]) && /range/i.test(blob)) return "Range Rover Sport";
      if (/range/i.test(m[1])) return "Range Rover";
      return m[1];
    }
  }

  return mapSeriesPatterns(blob);
}

function looksLikeEngineOnly(model: string) {
  return /^(?:\d(?:[.,]\d)?\s*[LlTtТт]|1\.\dT|2\.\dT|3\.\dT|[\d.]+\s*L\s*\d*)$/i.test(model.trim());
}

function isBrandEcho(brand: string, model: string) {
  if (!brand || !model) return true;
  const b = brand.toLowerCase();
  const m = model.toLowerCase();
  if (m === b) return true;
  if (m === "mercedes" && b.startsWith("mercedes")) return true;
  if (b.includes(m) && m.length >= 3 && !/\d/.test(m) && m.split(/\s+/).length <= 2) {
    // "Benz" inside Mercedes-Benz — treat as echo only if equal-ish
    if (m === "benz" || m === "mercedes-benz") return true;
  }
  return false;
}

export function latinModel(raw: string, fallback = "", brand = "") {
  const key = String(raw || "").trim();
  const fb = String(fallback || "").trim();

  const fromMap = mapSeriesPatterns(key) || mapSeriesPatterns(fb);
  if (fromMap && !isBrandEcho(brand || latinBrand(key), fromMap)) return fromMap;

  let latin = stripBrandPrefix(stripCjk(key), brand || latinBrand(key));
  if (latin && brand && isBrandEcho(brand, latin)) latin = "";
  if (latin && !looksLikeEngineOnly(latin) && !isBrandEcho(brand, latin)) return latin;

  let fromFb = stripBrandPrefix(stripCjk(fb), brand || "");
  if (fromFb && brand && isBrandEcho(brand, fromFb)) fromFb = "";
  if (fromFb && !looksLikeEngineOnly(fromFb) && !isBrandEcho(brand, fromFb)) {
    const inferred = inferModelFromTrim(brand, fromFb, latin);
    return inferred || fromFb;
  }

  if (brand) {
    const inferred = inferModelFromTrim(brand, fb || key, latin);
    if (inferred) return inferred;
  }

  return latin || fromFb || "";
}

export function latinizeVehicle(brand: string, model: string, extra = "") {
  const b = latinBrand(brand);
  let m = latinModel(model, extra, b);

  if (!m || isBrandEcho(b, m) || looksLikeEngineOnly(m)) {
    const inferred = inferModelFromTrim(b, extra, model);
    if (inferred) m = inferred;
  }

  // Final cleanup: never show brand as model
  if (!m || isBrandEcho(b, m)) {
    const fromExtra = stripBrandPrefix(stripCjk(extra), b);
    if (fromExtra && !isBrandEcho(b, fromExtra) && !looksLikeEngineOnly(fromExtra)) m = fromExtra;
  }

  if (m && isBrandEcho(b, m)) m = "";

  return { brand: b, model: m };
}
