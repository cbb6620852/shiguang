// 营养映射引擎（方案 A：从食材/标签启发式反推营养素，仅做"大致估算"）
// 设计原则：
//  1) 不改动菜谱数据结构（菜谱里只有 calories/protein 数值），其余微量营养素按"食材关键词"推断；
//  2) 对内置菜谱与用户手动添加菜谱同样生效（都带 name/tags/ingredients）；
//  3) 全部为估算，界面会标注"仅供参考"，不替代医嘱。

import { menuDishes, aggregateNutrition } from './nutrition.js';
import { computeStage } from './planner.js';

// 营养素字典：key 唯一；target 为孕妇每日参考摄入（通用科普值，非个体处方）
export const NUTRIENTS = {
  folate:  { key: 'folate',  name: '叶酸',     icon: '🥬', target: '≥600 μg/天',  why: '多吃深绿色蔬菜、豆类、动物肝脏来补充' },
  calcium: { key: 'calcium', name: '钙',       icon: '🥛', target: '1000 mg/天',  why: '多喝奶、吃豆腐、排骨、海带、紫菜等补钙食材' },
  iron:    { key: 'iron',    name: '铁',       icon: '🩸', target: '24–29 mg/天', why: '搭配红肉（牛/猪）、动物血、菠菜、木耳等补铁' },
  protein: { key: 'protein', name: '优质蛋白', icon: '🥚', target: '约70–100 g/天', why: '鸡蛋、鱼虾、瘦肉、豆腐都是优质蛋白来源' },
  dha:     { key: 'dha',     name: 'DHA',      icon: '🐟', target: '200 mg/天',   why: '多吃鲈鱼等海鱼、海带、紫菜补充' },
  fiber:   { key: 'fiber',   name: '膳食纤维', icon: '🌿', target: '25–30 g/天',  why: '蔬菜、菌菇、杂粮（玉米/小米/土豆）多吃点' },
  vitc:    { key: 'vitc',    name: '维生素C',  icon: '🍅', target: '85–100 mg/天', why: '番茄、青椒、西兰花等蔬果助铁吸收' },
  vitb6:   { key: 'vitb6',   name: '维生素B6', icon: '🍗', target: '1.9 mg/天',   why: '鸡肉、土豆、鱼类富含维生素B6，缓解孕吐' },
  iodine:  { key: 'iodine',  name: '碘',       icon: '🧂', target: '220 μg/天',   why: '海带、紫菜等海产品是补碘好来源' },
};

// 各孕期阶段的"重点营养"（延续 planner.js 的 PREG_STAGES 分期逻辑）
// general 为非孕期/未开启时的家庭通用重点
export const STAGE_NUTRIENTS = {
  early:   ['folate', 'vitb6', 'protein', 'vitc'],
  mid:     ['calcium', 'iron', 'protein', 'dha', 'folate'],
  late:    ['calcium', 'iron', 'fiber', 'iodine', 'protein'],
  general: ['protein', 'calcium', 'iron', 'fiber', 'vitc'],
};

// 营养素 → 食材关键词表（对菜名+标签+食材名做子串匹配）
const SOURCES = {
  folate:  ['西兰花', '菠菜', '生菜', '上海青', '青菜', '番茄', '西红柿', '空心菜', '包菜', '芦笋', '牛油果', '柑橘', '蛋黄', '豆腐', '动物肝脏', '肝', '毛豆'],
  calcium: ['牛奶', '豆腐', '嫩豆腐', '虾', '鱼', '蟹', '排骨', '海带', '干海带丝', '奶酪', '芝士', '芝麻', '紫菜', '小鱼', '西兰花', '菠菜', '生菜', '上海青', '空心菜', '包菜', '腐竹', '千张', '百叶'],
  iron:    ['牛腩', '牛肉', '猪里脊', '五花肉', '猪肉馅', '肉末', '排骨', '鸡胸肉', '鸡腿', '鸡翅中', '菠菜', '干木耳', '蛋黄', '肝', '血', '鱼', '火腿', '咸肉', '腊肉'],
  protein: ['鸡蛋', '鸡胸肉', '牛肉', '牛腩', '猪里脊', '五花肉', '鲈鱼', '鱼', '虾', '蟹', '豆腐', '嫩豆腐', '鸡腿', '鸡翅中', '肉末', '猪肉馅', '皮蛋', '腐竹', '千张', '百叶', '火腿', '咸肉', '腊肉'],
  dha:     ['鲈鱼', '三文鱼', '带鱼', '秋刀鱼', '鳕鱼', '虾', '鱼', '蟹', '海带', '紫菜', '核桃', '亚麻'],
  fiber:   ['西兰花', '空心菜', '包菜', '生菜', '上海青', '菠菜', '土豆', '玉米', '小米', '冬瓜', '海带', '干海带丝', '干木耳', '香菇', '白玉菇', '菌菇', '四季豆', '红薯', '燕麦', '全麦', '笋', '藕', '茭白', '毛豆', '雪菜', '菜薹', '茼蒿', '苦瓜', '花菜', '豆苗'],
  vitc:    ['番茄', '西红柿', '青椒', '西兰花', '橙子', '猕猴桃', '草莓', '菠菜', '上海青', '空心菜', '包菜', '生菜', '毛豆', '雪菜', '菜薹', '茼蒿', '苦瓜', '花菜', '豆苗'],
  vitb6:   ['鸡胸肉', '鸡腿', '鸡翅中', '牛腩', '鲈鱼', '鱼', '土豆', '香蕉', '鹰嘴豆', '蒜'],
  iodine:  ['海带', '干海带丝', '紫菜', '虾', '鱼', '蟹', '海鱼', '贝类', '碘盐', '海参'],
};

// 把一道菜变成可匹配的文本（菜名 + 标签 + 食材名）
function dishText(d) {
  const parts = [d && d.name ? d.name : ''];
  if (Array.isArray(d.tags)) parts.push(d.tags.join(' '));
  if (Array.isArray(d.ingredients)) parts.push(d.ingredients.map((i) => (i && i.name) || '').join(' '));
  return parts.join(' ');
}

// 推断一道菜大概含哪些营养素，返回 Set
export function dishNutrients(d) {
  if (!d) return new Set();
  const text = dishText(d);
  const set = new Set();
  for (const k of Object.keys(SOURCES)) {
    if (SOURCES[k].some((kw) => text.includes(kw))) set.add(k);
  }
  // 优质蛋白：命中关键词，或本身蛋白质数值较高（阈值 12g/份）
  if (set.has('protein') || (Number(d.protein) || 0) >= 12) set.add('protein');
  return set;
}

// 汇总今日菜单的营养分析：阶段需求 + 今日菜品对应关系
// 返回 { stage, stageKey, needed, neededDetail, coverage, coveredCount, total, cal, protein }
export function analyzeNutrition(menu, profile) {
  const stage = computeStage(profile);
  const stageKey = stage ? stage.stage : 'general';
  const needed = STAGE_NUTRIENTS[stageKey] || STAGE_NUTRIENTS.general;
  const dishes = menuDishes(menu);
  const dishNutri = dishes.map((d) => ({ dish: d, nuts: dishNutrients(d) }));
  const coverage = needed.map((nk) => {
    const n = NUTRIENTS[nk];
    const providers = dishNutri.filter((x) => x.nuts.has(nk)).map((x) => x.dish.name);
    return { key: nk, name: n.name, icon: n.icon, target: n.target, why: n.why, covered: providers.length > 0, providers };
  });
  const ag = aggregateNutrition(menu);
  return {
    stage,
    stageKey,
    needed,
    neededDetail: needed.map((k) => NUTRIENTS[k]),
    coverage,
    coveredCount: coverage.filter((c) => c.covered).length,
    total: needed.length,
    cal: ag.cal,
    protein: ag.protein,
  };
}
