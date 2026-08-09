// 食光小厨 · 抖音教学视频链接
// 设计：精确视频链接优先（菜谱 video 字段，由粘贴文字自动抓取或手动填写）；
//       未收录时生成抖音网页搜索深链，对所有菜自动生效、零维护、不会死链。
// 注：不依赖 App 级深链（snssdk1128://），因其在 PWA / 桌面不稳定；网页搜索链接最稳妥。

// 仅匹配 ASCII 安全字符，避免把链接后的中文文案误并入 URL（抖音真实链接均为 ASCII）
const DOUYIN_RE = /https?:\/\/(?:v\.|www\.)?douyin\.com\/[A-Za-z0-9_/?=&%:.\-]+/i;

// 从一段文字里抓取抖音视频链接（粘贴抖音/小红书文案时调用）
export function extractDouyinUrl(text) {
  if (!text) return '';
  const m = text.match(DOUYIN_RE);
  if (!m) return '';
  // 去掉尾部常见的标点 / 全角括号，避免把句子标点带进 URL
  return m[0].replace(/[。，,、）)】】.]+$/, '');
}

// 给定一道菜，返回应跳转的抖音链接
export function douyinUrlFor(dish) {
  if (dish && dish.video) return dish.video;
  const name = (dish && dish.name) ? dish.name : '';
  const q = (name + ' 做法').trim();
  return 'https://www.douyin.com/search/' + encodeURIComponent(q);
}
