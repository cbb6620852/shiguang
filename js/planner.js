// 每日食谱定制引擎（混合模式中的"本地规则引擎"）：按饮食画像从菜谱库挑菜，保证营养与荤素搭配
// 孕期模式：根据怀孕阶段（早/中/晚）调整选菜权重，并生成"推荐理由"
import { allRecipes, getRecipeById } from '../data/recipes.js';
import { store } from './store.js';

// 孕期三阶段医学通行分期与营养重点（仅作饮食参考，不替代医嘱）
export const PREG_STAGES = {
  early: { key: 'early', label: '孕早期', range: '1–12 周', focus: '胎儿器官形成关键期：重点补叶酸（防神经管缺陷）、维B6（缓解孕吐）；饮食宜清淡易消化、少食多餐，避开油腻辛辣与生冷。' },
  mid: { key: 'mid', label: '孕中期', range: '13–27 周', focus: '胎儿快速发育期：重点补钙（骨骼）、补铁（防贫血）、优质蛋白与 DHA；能量较孕前约 +300 kcal/天，胃口好转。' },
  late: { key: 'late', label: '孕晚期', range: '28–40 周', focus: '胎儿囤脂增重期：继续钙铁，控盐（防水肿/高血压）、控糖（防巨大儿/妊娠糖尿病）、多膳食纤维（防便秘）。' },
};

// 由画像推算当前孕期阶段；返回 null 表示未开启孕期模式
export function computeStage(profile) {
  const preg = profile && profile.pregnancy;
  if (!preg || !preg.enabled) return null;
  let stageKey = null, weeks = null, days = 0;
  if (preg.dueDate) {
    const due = new Date(preg.dueDate + 'T00:00:00');
    if (!isNaN(due.getTime())) {
      const conceived = new Date(due.getTime() - 280 * 86400000); // 预产期 - 280 天 ≈ 受孕日
      const diff = Math.floor((Date.now() - conceived.getTime()) / 86400000);
      weeks = Math.max(0, Math.min(42, Math.floor(diff / 7)));
      days = ((diff % 7) + 7) % 7;
      stageKey = weeks < 13 ? 'early' : weeks < 28 ? 'mid' : 'late';
    }
  }
  if (!stageKey) stageKey = ['early', 'mid', 'late'].includes(preg.stage) ? preg.stage : 'mid';
  const info = PREG_STAGES[stageKey];
  return { stage: stageKey, weeks, days, label: info.label, range: info.range, focus: info.focus };
}

// 根据健康目标与人数，估算每日热量/蛋白目标
export function computeTargets(profile) {
  const per = profile.goal === 'lose' ? 1600 : profile.goal === 'gain' ? 2400 : 2000;
  const cal = per * (profile.people || 1);
  const protein = Math.round((cal * 0.15) / 4); // 约 15% 热量来自蛋白质
  return { cal, protein };
}

// 过滤掉不符合限制的菜（忌口/不爱吃/难度/耗时/孕期阶段）
function eligible(profile) {
  const bad = [...(profile.allergies || []), ...(profile.dislikes || [])].map((s) => s.trim()).filter(Boolean);
  const stage = computeStage(profile);
  return allRecipes().filter((r) => {
    if (r.difficulty > (profile.skill || 3)) return false;
    if (r.time > (profile.timeBudget || 60)) return false;
    const txt = r.ingredients.map((i) => i.name).join(' ') + r.name;
    for (const b of bad) if (b && txt.includes(b)) return false;
    // 孕期模式：排除标注不适宜当前阶段的菜（如孕早期不选生冷凉拌）
    if (stage && r.preg && Array.isArray(r.preg.stages) && !r.preg.stages.includes(stage.stage)) return false;
    return true;
  });
}

// 用日期+画像做种子，保证"同一天结果稳定、不同天有变化"
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// 按孕期阶段给候选菜加权（返回额外加分；负数表示降权）
function stageBoost(stageKey, r) {
  if (!stageKey) return 0;
  const nm = r.name || '';
  const tg = r.tags || [];
  if (stageKey === 'early') {
    // 偏好清淡/低脂/叶酸/易消化；降权生冷与辣
    if (tg.includes('清淡') || tg.includes('低脂')) return 0.6;
    if (/(西兰花|菠菜|生菜|番茄|青菜|小米|鸡蛋)/.test(nm)) return 0.5;
    if (r.category === '凉拌') return -0.6;
    if (tg.includes('中辣') || tg.includes('微辣')) return -0.3;
    return 0;
  }
  if (stageKey === 'mid') {
    // 偏好补钙/补铁/高蛋白
    if (/(排骨|鲈鱼|牛肉|豆腐|木耳|牛奶|虾|猪肝)/.test(nm) || tg.includes('高蛋白')) return 0.7;
    if (tg.includes('清淡') || tg.includes('低脂')) return 0.2;
    return 0;
  }
  if (stageKey === 'late') {
    // 偏好清淡/高纤维/控盐控糖；降权油腻重辣高糖
    if (tg.includes('清淡') || tg.includes('低脂')) return 0.5;
    if (/(冬瓜|海带|菠菜|西兰花|芹菜|燕麦|菌菇)/.test(nm)) return 0.4;
    if (/(红烧肉|可乐|宫保|地三鲜|葱油)/.test(nm)) return -0.5;
    if (tg.includes('中辣')) return -0.4;
    return 0;
  }
  return 0;
}

// 在候选池里挑一道：口味匹配加分、阶段加权、当天已选减分，加入随机性避免每天雷同
function pick(pool, used, tastes, rand, stageKey) {
  const scored = pool
    .filter((r) => !used.has(r.id))
    .map((r) => {
      let score = rand();
      for (const t of tastes) if (r.tags.includes(t)) score += 0.5;
      score += stageBoost(stageKey, r);
      if (used.has(r.id)) score -= 1;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].r : null;
}

// 生成今日推荐理由（结合当天实际菜品，给出阶段化的一句话说明）
function buildSummary(stage, menu) {
  if (!stage) return '';
  const dishes = [].concat(...Object.values(menu)).map(getRecipeById).filter(Boolean);
  const has = (re) => dishes.some((d) => re.test(d.name) || (d.tags || []).some((t) => re.test(t)));
  const folate = has(/西兰花|菠菜|生菜|青菜|番茄/);
  const extra = [];
  if (stage.stage === 'early') {
    extra.push('清淡易消化、少食多餐，帮助缓解孕吐');
    if (folate) extra.push('深绿蔬菜补充叶酸');
  } else if (stage.stage === 'mid') {
    if (has(/排骨|豆腐|鲈鱼|牛奶|虾|海带|菌菇/) || dishes.some((d) => d.category === '汤类')) extra.push('已安排高钙食材助力宝宝骨骼发育');
    if (has(/牛肉|木耳|猪肝|猪肉|鸡翅|鸡胸|鸡腿/)) extra.push('搭配补铁荤菜预防孕期贫血');
    if (folate) extra.push('深绿蔬菜补充叶酸');
  } else {
    extra.push('控盐控糖、多纤维，利于控重与预防便秘');
    if (has(/冬瓜|海带|菠菜|西兰花|菌菇/)) extra.push('多安排利尿高纤维食材');
  }
  const wk = stage.weeks != null ? `（约 ${stage.weeks} 周${stage.days ? ' ' + stage.days + ' 天' : ''}）` : '';
  const tail = extra.length ? extra.join('，') + '。' : '营养搭配均衡。';
  return `${stage.label}${wk}：${tail}（食谱仅供参考，具体请遵医嘱）`;
}

// 生成今日计划：{ breakfast:[ids], lunch:[], dinner:[], snack:[], stage, summary }
export function generateDailyPlan(profile, dateKey) {
  const stage = computeStage(profile);
  const stageKey = stage ? stage.stage : null;
  const pool = eligible(profile);
  const rand = mulberry32(hash(dateKey || 'today') ^ hash(JSON.stringify(profile)));
  const used = new Set();
  const menu = { breakfast: [], lunch: [], dinner: [], snack: [] };
  const add = (slot, dish) => { if (dish) { used.add(dish.id); menu[slot].push(dish.id); } };
  const byCat = (c) => pool.filter((r) => r.category === c);

  // 早餐：1 主食 + 1 蛋/蔬菜
  add('breakfast', pick(byCat('主食'), used, profile.tastes, rand, stageKey));
  add('breakfast', pick(
    [...byCat('蔬菜'), ...byCat('荤菜')].filter((r) => ['番茄炒蛋', '清炒西兰花', '蒜蓉空心菜', '蚝油生菜', '香菇青菜'].includes(r.name)),
    used, profile.tastes, rand, stageKey));

  // 午/晚：荤 + 蔬菜(或凉拌) + 主食，晚餐按概率加一道汤
  for (const slot of ['lunch', 'dinner']) {
    add(slot, pick(byCat('荤菜'), used, profile.tastes, rand, stageKey));
    const vegPool = rand() > 0.5 ? byCat('蔬菜') : [...byCat('蔬菜'), ...byCat('凉拌')];
    add(slot, pick(vegPool, used, profile.tastes, rand, stageKey));
    add(slot, pick(byCat('主食'), used, profile.tastes, rand, stageKey));
    if (slot === 'dinner' && rand() > 0.5) add(slot, pick(byCat('汤类'), used, profile.tastes, rand, stageKey));
  }
  // 加餐：凉拌/蔬菜/主食 里挑一道清淡的
  add('snack', pick([...byCat('凉拌'), ...byCat('蔬菜'), ...byCat('主食')], used, profile.tastes, rand, stageKey));
  menu.stage = stage;
  menu.summary = stage ? buildSummary(stage, menu) : '';
  return menu;
}
