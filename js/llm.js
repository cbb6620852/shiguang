// 可选大模型接入（OpenAI 兼容接口）。不填 API Key 时，全程使用本地规则引擎，不影响任何功能。
import { store } from './store.js';

// 调用大模型：把对话消息发给兼容接口，返回文本；无配置或出错返回 null
export async function callLLM(messages) {
  const cfg = store.getLlm();
  if (!cfg || !cfg.key || !cfg.base) return null;
  try {
    const res = await fetch(`${cfg.base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({ model: cfg.model || 'gpt-3.5-turbo', messages, temperature: 0.6 }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

// 用大模型生成一句自然语言建议（与本地计划并存，作为补充参考）
export async function llmSuggestion(profile, recipes) {
  const names = recipes.map((r) => `${r.name}(${r.category}/${r.tags.join(',')})`).join('、');
  const msg = [
    { role: 'system', content: '你是家庭食谱助手，用简洁中文给今日配餐建议，只说思路，不超过80字。' },
    {
      role: 'user',
      content:
        `用餐人数${profile.people}，目标${profile.goal}，口味偏好${profile.tastes.join('/') || '无'}，忌口${profile.allergies.join('/') || '无'}。` +
        `可选菜：${names}。请给出今日荤素主食搭配思路。`,
    },
  ];
  return callLLM(msg);
}
