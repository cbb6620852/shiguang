// 营养统计：把今日菜单各菜的营养按人数汇总
import { getRecipeById } from '../data/recipes.js';
import { store } from './store.js';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

// 今日菜单里出现过的所有菜（去重）
export function menuDishes(menu) {
  const ids = new Set();
  for (const k of SLOTS) (menu[k] || []).forEach((id) => ids.add(id));
  return [...ids].map(getRecipeById).filter(Boolean);
}

// 汇总热量与蛋白质；按"人数 / 菜基准份量"缩放
export function aggregateNutrition(menu) {
  const p = store.getProfile();
  const factor = p.people || 1;
  let cal = 0, protein = 0;
  for (const dish of menuDishes(menu)) {
    const f = factor / (dish.servings || 1);
    cal += (dish.calories || 0) * f;
    protein += (dish.protein || 0) * f;
  }
  return { cal: Math.round(cal), protein: Math.round(protein) };
}
