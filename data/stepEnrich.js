// 步骤增强层：为内置 35 道菜每步补充「配图(img) + 本步用料(season) + 更具体的描述(text)」。
// 不会改动 recipes.js 本体；做菜页渲染时按 步骤序号 与 recipes.js 的 step 合并：
//   text 优先用这里，否则用原 step.text；img 优先用这里，否则按文字推断；tip/timer 沿用原 step。
// season 字段：[{ name, qty, unit }]，qty 可为数字或字符串（如 '适量'、'1小勺'、'0.5'）。

export const STEP_ENRICH = {
  h1: [
    { img: 'cut', text: '番茄去蒂切 2cm 小块；鸡蛋 3 个打入碗，加 盐 1 克 打散待用。', season: [{ name: '鸡蛋', qty: 3, unit: '个' }, { name: '番茄', qty: 2, unit: '个' }, { name: '盐', qty: 1, unit: '克' }] },
    { img: 'fry', text: '锅烧热，倒 食用油 15 毫升，油面微冒青烟时倒入蛋液；底部凝固后用铲划散，炒至刚熟盛出。', timer: 60, season: [{ name: '食用油', qty: 15, unit: '毫升' }] },
    { img: 'saute', text: '原锅下番茄块，中火翻炒压出红汤，加 白糖 3 克、盐 1 克 炒匀出味。', timer: 120, season: [{ name: '番茄', qty: 2, unit: '个' }, { name: '白糖', qty: 3, unit: '克' }, { name: '盐', qty: 1, unit: '克' }] },
    { img: 'plate', text: '倒回鸡蛋轻翻几下，撒 小葱 1 根（切葱花）出锅。', season: [{ name: '鸡蛋', qty: 3, unit: '个' }, { name: '小葱', qty: 1, unit: '根' }] },
  ],
  h2: [
    { img: 'marinate', text: '鸡胸肉切 1.5cm 丁，加 生抽 10 毫升、淀粉 1 小勺、食用油 5 毫升 抓匀，腌 10 分钟。', timer: 600, season: [{ name: '鸡胸肉', qty: 250, unit: '克' }, { name: '生抽', qty: 10, unit: '毫升' }, { name: '淀粉', qty: 1, unit: '小勺' }, { name: '食用油', qty: 5, unit: '毫升' }] },
    { img: 'season', text: '调碗汁：生抽 5 毫升 + 醋 10 毫升 + 白糖 10 克 + 清水 1 汤匙 + 淀粉少许，搅匀。', season: [{ name: '生抽', qty: 5, unit: '毫升' }, { name: '醋', qty: 10, unit: '毫升' }, { name: '白糖', qty: 10, unit: '克' }] },
    { img: 'fry', text: '油 15 毫升 烧热，下 花生米 50 克 小火炸香盛出。', season: [{ name: '食用油', qty: 15, unit: '毫升' }, { name: '花生米', qty: 50, unit: '克' }] },
    { img: 'saute', text: '原锅下 干辣椒 8 个、花椒 1 小勺 爆香，下鸡丁大火滑炒至变色。', season: [{ name: '干辣椒', qty: 8, unit: '个' }, { name: '花椒', qty: 1, unit: '小勺' }] },
    { img: 'stir-fry', text: '倒碗汁炒匀收浓，加 葱白 2 段、花生米 翻匀出锅。', season: [{ name: '葱白', qty: 2, unit: '段' }, { name: '花生米', qty: 50, unit: '克' }] },
  ],
  h3: [
    { img: 'blanch', text: '鸡翅中 8 个 两面各划两刀，冷水下锅，加 姜片 1 片 焯去血沫，捞出沥干。', timer: 180, season: [{ name: '鸡翅中', qty: 8, unit: '个' }, { name: '姜', qty: 1, unit: '片' }] },
    { img: 'fry', text: '锅倒 油 10 毫升，鸡翅煎至两面金黄。', season: [{ name: '食用油', qty: 10, unit: '毫升' }] },
    { img: 'boil', text: '下 姜片 2 片、生抽 15 毫升、整罐 可乐 1 罐（约 330 毫升）没过鸡翅。', season: [{ name: '姜', qty: 2, unit: '片' }, { name: '生抽', qty: 15, unit: '毫升' }, { name: '可乐', qty: 1, unit: '罐' }] },
    { img: 'reduce', text: '大火烧开转中小火，加盖焖煮收汁至浓稠裹翅。', timer: 900, season: [] },
  ],
  h4: [
    { img: 'marinate', text: '猪里脊 200 克 切细丝，加 生抽 10 毫升、淀粉 5 克、油 5 毫升 抓匀腌 10 分钟。', timer: 600, season: [{ name: '猪里脊', qty: 200, unit: '克' }, { name: '生抽', qty: 10, unit: '毫升' }, { name: '淀粉', qty: 5, unit: '克' }, { name: '食用油', qty: 5, unit: '毫升' }] },
    { img: 'cut', text: '青椒 2 个 去籽切丝；蒜 2 瓣 切片。', season: [{ name: '青椒', qty: 2, unit: '个' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'stir-fry', text: '油 15 毫升 烧热，下肉丝大火滑炒变色盛出。', season: [{ name: '食用油', qty: 15, unit: '毫升' }] },
    { img: 'stir-fry', text: '下 蒜片、青椒丝 炒断生，倒回肉丝，加 生抽 5 毫升 快速炒匀。', season: [{ name: '蒜', qty: 2, unit: '瓣' }, { name: '青椒', qty: 2, unit: '个' }, { name: '生抽', qty: 5, unit: '毫升' }] },
  ],
  h5: [
    { img: 'blanch', text: '五花肉 500 克 切 3cm 方块，冷水下锅焯去血沫，捞出温水冲净。', timer: 240, season: [{ name: '五花肉', qty: 500, unit: '克' }] },
    { img: 'braise', text: '锅少油，下 冰糖 30 克 小火炒至琥珀色，下肉块翻炒上糖色。', season: [{ name: '冰糖', qty: 30, unit: '克' }] },
    { img: 'boil', text: '加 生抽 30 毫升、老抽 10 毫升、姜片 3 片、八角 2 个，倒热水没过肉。', season: [{ name: '生抽', qty: 30, unit: '毫升' }, { name: '老抽', qty: 10, unit: '毫升' }, { name: '姜', qty: 3, unit: '片' }, { name: '八角', qty: 2, unit: '个' }] },
    { img: 'simmer', text: '大火烧开转小火，加盖炖 50 分钟 至软糯。', timer: 3000, season: [] },
    { img: 'reduce', text: '开大火收汁至油亮裹肉。', timer: 300, season: [] },
  ],
  h6: [
    { img: 'steam', text: '鲈鱼 1 条 洗净两面各划 3 刀，盘底铺 姜片 2 片、葱段 1 根，鱼身也放姜片；水开上锅蒸 8 分钟。', timer: 480, season: [{ name: '鲈鱼', qty: 1, unit: '条' }, { name: '姜', qty: 2, unit: '片' }, { name: '葱', qty: 1, unit: '根' }] },
    { img: 'season', text: '倒掉蒸出的腥水，铺新 葱丝、姜丝，淋 蒸鱼豉油 30 毫升。', season: [{ name: '葱', qty: 2, unit: '根' }, { name: '姜', qty: 2, unit: '片' }, { name: '蒸鱼豉油', qty: 30, unit: '毫升' }] },
    { img: 'saute', text: '油 15 毫升 烧至冒烟，泼在葱丝上激出香味。', season: [{ name: '食用油', qty: 15, unit: '毫升' }] },
  ],
  h7: [
    { img: 'blanch', text: '嫩豆腐 1 盒 切 2cm 丁，加 盐 1 小勺 的开水浸泡 5 分钟 去豆腥，沥干。', timer: 300, season: [{ name: '嫩豆腐', qty: 1, unit: '盒' }, { name: '盐', qty: 1, unit: '小勺' }] },
    { img: 'saute', text: '油 20 毫升 烧热，下 肉末 100 克 炒至变色，加 豆瓣酱 20 克 炒出红油。', season: [{ name: '食用油', qty: 20, unit: '毫升' }, { name: '肉末', qty: 100, unit: '克' }, { name: '豆瓣酱', qty: 20, unit: '克' }] },
    { img: 'boil', text: '加清水约 200 毫升 烧开，下豆腐轻推煮 3 分钟 入味。', timer: 180, season: [{ name: '嫩豆腐', qty: 1, unit: '盒' }, { name: '水', qty: 200, unit: '毫升' }] },
    { img: 'reduce', text: '淋水淀粉勾薄芡，撒 花椒粉 2 克、蒜苗 1 根（切段）出锅。', season: [{ name: '花椒粉', qty: 2, unit: '克' }, { name: '蒜苗', qty: 1, unit: '根' }] },
  ],
  h8: [
    { img: 'blanch', text: '牛腩 400 克 切 3cm 块，冷水下锅焯去血沫，捞出冲净。', timer: 300, season: [{ name: '牛腩', qty: 400, unit: '克' }] },
    { img: 'saute', text: '油少许烧热，下 姜片 3 片 炒香，下牛腩翻炒，加 生抽 30 毫升 与热水没过。', season: [{ name: '姜', qty: 3, unit: '片' }, { name: '生抽', qty: 30, unit: '毫升' }] },
    { img: 'simmer', text: '小火加盖炖 50 分钟 至牛肉软。', timer: 3000, season: [] },
    { img: 'boil', text: '加 土豆 2 个、胡萝卜 1 根、番茄 1 个（切块）再炖 20 分钟。', timer: 1200, season: [{ name: '土豆', qty: 2, unit: '个' }, { name: '胡萝卜', qty: 1, unit: '根' }, { name: '番茄', qty: 1, unit: '个' }] },
    { img: 'season', text: '加 盐 适量 调味，开大火收汁至汤汁浓稠。', season: [{ name: '盐', qty: '适量', unit: '' }] },
  ],
  v1: [
    { img: 'blanch', text: '西兰花 1 颗 掰小朵，加 盐 1 克 的开水焯 1 分钟 过凉沥干。', timer: 60, season: [{ name: '西兰花', qty: 1, unit: '颗' }, { name: '盐', qty: 1, unit: '克' }] },
    { img: 'saute', text: '油 15 毫升 烧热，下 蒜 2 瓣（切片）爆香，下西兰花大火快炒。', season: [{ name: '食用油', qty: 15, unit: '毫升' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'season', text: '加 盐 1 克 翻匀出锅。', season: [{ name: '盐', qty: 1, unit: '克' }] },
  ],
  v2: [
    { img: 'cut', text: '空心菜 300 克 切 5cm 段；蒜 4 瓣 剁蓉。', season: [{ name: '空心菜', qty: 300, unit: '克' }, { name: '蒜', qty: 4, unit: '瓣' }] },
    { img: 'saute', text: '油 15 毫升 烧热，下 蒜蓉 爆香，下空心菜大火快炒。', season: [{ name: '食用油', qty: 15, unit: '毫升' }, { name: '蒜', qty: 4, unit: '瓣' }] },
    { img: 'season', text: '加 盐 2 克 炒软出锅。', season: [{ name: '盐', qty: 2, unit: '克' }] },
  ],
  v3: [
    { img: 'cut', text: '土豆 2 个 切细丝，泡水 5 分钟 去淀粉沥干。', timer: 300, season: [{ name: '土豆', qty: 2, unit: '个' }] },
    { img: 'saute', text: '油 15 毫升 烧热，下 干辣椒 3 个 爆香，下土豆丝大火快炒。', season: [{ name: '食用油', qty: 15, unit: '毫升' }, { name: '干辣椒', qty: 3, unit: '个' }] },
    { img: 'season', text: '沿锅边淋 醋 15 毫升、加 盐 2 克 炒匀出锅。', season: [{ name: '醋', qty: 15, unit: '毫升' }, { name: '盐', qty: 2, unit: '克' }] },
  ],
  v4: [
    { img: 'cut', text: '包菜 半颗 用手撕成片；蒜 2 瓣 切片。', season: [{ name: '包菜', qty: 0.5, unit: '颗' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'saute', text: '油 15 毫升 烧热，下 干辣椒 3 个、蒜片 爆香，下包菜大火翻炒。', season: [{ name: '食用油', qty: 15, unit: '毫升' }, { name: '干辣椒', qty: 3, unit: '个' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'season', text: '加 生抽 10 毫升、醋 5 毫升 炒软出锅。', season: [{ name: '生抽', qty: 10, unit: '毫升' }, { name: '醋', qty: 5, unit: '毫升' }] },
  ],
  v5: [
    { img: 'cut', text: '生菜 300 克 掰片洗净；蒜 2 瓣 剁蓉。', season: [{ name: '生菜', qty: 300, unit: '克' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'saute', text: '油 10 毫升 烧热，下 蒜蓉 爆香，下生菜大火快炒。', season: [{ name: '食用油', qty: 10, unit: '毫升' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'season', text: '加 蚝油 15 克 炒匀出锅。', season: [{ name: '蚝油', qty: 15, unit: '克' }] },
  ],
  v6: [
    { img: 'cut', text: '土豆 1 个、茄子 1 根 切滚刀块；青椒 1 个 切块。', season: [{ name: '土豆', qty: 1, unit: '个' }, { name: '茄子', qty: 1, unit: '根' }, { name: '青椒', qty: 1, unit: '个' }] },
    { img: 'fry', text: '油 40 毫升 烧至六成热，分别炸 土豆、茄子 至金黄盛出。', season: [{ name: '食用油', qty: 40, unit: '毫升' }] },
    { img: 'saute', text: '留底油下 青椒 炒香，加 生抽 15 毫升、白糖 5 克 与清水 2 汤匙。', season: [{ name: '青椒', qty: 1, unit: '个' }, { name: '生抽', qty: 15, unit: '毫升' }, { name: '白糖', qty: 5, unit: '克' }] },
    { img: 'reduce', text: '倒回土豆茄子翻匀，收汁至抱味。', season: [{ name: '土豆', qty: 1, unit: '个' }, { name: '茄子', qty: 1, unit: '根' }] },
  ],
  v7: [
    { img: 'fry', text: '四季豆 300 克 去筋，油 40 毫升 中火煸至起皱皮盛出。', timer: 300, season: [{ name: '四季豆', qty: 300, unit: '克' }, { name: '食用油', qty: 40, unit: '毫升' }] },
    { img: 'saute', text: '底油下 肉末 50 克、干辣椒 3 个、芽菜 20 克 炒香。', season: [{ name: '肉末', qty: 50, unit: '克' }, { name: '干辣椒', qty: 3, unit: '个' }, { name: '芽菜', qty: 20, unit: '克' }] },
    { img: 'stir-fry', text: '倒回四季豆加 盐 适量 翻炒均匀出锅。', season: [{ name: '四季豆', qty: 300, unit: '克' }, { name: '盐', qty: '适量', unit: '' }] },
  ],
  v8: [
    { img: 'cut', text: '干香菇 5 朵 泡发切片；上海青 300 克 洗净对半切；蒜 2 瓣 切片。', timer: 600, season: [{ name: '干香菇', qty: 5, unit: '朵' }, { name: '上海青', qty: 300, unit: '克' }, { name: '蒜', qty: 2, unit: '瓣' }] },
    { img: 'saute', text: '油 12 毫升 烧热，下 蒜片、香菇 炒出香味。', season: [{ name: '食用油', qty: 12, unit: '毫升' }, { name: '蒜', qty: 2, unit: '瓣' }, { name: '干香菇', qty: 5, unit: '朵' }] },
    { img: 'season', text: '下青菜大火炒软，加 蚝油 10 克 翻匀。', season: [{ name: '上海青', qty: 300, unit: '克' }, { name: '蚝油', qty: 10, unit: '克' }] },
  ],
  c1: [
    { img: 'smash', text: '黄瓜 2 根 拍裂切段；蒜 3 瓣 剁蓉。', season: [{ name: '黄瓜', qty: 2, unit: '根' }, { name: '蒜', qty: 3, unit: '瓣' }] },
    { img: 'marinate', text: '黄瓜加 盐 1 小勺 腌 5 分钟 挤去水。', timer: 300, season: [{ name: '盐', qty: 1, unit: '小勺' }] },
    { img: 'mix', text: '加 蒜蓉、生抽 10 毫升、醋 10 毫升、香油 5 毫升 拌匀。', season: [{ name: '蒜', qty: 3, unit: '瓣' }, { name: '生抽', qty: 10, unit: '毫升' }, { name: '醋', qty: 10, unit: '毫升' }, { name: '香油', qty: 5, unit: '毫升' }] },
  ],
  c2: [
    { img: 'blanch', text: '干木耳 15 克 泡发焯水过凉沥干。', timer: 300, season: [{ name: '干木耳', qty: 15, unit: '克' }] },
    { img: 'mix', text: '加 蒜蓉、香菜 2 根、生抽 10 毫升、醋 10 毫升、辣椒油 5 毫升 拌匀。', season: [{ name: '蒜', qty: 2, unit: '瓣' }, { name: '香菜', qty: 2, unit: '根' }, { name: '生抽', qty: 10, unit: '毫升' }, { name: '醋', qty: 10, unit: '毫升' }, { name: '辣椒油', qty: 5, unit: '毫升' }] },
  ],
  c3: [
    { img: 'boil', text: '鸡腿 2 个 加 姜片 2 片、葱段 1 根 冷水煮 15 分钟，关火焖 10 分钟。', timer: 900, season: [{ name: '鸡腿', qty: 2, unit: '个' }, { name: '姜', qty: 2, unit: '片' }, { name: '葱', qty: 1, unit: '根' }] },
    { img: 'blanch', text: '捞出泡冰水 5 分钟，斩块装盘。', timer: 300, season: [{ name: '鸡腿', qty: 2, unit: '个' }] },
    { img: 'season', text: '红油辣酱 30 克 + 生抽 15 毫升 + 花椒油 5 毫升 + 鸡汤 1 勺 调汁淋上。', season: [{ name: '红油辣酱', qty: 30, unit: '克' }, { name: '生抽', qty: 15, unit: '毫升' }, { name: '花椒油', qty: 5, unit: '毫升' }] },
  ],
  c4: [
    { img: 'cut', text: '嫩豆腐 1 盒 倒扣切厚片装盘；皮蛋 2 个 剥壳切瓣摆上。', season: [{ name: '嫩豆腐', qty: 1, unit: '盒' }, { name: '皮蛋', qty: 2, unit: '个' }] },
    { img: 'season', text: '淋 生抽 15 毫升、香油 5 毫升，撒 小葱 1 根（葱花）。', season: [{ name: '生抽', qty: 15, unit: '毫升' }, { name: '香油', qty: 5, unit: '毫升' }, { name: '小葱', qty: 1, unit: '根' }] },
  ],
  c5: [
    { img: 'blanch', text: '干海带丝 50 克 泡发焯水过凉沥干。', timer: 300, season: [{ name: '干海带丝', qty: 50, unit: '克' }] },
    { img: 'mix', text: '加 蒜蓉、醋 15 毫升、生抽 10 毫升、辣椒油 5 毫升 拌匀。', season: [{ name: '蒜', qty: 2, unit: '瓣' }, { name: '醋', qty: 15, unit: '毫升' }, { name: '生抽', qty: 10, unit: '毫升' }, { name: '辣椒油', qty: 5, unit: '毫升' }] },
  ],
  c6: [
    { img: 'blanch', text: '土豆 2 个 切丝泡水去淀粉，焯水 2 分钟 过凉。', timer: 120, season: [{ name: '土豆', qty: 2, unit: '个' }] },
    { img: 'season', text: '油 10 毫升 烧热泼 干辣椒 2 个，加 醋 15 毫升、盐 2 克 拌入土豆丝。', season: [{ name: '食用油', qty: 10, unit: '毫升' }, { name: '干辣椒', qty: 2, unit: '个' }, { name: '醋', qty: 15, unit: '毫升' }, { name: '盐', qty: 2, unit: '克' }] },
  ],
  c7: [
    { img: 'blanch', text: '菠菜 300 克 焯水 1 分钟 过凉挤干切段（去草酸）。', timer: 120, season: [{ name: '菠菜', qty: 300, unit: '克' }] },
    { img: 'mix', text: '加 蒜蓉、生抽 10 毫升、香油 5 毫升 拌匀。', season: [{ name: '蒜', qty: 2, unit: '瓣' }, { name: '生抽', qty: 10, unit: '毫升' }, { name: '香油', qty: 5, unit: '毫升' }] },
  ],
  s1: [
    { img: 'prep', text: '鸡蛋 2 个 打散；米饭 1 碗 用手抓散；葱花 2 勺 备好。', season: [{ name: '鸡蛋', qty: 2, unit: '个' }, { name: '米饭', qty: 1, unit: '碗' }, { name: '葱花', qty: 2, unit: '勺' }] },
    { img: 'stir-fry', text: '油 15 毫升 烧热，蛋液下锅炒至半凝固，下米饭翻炒散开。', season: [{ name: '食用油', qty: 15, unit: '毫升' }, { name: '鸡蛋', qty: 2, unit: '个' }, { name: '米饭', qty: 1, unit: '碗' }] },
    { img: 'season', text: '加 盐 2 克、葱花 2 勺 炒至粒粒分明出锅。', season: [{ name: '盐', qty: 2, unit: '克' }, { name: '葱花', qty: 2, unit: '勺' }] },
  ],
  s2: [
    { img: 'saute', text: '小葱 5 根 切段，油 30 毫升 小火慢炸至焦香，得葱油。', timer: 300, season: [{ name: '小葱', qty: 5, unit: '根' }, { name: '食用油', qty: 30, unit: '毫升' }] },
    { img: 'season', text: '调汁：生抽 20 毫升 + 老抽 5 毫升 + 白糖 5 克 + 葱油 2 勺 搅匀。', season: [{ name: '生抽', qty: 20, unit: '毫升' }, { name: '老抽', qty: 5, unit: '毫升' }, { name: '白糖', qty: 5, unit: '克' }] },
    { img: 'boil', text: '面条 1 人份 煮熟过凉，拌入葱油汁与葱段。', season: [{ name: '面条', qty: 1, unit: '人份' }] },
  ],
  s3: [
    { img: 'saute', text: '油 10 毫升 烧热，番茄 1 个 切块炒软出汁，加水 1 碗 煮开。', season: [{ name: '食用油', qty: 10, unit: '毫升' }, { name: '番茄', qty: 1, unit: '个' }] },
    { img: 'season', text: '淋 蛋液 1 个 成蛋花，加 盐 2 克 调味。', timer: 60, season: [{ name: '鸡蛋', qty: 1, unit: '个' }, { name: '盐', qty: 2, unit: '克' }] },
    { img: 'boil', text: '另起锅煮 面条 1 人份，捞入汤中。', season: [{ name: '面条', qty: 1, unit: '人份' }] },
  ],
  s4: [
    { img: 'cut', text: '白菜 200 克 剁碎加 盐 1 小勺 腌 5 分钟 挤干水。', timer: 300, season: [{ name: '白菜', qty: 200, unit: '克' }, { name: '盐', qty: 1, unit: '小勺' }] },
    { img: 'marinate', text: '肉馅加 姜片 3 片（剁末）、生抽 20 毫升、香油 10 毫升 搅上劲，拌入白菜成馅。', season: [{ name: '猪肉馅', qty: 300, unit: '克' }, { name: '姜', qty: 3, unit: '片' }, { name: '生抽', qty: 20, unit: '毫升' }, { name: '香油', qty: 10, unit: '毫升' }] },
    { img: 'boil', text: '包好饺子，水开下锅，点两次凉水煮熟。', timer: 360, season: [{ name: '饺子皮', qty: 30, unit: '张' }] },
  ],
  s5: [
    { img: 'boil', text: '小米 80 克 淘洗，加水 800 毫升 大火煮开转小火。', timer: 300, season: [{ name: '小米', qty: 80, unit: '克' }, { name: '水', qty: 800, unit: '毫升' }] },
    { img: 'simmer', text: '小火熬 25 分钟 至粘稠，中途搅几次防糊底。', timer: 1500, season: [] },
  ],
  s6: [
    { img: 'season', text: '碗里放 猪油 5 克、生抽 15 毫升、小葱 1 根（葱花）。', season: [{ name: '猪油', qty: 5, unit: '克' }, { name: '生抽', qty: 15, unit: '毫升' }, { name: '小葱', qty: 1, unit: '根' }] },
    { img: 'boil', text: '冲入滚烫 高汤 200 毫升 化开。', season: [{ name: '高汤', qty: 200, unit: '毫升' }] },
    { img: 'boil', text: '煮 面条 1 人份 捞入碗中。', season: [{ name: '面条', qty: 1, unit: '人份' }] },
  ],
  t1: [
    { img: 'cut', text: '番茄 2 个 去蒂切小块；鸡蛋 2 个 打散。', season: [{ name: '番茄', qty: 2, unit: '个' }, { name: '鸡蛋', qty: 2, unit: '个' }] },
    { img: 'boil', text: '水 500 毫升 烧开下番茄煮出红汤。', timer: 60, season: [{ name: '水', qty: 500, unit: '毫升' }, { name: '番茄', qty: 2, unit: '个' }] },
    { img: 'season', text: '淋 蛋液 边倒边搅成蛋花。', timer: 30, season: [{ name: '鸡蛋', qty: 2, unit: '个' }] },
    { img: 'season', text: '加 盐 2 克、香油 3 毫升，撒 小葱 1 根 出锅。', season: [{ name: '盐', qty: 2, unit: '克' }, { name: '香油', qty: 3, unit: '毫升' }, { name: '小葱', qty: 1, unit: '根' }] },
  ],
  t2: [
    { img: 'boil', text: '水 500 毫升 烧开，放 紫菜 5 克 煮散。', timer: 30, season: [{ name: '水', qty: 500, unit: '毫升' }, { name: '紫菜', qty: 5, unit: '克' }] },
    { img: 'season', text: '淋 蛋液 1 个 成蛋花。', timer: 20, season: [{ name: '鸡蛋', qty: 1, unit: '个' }] },
    { img: 'season', text: '加 盐 2 克、香油 3 毫升，撒 小葱 1 根 出锅。', season: [{ name: '盐', qty: 2, unit: '克' }, { name: '香油', qty: 3, unit: '毫升' }, { name: '小葱', qty: 1, unit: '根' }] },
  ],
  t3: [
    { img: 'blanch', text: '排骨 400 克 冷水下锅，加 料酒 10 毫升 焯去血沫捞出。', timer: 300, season: [{ name: '排骨', qty: 400, unit: '克' }, { name: '料酒', qty: 10, unit: '毫升' }] },
    { img: 'simmer', text: '排骨加 姜片 3 片、料酒 10 毫升、热水炖 40 分钟。', timer: 2400, season: [{ name: '姜', qty: 3, unit: '片' }, { name: '料酒', qty: 10, unit: '毫升' }] },
    { img: 'boil', text: '下 冬瓜 300 克（切块）再炖 15 分钟。', timer: 900, season: [{ name: '冬瓜', qty: 300, unit: '克' }] },
    { img: 'season', text: '加 盐 3 克 调味即可。', season: [{ name: '盐', qty: 3, unit: '克' }] },
  ],
  t4: [
    { img: 'blanch', text: '排骨 400 克 冷水焯去血沫捞出。', timer: 300, season: [{ name: '排骨', qty: 400, unit: '克' }] },
    { img: 'simmer', text: '加 玉米 2 根（切段）、胡萝卜 1 根、姜片 3 片、热水炖 50 分钟。', timer: 3000, season: [{ name: '玉米', qty: 2, unit: '根' }, { name: '胡萝卜', qty: 1, unit: '根' }, { name: '姜', qty: 3, unit: '片' }] },
    { img: 'season', text: '加 盐 3 克 调味。', season: [{ name: '盐', qty: 3, unit: '克' }] },
  ],
  t5: [
    { img: 'cut', text: '香菇 5 朵、干木耳 10 克 泡发切丝；嫩豆腐 1 盒 切丝。', timer: 300, season: [{ name: '嫩豆腐', qty: 1, unit: '盒' }, { name: '干香菇', qty: 5, unit: '朵' }, { name: '干木耳', qty: 10, unit: '克' }] },
    { img: 'boil', text: '水烧开下 香菇丝、木耳丝、豆腐丝 煮 3 分钟。', timer: 180, season: [{ name: '嫩豆腐', qty: 1, unit: '盒' }, { name: '干香菇', qty: 5, unit: '朵' }, { name: '干木耳', qty: 10, unit: '克' }] },
    { img: 'season', text: '加 生抽 10 毫升、醋 15 毫升、白胡椒 2 克 调味。', season: [{ name: '生抽', qty: 10, unit: '毫升' }, { name: '醋', qty: 15, unit: '毫升' }, { name: '白胡椒', qty: 2, unit: '克' }] },
    { img: 'reduce', text: '淋 蛋液 1 个 成蛋花，水淀粉（淀粉 10 克 + 水）勾薄芡。', season: [{ name: '鸡蛋', qty: 1, unit: '个' }, { name: '淀粉', qty: 10, unit: '克' }] },
    { img: 'season', text: '淋 香油 5 毫升 出锅。', season: [{ name: '香油', qty: 5, unit: '毫升' }] },
  ],
  t6: [
    { img: 'cut', text: '白玉菇 100 克、香菇 3 朵 切片；嫩豆腐 1 盒 切块。', season: [{ name: '白玉菇', qty: 100, unit: '克' }, { name: '干香菇', qty: 3, unit: '朵' }, { name: '嫩豆腐', qty: 1, unit: '盒' }] },
    { img: 'boil', text: '水烧开下菌菇煮出香味（约 3 分钟）。', timer: 180, season: [{ name: '白玉菇', qty: 100, unit: '克' }, { name: '干香菇', qty: 3, unit: '朵' }] },
    { img: 'boil', text: '下 豆腐块 煮 5 分钟。', timer: 300, season: [{ name: '嫩豆腐', qty: 1, unit: '盒' }] },
    { img: 'season', text: '加 盐 2 克、香油 3 毫升，撒 小葱 1 根 出锅。', season: [{ name: '盐', qty: 2, unit: '克' }, { name: '香油', qty: 3, unit: '毫升' }, { name: '小葱', qty: 1, unit: '根' }] },
  ],
};
