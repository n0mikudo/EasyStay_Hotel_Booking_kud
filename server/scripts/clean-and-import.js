/**
 * 原始酒店数据清洗与导入脚本
 * 
 * 读取 data/hotels_raw.json（百度 API 原始数据），
 * 进行数据清洗后格式化为项目 schema，合并到 hotels.json。
 * 
 * 用法：
 *   node scripts/clean-and-import.js                 # 预览清洗结果
 *   node scripts/clean-and-import.js --import        # 执行导入
 *   node scripts/clean-and-import.js --import --replace  # 替换（删除旧的百度数据）
 *   node scripts/clean-and-import.js --stats         # 仅查看统计
 */

const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, '..', 'data', 'hotels_raw.json');
const HOTELS_FILE = path.join(__dirname, '..', 'data', 'hotels.json');
const CLEAN_OUTPUT = path.join(__dirname, '..', 'data', 'hotels_cleaned.json');

// ==================== 星级推断规则 ====================
const STAR_RULES = [
  { pattern: /丽思卡尔顿|瑞吉|宝格丽|安缦|半岛|柏悦|文华东方|四季酒店|W酒店|华尔道夫|悦榕庄/, star: 5 },
  { pattern: /万豪|希尔顿|洲际|香格里拉|喜来登|威斯汀|凯悦|朗廷|铂尔曼|皇冠假日|JW|索菲特|费尔蒙|瑰丽/, star: 5 },
  { pattern: /五星|豪华|国际大酒店|大饭店/, star: 5 },
  { pattern: /全季|亚朵|桔子水晶|维也纳|和颐|诺富特|智选假日|美居|雅乐轩|福朋|华美达/, star: 4 },
  { pattern: /四星/, star: 4 },
  { pattern: /如家|汉庭|锦江之星|格林豪泰|城市便捷|IU|麗枫|希岸|都市118/, star: 3 },
  { pattern: /三星|商务酒店/, star: 3 },
  { pattern: /7天|速8|莫泰|布丁|海友|飘HOME|尚客优|99旅馆/, star: 2 },
  { pattern: /青年旅舍|招待所|旅社|经济/, star: 2 },
  { pattern: /民宿|客栈|农家|山庄/, star: 3 },
  { pattern: /度假村|度假酒店|温泉|别墅/, star: 4 },
];

const BRAND_RULES = [
  { pattern: /万豪/, brand: '万豪' }, { pattern: /希尔顿/, brand: '希尔顿' },
  { pattern: /洲际/, brand: '洲际' }, { pattern: /香格里拉/, brand: '香格里拉' },
  { pattern: /喜来登/, brand: '喜来登' }, { pattern: /威斯汀/, brand: '威斯汀' },
  { pattern: /凯悦/, brand: '凯悦' }, { pattern: /丽思卡尔顿/, brand: '丽思卡尔顿' },
  { pattern: /四季酒店/, brand: '四季' }, { pattern: /全季/, brand: '全季' },
  { pattern: /亚朵/, brand: '亚朵' }, { pattern: /维也纳/, brand: '维也纳' },
  { pattern: /如家/, brand: '如家' }, { pattern: /汉庭/, brand: '汉庭' },
  { pattern: /锦江/, brand: '锦江' }, { pattern: /格林/, brand: '格林豪泰' },
  { pattern: /7天/, brand: '7天' }, { pattern: /速8/, brand: '速8' },
  { pattern: /华住/, brand: '华住' }, { pattern: /首旅/, brand: '首旅' },
  { pattern: /开元/, brand: '开元' }, { pattern: /半岛/, brand: '半岛' },
  { pattern: /铂尔曼/, brand: '铂尔曼' }, { pattern: /诺富特/, brand: '诺富特' },
  { pattern: /假日/, brand: '假日' }, { pattern: /美居/, brand: '美居' },
  { pattern: /桔子/, brand: '桔子' }, { pattern: /和颐/, brand: '和颐' },
  { pattern: /莫泰/, brand: '莫泰' }, { pattern: /布丁/, brand: '布丁' },
];

function guessStar(name, tag) {
  const text = (name || '') + (tag || '');
  for (const rule of STAR_RULES) {
    if (rule.pattern.test(text)) return rule.star;
  }
  return 3;
}

function guessBrand(name) {
  for (const rule of BRAND_RULES) {
    if (rule.pattern.test(name)) return rule.brand;
  }
  return '';
}

function guessPrice(star, name) {
  const ranges = { 5: [400, 2000], 4: [200, 600], 3: [120, 350], 2: [60, 180] };
  const [min, max] = ranges[star] || [100, 300];
  // 用名称哈希做伪随机，保证同一酒店每次生成一样的价格
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  const ratio = Math.abs(hash % 1000) / 1000;
  return Math.round(min + ratio * (max - min));
}

function genRoomTypes(star, basePrice) {
  const types = [{ name: '标准间', price: basePrice, description: '舒适标准双床' }];
  if (star >= 3) types.push({ name: '大床房', price: Math.round(basePrice * 1.15), description: '1.8米大床' });
  if (star >= 4) {
    types.push({ name: '豪华大床房', price: Math.round(basePrice * 1.5), description: '宽敞空间，高品质设施' });
    types.push({ name: '商务双床房', price: Math.round(basePrice * 1.3), description: '商务差旅首选' });
  }
  if (star === 5) types.push({ name: '行政套房', price: Math.round(basePrice * 2.5), description: '独立客厅，行政酒廊特权' });
  return types;
}

function extractAmenities(detailInfo, star) {
  const base = ['免费WiFi', '空调'];
  if (star >= 3) base.push('电梯', '24小时前台', '行李寄存');
  if (star >= 4) base.push('健身房', '餐厅', '商务中心', '洗衣服务');
  if (star === 5) base.push('游泳池', 'SPA', '酒吧', '客房服务', '礼宾服务', '会议室');
  if (star <= 2) base.push('免费停车');
  return [...new Set(base)];
}

function extractTags(detailInfo, name, city, star) {
  const tags = [];
  const tag = (detailInfo.tag || '') + (detailInfo.detail_url || '') + name;
  if (/商务/.test(tag) || star >= 4) tags.push('商务出行');
  if (/度假|温泉|spa/i.test(tag)) tags.push('休闲度假');
  if (/亲子|家庭|儿童/.test(tag)) tags.push('亲子游');
  if (/蜜月|情侣|浪漫/.test(tag)) tags.push('情侣蜜月');
  if (star === 5) tags.push('高端奢华');
  if (star <= 2) tags.push('性价比高');
  if (/民宿|客栈/.test(name)) tags.push('特色民宿');
  if (/会议|会展/.test(tag)) tags.push('会议会展');

  const scenic = ['三亚', '丽江', '桂林', '黄山', '张家界', '大理', '香格里拉', '九寨', '敦煌', '拉萨', '西双版纳', '北海', '腾冲'];
  if (scenic.some(s => city.includes(s))) tags.push('休闲度假', '近景区');
  const coastal = ['三亚', '珠海', '厦门', '青岛', '大连', '北海', '威海', '烟台', '海口', '万宁'];
  if (coastal.some(s => city.includes(s))) tags.push('海景');

  return [...new Set(tags)].slice(0, 5);
}

// ==================== 数据清洗 ====================
function cleanData(rawHotels) {
  const cleaned = [];
  const rejected = { noName: 0, tooShort: 0, nonHotel: 0, noLocation: 0 };

  for (const raw of rawHotels) {
    const name = (raw.name || '').trim();

    // 过滤条件
    if (!name) { rejected.noName++; continue; }
    if (name.length < 2) { rejected.tooShort++; continue; }
    if (/公寓出租|写字楼|办公|售楼|中介|旅行社|培训|装修|设计|物业|管理公司|房产/.test(name)) {
      rejected.nonHotel++; continue;
    }
    if (!raw.location || (!raw.location.lat && !raw.location.lng)) { rejected.noLocation++; continue; }

    const di = raw.detail_info || {};
    const city = raw._fetch_city || raw.city || '';
    const star = guessStar(name, di.tag);
    const basePrice = di.price ? parseInt(di.price) : guessPrice(star, name);
    const phone = (raw.telephone || '').replace(/<[^>]+>/g, '').split(/[,;，；]/).map(s => s.trim()).filter(Boolean)[0] || '';

    cleaned.push({
      // 真实数据字段
      name,
      city,
      province: di.province || raw.province || '',
      district: di.district || raw.area || '',
      address: raw.address || '',
      phone,
      latitude: raw.location.lat || 0,
      longitude: raw.location.lng || 0,
      baiduUid: raw.uid || '',
      baiduTag: di.tag || '',
      baiduOverallRating: di.overall_rating || '',
      baiduTasteRating: di.taste_rating || '',
      baiduServiceRating: di.service_rating || '',
      baiduEnvironmentRating: di.environment_rating || '',
      baiduCommentNum: di.comment_num || '',
      baiduPrice: di.price || '',
      baiduShopHours: di.shop_hours || '',
      // 推断字段
      star,
      brand: guessBrand(name),
      price: basePrice > 0 ? basePrice : guessPrice(star, name),
      roomTypes: genRoomTypes(star, basePrice > 0 ? basePrice : guessPrice(star, name)),
      amenities: extractAmenities(di, star),
      tags: extractTags(di, name, city, star),
    });
  }

  console.log(`清洗结果: ${cleaned.length} 条有效 / ${rawHotels.length} 条原始`);
  console.log(`过滤: 无名称${rejected.noName} / 名称过短${rejected.tooShort} / 非酒店${rejected.nonHotel} / 无坐标${rejected.noLocation}`);

  return cleaned;
}

// ==================== 格式化为项目 schema ====================
function formatToSchema(cleanedHotels) {
  const now = new Date().toISOString();
  return cleanedHotels.map((h, i) => ({
    id: `real_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 7)}`,
    name: h.name,
    nameEn: '',
    city: h.city,
    province: h.province,
    district: h.district,
    address: h.address,
    description: `${h.name}位于${h.city}${h.district ? h.district : ''}，${h.star >= 4 ? '高品质' : '舒适型'}住宿体验。${h.amenities.slice(0, 4).join('、')}等设施一应俱全。${h.baiduCommentNum ? `百度评价${h.baiduCommentNum}条。` : ''}`,
    price: h.price,
    rating: h.star,
    phone: h.phone,
    images: [
      `https://picsum.photos/seed/${encodeURIComponent(h.name)}_1/800/600`,
      `https://picsum.photos/seed/${encodeURIComponent(h.name)}_2/800/600`,
      `https://picsum.photos/seed/${encodeURIComponent(h.name)}_3/800/600`
    ],
    amenities: h.amenities,
    roomTypes: h.roomTypes,
    openDate: '',
    tags: h.tags,
    brand: h.brand,
    latitude: h.latitude,
    longitude: h.longitude,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    totalRooms: 30 + Math.floor(Math.random() * 250),
    floorCount: 2 + Math.floor(Math.random() * 25),
    status: 'approved',
    createdAt: now,
    updatedAt: now,
    source: 'baidu_real',
    baiduUid: h.baiduUid,
    baiduOverallRating: h.baiduOverallRating,
    baiduCommentNum: h.baiduCommentNum,
  }));
}

// ==================== 统计 ====================
function printStats(hotels) {
  const byCity = {};
  const byStar = { 2: 0, 3: 0, 4: 0, 5: 0 };
  const byBrand = {};

  for (const h of hotels) {
    byCity[h.city] = (byCity[h.city] || 0) + 1;
    byStar[h.star] = (byStar[h.star] || 0) + 1;
    if (h.brand) byBrand[h.brand] = (byBrand[h.brand] || 0) + 1;
  }

  console.log('\n═══════ 城市分布（Top 20） ═══════');
  Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 20)
    .forEach(([c, n]) => console.log(`  ${c.padEnd(12)} ${n} 家`));

  console.log('\n═══════ 星级分布 ═══════');
  Object.entries(byStar).sort((a, b) => b[0] - a[0])
    .forEach(([s, n]) => console.log(`  ${s}星: ${n} 家 (${(n / hotels.length * 100).toFixed(1)}%)`));

  console.log('\n═══════ 品牌分布（Top 15） ═══════');
  Object.entries(byBrand).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([b, n]) => console.log(`  ${b.padEnd(12)} ${n} 家`));

  const withPhone = hotels.filter(h => h.phone).length;
  const withRating = hotels.filter(h => h.baiduOverallRating).length;
  console.log(`\n有电话: ${withPhone}/${hotels.length}  有百度评分: ${withRating}/${hotels.length}`);
}

// ==================== 主流程 ====================
function main() {
  const doImport = process.argv.includes('--import');
  const doReplace = process.argv.includes('--replace');
  const statsOnly = process.argv.includes('--stats');

  console.log('读取原始数据...');
  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  } catch {
    console.error(`找不到原始数据文件: ${RAW_FILE}`);
    console.error('请先运行: node scripts/fetch-real-hotels.js');
    process.exit(1);
  }
  console.log(`原始数据: ${rawData.length} 条\n`);

  const cleaned = cleanData(rawData);

  if (statsOnly) {
    printStats(cleaned);
    return;
  }

  // 保存清洗后数据
  fs.writeFileSync(CLEAN_OUTPUT, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`清洗后数据已保存: ${CLEAN_OUTPUT}`);

  printStats(cleaned);

  if (doImport) {
    const formatted = formatToSchema(cleaned);
    let existing = [];
    try { existing = JSON.parse(fs.readFileSync(HOTELS_FILE, 'utf-8')); } catch {}

    let base = doReplace
      ? existing.filter(h => h.source !== 'baidu_real' && h.source !== 'seed')
      : existing.filter(h => h.source !== 'baidu_real');

    const merged = [...base, ...formatted];
    fs.writeFileSync(HOTELS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    console.log(`\n已导入 hotels.json: ${base.length} 条原有 + ${formatted.length} 条真实 = ${merged.length} 条`);
  } else {
    console.log(`\n预览完成。执行导入请运行:`);
    console.log(`  node scripts/clean-and-import.js --import`);
    console.log(`  node scripts/clean-and-import.js --import --replace  # 同时清除旧的批量生成数据`);
  }
}

main();
