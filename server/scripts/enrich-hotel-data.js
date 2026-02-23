#!/usr/bin/env node
/**
 * 酒店数据增强脚本
 * 为 hotels.json 中的所有酒店重新分配多样化的 amenities、description、tags
 * 基于 hotel.id 的确定性随机，保证可复现
 */

const fs = require('fs');
const path = require('path');

const HOTELS_PATH = path.join(__dirname, '..', 'data', 'hotels.json');

// ===== 确定性随机 =====
function seedRandom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  let s = h >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

function pickN(arr, n, rng) {
  const pool = [...arr];
  const result = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// ===== 设施池（55+ 个） =====
const AMENITY_POOLS = {
  basic: ['免费WiFi', '空调', '暖气', '有线电视', '电热水壶', '独立卫浴', '吹风机', '一次性洗漱用品', '拖鞋', '衣架', '书桌', '穿衣镜'],
  comfort: ['冰箱', '迷你吧', '保险箱', '电梯', '行李寄存', '隔音客房', '熨斗/熨衣板', '遮光窗帘', '智能马桶', '浴缸', '浴袍', '每日客房清洁'],
  business: ['商务中心', '会议室', '打印服务', '传真服务', '快速入住退房', '多功能厅'],
  dining: ['中餐厅', '西餐厅', '咖啡厅', '自助早餐', '大堂吧', '客房送餐', '行政酒廊', '茶室'],
  recreation: ['健身房', '室内泳池', '室外泳池', 'SPA水疗', '棋牌室', 'KTV', '花园/露台', '瑜伽室', '儿童乐园', '儿童泳池'],
  service: ['24小时前台', '礼宾服务', '机场接送', '叫车服务', '洗衣服务', '行李搬运', '外币兑换', '旅游咨询', '叫醒服务', '管家服务'],
  parking: ['免费停车', '收费停车', '代客泊车', '新能源充电桩'],
  special: ['阅读空间', '大堂茶饮', '共享厨房', '露天影院', '温泉', '无边泳池', '天台酒吧', '私人沙滩', '露天温泉']
};

// 品类必备设施
const CATEGORY_MUST_HAVE = {
  '经济型':   ['免费WiFi', '空调', '独立卫浴'],
  '舒适型':   ['免费WiFi', '空调', '电梯', '行李寄存'],
  '高档型':   ['免费WiFi', '空调', '电梯', '行李寄存', '健身房', '商务中心'],
  '豪华型':   ['免费WiFi', '空调', '电梯', '行李寄存', '健身房', '商务中心', '礼宾服务', '客房送餐'],
  '民宿':     ['免费WiFi', '空调', '共享厨房'],
  '客栈':     ['免费WiFi', '空调', '茶室'],
  '民宿客栈': ['免费WiFi', '空调', '共享厨房'],
  '度假村':   ['免费WiFi', '空调', '花园/露台', '室外泳池'],
  '青年旅舍': ['免费WiFi', '空调', '行李寄存'],
  '公寓式酒店': ['免费WiFi', '空调', '冰箱', '电热水壶'],
  '商务酒店': ['免费WiFi', '空调', '商务中心', '会议室'],
  '星级酒店': ['免费WiFi', '空调', '电梯', '礼宾服务'],
};

// 品牌特色设施
const BRAND_FEATURES = {
  '亚朵酒店':     ['阅读空间', '大堂茶饮'],
  '全季酒店':     ['大堂茶饮', '自助早餐'],
  '桔子水晶酒店': ['隔音客房', '智能马桶'],
  '希尔顿酒店':   ['行政酒廊', '管家服务', '室内泳池'],
  '万豪酒店':     ['行政酒廊', 'SPA水疗', '室内泳池'],
  '洲际酒店':     ['行政酒廊', '管家服务', 'SPA水疗'],
  '喜来登酒店':   ['健身房', '室内泳池', '行政酒廊'],
  '香格里拉酒店': ['SPA水疗', '管家服务', '花园/露台'],
  '凯悦酒店':     ['行政酒廊', '室内泳池', '管家服务'],
  '威斯汀酒店':   ['SPA水疗', '健身房', '室内泳池'],
  '皇冠假日酒店': ['行政酒廊', '会议室', '商务中心'],
  '假日酒店':     ['自助早餐', '健身房'],
  '智选假日酒店': ['自助早餐', '快速入住退房'],
  '如家酒店':     ['24小时前台', '自助早餐'],
  '汉庭酒店':     ['24小时前台', '自助早餐'],
  '维也纳酒店':   ['自助早餐', '棋牌室'],
  '花间堂':       ['花园/露台', '茶室'],
  '悦榕庄':       ['SPA水疗', '私人沙滩', '无边泳池', '管家服务'],
  '开元酒店':     ['中餐厅', '棋牌室', '会议室'],
  '铂尔曼酒店':   ['行政酒廊', '健身房', '咖啡厅'],
  '美居酒店':     ['自助早餐', '咖啡厅'],
  '诺富特酒店':   ['自助早餐', '儿童乐园'],
  '华美达酒店':   ['自助早餐', '会议室'],
  '锦江之星':     ['24小时前台', '自助早餐'],
  '麗枫酒店':     ['大堂茶饮', '隔音客房'],
  '希岸酒店':     ['大堂茶饮', '浴缸'],
};

// 星级对应的额外设施池和数量范围
const TIER_CONFIG = {
  1: { pools: ['basic', 'parking'], extra: [1, 3] },
  2: { pools: ['basic', 'comfort', 'parking'], extra: [2, 4] },
  3: { pools: ['basic', 'comfort', 'dining', 'service', 'parking'], extra: [3, 5] },
  4: { pools: ['comfort', 'business', 'dining', 'recreation', 'service', 'parking'], extra: [4, 7] },
  5: { pools: ['comfort', 'business', 'dining', 'recreation', 'service', 'parking', 'special'], extra: [6, 10] },
};

function assignAmenities(hotel) {
  const rng = seedRandom(hotel.id + '_amenities');
  const star = hotel.rating || 3;
  const category = hotel.category || '舒适型';
  const brand = hotel.brand || '';

  const result = new Set();

  // 1) 品类必备
  const must = CATEGORY_MUST_HAVE[category] || CATEGORY_MUST_HAVE['舒适型'];
  must.forEach(a => result.add(a));

  // 2) 品牌特色
  const brandF = BRAND_FEATURES[brand] || [];
  brandF.forEach(a => result.add(a));

  // 3) 基础设施随机选 2-4 个
  const baseCount = 2 + Math.floor(rng() * 3);
  const basePool = AMENITY_POOLS.basic.filter(a => !result.has(a));
  pickN(basePool, baseCount, rng).forEach(a => result.add(a));

  // 4) 星级额外
  const tier = TIER_CONFIG[Math.min(5, Math.max(1, star))] || TIER_CONFIG[3];
  const tierPool = [];
  tier.pools.forEach(p => {
    (AMENITY_POOLS[p] || []).forEach(a => {
      if (!result.has(a)) tierPool.push(a);
    });
  });
  const [minExtra, maxExtra] = tier.extra;
  const extraCount = minExtra + Math.floor(rng() * (maxExtra - minExtra + 1));
  pickN(tierPool, extraCount, rng).forEach(a => result.add(a));

  // 5) 随机彩蛋 1-2 个（从所有池中未选的）
  const allAmenities = Object.values(AMENITY_POOLS).flat();
  const remaining = allAmenities.filter(a => !result.has(a));
  const bonusCount = 1 + Math.floor(rng() * 2);
  pickN(remaining, bonusCount, rng).forEach(a => result.add(a));

  return [...result];
}

// ===== 标签池（30+ 个） =====
const TAG_POOLS = {
  location: ['近地铁', '近景区', '市中心', '火车站周边', '机场附近', '步行街周边', '湖景', '山景', '海景', '江景'],
  experience: ['商务出行', '高端奢华', '性价比高', '休闲度假', '亲子游', '情侣蜜月', '会议会展', '闺蜜出游', '背包客优选'],
  feature: ['含早餐', '新装修', '设计师酒店', '网红打卡', '安静舒适', '温馨民宿', '古色古香', '花园洋房', '地标建筑旁', '美食街旁', '购物便利', '夜景绝佳']
};

const COASTAL_CITIES = ['三亚', '厦门', '青岛', '大连', '珠海', '海口', '烟台', '威海', '北海', '深圳', '宁波', '舟山', '泉州', '汕头', '湛江', '澳门特别行政区', '香港特别行政区'];
const RIVER_CITIES = ['重庆', '武汉', '南京', '长沙', '杭州', '南昌', '芜湖', '镇江'];
const LAKE_CITIES = ['杭州', '昆明', '武汉', '南京', '苏州', '无锡', '嘉兴'];
const MOUNTAIN_CITIES = ['丽江', '大理', '张家界', '黄山', '桂林', '九寨沟', '拉萨', '西宁', '成都'];
const TOURISM_CITIES = ['三亚', '丽江', '大理', '桂林', '张家界', '九寨沟', '厦门', '西安', '成都', '杭州', '苏州', '拉萨', '黄山', '北海', '青岛'];

function assignTags(hotel) {
  const rng = seedRandom(hotel.id + '_tags');
  const star = hotel.rating || 3;
  const category = hotel.category || '舒适型';
  const city = hotel.city || '';
  const amenities = hotel.amenities || [];

  const result = new Set();

  // 星级/品类标签
  if (star >= 5) result.add('高端奢华');
  else if (star <= 2) result.add('性价比高');

  if (star >= 4) result.add('商务出行');
  if (['民宿', '客栈', '民宿客栈'].includes(category)) result.add('温馨民宿');
  if (category === '度假村') result.add('休闲度假');
  if (['青年旅舍'].includes(category)) result.add('背包客优选');

  // 地理标签
  if (COASTAL_CITIES.includes(city)) { if (rng() > 0.3) result.add('海景'); }
  if (RIVER_CITIES.includes(city)) { if (rng() > 0.4) result.add('江景'); }
  if (LAKE_CITIES.includes(city)) { if (rng() > 0.4) result.add('湖景'); }
  if (MOUNTAIN_CITIES.includes(city)) { if (rng() > 0.4) result.add('山景'); }
  if (TOURISM_CITIES.includes(city)) { if (rng() > 0.3) result.add('近景区'); }

  // 设施驱动标签
  if (amenities.some(a => a.includes('早餐'))) result.add('含早餐');
  if (amenities.some(a => a.includes('儿童'))) result.add('亲子游');
  if (amenities.some(a => a.includes('会议'))) result.add('会议会展');

  // 随机位置标签
  const locTags = TAG_POOLS.location.filter(t => !result.has(t));
  pickN(locTags, 1 + Math.floor(rng() * 2), rng).forEach(t => result.add(t));

  // 随机特色标签
  const featTags = TAG_POOLS.feature.filter(t => !result.has(t));
  pickN(featTags, 1 + Math.floor(rng() * 2), rng).forEach(t => result.add(t));

  // 随机体验标签（补到至少3个）
  if (result.size < 3) {
    const expTags = TAG_POOLS.experience.filter(t => !result.has(t));
    pickN(expTags, 3 - result.size, rng).forEach(t => result.add(t));
  }

  // 总数控制 3-6 个
  const arr = [...result];
  const maxTags = 3 + Math.floor(rng() * 4);
  return arr.slice(0, Math.max(3, Math.min(maxTags, arr.length)));
}

// ===== 描述模板系统 =====
const DESC_TEMPLATES = {
  '经济型': [
    (h, a) => `${h.name}地处${h.city}${h.district || ''}核心地段，交通四通八达。客房干净整洁，配备${a[0]}、${a[1]}等基础设施，是商旅出行的高性价比之选。`,
    (h, a) => `坐落于${h.city}${h.district || ''}，${h.name}以简约舒适的住宿环境深受旅客好评。${a[0]}、${a[1]}一应俱全，周边餐饮购物便利。`,
    (h, a) => `${h.name}是${h.city}的热门经济型住宿，地理位置优越，步行可达周边商圈。提供${a[0]}、${a[1]}、${a[2] || '独立卫浴'}等贴心设施，让旅途无忧。`,
    (h, a) => `位于${h.city}${h.district || ''}的${h.name}，以亲民的价格和温馨的入住体验著称。配备${a[0]}、${a[1]}等设施，满足商旅出行的基本需求。`,
    (h, a) => `${h.name}毗邻${h.city}主要交通枢纽，出行便捷。酒店虽精巧但五脏俱全，${a[0]}、${a[1]}、${a[2] || '吹风机'}等设施一应俱全，适合短途旅行或商务差旅。`,
  ],
  '舒适型': [
    (h, a) => `${h.name}位于${h.city}${h.district || ''}繁华地带，精心打造的客房空间兼具格调与舒适。酒店提供${a[0]}、${a[1]}、${a[2] || '洗衣服务'}等贴心服务，让旅途更加惬意。`,
    (h, a) => `${h.brand ? `作为${h.brand}旗下品质之选，` : ''}${h.name}以简约时尚的设计风格和周到的服务闻名。${a[0]}、${a[1]}是其一大亮点，深受商务及休闲旅客青睐。`,
    (h, a) => `${h.name}坐落于${h.city}${h.district || ''}，周边配套成熟，生活便利。酒店注重品质体验，配有${a[0]}、${a[1]}、${a[2] || '行李寄存'}等设施，是品质出行的理想选择。`,
    (h, a) => `选择${h.name}，享受${h.city}的都市便捷与舒适。酒店提供${a[0]}、${a[1]}等设施，客房设计现代简约，为宾客营造温馨的居停氛围。`,
    (h, a) => `${h.name}地处${h.city}${h.district || ''}的黄金地段，闹中取静。酒店融合现代审美与实用功能，提供${a[0]}、${a[1]}、${a[2] || '24小时前台'}等优质服务，是差旅休闲的上佳之选。`,
  ],
  '高档型': [
    (h, a) => `${h.name}坐拥${h.city}${h.district || ''}优越地理位置，是商务精英与品质旅者的不二之选。尊享${a[0]}、${a[1]}、${a[2] || '健身房'}等高端设施，尽享尊贵入住体验。`,
    (h, a) => `${h.brand ? `${h.brand}品牌旗下的` : ''}${h.name}以卓越的服务与精致的空间设计著称。酒店配备${a[0]}、${a[1]}等高端设施，为每一位宾客打造难忘的住宿记忆。`,
    (h, a) => `位于${h.city}核心区域的${h.name}，将现代奢华与本地文化完美融合。${a[0]}、${a[1]}、${a[2] || '商务中心'}等一流配套，让您的旅程从容优雅。`,
    (h, a) => `${h.name}矗立于${h.city}${h.district || ''}的繁华地段，以高品质的服务和精心设计的空间闻名。设有${a[0]}、${a[1]}等设施，是追求品质的旅行者的首选。`,
  ],
  '豪华型': [
    (h, a) => `${h.name}是${h.city}的奢华地标，以无可挑剔的服务和极致的空间美学闻名于世。尊享${a[0]}、${a[1]}、${a[2] || 'SPA水疗'}等世界级设施，每一处细节都彰显非凡品味。`,
    (h, a) => `${h.brand ? `${h.brand}旗下` : ''}${h.name}坐落于${h.city}最负盛名的地段，将国际化的奢华体验与本地人文精髓完美交融。${a[0]}、${a[1]}、${a[2] || '管家服务'}等顶级设施一应俱全。`,
    (h, a) => `踏入${h.name}，即刻开启一段非凡的奢华之旅。酒店位于${h.city}${h.district || ''}，拥有${a[0]}、${a[1]}等世界级设施，以臻至完美的服务理念，诠释极致待客之道。`,
    (h, a) => `${h.name}以恢弘典雅的建筑风格傲立${h.city}天际线。${a[0]}、${a[1]}、${a[2] || '行政酒廊'}等臻选配套，配合一对一管家式服务，为尊贵宾客呈现至臻体验。`,
  ],
  '民宿': [
    (h, a) => `${h.name}是${h.city}一处温馨雅致的民宿，远离都市喧嚣，让您感受地道的当地风情。配有${a[0]}、${a[1]}等生活设施，如家般自在。`,
    (h, a) => `隐匿于${h.city}${h.district || ''}的${h.name}，以质朴温暖的氛围和贴心的服务赢得旅客好评。${a[0]}、${a[1]}一应俱全，适合寻求慢生活的您。`,
    (h, a) => `${h.name}坐落于${h.city}的宁静角落，融合当地建筑特色与现代舒适。提供${a[0]}、${a[1]}等设施，是体验在地文化的绝佳住所。`,
  ],
  '客栈': [
    (h, a) => `${h.name}是${h.city}一家充满人文气息的客栈，古色古香的环境中融入现代舒适。配有${a[0]}、${a[1]}等设施，让您的旅途充满诗意。`,
    (h, a) => `漫步至${h.city}${h.district || ''}的${h.name}，感受古朴与现代交织的独特魅力。${a[0]}、${a[1]}等贴心配置，为旅人打造一方宁静天地。`,
    (h, a) => `${h.name}位于${h.city}老城区的幽巷之中，传承了当地深厚的文化底蕴。提供${a[0]}、${a[1]}等基础设施，是文艺青年和背包客的心仪之所。`,
  ],
  '民宿客栈': [
    (h, a) => `${h.name}是${h.city}一处兼具民宿温馨与客栈韵味的特色住所。配有${a[0]}、${a[1]}等设施，让您在旅途中找到归属感。`,
    (h, a) => `位于${h.city}${h.district || ''}的${h.name}，以独特的设计风格和亲切的服务态度著称。${a[0]}、${a[1]}一应俱全，是探索当地的理想据点。`,
  ],
  '度假村': [
    (h, a) => `${h.name}是${h.city}的顶级度假胜地，坐拥绝美自然风光。尽情享受${a[0]}、${a[1]}、${a[2] || '花园/露台'}等休闲设施，开启一段难忘的度假时光。`,
    (h, a) => `远离都市的繁忙，${h.name}为您打造沉浸式的${h.city}度假体验。${a[0]}、${a[1]}等设施配套完善，让身心在自然中得到彻底放松。`,
    (h, a) => `${h.name}位于${h.city}风景如画的区域，融合自然之美与现代奢华。设有${a[0]}、${a[1]}、${a[2] || '室外泳池'}等丰富设施，适合家庭度假或浪漫之旅。`,
  ],
};

// 通用兜底模板
const FALLBACK_TEMPLATES = [
  (h, a) => `${h.name}位于${h.city}${h.district || ''}，交通便利，周边配套齐全。酒店提供${a[0]}、${a[1]}等设施，致力于为宾客提供舒适便捷的住宿体验。`,
  (h, a) => `${h.name}地处${h.city}${h.district || ''}，以优质的服务和舒适的环境受到旅客欢迎。配备${a[0]}、${a[1]}、${a[2] || '独立卫浴'}等设施，满足不同出行需求。`,
  (h, a) => `欢迎入住${h.name}，感受${h.city}的独特魅力。酒店设有${a[0]}、${a[1]}等贴心设施，无论商务出差还是休闲旅游，都能为您带来愉悦的入住体验。`,
  (h, a) => `${h.name}坐落于${h.city}${h.district || ''}的便捷位置，为宾客提供${a[0]}、${a[1]}等实用设施。简约而不简单的设计理念，让每一次入住都温馨舒适。`,
];

function generateDescription(hotel) {
  const rng = seedRandom(hotel.id + '_desc');
  const category = hotel.category || '舒适型';
  const amenities = hotel.amenities || [];

  // 选择 3 个有代表性的设施用于描述（跳过太基础的）
  const basicSet = new Set(['免费WiFi', '空调', '独立卫浴', '吹风机', '拖鞋', '衣架', '一次性洗漱用品', '电热水壶', '书桌', '穿衣镜', '暖气', '有线电视']);
  const highlights = amenities.filter(a => !basicSet.has(a));
  const basicAmenities = amenities.filter(a => basicSet.has(a));
  const descAmenities = highlights.length >= 3
    ? pickN(highlights, 3, rng)
    : [...pickN(highlights, highlights.length, rng), ...pickN(basicAmenities, 3 - highlights.length, rng)];

  const templates = DESC_TEMPLATES[category] || FALLBACK_TEMPLATES;
  const idx = Math.floor(rng() * templates.length);
  const template = templates[idx];

  let desc = template(hotel, descAmenities);

  // 百度评分补充
  if (hotel.baiduOverallRating && parseFloat(hotel.baiduOverallRating) > 0) {
    const score = parseFloat(hotel.baiduOverallRating).toFixed(1);
    const commentNum = hotel.baiduCommentNum ? parseInt(hotel.baiduCommentNum, 10) : 0;
    if (commentNum > 50) {
      desc += `（百度评分${score}，${commentNum}条真实评价）`;
    } else if (commentNum > 0) {
      desc += `（百度评分${score}）`;
    }
  }

  return desc;
}

// ===== 主逻辑 =====
function main() {
  console.log('正在读取 hotels.json ...');
  const raw = fs.readFileSync(HOTELS_PATH, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('JSON 解析失败:', e.message);
    process.exit(1);
  }

  const hotels = Array.isArray(data) ? data : (data.hotels || []);
  console.log(`共 ${hotels.length} 家酒店，开始增强数据...`);

  let enriched = 0;
  for (const hotel of hotels) {
    if (!hotel.id) continue;

    // 重新分配设施
    hotel.amenities = assignAmenities(hotel);

    // 重新分配标签
    hotel.tags = assignTags(hotel);

    // 重新生成描述
    hotel.description = generateDescription(hotel);

    enriched++;
  }

  // 写回
  const output = Array.isArray(data) ? hotels : { ...data, hotels };
  fs.writeFileSync(HOTELS_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`增强完成: ${enriched} 家酒店已更新`);

  // 统计
  const amenitySets = {};
  const allAmenities = {};
  const allTags = {};
  const descSet = new Set();
  hotels.forEach(h => {
    const aKey = (h.amenities || []).sort().join('|');
    amenitySets[aKey] = (amenitySets[aKey] || 0) + 1;
    (h.amenities || []).forEach(a => { allAmenities[a] = (allAmenities[a] || 0) + 1; });
    (h.tags || []).forEach(t => { allTags[t] = (allTags[t] || 0) + 1; });
    descSet.add(h.description);
  });

  console.log('\n=== 数据多样性统计 ===');
  console.log(`唯一设施组合数: ${Object.keys(amenitySets).length} (原5)`);
  console.log(`唯一设施选项数: ${Object.keys(allAmenities).length} (原17)`);
  console.log(`唯一标签选项数: ${Object.keys(allTags).length} (原11)`);
  console.log(`唯一描述数: ${descSet.size} / ${hotels.length}`);

  console.log('\n设施频率 Top 15:');
  Object.entries(allAmenities).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([k, v]) => console.log(`  ${k}: ${v} (${(v / hotels.length * 100).toFixed(1)}%)`));

  console.log('\n标签频率 Top 15:');
  Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([k, v]) => console.log(`  ${k}: ${v} (${(v / hotels.length * 100).toFixed(1)}%)`));
}

main();
