// 家庭共享后端：LeanCloud 国内版（BaaS，leancloud.cn）
// 数据模型：类 FamilyShare，每条记录 = 一个家庭(household 共享码)的共享快照。
//   字段：household(字符串，用于查询) + payload(JSON: 今日菜单/自定义菜谱/画像/隐藏/冰箱)。
// 客户端直接用 App ID + App Key 调 REST API（密钥暴露在前端，靠「Web 安全域名」+ 共享码保密，适合一家人用）。
// 所有读写失败都优雅降级：本机数据照常可用，状态文案提示用户。
import { store, todayKey } from './store.js';

const CFG_KEY = 'shiguang_sync';
const API_BASE = 'https://api.leancloud.cn/1.1';
const CLASS = 'FamilyShare';
const SAVE_DELAY = 1000;

function readCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
}
function writeCfg(c) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export const sync = {
  cfg: readCfg(),
  lastStatus: '',
  _objId: null,
  _saveTimer: null,
  _saving: false,

  isEnabled() {
    const c = this.cfg || {};
    return !!(c.enabled && c.appId && c.appKey && c.household);
  },
  getCfg() { return this.cfg; },
  setCfg(partial) { this.cfg = { ...readCfg(), ...partial }; writeCfg(this.cfg); },

  // 把本地需要共享的数据打包成一份快照
  buildPayload() {
    return {
      v: 1,
      today: store.getToday(),
      userRecipes: store.getUserRecipes(),
      profile: store.getProfile(),
      deleted: store.getDeletedIds(),
      pantry: store.getPantry(),
    };
  },

  // 把云端快照写回本地（不触发回写，避免同步环路）
  applyPayload(pl) {
    if (!pl) return;
    if (pl.profile) store.setProfile(pl.profile);
    if (Array.isArray(pl.userRecipes)) store.setUserRecipes(pl.userRecipes);
    if (Array.isArray(pl.deleted)) store.setDeletedIds(pl.deleted);
    if (Array.isArray(pl.pantry)) store.setPantry(pl.pantry);
    // 今日只在本日有效时覆盖，避免把别天的旧菜单塞进来
    if (pl.today && pl.today.date === todayKey()) store.setToday(pl.today);
  },

  // 拉取全家共享数据（启动或点「连接」时调用）
  async loadShared() {
    if (!this.isEnabled()) return { ok: false, reason: 'disabled' };
    const { appId, appKey, household } = this.cfg;
    const url = `${API_BASE}/classes/${CLASS}?where=${encodeURIComponent(JSON.stringify({ household }))}`;
    try {
      const res = await fetch(url, {
        headers: { 'X-LC-Id': appId, 'X-LC-Key': appKey, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const row = data.results && data.results[0];
      if (row) {
        this._objId = row.objectId;
        this.applyPayload(row.payload);
        this.lastStatus = '已同步 · ' + fmtTime(row.updatedAt);
        return { ok: true, updatedAt: row.updatedAt };
      }
      this.lastStatus = '已连接 · 暂无共享数据，本机数据将作为首次共享';
      return { ok: true, empty: true };
    } catch (e) {
      this.lastStatus = '离线 · 使用本地数据（' + errMsg(e) + '）';
      return { ok: false, error: e };
    }
  },

  // 回写云端：按 household 找记录，有则 PUT 更新、无则 POST 新建（upsert）
  async saveShared() {
    if (!this.isEnabled()) return { ok: false, reason: 'disabled' };
    if (this._saving) return { ok: false, reason: 'busy' };
    this._saving = true;
    try {
      const { appId, appKey, household } = this.cfg;
      const headers = { 'X-LC-Id': appId, 'X-LC-Key': appKey, 'Content-Type': 'application/json' };
      const payload = this.buildPayload();
      // 没有缓存 objectId 时先查一次
      if (!this._objId) {
        const q = await fetch(`${API_BASE}/classes/${CLASS}?where=${encodeURIComponent(JSON.stringify({ household }))}`, { headers });
        const qd = await q.json();
        if (qd.results && qd.results[0]) this._objId = qd.results[0].objectId;
      }
      let res;
      if (this._objId) {
        res = await fetch(`${API_BASE}/classes/${CLASS}/${this._objId}`, {
          method: 'PUT', headers, body: JSON.stringify({ payload }),
        });
      } else {
        res = await fetch(`${API_BASE}/classes/${CLASS}`, {
          method: 'POST', headers, body: JSON.stringify({ household, payload }),
        });
        if (res.ok) { const rd = await res.json(); this._objId = rd.objectId; }
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      this.lastStatus = '已同步 · ' + fmtTime(new Date().toISOString());
      return { ok: true };
    } catch (e) {
      this.lastStatus = '同步失败 · ' + errMsg(e);
      return { ok: false, error: e };
    } finally {
      this._saving = false;
    }
  },

  // 本地变更后调用：防抖回写云端
  scheduleSave(delay = SAVE_DELAY) {
    if (!this.isEnabled()) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => { this._saveTimer = null; this.saveShared(); }, delay);
  },

  // 应用本机配置变化后，立刻重连并拉取（不防抖）
  async reconnect() {
    this._objId = null;
    return this.loadShared();
  },
};

function errMsg(e) { return e && e.message ? e.message : '网络错误'; }
function fmtTime(s) {
  try { return new Date(s).toLocaleString('zh-CN', { hour12: false }); } catch { return ''; }
}
