/**
 * 基于真实行政区划的酒店数据生成脚本
 * 
 * 读取 hotels_raw.json（百度API真实数据）提取品牌/价格/评分统计模型，
 * 结合 geo_data.js（100+城市真实行政区划），生成约5000条酒店数据。
 * 
 * 用法：
 *   cd server
 *   node scripts/generate-from-real.js              # 生成并导入
 *   node scripts/generate-from-real.js --preview     # 仅预览不导入
 *   node scripts/generate-from-real.js --stats       # 仅查看统计
 */

const fs = require('fs');
const path = require('path');
const GEO_DATA = require('./geo_data');

const RAW_FILE = path.join(__dirname, '..', 'data', 'hotels_raw.json');
const HOTELS_FILE = path.join(__dirname, '..', 'data', 'hotels.json');
const DISTRICTS_FILE = path.join(__dirname, '..', 'data', 'city_districts.json');

// ==================== 1. 从真实数据提取统计模型 ====================

function loadRawData() {
  try {
    return JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  } catch {
    console.warn('未找到 hotels_raw.json，使用内置默认统计模型');
    return [];
  }
}

function extractStats(rawData) {
  const brands = {};
  const categories = {};
  const prices = [];
  const ratings = [];

  for (const h of rawData) {
    const di = h.detail_info || {};
    const brand = di.brand || '';
    if (brand && brand.length < 20) {
      brands[brand] = (brands[brand] || 0) + 1;
    }
    const tag = di.classified_poi_tag || '';
    const cat = tag.split(';')[1] || '经济型';
    categories[cat] = (categories[cat] || 0) + 1;

    const price = parseFloat(di.price);
    if (price > 0 && price < 10000) prices.push(price);

    const rating = parseFloat(di.overall_rating);
    if (rating > 0) ratings.push(rating);
  }

  return {
    brands: Object.entries(brands).sort((a, b) => b[1] - a[1]),
    categories,
    priceMedian: prices.length ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 280,
    priceRange: prices.length ? [Math.min(...prices), Math.max(...prices)] : [50, 3000],
    ratingMean: ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 3.8,
    ratingStd: 0.6,
    totalRaw: rawData.length,
  };
}

// ==================== 2. 品牌与命名系统 ====================

const BRAND_POOL = [
  // 经济型
  { name: '如家酒店', star: 2, weight: 12, category: '经济型' },
  { name: '汉庭酒店', star: 2, weight: 10, category: '经济型' },
  { name: '7天连锁酒店', star: 2, weight: 8, category: '经济型' },
  { name: '速8酒店', star: 2, weight: 6, category: '经济型' },
  { name: '格林豪泰酒店', star: 2, weight: 6, category: '经济型' },
  { name: '锦江之星', star: 2, weight: 5, category: '经济型' },
  { name: '布丁酒店', star: 2, weight: 4, category: '经济型' },
  { name: '莫泰酒店', star: 2, weight: 3, category: '经济型' },
  { name: '城市便捷酒店', star: 2, weight: 3, category: '经济型' },
  { name: '尚客优酒店', star: 2, weight: 2, category: '经济型' },
  { name: '都市118酒店', star: 2, weight: 2, category: '经济型' },
  // 舒适型
  { name: '全季酒店', star: 3, weight: 8, category: '舒适型' },
  { name: '亚朵酒店', star: 3, weight: 7, category: '舒适型' },
  { name: '维也纳酒店', star: 3, weight: 7, category: '舒适型' },
  { name: '桔子水晶酒店', star: 3, weight: 4, category: '舒适型' },
  { name: '和颐酒店', star: 3, weight: 3, category: '舒适型' },
  { name: '麗枫酒店', star: 3, weight: 3, category: '舒适型' },
  { name: '希岸酒店', star: 3, weight: 3, category: '舒适型' },
  { name: 'IU酒店', star: 3, weight: 2, category: '舒适型' },
  // 高档型
  { name: '假日酒店', star: 4, weight: 4, category: '高档型' },
  { name: '智选假日酒店', star: 4, weight: 3, category: '高档型' },
  { name: '诺富特酒店', star: 4, weight: 2, category: '高档型' },
  { name: '美居酒店', star: 4, weight: 2, category: '高档型' },
  { name: '华美达酒店', star: 4, weight: 2, category: '高档型' },
  { name: '开元酒店', star: 4, weight: 2, category: '高档型' },
  { name: '铂尔曼酒店', star: 4, weight: 1, category: '高档型' },
  // 豪华型
  { name: '希尔顿酒店', star: 5, weight: 3, category: '豪华型' },
  { name: '万豪酒店', star: 5, weight: 2, category: '豪华型' },
  { name: '洲际酒店', star: 5, weight: 2, category: '豪华型' },
  { name: '喜来登酒店', star: 5, weight: 2, category: '豪华型' },
  { name: '香格里拉酒店', star: 5, weight: 2, category: '豪华型' },
  { name: '凯悦酒店', star: 5, weight: 1, category: '豪华型' },
  { name: '威斯汀酒店', star: 5, weight: 1, category: '豪华型' },
  { name: '皇冠假日酒店', star: 5, weight: 1, category: '豪华型' },
  // 民宿/客栈
  { name: '花间堂', star: 3, weight: 2, category: '民宿客栈', onlyTourism: true },
  { name: '隐居', star: 4, weight: 1, category: '民宿客栈', onlyTourism: true },
  { name: '悦榕庄', star: 5, weight: 1, category: '豪华型', onlyTourism: true },
];

const INDEPENDENT_NAMES = [
  '金都', '华天', '新世纪', '国际', '商务', '中心', '嘉华', '银河',
  '天润', '龙泉', '金海', '明珠', '鑫源', '华庭', '凯旋', '盛世',
  '锦绣', '和平', '东方', '皇家', '紫金', '翡翠', '红星', '金桥',
  '碧水', '丽景', '阳光', '星程', '驿家', '都市花园', '印象',
];

const HOTEL_SUFFIX = ['酒店', '宾馆', '大酒店', '商务酒店', '精品酒店', '主题酒店'];
const MINSU_SUFFIX = ['民宿', '客栈', '小院', '山居', '雅居'];

// 城市简称
function cityShort(city) {
  return city.replace(/市$|特别行政区$|白族自治州$|傣族自治州$/g, '');
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ==================== 3. 生成逻辑 ====================

const LEVEL_HOTEL_COUNT = {
  '一线': [70, 100],
  '新一线': [50, 70],
  '二线': [35, 55],
  '三线': [20, 35],
  '旅游': [25, 45],
};

function genPrice(star, rng) {
  const ranges = { 5: [500, 2500], 4: [250, 800], 3: [150, 500], 2: [80, 250] };
  const [min, max] = ranges[star] || [100, 300];
  return Math.round(min + rng() * (max - min));
}

function genRoomTypes(star, basePrice) {
  const types = [{ name: '标准间', price: basePrice, description: '舒适标准双床' }];
  if (star >= 2) types.push({ name: '大床房', price: Math.round(basePrice * 1.15), description: '1.8米大床，安静舒适' });
  if (star >= 3) types.push({ name: '商务双床房', price: Math.round(basePrice * 1.3), description: '商务差旅首选' });
  if (star >= 4) types.push({ name: '豪华大床房', price: Math.round(basePrice * 1.6), description: '宽敞空间，高品质设施' });
  if (star === 5) types.push({ name: '行政套房', price: Math.round(basePrice * 2.5), description: '独立客厅，行政酒廊特权' });
  return types;
}

function genAmenities(star) {
  const base = ['免费WiFi', '空调', '24小时前台'];
  if (star >= 2) base.push('电梯', '行李寄存');
  if (star >= 3) base.push('免费停车', '餐厅', '洗衣服务');
  if (star >= 4) base.push('健身房', '商务中心', '会议室', '接送服务');
  if (star === 5) base.push('游泳池', 'SPA', '酒吧', '客房服务', '礼宾服务');
  return [...new Set(base)];
}

function genTags(star, cityLevel) {
  const tags = [];
  if (star >= 4) tags.push('商务出行');
  if (star === 5) tags.push('高端奢华');
  if (star <= 2) tags.push('性价比高');
  if (cityLevel === '旅游') tags.push('休闲度假');

  const extra = ['近地铁', '近景区', '市中心', '亲子游', '情侣蜜月', '会议会展', '购物便利'];
  const pick = extra.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
  return [...new Set([...tags, ...pick])].slice(0, 4);
}

function genRating(star, rng) {
  const base = { 5: 4.5, 4: 4.2, 3: 4.0, 2: 3.5 };
  const b = base[star] || 3.8;
  return Math.min(5, Math.max(2, +(b + (rng() - 0.5) * 1.0).toFixed(1)));
}

function genPhone(province) {
  const areaCode = '1' + [3, 5, 7, 8, 9][Math.floor(Math.random() * 5)];
  const num = String(Math.floor(Math.random() * 1e9)).padStart(9, '0');
  return areaCode + num;
}

function generateHotelsForCity(cityName, cityData, stats) {
  const { province, level, center, districts } = cityData;
  const [minCount, maxCount] = LEVEL_HOTEL_COUNT[level] || [20, 35];
  const rng = seededRandom(hashStr(cityName));
  const targetCount = Math.round(minCount + rng() * (maxCount - minCount));

  const districtNames = Object.keys(districts);
  const isTourism = level === '旅游';
  const hotels = [];

  // 构建加权品牌池
  const availableBrands = BRAND_POOL.filter(b => !b.onlyTourism || isTourism);
  const weightedBrands = [];
  for (const b of availableBrands) {
    // 一线/新一线城市多高端品牌；三线/旅游少高端
    let w = b.weight;
    if (b.star === 5 && (level === '三线' || level === '旅游')) w = Math.max(1, Math.floor(w * 0.3));
    if (b.star === 5 && level === '一线') w = Math.floor(w * 1.5);
    for (let i = 0; i < w; i++) weightedBrands.push(b);
  }

  for (let i = 0; i < targetCount; i++) {
    const r = rng();
    // 70% 连锁品牌，30% 独立酒店
    const isChain = r < 0.7;

    const districtName = districtNames[Math.floor(rng() * districtNames.length)];
    const districtData = districts[districtName];
    const streets = districtData.streets;
    const street = streets[Math.floor(rng() * streets.length)];
    const houseNum = Math.floor(rng() * 500) + 1;

    let name, star, category, brand;

    if (isChain) {
      const brandInfo = weightedBrands[Math.floor(rng() * weightedBrands.length)];
      brand = brandInfo.name;
      star = brandInfo.star;
      category = brandInfo.category;
      const cs = cityShort(cityName);
      // 命名模式：品牌(城市+路名/地标+店)
      const patterns = [
        `${brand}(${cs}${street}店)`,
        `${brand}(${cs}${districtName}店)`,
        `${brand}(${cs}${street}${districtName}店)`,
      ];
      name = patterns[Math.floor(rng() * patterns.length)];
    } else {
      // 独立酒店
      const prefix = INDEPENDENT_NAMES[Math.floor(rng() * INDEPENDENT_NAMES.length)];
      star = [2, 3, 3, 3, 4][Math.floor(rng() * 5)];
      const isMSKZ = isTourism && rng() < 0.3;
      if (isMSKZ) {
        const suffix = MINSU_SUFFIX[Math.floor(rng() * MINSU_SUFFIX.length)];
        name = `${prefix}${suffix}(${cityShort(cityName)}${street}店)`;
        category = '民宿客栈';
        star = 3;
      } else {
        const suffix = HOTEL_SUFFIX[Math.floor(rng() * HOTEL_SUFFIX.length)];
        name = `${cityShort(cityName)}${prefix}${suffix}`;
        category = star >= 4 ? '高档型' : star === 3 ? '舒适型' : '经济型';
      }
      brand = '';
    }

    const basePrice = genPrice(star, rng);

    // 经纬度：基于城市中心 + 偏移
    const distIdx = districtNames.indexOf(districtName);
    const angle = (distIdx / districtNames.length) * 2 * Math.PI;
    const radius = 0.02 + rng() * 0.06;
    const lat = center[0] + Math.cos(angle) * radius + (rng() - 0.5) * 0.01;
    const lng = center[1] + Math.sin(angle) * radius + (rng() - 0.5) * 0.01;

    hotels.push({
      id: `gen_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 7)}`,
      name,
      nameEn: '',
      city: cityName,
      province,
      district: districtName,
      address: `${province === cityName ? '' : province}${cityName}${districtName}${street}${houseNum}号`,
      description: `${name}位于${cityName}${districtName}${street}，是一家${category}住宿。提供${genAmenities(star).slice(0, 3).join('、')}等设施，致力于为宾客打造舒适的入住体验。`,
      price: basePrice,
      rating: star,
      phone: genPhone(province),
      images: [
        `https://picsum.photos/seed/${encodeURIComponent(name)}_1/800/600`,
        `https://picsum.photos/seed/${encodeURIComponent(name)}_2/800/600`,
        `https://picsum.photos/seed/${encodeURIComponent(name)}_3/800/600`,
      ],
      amenities: genAmenities(star),
      roomTypes: genRoomTypes(star, basePrice),
      openDate: '',
      tags: genTags(star, level),
      brand: brand,
      latitude: +lat.toFixed(6),
      longitude: +lng.toFixed(6),
      checkInTime: '14:00',
      checkOutTime: '12:00',
      totalRooms: 30 + Math.floor(rng() * 250),
      floorCount: star >= 4 ? 8 + Math.floor(rng() * 25) : 3 + Math.floor(rng() * 10),
      baiduOverallRating: String(genRating(star, rng)),
      baiduCommentNum: String(Math.floor(rng() * 2000)),
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'generated',
      category,
    });
  }

  return hotels;
}

// ==================== 4. 导出行政区划 JSON ====================

function exportCityDistricts() {
  const result = {};
  for (const [city, data] of Object.entries(GEO_DATA)) {
    const prov = data.province;
    if (!result[prov]) result[prov] = {};
    result[prov][city] = Object.keys(data.districts);
  }
  fs.writeFileSync(DISTRICTS_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`行政区划数据已导出: ${DISTRICTS_FILE}`);
  return result;
}

// ==================== 5. 清洗并导入真实数据 ====================

function formatRawToSchema(rawData) {
  const now = new Date().toISOString();
  const formatted = [];

  for (const raw of rawData) {
    const name = (raw.name || '').trim();
    if (!name || name.length < 2) continue;
    if (/公寓出租|写字楼|办公|售楼|中介|旅行社|培训/.test(name)) continue;
    if (!raw.location || (!raw.location.lat && !raw.location.lng)) continue;

    const di = raw.detail_info || {};
    const city = raw._fetch_city || raw.city || '';
    const tag = di.classified_poi_tag || '';
    const cat = tag.split(';')[1] || '经济型';
    const starMap = { '豪华型': 5, '高档型': 4, '舒适型': 3, '经济型': 2 };
    const star = starMap[cat] || 3;
    const price = parseFloat(di.price) || genPrice(star, Math.random);
    const phone = (raw.telephone || '').replace(/<[^>]+>/g, '').split(/[,;，；]/)[0].trim();

    formatted.push({
      id: `real_${raw.uid || Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      name,
      nameEn: '',
      city,
      province: di.province || raw.province || '',
      district: raw.area || di.district || '',
      address: raw.address || '',
      description: `${name}位于${city}${raw.area || ''}，${cat}住宿。百度评分${di.overall_rating || '-'}，评论${di.comment_num || '0'}条。`,
      price: Math.round(price),
      rating: star,
      phone,
      images: [
        `https://picsum.photos/seed/${encodeURIComponent(name)}_1/800/600`,
        `https://picsum.photos/seed/${encodeURIComponent(name)}_2/800/600`,
      ],
      amenities: genAmenities(star),
      roomTypes: genRoomTypes(star, Math.round(price)),
      openDate: '',
      tags: genTags(star, 'none'),
      brand: di.brand || '',
      latitude: raw.location.lat || 0,
      longitude: raw.location.lng || 0,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      totalRooms: 30 + Math.floor(Math.random() * 200),
      floorCount: 3 + Math.floor(Math.random() * 20),
      baiduUid: raw.uid || '',
      baiduOverallRating: di.overall_rating || '',
      baiduCommentNum: di.comment_num || '',
      status: 'approved',
      createdAt: now,
      updatedAt: now,
      source: 'baidu_real',
      category: cat,
    });
  }

  return formatted;
}

// ==================== 6. 统计 ====================

function printStats(hotels) {
  const byCity = {};
  const byStar = {};
  const bySource = {};
  const byProvince = {};

  for (const h of hotels) {
    byCity[h.city] = (byCity[h.city] || 0) + 1;
    byStar[h.rating] = (byStar[h.rating] || 0) + 1;
    bySource[h.source] = (bySource[h.source] || 0) + 1;
    byProvince[h.province] = (byProvince[h.province] || 0) + 1;
  }

  console.log('\n========== 数据统计 ==========');
  console.log(`总数: ${hotels.length}`);
  console.log(`\n来源分布:`, bySource);
  console.log(`\n星级分布:`, byStar);
  console.log(`\n省份分布 (Top 15):`);
  Object.entries(byProvince).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([p, n]) => console.log(`  ${p.padEnd(12)} ${n}`));
  console.log(`\n城市分布 (Top 20):`);
  Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 20)
    .forEach(([c, n]) => console.log(`  ${c.padEnd(12)} ${n}`));
  console.log(`\n城市数: ${Object.keys(byCity).length}`);
}

// ==================== 主流程 ====================

function main() {
  const preview = process.argv.includes('--preview');
  const statsOnly = process.argv.includes('--stats');

  console.log('============================================');
  console.log('  基于真实行政区划的酒店数据生成');
  console.log('============================================\n');

  // 1. 提取真实数据统计
  const rawData = loadRawData();
  const stats = extractStats(rawData);
  console.log(`真实数据: ${stats.totalRaw} 条`);
  console.log(`品牌: ${stats.brands.length} 个, 价格中位数: ¥${stats.priceMedian}`);

  // 2. 格式化真实数据
  const realHotels = formatRawToSchema(rawData);
  console.log(`真实数据清洗后: ${realHotels.length} 条`);

  // 3. 生成各城市数据
  const cities = Object.entries(GEO_DATA);
  console.log(`\n开始生成 ${cities.length} 个城市的酒店数据...`);

  let allGenerated = [];
  for (const [cityName, cityData] of cities) {
    const hotels = generateHotelsForCity(cityName, cityData, stats);
    allGenerated.push(...hotels);
    process.stdout.write(`\r  已生成: ${allGenerated.length} 条 (${cityName})`);
  }
  console.log(`\n生成完成: ${allGenerated.length} 条`);

  // 4. 合并
  // 保留有 userId 的商户手动录入酒店
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(HOTELS_FILE, 'utf-8')); } catch {}
  const userHotels = existing.filter(h => h.userId && h.source !== 'seed' && h.source !== 'baidu_real' && h.source !== 'generated');
  console.log(`保留商户录入: ${userHotels.length} 条`);

  const allHotels = [...userHotels, ...realHotels, ...allGenerated];

  // 5. 统计
  printStats(allHotels);

  if (statsOnly) return;

  // 6. 导出行政区划
  exportCityDistricts();

  if (preview) {
    const previewFile = path.join(__dirname, '..', 'data', 'hotels_preview.json');
    fs.writeFileSync(previewFile, JSON.stringify(allHotels.slice(0, 50), null, 2), 'utf-8');
    console.log(`\n预览文件: ${previewFile} (前50条)`);
    console.log('确认无误后运行: node scripts/generate-from-real.js');
    return;
  }

  // 7. 写入
  fs.writeFileSync(HOTELS_FILE, JSON.stringify(allHotels, null, 2), 'utf-8');
  console.log(`\n已写入 hotels.json: ${allHotels.length} 条`);
  console.log('  - 商户录入: ' + userHotels.length);
  console.log('  - 百度真实: ' + realHotels.length);
  console.log('  - 生成数据: ' + allGenerated.length);
  console.log('\n完成!');
}

main();
