// 本地状态存储：用浏览器 localStorage 把数据存在用户自己设备上，无需后端服务器
const PREFIX = 'shiguang_';
const KEYS = { profile: 'profile', today: 'today', pantry: 'pantry', history: 'history', llm: 'llm', userRecipes: 'userRecipes', deleted: 'deletedRecipes' };

function read(key, fallback) {
  try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function write(key, val) { localStorage.setItem(PREFIX + key, JSON.stringify(val)); }

// 饮食画像默认值（用户可在"我的"里改）
const DEFAULT_PROFILE = {
  people: 2,          // 用餐人数
  allergies: [],      // 忌口/过敏食材关键词
  dislikes: [],       // 不爱吃的食材
  tastes: [],         // 口味偏好标签：微辣/中辣/清淡/酸甜/咸鲜
  goal: 'maintain',   // 健康目标：maintain 保持 / lose 减脂 / gain 增肌
  skill: 2,           // 厨艺水平 1-3（限制菜谱难度）
  timeBudget: 30,     // 每餐可投入时间(分钟)，超过则不选
  pregnancy: {        // 孕期模式：为孕妇按怀孕阶段定制菜单（全家共享·按孕妇需求）
    enabled: false,   // 是否开启孕期专属推荐
    dueDate: '',      // 预产期 yyyy-mm-dd（填了自动推算孕周与阶段）
    stage: 'mid',     // 手动阶段 early/mid/late（未填预产期或想覆盖时用）
  },
};

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const SLOT_LABEL = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };

export const store = {
  getProfile() { return { ...DEFAULT_PROFILE, ...read(KEYS.profile, {}) }; },
  setProfile(p) { write(KEYS.profile, p); },
  getToday() { return read(KEYS.today, null); },
  setToday(t) { write(KEYS.today, t); },
  getPantry() { return read(KEYS.pantry, []); },
  setPantry(arr) { write(KEYS.pantry, arr); },
  getHistory() { return read(KEYS.history, []); },
  addHistory(h) { const a = read(KEYS.history, []); a.unshift(h); write(KEYS.history, a.slice(0, 30)); },
  getLlm() { return read(KEYS.llm, {}); },
  setLlm(c) { write(KEYS.llm, c); },
  // 用户在"菜谱"页手动添加的菜谱（持久化，下次打开仍在）
  getUserRecipes() { return read(KEYS.userRecipes, []); },
  setUserRecipes(arr) { write(KEYS.userRecipes, arr); },
  addUserRecipe(r) { const a = read(KEYS.userRecipes, []); a.push(r); write(KEYS.userRecipes, a); },
  delUserRecipe(id) { write(KEYS.userRecipes, read(KEYS.userRecipes, []).filter((r) => r.id !== id)); },
  // 已隐藏的系统菜谱（隐藏后从菜谱库/推荐中消失，可在「我的」恢复）
  getDeletedIds() { return read(KEYS.deleted, []); },
  setDeletedIds(arr) { write(KEYS.deleted, Array.isArray(arr) ? arr : []); },
  addDeletedId(id) { const a = read(KEYS.deleted, []); if (!a.includes(id)) a.push(id); write(KEYS.deleted, a); },
  removeDeletedId(id) { write(KEYS.deleted, read(KEYS.deleted, []).filter((x) => x !== id)); },
  // 统一删除：用户菜(id 以 u 开头)永久删；系统菜隐藏(可恢复)
  deleteRecipe(id) {
    if (String(id).startsWith('u')) this.delUserRecipe(id);
    else this.addDeletedId(id);
  },
};

// 今天日期字符串，用作每日计划的稳定种子
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
