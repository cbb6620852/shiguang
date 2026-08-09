// 食光小厨 · 前端主控：路由 + 6 个视图 + 做菜计时
import { RECIPES, CATEGORIES, getRecipeById, allRecipes } from '../data/recipes.js';
import { store, todayKey, SLOTS, SLOT_LABEL } from './store.js';
import { generateDailyPlan, computeTargets, PREG_STAGES } from './planner.js';
import { aggregateNutrition, menuDishes } from './nutrition.js';
import { analyzeNutrition, NUTRIENTS } from './nutrients.js';
import { shoppingList } from './shopping.js';
import { llmSuggestion } from './llm.js';
import { STEP_ENRICH } from '../data/stepEnrich.js';
import { stepImage } from './stepArt.js';
import { extractDouyinUrl, douyinUrlFor } from './douyin.js';

const TABS = [
  { key: 'today', label: '今日', icon: '📅' },
  { key: 'order', label: '点菜', icon: '🍽️' },
  { key: 'recipes', label: '菜谱', icon: '📖' },
  { key: 'cook', label: '做菜', icon: '👨‍🍳' },
  { key: 'shop', label: '清单', icon: '🛒' },
  { key: 'nutrition', label: '营养', icon: '📊' },
  { key: 'me', label: '我的', icon: '⚙️' },
];

const state = { tab: 'today', today: null, cook: null, cookStep: 0, orderCat: CATEGORIES[0], suggest: '', timer: null, search: '', recipeCat: '全部', orderSel: {} };
const SLOT_LBL = { breakfast: '早', lunch: '午', dinner: '晚', snack: '加餐' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const catClass = (c) => ({ 荤菜: 'meat', 蔬菜: 'veg', 凉拌: 'cold', 主食: 'staple', 汤类: 'soup' }[c] || 'veg');
// 菜谱库卡片里的孕期适宜徽章（早/中/晚 三格）
function pregBadge(d) {
  const preg = d.preg;
  if (!preg) return '';
  const map = { early: '早', mid: '中', late: '晚' };
  const stages = preg.stages || [];
  const dots = ['early', 'mid', 'late'].map((s) => `<span class="preg-dot ${stages.includes(s) ? 'on' : 'off'}">${map[s]}</span>`).join('');
  const caution = preg.caution ? ` <span class="preg-caution">⚠️ ${esc(preg.caution)}</span>` : '';
  return `<div class="preg-badge">孕期适宜：<span class="preg-dots">${dots}</span>${caution}</div>`;
}
const goalLabel = (g) => ({ maintain: '保持', lose: '减脂', gain: '增肌' }[g] || '保持');
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// 轻量 toast 提示（追加到 body，不受视图重渲染影响）
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

function ensureToday() {
  const key = todayKey();
  let t = store.getToday();
  if (!t || t.date !== key) {
    t = { date: key, ...generateDailyPlan(store.getProfile(), key) };
    store.setToday(t);
  }
  state.today = t;
}

// ---------------- 视图 ----------------
function viewToday() {
  ensureToday();
  const t = state.today;
  const nut = aggregateNutrition(t);
  const tg = computeTargets(store.getProfile());
  const stage = t.stage;
  let html = `<div class="page"><div class="brand">食光小厨</div><h1>今日食谱</h1>`;
  html += `<p class="sub">${esc(t.date)} ｜ ${nut.cal} kcal · 蛋白 ${nut.protein}g（目标 ${tg.cal}）</p>`;
  if (stage) {
    const wk = stage.weeks != null ? ` · 约 ${stage.weeks} 周${stage.days ? ' ' + stage.days + ' 天' : ''}` : '';
    html += `<div class="preg-card">
      <div class="preg-h">🤰 孕期模式 · ${esc(stage.label)}${wk}</div>
      <div class="preg-focus">${esc(stage.focus)}</div>
      ${stage.summary ? `<div class="preg-summary">📌 ${esc(stage.summary)}</div>` : ''}
    </div>`;
  }
  for (const slot of SLOTS) {
    const ids = t[slot] || [];
    html += `<div class="slot"><div class="slot-h">${SLOT_LABEL[slot]}</div>`;
    if (!ids.length) html += `<div class="empty">暂无，去"点菜"添加</div>`;
    for (const id of ids) {
      const d = getRecipeById(id); if (!d) continue;
      const preg = d.preg || {};
      const reason = preg.reason ? `<div class="dish-reason">💡 ${esc(preg.reason)}</div>` : '';
      const caution = preg.caution ? `<div class="dish-caution">⚠️ ${esc(preg.caution)}</div>` : '';
      html += `<div class="dish-row">
        <div><div class="dish-name">${esc(d.name)}</div>
        <div class="dish-meta"><span class="badge cat-${catClass(d.category)}">${esc(d.category)}</span> ⏱${d.time}分 · 🔥${d.calories}kcal</div>
        ${reason}${caution}</div>
        <button class="x" data-action="remove" data-id="${d.id}" data-slot="${slot}">✕</button>
      </div>`;
    }
    html += `</div>`;
  }
  html += `<div class="actions"><button class="btn primary" data-action="regen">🔄 重新生成今日</button></div>`;
  if (state.suggest) html += `<div class="suggest">💡 ${esc(state.suggest)}</div>`;
  html += `<p class="hint">想换菜？去"点菜"先点 早/午/晚/加餐 选中时段，再点「➕加」加入，或在上方 ✕ 移除。</p></div>`;
  return html;
}

function viewOrder() {
  let html = `<div class="page"><h1>点菜</h1><p class="sub">先点 早/午/晚/加餐 选中时段（按钮变色），再点「➕加」加入今日菜单</p><div class="cat-tabs">`;
  for (const c of CATEGORIES) {
    html += `<button class="cat-tab ${c === state.orderCat ? 'active' : ''}" data-action="cat" data-cat="${esc(c)}">${esc(c)}</button>`;
  }
  html += `</div><div class="grid">`;
  for (const d of allRecipes().filter((r) => r.category === state.orderCat)) {
    html += `<div class="card">
      <div class="card-h"><span class="dish-name">${esc(d.name)}</span>${videoBadge(d)}<span class="badge cat-${catClass(d.category)}">${esc(d.category)}</span></div>
      <div class="dish-meta">⏱${d.time}分 · 🔥${d.calories}kcal · 难度${'★'.repeat(d.difficulty)}</div>
      <div class="tags">${d.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${addRow(d)}</div>`;
  }
  html += `</div></div>`;
  return html;
}

// 抖音图标（音乐符），用于标记已收录视频的菜
const VD_ICON = '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="#fff" d="M12 3v9.55A4 4 0 1014 16V7h3V3h-5z"/></svg>';
function videoBadge(d) {
  return (d && d.video)
    ? `<span class="vd-badge" title="已收录抖音教学视频，做菜页可一键跳转">${VD_ICON}抖音</span>`
    : '';
}

// 菜谱库：现成菜谱 + 搜索 + 手动添加（含"粘贴文字自动生成"）
function viewRecipes() {
  const all = allRecipes();
  const cats = ['全部', ...CATEGORIES];
  const q = (state.search || '').trim().toLowerCase();
  let html = `<div class="page"><h1>菜谱库</h1><p class="sub">现成 ${all.length} 道菜 · 可搜索、可手动添加新菜</p>`;
  html += `<div class="search"><input id="r-search" type="search" placeholder="搜索菜名 / 食材 / 标签…" value="${esc(state.search)}"></div>`;
  html += `<div class="cat-tabs">`;
  for (const c of cats) {
    html += `<button class="cat-tab ${c === state.recipeCat ? 'active' : ''}" data-action="r-cat" data-cat="${esc(c)}">${esc(c)}</button>`;
  }
  html += `</div><div class="grid" id="r-grid">`;
  for (const d of all) {
    const hay = (d.name + ' ' + d.ingredients.map((i) => i.name).join(' ') + ' ' + d.tags.join(' ')).toLowerCase();
    const hidden = !((state.recipeCat === '全部' || d.category === state.recipeCat) && (!q || hay.includes(q)));
    const isUser = String(d.id).startsWith('u');
    html += `<div class="card recipe-card ${hidden ? 'hide' : ''}" data-hay="${esc(hay)}" data-cat="${esc(d.category)}">
      <div class="card-h"><span class="dish-name">${esc(d.name)}</span>${videoBadge(d)}<span class="badge cat-${catClass(d.category)}">${esc(d.category)}</span></div>
      <div class="dish-meta">⏱${d.time}分 · 🔥${d.calories}kcal · 难度${'★'.repeat(d.difficulty)}</div>
      <div class="tags">${d.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${pregBadge(d)}
      ${addRow(d)}
      ${isUser ? `<button class="mini del" data-action="r-del" data-id="${d.id}">删</button>` : ''}</div>`;
  }
  html += `</div><button class="fab" data-action="new-recipe">＋ 新建菜谱</button></div>`;
  return html;
}

// 在 #r-grid 里按当前搜索词/分类隐藏卡片（不重渲染，保留搜索框焦点）
function filterRecipeList() {
  const q = (state.search || '').trim().toLowerCase();
  const cat = state.recipeCat;
  document.querySelectorAll('#r-grid .recipe-card').forEach((el) => {
    const hay = el.dataset.hay || '';
    const c = el.dataset.cat || '';
    el.classList.toggle('hide', !((!q || hay.includes(q)) && (cat === '全部' || c === cat)));
  });
}

function viewCook() {
  ensureToday();
  if (state.cook) {
  const d = getRecipeById(state.cook);
  const idx = state.cookStep || 0;
  const step = d.steps[idx];
  const en = (STEP_ENRICH[d.id] || [])[idx] || {};
  const text = en.text || step.text;
  const season = en.season || [];
  const seasonChips = season.length
    ? `<div class="season-row"><span class="season-label">🥄 本步用料</span>${season.map((s) => `<span class="season-chip">${esc(s.name)} <b>${typeof s.qty === 'number' ? s.qty : esc(s.qty)}${s.unit ? ' ' + esc(s.unit) : ''}</b></span>`).join('')}</div>`
    : '';
  let html = `<div class="page cook">
    <button class="back" data-action="cook-back">← ${esc(d.name)}</button>
    <div class="douyin-bar">
      <button class="btn btn-douyin" data-action="douyin-open" data-id="${d.id}">📺 抖音教学视频</button>
      <span class="douyin-note">${d.video ? '已收录该菜专属视频，点开即看' : '未收录则跳转抖音搜索该菜做法'}</span>
    </div>
    <div class="step-count">步骤 ${idx + 1} / ${d.steps.length}</div>
    <div class="step-art">${stepImage(en)}</div>
    <div class="step-text">${esc(text)}</div>
    ${seasonChips}
    ${step.tip ? `<div class="tip">💡 ${esc(step.tip)}</div>` : ''}
    ${step.timer ? `<div class="timer" id="timer">⏱ ${fmtTime(step.timer)}</div>
      <button class="btn" data-action="timer-start" data-sec="${step.timer}">开始计时</button>` : ''}
    <div class="actions row">
      <button class="btn" data-action="cook-prev" ${idx === 0 ? 'disabled' : ''}>上一步</button>
      <button class="btn primary" data-action="cook-next" ${idx === d.steps.length - 1 ? 'disabled' : ''}>${idx === d.steps.length - 1 ? '完成 ✓' : '下一步'}</button>
    </div></div>`;
  return html;
  }
  const dishes = menuDishes(state.today);
  let html = `<div class="page"><h1>做菜指导</h1><p class="sub">选一道菜，跟着步骤做</p><div class="list">`;
  for (const d of dishes) {
    html += `<button class="row-btn" data-action="cook-open" data-id="${d.id}"><span>${esc(d.name)} ${videoBadge(d)}</span><span class="muted">${d.steps.length}步 →</span></button>`;
  }
  if (!dishes.length) html += `<div class="empty">今日还没有菜，先去"点菜"或"今日"生成</div>`;
  html += `</div></div>`;
  return html;
}

function viewShop() {
  ensureToday();
  const list = shoppingList(state.today);
  const order = ['蔬菜', '肉蛋豆制品', '主食', '调料', '其他'];
  let html = `<div class="page"><h1>购物清单</h1><p class="sub">已扣除冰箱现有食材（在"我的"里维护）</p>`;
  let any = false;
  for (const g of order) {
    if (!list[g] || !list[g].length) continue;
    any = true;
    html += `<div class="slot"><div class="slot-h">${g}</div>`;
    for (const it of list[g]) {
      html += `<label class="check ${it.need ? '' : 'have'}">
        <input type="checkbox" data-action="check" data-name="${esc(it.name)}" ${it.need ? '' : 'checked disabled'}>
        <span>${esc(it.name)} ${it.qty}${esc(it.unit)} ${it.need ? '' : '（冰箱有）'}</span></label>`;
    }
    html += `</div>`;
  }
  if (!any) html += `<div class="empty">暂无需要购买的食材</div>`;
  html += `</div>`;
  return html;
}

function viewNutrition() {
  ensureToday();
  const profile = store.getProfile();
  const res = analyzeNutrition(state.today, profile);
  const tg = computeTargets(profile);
  const bar = (name, val, target, unit) => {
    const pct = target ? Math.min(100, Math.round((val / target) * 100)) : 0;
    return `<div class="bar-block"><div class="bar-top"><span>${name}</span><span>${val} / ${target} ${unit}</span></div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div></div>`;
  };
  const stageLabel = res.stage
    ? `${res.stage.label}（约 ${res.stage.weeks} 周${res.stage.days ? ' ' + res.stage.days + ' 天' : ''}）`
    : '家庭通用';
  let html = `<div class="page"><h1>营养统计</h1>`;

  // 1) 精确数字：热量 / 蛋白质（菜谱里已有真实数值）
  html += `<div class="card"><div class="slot-h">📈 今日摄入（按 ${profile.people} 人）</div>`;
  html += bar('热量', res.cal, tg.cal, 'kcal');
  html += bar('蛋白质', res.protein, tg.protein, 'g');
  html += `</div>`;

  // 2) 本阶段重点营养需求
  html += `<div class="card"><div class="slot-h">🤰 本阶段重点营养 · ${stageLabel}</div>`;
  if (res.stage) html += `<p class="sub">${esc(res.stage.focus)}</p>`;
  html += `<div class="nut-grid">`;
  for (const n of res.neededDetail) {
    html += `<div class="nut-cell"><div class="nut-ic">${n.icon}</div>
      <div><div class="nut-nm">${n.name}</div><div class="nut-tg">${n.target}</div></div></div>`;
  }
  html += `</div></div>`;

  // 3) 今日菜品 ↔ 营养对应（覆盖情况 + 来源菜品）
  html += `<div class="card"><div class="slot-h">🔗 今日菜品 ↔ 营养对应</div>`;
  html += `<p class="sub">重点营养已覆盖 ${res.coveredCount}/${res.total}（按食材估算，仅供参考）</p>`;
  for (const c of res.coverage) {
    const badge = c.covered
      ? `<span class="nut-badge ok">✅ 已覆盖</span>`
      : `<span class="nut-badge lack">⚠️ 待补充</span>`;
    const src = c.covered
      ? `<div class="nut-src">来源：${esc(c.providers.join('、'))}</div>`
      : `<div class="nut-src lack">建议：${esc(c.why)}</div>`;
    html += `<div class="nut-row">
      <div class="nut-row-h"><span class="nut-ic sm">${c.icon}</span><span class="nut-nm">${c.name}</span>
      <span class="nut-tg">${c.target}</span>${badge}</div>${src}</div>`;
  }
  html += `</div></div>`;
  return html;
}

function viewMe() {
  const p = store.getProfile();
  const pantry = store.getPantry();
  const llm = store.getLlm();
  const tasteOpts = ['微辣', '中辣', '清淡', '酸甜', '咸鲜'];
  const tastesHtml = tasteOpts.map((t) => `<label class="chk"><input type="checkbox" class="taste" value="${t}" ${p.tastes.includes(t) ? 'checked' : ''}> ${t}</label>`).join('');
  const goalOpts = ['maintain', 'lose', 'gain'].map((g) => `<option value="${g}" ${p.goal === g ? 'selected' : ''}>${goalLabel(g)}</option>`).join('');
  let html = `<div class="page"><h1>我的</h1>
    <div class="card">
      <div class="slot-h">🤰 孕期模式</div>
      <label class="field chk-inline"><input type="checkbox" id="f-preg-on" ${p.pregnancy && p.pregnancy.enabled ? 'checked' : ''}> 开启孕期专属食谱推荐</label>
      <label class="field">预产期 <input id="f-due" type="date" value="${esc((p.pregnancy && p.pregnancy.dueDate) || '')}"></label>
      <p class="hint">填预产期将自动推算「孕X周X天」与阶段；不填可手动选阶段。</p>
      <label class="field">手动阶段 <select id="f-stage">
        ${['early', 'mid', 'late'].map((s) => `<option value="${s}" ${((p.pregnancy && p.pregnancy.stage) || 'mid') === s ? 'selected' : ''}>${PREG_STAGES[s].label}（${PREG_STAGES[s].range}）</option>`).join('')}
      </select></label>
      <p class="sub">保存后「今日食谱」会按阶段推荐并附理由。食谱仅供参考，具体请遵医嘱。</p>
    </div>
    <div class="card">
      <div class="slot-h">饮食画像</div>
      <label class="field">用餐人数 <input id="f-people" type="number" min="1" value="${p.people}"></label>
      <label class="field">健康目标 <select id="f-goal">${goalOpts}</select></label>
      <label class="field">厨艺水平 <span class="muted">${'★'.repeat(p.skill)}</span><input id="f-skill" type="range" min="1" max="3" value="${p.skill}"></label>
      <label class="field">每餐时间(分) <input id="f-time" type="number" min="5" value="${p.timeBudget}"></label>
      <div class="field">口味偏好 <div class="chips">${tastesHtml}</div></div>
      <label class="field">忌口/过敏(逗号分隔) <input id="f-allergies" value="${esc((p.allergies || []).join('，'))}"></label>
      <label class="field">不爱吃(逗号分隔) <input id="f-dislikes" value="${esc((p.dislikes || []).join('，'))}"></label>
      <button class="btn primary" data-action="save-profile">保存画像并刷新今日</button>
    </div>
    <div class="card">
      <div class="slot-h">冰箱现有食材</div>
      <div class="add-row"><input id="f-pantry" placeholder="如 鸡蛋、米饭"><button class="btn" data-action="pantry-add">添加</button></div>
      <div class="chips">${pantry.map((x) => `<span class="chip">${esc(x)} <b data-action="pantry-del" data-name="${esc(x)}">✕</b></span>`).join('') || '<span class="muted">空</span>'}</div>
    </div>
    <div class="card">
      <div class="slot-h">大模型(可选)</div>
      <p class="sub">不填也能用（本地规则引擎）。填了可用 AI 给今日配餐建议。</p>
      <label class="field">API Key <input id="f-llm-key" value="${esc(llm.key || '')}" placeholder="sk-..."></label>
      <label class="field">Base URL <input id="f-llm-base" value="${esc(llm.base || '')}" placeholder="https://api.openai.com/v1"></label>
      <label class="field">模型 <input id="f-llm-model" value="${esc(llm.model || 'gpt-3.5-turbo')}"></label>
      <button class="btn" data-action="save-llm">保存大模型配置</button>
      <button class="btn ghost" data-action="llm-suggest">✨ 让 AI 给今日建议</button>
    </div>
  </div>`;
  return html;
}

// ---------------- 新建菜谱（表单 + 粘贴文字自动生成） ----------------
const $val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
const $set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };

function closeRecipeModal() { const m = document.getElementById('r-modal'); if (m) m.remove(); }

function openRecipeModal() {
  closeRecipeModal();
  const cats = CATEGORIES;
  const div = document.createElement('div');
  div.id = 'r-modal';
  div.className = 'modal-mask';
  div.dataset.action = 'r-close';
  div.innerHTML = `
    <div class="modal">
      <div class="modal-h">新建菜谱<button class="x" data-action="r-close">✕</button></div>
      <div class="tabs">
        <button class="tab active" data-action="r-tab" data-mode="form">逐项填写</button>
        <button class="tab" data-action="r-tab" data-mode="paste">粘贴文字自动生成</button>
      </div>
      <div class="modal-body" id="r-form">
        <label class="field">菜名 <input id="nr-name" placeholder="如 西红柿鸡蛋汤"></label>
        <label class="field">分类 <select id="nr-cat">${cats.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <label class="field">标签(逗号分隔) <input id="nr-tags" placeholder="清淡, 快手"></label>
        <div class="row2">
          <label class="field">难度<input id="nr-diff" type="number" min="1" max="3" value="2"></label>
          <label class="field">耗时(分)<input id="nr-time" type="number" min="1" value="15"></label>
        </div>
        <div class="row2">
          <label class="field">份量<input id="nr-serv" type="number" min="1" value="2"></label>
          <label class="field">热量(kcal)<input id="nr-cal" type="number" min="0" value="0"></label>
        </div>
        <label class="field">蛋白质(g)<input id="nr-pro" type="number" min="0" value="0"></label>
        <label class="field">抖音视频链接(可选) <input id="nr-video" placeholder="粘贴 douyin.com/... 链接，自动跳转该视频"></label>
        <label class="field">食材（每行一个：名称 数量 单位）<textarea id="nr-ing" rows="4" placeholder="鸡蛋 2 个&#10;西红柿 2 个"></textarea></label>
        <label class="field">步骤（每行一步；可选 “| 秒数” 设计时，如 煮开 | 120）<textarea id="nr-steps" rows="5" placeholder="西红柿切块&#10;水开下番茄 | 60"></textarea></label>
        <button class="btn primary" data-action="r-save">保存菜谱</button>
      </div>
      <div class="modal-body hide" id="r-paste">
        <p class="sub">把抖音 / 小红书等看到的做菜文字粘贴进来，自动识别菜名、食材、步骤，确认后微调保存。</p>
        <textarea id="nr-paste-text" rows="10" placeholder="例如：&#10;西红柿鸡蛋汤&#10;食材：西红柿2个、鸡蛋2个、小葱1根、盐2克&#10;步骤：1.西红柿切块 2.水开下番茄煮出味 3.淋蛋液 4.加盐葱花出锅"></textarea>
        <button class="btn" data-action="r-parse">自动识别</button>
        <p class="hint" id="r-parse-hint"></p>
        <button class="btn primary" data-action="r-save">保存菜谱</button>
      </div>
    </div>`;
  document.body.appendChild(div);
}

function switchRtab(mode) {
  document.querySelectorAll('#r-modal .tab').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  document.getElementById('r-form').classList.toggle('hide', mode !== 'form');
  document.getElementById('r-paste').classList.toggle('hide', mode !== 'paste');
}

function detectTimer(t) {
  const m = t.match(/(\d{1,3})\s*分钟/);
  if (m) { const n = parseInt(m[1], 10); if (n <= 180) return n * 60; }
  const s = t.match(/(\d{1,3})\s*秒/);
  if (s) { const n = parseInt(s[1], 10); if (n <= 600) return n; }
  return null;
}

function guessCat(name) {
  if (/汤|羹|煲/.test(name)) return '汤类';
  if (/凉拌|拌/.test(name)) return '凉拌';
  if (/炒饭|炒面|粥|米饭|面条|馒头|饺子|包子|面$|饭$/.test(name)) return '主食';
  return '荤菜';
}

// 本地启发式解析：把自由文本（如抖音/小红书复制的做菜文字）变成菜谱草稿（无需联网/API）
function parseRecipeText(text) {
  const lines = text.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  let name = lines[0].replace(/^(教程|做法|配方|菜谱|教您|教你|家常菜|快手菜)[：:\s]*/, '').replace(/[🍳✅🔥❤️⭐▶️]/g, '').trim();
  const video = extractDouyinUrl(text); // 粘贴文案里若带抖音链接则自动抓取
  const unit = '(克|g|毫升|ml|个|只|根|条|瓣|勺|茶匙|汤匙|片|块|杯|包|袋|斤|两|颗|朵|盒|罐|张|人份|碗|段|把|尾)';
  const unitRe = new RegExp(unit);
  const isStepHeader = /^【?\s*(步骤|做法|制作|制作过程|方法|步骤说明|操作)/;
  const isNumbered = (l) => /^\d+[\.、)）]/.test(l);
  const hasUnit = (l) => unitRe.test(l) || /^(食材|用料|准备|材料|配料)/.test(l);
  const ingredients = [], steps = [];
  let inStep = false, seenIngredients = false;
  const pushStep = (s) => { s = s.replace(/^\d+[\.、)）]\s*/, '').trim(); if (s) steps.push(s); };
  for (let i = 1; i < lines.length; i++) {
    let l = lines[i];
    if (isStepHeader.test(l)) {
      inStep = true;
      l = l.replace(/^【?\s*(步骤|做法|制作|制作过程|方法|步骤说明|操作)\s*】?\s*[：:]?\s*/, '');
      if (l) l.split(/(?=\d+[\.、)）])/).forEach(pushStep);
      continue;
    }
    if (isNumbered(l)) { inStep = true; pushStep(l); continue; }
    if (!inStep && hasUnit(l)) {
      const body = l.replace(/^(食材|用料|准备|材料|配料)[：:\s]*/, '');
      const toks = body.split(/[、，,/\s]+/).map((s) => s.trim()).filter(Boolean);
      for (const t of toks) {
        const m = t.match(new RegExp('^(.*?)(\\d+\\.?\\d*)\\s*' + unit + '?'));
        if (m && m[1].trim()) ingredients.push({ name: m[1].trim(), qty: isFinite(parseFloat(m[2])) ? parseFloat(m[2]) : m[2], unit: m[3] || '适量' });
        else if (m && !m[1].trim()) { /* 数字开头、无名，跳过避免脏数据 */ }
        else if (t && !/^(食材|用料)/.test(t)) ingredients.push({ name: t, qty: '适量', unit: '' });
      }
      seenIngredients = true;
      continue;
    }
    if (seenIngredients && !hasUnit(l)) inStep = true; // 食材之后的非食材短行视为步骤
    if (inStep || steps.length || l.length > 12) { if (!isStepHeader.test(l)) pushStep(l); }
  }
  return { name, ingredients, steps, video };
}

function fillRecipeForm(p) {
  if (!p) return;
  $set('nr-name', p.name || '');
  $set('nr-video', p.video || '');
  const sel = document.getElementById('nr-cat');
  if (sel) sel.value = CATEGORIES.includes(guessCat(p.name || '')) ? guessCat(p.name || '') : sel.value;
  $set('nr-tags', '');
  $set('nr-ing', (p.ingredients || []).map((i) => `${i.name} ${i.qty} ${i.unit || ''}`.trim()).join('\n'));
  $set('nr-steps', (p.steps || []).map((s) => (typeof s === 'string' ? s : s.text + (s.timer ? ` | ${s.timer}` : ''))).join('\n'));
  $set('nr-time', Math.max(8, (p.steps || []).length * 5));
  switchRtab('form');
}

function saveRecipe() {
  const name = $val('nr-name').trim();
  const video = $val('nr-video').trim();
  const cat = $val('nr-cat');
  if (!name) { alert('请填写菜名'); return; }
  const ing = $val('nr-ing').split(/\n+/).map((s) => s.trim()).filter(Boolean).map((line) => {
    const m = line.match(/^(.*?)[\s：:]+(\d+\.?\d*)\s*(\S+)?$/);
    if (m) return { name: m[1].trim(), qty: isFinite(parseFloat(m[2])) ? parseFloat(m[2]) : m[2], unit: m[3] || '适量' };
    const p = line.split(/\s+/);
    return { name: p[0], qty: isFinite(parseFloat(p[1])) ? parseFloat(p[1]) : (p[1] || '适量'), unit: p[2] || '适量' };
  });
  const steps = $val('nr-steps').split(/\n+/).map((s) => s.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/\s*\|\s*/);
    const text = parts[0].trim();
    const t = parts[1] ? parseInt(parts[1], 10) : detectTimer(text);
    return { text, timer: isNaN(t) ? null : t, tip: (parts[2] || '').trim() };
  });
  const recipe = {
    id: 'u' + Date.now(),
    name, category: cat, cuisine: '',
    tags: $val('nr-tags').split(/[，,\s]+/).map((s) => s.trim()).filter(Boolean),
    difficulty: parseInt($val('nr-diff'), 10) || 2,
    time: parseInt($val('nr-time'), 10) || 15,
    servings: parseInt($val('nr-serv'), 10) || 2,
    calories: parseInt($val('nr-cal'), 10) || 0,
    protein: parseInt($val('nr-pro'), 10) || 0,
    ingredients: ing, steps, tips: '', video,
  };
  store.addUserRecipe(recipe);
  closeRecipeModal();
  state.tab = 'recipes'; state.search = ''; state.recipeCat = '全部';
  render();
}

// ---------------- 交互 ----------------
function render() {
  const app = document.getElementById('app');
  const views = { today: viewToday, order: viewOrder, recipes: viewRecipes, cook: viewCook, shop: viewShop, nutrition: viewNutrition, me: viewMe };
  app.innerHTML = (views[state.tab] || viewToday)();
  const nav = document.getElementById('nav');
  nav.innerHTML = TABS.map((t) => `<button class="nav-btn ${state.tab === t.key ? 'active' : ''}" data-action="tab" data-tab="${t.key}"><span class="ni">${t.icon}</span><span>${t.label}</span></button>`).join('');
  if (state.tab === 'recipes') filterRecipeList();
}

function setTab(tab) { state.tab = tab; render(); }
function stopTimer() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }
function addDish(id, slot) { ensureToday(); state.today[slot].push(id); store.setToday(state.today); render(); }
function removeDish(id, slot) { ensureToday(); state.today[slot] = state.today[slot].filter((x) => x !== id); store.setToday(state.today); render(); }
function regen() { ensureToday(); state.today = { date: todayKey(), ...generateDailyPlan(store.getProfile(), todayKey()) }; store.setToday(state.today); render(); }

// 点菜/菜谱库的加菜行：先点 早/午/晚/加餐 选中时段（变色），再点「➕加」加入
function addRow(d) {
  const slots = [['breakfast', '早'], ['lunch', '午'], ['dinner', '晚'], ['snack', '加餐']];
  const sel = state.orderSel[d.id];
  const btns = slots.map(([s, l]) => `<button class="mini slot ${sel === s ? 'on' : ''}" data-action="sel" data-id="${d.id}" data-slot="${s}">${l}</button>`).join('');
  return `<div class="add-row">${btns}<button class="mini add-confirm" data-action="add-confirm" data-id="${d.id}">➕ 加</button></div>`;
}

function startTimer(sec) {
  stopTimer();
  const el = document.getElementById('timer');
  if (!el) return;
  let left = sec;
  el.textContent = `⏱ ${fmtTime(left)}`;
  state.timer = setInterval(() => {
    left--;
    if (left <= 0) { el.textContent = '⏰ 时间到！'; clearInterval(state.timer); state.timer = null; if (navigator.vibrate) navigator.vibrate(300); return; }
    el.textContent = `⏱ ${fmtTime(left)}`;
  }, 1000);
}

function saveProfile() {
  const tastes = [...document.querySelectorAll('.taste:checked')].map((c) => c.value);
  const splitCn = (s) => s.split(/[，,]/).map((x) => x.trim()).filter(Boolean);
  const p = {
    people: parseInt(document.getElementById('f-people').value, 10) || 1,
    goal: document.getElementById('f-goal').value,
    skill: parseInt(document.getElementById('f-skill').value, 10) || 2,
    timeBudget: parseInt(document.getElementById('f-time').value, 10) || 30,
    tastes,
    allergies: splitCn(document.getElementById('f-allergies').value),
    dislikes: splitCn(document.getElementById('f-dislikes').value),
    pregnancy: {
      enabled: !!(document.getElementById('f-preg-on') && document.getElementById('f-preg-on').checked),
      dueDate: document.getElementById('f-due') ? document.getElementById('f-due').value.trim() : '',
      stage: document.getElementById('f-stage') ? document.getElementById('f-stage').value : 'mid',
    },
  };
  store.setProfile(p);
  state.suggest = '';
  regen();
}

function pantryAdd() {
  const v = document.getElementById('f-pantry').value.trim();
  if (!v) return;
  const arr = store.getPantry();
  v.split(/[，,]/).map((x) => x.trim()).filter(Boolean).forEach((x) => { if (!arr.includes(x)) arr.push(x); });
  store.setPantry(arr);
  state.tab = 'me'; render();
}
function pantryDel(name) { store.setPantry(store.getPantry().filter((x) => x !== name)); render(); }

function saveLlm() {
  store.setLlm({
    key: document.getElementById('f-llm-key').value.trim(),
    base: document.getElementById('f-llm-base').value.trim(),
    model: document.getElementById('f-llm-model').value.trim() || 'gpt-3.5-turbo',
  });
  alert('已保存大模型配置');
}

async function loadSuggest() {
  state.suggest = 'AI 思考中…';
  render();
  const s = await llmSuggestion(store.getProfile(), allRecipes());
  state.suggest = s || '（未配置或调用失败，仍可使用本地引擎）';
  state.tab = 'today'; render();
}

function onClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const a = btn.dataset.action;
  const { id, slot, cat, sec, name } = btn.dataset;
  switch (a) {
    case 'tab': setTab(btn.dataset.tab); break;
    case 'regen': regen(); break;
    case 'add': addDish(id, slot); break;
    case 'remove': removeDish(id, slot); break;
    case 'cat': state.orderCat = cat; render(); break;
    case 'sel': {
      const cur = state.orderSel[id];
      if (cur === slot) delete state.orderSel[id]; else state.orderSel[id] = slot;
      render();
      break;
    }
    case 'add-confirm': {
      const s = state.orderSel[id];
      if (!s) { toast('请先点 早/午/晚/加餐 选定时段'); break; }
      delete state.orderSel[id];
      addDish(id, s);
      toast('已加入' + SLOT_LBL[s]);
      break;
    }
    case 'r-cat': state.recipeCat = cat; render(); break;
    case 'r-del': if (confirm('删除这道自制菜谱？')) { store.delUserRecipe(id); render(); } break;
    case 'new-recipe': openRecipeModal(); break;
    case 'r-tab': switchRtab(btn.dataset.mode); break;
    case 'r-parse': {
      const p = parseRecipeText($val('nr-paste-text'));
      const hint = document.getElementById('r-parse-hint');
      if (!p) { if (hint) hint.textContent = '没识别到内容，请检查粘贴格式。'; break; }
      fillRecipeForm(p);
      const extra = p.video ? ' · 已自动抓取抖音视频链接' : '';
      if (hint) hint.textContent = `已识别：${p.ingredients.length} 种食材、${p.steps.length} 个步骤${extra}，请在上方核对修改后保存。`;
      break;
    }
    case 'r-save': saveRecipe(); break;
    case 'r-close': if (e.target === btn) closeRecipeModal(); break;
    case 'cook-open': state.cook = id; state.cookStep = 0; stopTimer(); render(); break;
    case 'cook-back': state.cook = null; state.cookStep = 0; stopTimer(); render(); break;
    case 'cook-next': if (state.cook && state.cookStep < getRecipeById(state.cook).steps.length - 1) { state.cookStep++; stopTimer(); render(); } break;
    case 'cook-prev': if (state.cookStep > 0) { state.cookStep--; stopTimer(); render(); } break;
    case 'douyin-open': {
      const url = douyinUrlFor(getRecipeById(id));
      if (url) window.open(url, '_blank', 'noopener');
      break;
    }
    case 'timer-start': startTimer(parseInt(sec, 10)); break;
    case 'check': btn.parentElement.classList.toggle('done'); break;
    case 'save-profile': saveProfile(); break;
    case 'save-llm': saveLlm(); break;
    case 'pantry-add': pantryAdd(); break;
    case 'pantry-del': pantryDel(name); break;
    case 'llm-suggest': loadSuggest(); break;
  }
}

document.addEventListener('click', onClick);
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'r-search') { state.search = e.target.value; filterRecipeList(); }
});
ensureToday();
render();
