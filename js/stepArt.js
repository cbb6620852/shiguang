// 步骤插画：一组离线 SVG 手绘风矢量图，按"烹饪动作"给每一步配图。
// 全部内联、随 JS 走，断网也能显示，零额外体积。

function card(inner) {
  return `<svg viewBox="0 0 160 120" class="step-svg" role="img" aria-hidden="true">
    <rect x="2" y="2" width="156" height="116" rx="14" fill="#fff7ef" stroke="#f0d9c4" stroke-width="1.5"/>
    ${inner}
  </svg>`;
}

// 共用小元素
const flame = (x, y, s = 1) => `<path d="M${x} ${y} q -6 ${ -10*s } 0 ${ -18*s } q 6 8 0 18 q -3 -5 -2 -10 q 4 4 2 10 z" fill="#ff7043" opacity=".9"/>`;
const steam = (x, y) => `<path d="M${x} ${y} q -4 -6 0 -12 q 4 6 0 12" fill="none" stroke="#cfd8dc" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M${x+8} ${y-2} q -4 -6 0 -12 q 4 6 0 12" fill="none" stroke="#cfd8dc" stroke-width="2.5" stroke-linecap="round"/>`;
const wok = () => `<path d="M30 78 q50 34 100 0 q -10 16 -50 16 q -40 0 -50 -16 z" fill="#455a64"/>
  <rect x="118" y="74" width="34" height="6" rx="3" transform="rotate(-18 135 77)" fill="#37474f"/>`;
const pot = () => `<path d="M40 64 h80 v18 q0 14 -14 14 h-52 q-14 0 -14 -14 z" fill="#607d8b"/>
  <rect x="34" y="60" width="92" height="8" rx="4" fill="#455a64"/>
  <rect x="22" y="60" width="12" height="5" rx="2" fill="#37474f"/><rect x="126" y="60" width="12" height="5" rx="2" fill="#37474f"/>`;
const board = () => `<rect x="24" y="86" width="112" height="20" rx="6" fill="#e8c9a0" stroke="#d4b483" stroke-width="1.5"/>`;
const knife = (x, y, rot = -22) => `<g transform="rotate(${rot} ${x} ${y})">
  <rect x="${x-2}" y="${y}" width="50" height="8" rx="4" fill="#90a4ae"/>
  <rect x="${x+44}" y="${y-2}" width="20" height="12" rx="4" fill="#5d4037"/></g>`;
const leaf = (x, y, c = '#7cb342') => `<path d="M${x} ${y} q 14 -10 22 2 q -10 12 -22 -2 z" fill="${c}"/>`;

export const STEP_ART = {
  // 备菜：菜板 + 刀 + 菜
  prep: card(`${board()}${leaf(60, 80)}<circle cx="95" cy="80" r="8" fill="#ef9a9a"/>${knife(70, 64)}`),
  // 切：刀在菜板上切菜
  cut: card(`${board()}<rect x="56" y="78" width="40" height="10" rx="3" fill="#7cb342"/>${knife(78, 60)}`),
  // 拍/剁：刀背拍蒜
  smash: card(`${board()}<circle cx="80" cy="82" r="9" fill="#f5f5dc" stroke="#d7ccc8"/><circle cx="76" cy="80" r="2" fill="#bcaaa4"/><circle cx="84" cy="84" r="2" fill="#bcaaa4"/>${knife(80, 58, 70)}`),
  // 腌/抓匀：碗 + 筷子
  marinate: card(`<path d="M44 70 q36 40 72 0 z" fill="#fff" stroke="#cfd8dc" stroke-width="2"/><ellipse cx="80" cy="70" rx="36" ry="9" fill="#f1f8e9" stroke="#c5e1a5"/>${knife(96, 40, 60).replace('y="40"', 'y="46"')}<line x1="104" y1="44" x2="92" y2="68" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/>`),
  // 焯水：锅 + 漏勺 + 蒸汽
  blanch: card(`${pot()}<rect x="70" y="40" width="34" height="22" rx="4" fill="#cfd8dc" opacity=".7"/><circle cx="80" cy="50" r="3" fill="#fff"/><circle cx="90" cy="54" r="3" fill="#fff"/><circle cx="86" cy="48" r="3" fill="#fff"/>${steam(64, 40)}${steam(96, 40)}`),
  // 热锅下油：锅 + 油滴 + 热气
  'heat-oil': card(`${wok()}<circle cx="74" cy="62" r="3" fill="#ffb300"/><circle cx="92" cy="66" r="2" fill="#ffb300"/><path d="M70 50 q-3 -6 0 -10" stroke="#ffcc80" stroke-width="2" fill="none"/><path d="M96 52 q3 -6 0 -10" stroke="#ffcc80" stroke-width="2" fill="none"/>`),
  // 煎/炸：平底锅 + 食材 + 油泡
  fry: card(`<ellipse cx="80" cy="80" rx="52" ry="14" fill="#546e7a"/><ellipse cx="80" cy="76" rx="50" ry="12" fill="#607d8b"/><circle cx="68" cy="74" r="9" fill="#fbc02d"/><circle cx="92" cy="78" r="7" fill="#e57373"/><circle cx="80" cy="70" r="2" fill="#fff" opacity=".8"/>`),
  // 翻炒：锅 + 铲
  'stir-fry': card(`${wok()}<g transform="rotate(20 120 50)"><rect x="118" y="44" width="6" height="34" rx="3" fill="#8d6e63"/><path d="M112 44 h18 l-3 -8 h-12 z" fill="#9e9e9e"/></g><circle cx="70" cy="66" r="6" fill="#7cb342"/><circle cx="88" cy="70" r="5" fill="#ef9a9a"/>`),
  // 爆香：锅 + 蒜椒 + 香气
  saute: card(`${wok()}<circle cx="66" cy="66" r="5" fill="#fff" stroke="#bdbdbd"/><path d="M88 64 l8 -6 -2 9 z" fill="#d84315"/><path d="M58 50 q-4 -6 0 -10" stroke="#ffcc80" stroke-width="2" fill="none"/><path d="M74 46 q-4 -6 0 -10" stroke="#ffcc80" stroke-width="2" fill="none"/>`),
  // 煮开：锅 + 沸水 + 蒸汽
  boil: card(`${pot()}<path d="M50 70 q6 -8 12 0 t12 0 t12 0 t12 0" stroke="#4fc3f7" stroke-width="2.5" fill="none"/><circle cx="64" cy="74" r="2" fill="#4fc3f7"/><circle cx="84" cy="76" r="2" fill="#4fc3f7"/><circle cx="100" cy="74" r="2" fill="#4fc3f7"/>${steam(60, 44)}${steam(100, 44)}`),
  // 炖/小火：锅 + 盖 + 小火苗
  simmer: card(`${pot()}<ellipse cx="80" cy="60" rx="44" ry="9" fill="#90a4ae"/><rect x="44" y="54" width="72" height="8" rx="4" fill="#607d8b"/><rect x="74" y="44" width="12" height="12" rx="3" fill="#607d8b"/>${flame(72, 96)}${flame(88, 96)}`),
  // 蒸：蒸笼 + 蒸汽
  steam: card(`<rect x="34" y="70" width="92" height="22" rx="6" fill="#d7a86e"/><rect x="30" y="64" width="100" height="10" rx="5" fill="#c0905a"/><g stroke="#a97846" stroke-width="1.5"><line x1="50" y1="70" x2="50" y2="92"/><line x1="70" y1="70" x2="70" y2="92"/><line x1="90" y1="70" x2="90" y2="92"/><line x1="110" y1="70" x2="110" y2="92"/></g>${steam(60, 44)}${steam(80, 40)}${steam(100, 44)}`),
  // 红烧/焖：锅 + 盖 + 中火
  braise: card(`${pot()}<ellipse cx="80" cy="60" rx="44" ry="9" fill="#90a4ae"/><rect x="44" y="54" width="72" height="8" rx="4" fill="#607d8b"/>${flame(68, 96, 1.3)}${flame(86, 96, 1.3)}${flame(102, 96, 1.1)}`),
  // 收汁：锅 + 浓汁 + 勺
  reduce: card(`${wok()}<path d="M50 74 q30 10 60 0 q-6 8 -30 8 q-24 0 -30 -8z" fill="#a1887f"/><g transform="rotate(25 118 48)"><rect x="116" y="40" width="5" height="30" rx="2.5" fill="#8d6e63"/><ellipse cx="118" cy="40" rx="9" ry="5" fill="#bcaaa4"/></g>`),
  // 调味/淋汁：小碗往锅里倒
  season: card(`${wok()}<g transform="rotate(35 70 50)"><path d="M50 52 q20 -14 40 0 q-4 14 -20 14 q-16 0 -20 -14z" fill="#ffcc80" stroke="#ffb300"/><path d="M70 66 q2 8 0 12" stroke="#ffb300" stroke-width="2" fill="none"/></g><circle cx="86" cy="74" r="3" fill="#ffb300"/><circle cx="94" cy="78" r="2" fill="#ffb300"/>`),
  // 凉拌拌匀：碗 + 筷翻拌 + 菜叶
  mix: card(`<path d="M40 72 q40 38 80 0 z" fill="#fff" stroke="#cfd8dc" stroke-width="2"/><ellipse cx="80" cy="72" rx="40" ry="9" fill="#f1f8e9" stroke="#c5e1a5"/>${leaf(64, 66, '#9ccc65')}${leaf(88, 70, '#ef9a9a')}<line x1="98" y1="40" x2="86" y2="66" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/><line x1="108" y1="44" x2="96" y2="68" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/>`),
  // 装盘/出锅：盘子 + 成品
  plate: card(`<ellipse cx="80" cy="78" rx="52" ry="18" fill="#fff" stroke="#e0e0e0" stroke-width="2"/><ellipse cx="80" cy="74" rx="40" ry="13" fill="#f5f5f5"/><path d="M66 76 q14 -16 28 0 q-14 10 -28 0z" fill="#ef9a9a"/><circle cx="80" cy="70" r="4" fill="#7cb342"/>`),
};

// 若步骤未显式指定 img，则按文字关键词推断一个合适的插画
export function inferStepImage(text = '') {
  const t = String(text);
  if (/上汽|蒸|隔水/.test(t)) return 'steam';
  if (/凉拌|拌匀|拌入|拌均|拌好|翻拌/.test(t)) return 'mix';
  if (/焯|过水|汆|汆烫|烫熟|冰水|过凉/.test(t)) return 'blanch';
  if (/炖|小火|慢炖|煲|卤/.test(t)) return 'simmer';
  if (/红烧|焖|加盖/.test(t)) return 'braise';
  if (/收汁|浓缩|收浓|收干/.test(t)) return 'reduce';
  if (/炸|煎|油锅|油炸/.test(t)) return 'fry';
  if (/爆香|炝|爆锅|煸[香炒]/.test(t)) return 'saute';
  if (/煮开|烧开|加水|水沸|煮沸|煮[三俩\d]分钟/.test(t)) return 'boil';
  if (/热[锅油]|下油|倒油|烧[热温]油/.test(t)) return 'heat-oil';
  if (/翻炒|滑炒|快炒|炒[软断生]|回锅|翻匀/.test(t)) return 'stir-fry';
  if (/腌|抓匀|入味|上劲|码味/.test(t)) return 'marinate';
  if (/调味|淋|浇|倒汁|勾芡|加[入].*(生抽|老抽|盐|糖|醋|蚝油|豉油)|放调料/.test(t)) return 'season';
  if (/装盘|出锅|盛[出入]|摆盘|上桌/.test(t)) return 'plate';
  if (/拍|剁|剁碎|斩|捣|碾/.test(t)) return 'smash';
  if (/切|撕|剥|掰|去蒂|去筋|切段|切块|切丝|切丁|切片|切碎|改刀/.test(t)) return 'cut';
  return 'prep';
}

// 对外：给定一步（含可选 img），返回应显示的 SVG 字符串
export function stepImage(step = {}) {
  const key = step.img && STEP_ART[step.img] ? step.img : inferStepImage(step.text);
  return STEP_ART[key] || STEP_ART.prep;
}
