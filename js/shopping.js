// 食材 & 购物清单：汇总今日菜单所需食材，扣除"现有食材(冰箱)"，按类别分组
import { getRecipeById } from '../data/recipes.js';
import { store } from './store.js';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

// 汇总菜单全部食材（同名同单位自动相加）
export function aggregateIngredients(menu) {
  const map = new Map();
  for (const k of SLOTS) {
    for (const id of (menu[k] || [])) {
      const dish = getRecipeById(id);
      if (!dish) continue;
      for (const ing of dish.ingredients) {
        if (map.has(ing.name)) {
          const e = map.get(ing.name);
          if (e.unit === ing.unit) e.qty += ing.qty;
          else e.qty = `${e.qty}+${ing.qty}${ing.unit}`;
        } else map.set(ing.name, { qty: ing.qty, unit: ing.unit });
      }
    }
  }
  return map;
}

// 食材归类（用于购物清单分组展示）
const GROUPS = {
  蔬菜: ['番茄', '西红柿', '青椒', '黄瓜', '西兰花', '空心菜', '土豆', '包菜', '生菜', '四季豆', '上海青', '菠菜', '胡萝卜', '茄子', '白菜', '葱', '香菜', '蒜', '姜', '香菇', '木耳', '海带', '辣椒', '玉米', '冬瓜', '白萝卜', '山药', '蘑菇', '白玉菇', '金针菇'],
  肉蛋豆制品: ['鸡蛋', '鸡胸肉', '鸡翅', '鸡腿', '里脊', '五花肉', '牛肉', '排骨', '鲈鱼', '肉末', '猪肉馅', '豆腐', '花生米', '火腿'],
  主食: ['米饭', '面条', '小米', '饺子皮', '粉丝'],
  调料: ['盐', '糖', '生抽', '老抽', '醋', '油', '香油', '蚝油', '豆瓣酱', '淀粉', '花椒', '八角', '冰糖', '蒸鱼豉油', '辣椒油', '红油辣酱', '芽菜', '干辣椒', '料酒', '白胡椒'],
};
function groupOf(name) {
  for (const g in GROUPS) if (GROUPS[g].some((k) => name.includes(k))) return g;
  return '其他';
}

// 生成购物清单：need=true 表示冰箱没有、需要买
export function shoppingList(menu) {
  const map = aggregateIngredients(menu);
  const pantry = store.getPantry().map((s) => s.trim()).filter(Boolean);
  const result = {};
  for (const [name, info] of map) {
    const have = pantry.some((p) => name.includes(p) || p.includes(name));
    const g = groupOf(name);
    (result[g] = result[g] || []).push({ name, qty: info.qty, unit: info.unit, need: !have });
  }
  return result;
}
