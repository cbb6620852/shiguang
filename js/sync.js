// 家庭共享后端：阿里云函数计算 FC（HTTP 触发器，匿名访问）+ OSS 存储
// FC 函数负责读写 OSS bucket 中 `shares/{household}.json` 一份 JSON 快照（household = 共享码）。
// 前端用「共享码」当房间号；FC 匿名访问，跨域由函数返回的 CORS 头放行，适合一家人共享。
// 所有读写失败都优雅降级：本机数据照常可用，状态文案提示用户。
import { store, todayKey } from './store.js';

const CFG_KEY = 'shiguang_sync';
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
  _saveTimer: null,
  _saving: false,

  isEnabled() {
    const c = this.cfg || {};
    return !!(c.enabled && c.endpoint && c.household);
  },
  getCfg() { return this.cfg; },
  setCfg(partial) { this.cfg = { ...readCfg(), ...partial }; writeCfg(this.cfg); },

  // 归一化 endpoint：去掉结尾的 /
  baseUrl() { return (this.cfg.endpoint || '').replace(/\/+$/, ''); },

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
    const { household } = this.cfg;
    const url = `${this.baseUrl()}?household=${encodeURIComponent(household)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data && data.payload) {
        this.applyPayload(data.payload);
        this.lastStatus = '已同步 · ' + fmtTime(data.updatedAt || new Date().toISOString());
        return { ok: true };
      }
      this.lastStatus = '已连接 · 暂无共享数据，本机数据将作为首次共享';
      return { ok: true, empty: true };
    } catch (e) {
      this.lastStatus = '离线 · 使用本地数据（' + errMsg(e) + '）';
      return { ok: false, error: e };
    }
  },

  // 回写云端（FC 函数负责 upsert：有则覆盖、无则新建）
  async saveShared() {
    if (!this.isEnabled()) return { ok: false, reason: 'disabled' };
    if (this._saving) return { ok: false, reason: 'busy' };
    this._saving = true;
    try {
      const { household } = this.cfg;
      const payload = this.buildPayload();
      const res = await fetch(this.baseUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household, payload }),
      });
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
    return this.loadShared();
  },
};

function errMsg(e) { return e && e.message ? e.message : '网络错误'; }
function fmtTime(s) {
  try { return new Date(s).toLocaleString('zh-CN', { hour12: false }); } catch { return ''; }
}
