#!/usr/bin/env node
/**
 * Coze 知识库文档生成脚本
 * 
 * 从 hotels.json 生成结构化 Markdown 文档，用于上传到 Coze Knowledge Base。
 * 
 * 输出：
 *   kb_output/cities/      — 每个城市一个 .md（酒店概览+推荐）
 *   kb_output/travel/      — 旅游城市指南
 *   kb_output/faq.md       — 预订常见问题
 *   kb_output/amenities.md — 设施与标签速查
 * 
 * 用法：node server/scripts/build-knowledge-base.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'hotels.json');
const GEO_DATA = require('./geo_data');
const OUT_DIR = path.join(__dirname, '..', '..', 'kb_output');

const hotels = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  .filter(h => h.status === 'approved' && h.name && h.city);

console.log(`已加载 ${hotels.length} 家已审核酒店`);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function priceRange(p) {
  if (p < 200) return '经济型（200元以下）';
  if (p < 500) return '舒适型（200-500元）';
  if (p < 1000) return '高档型（500-1000元）';
  return '豪华型（1000元以上）';
}

function starText(r) {
  return r >= 5 ? '五星/豪华' : r >= 4 ? '四星/高档' : r >= 3 ? '三星/舒适' : '经济型';
}

// ============ 城市酒店概览 ============
function buildCityDocs() {
  ensureDir(path.join(OUT_DIR, 'cities'));

  const byCity = {};
  hotels.forEach(h => {
    const c = h.city;
    if (!byCity[c]) byCity[c] = [];
    byCity[c].push(h);
  });

  Object.entries(byCity).forEach(([city, list]) => {
    if (list.length < 3) return;

    const districts = {};
    const brands = {};
    const priceGroups = { '经济型（200元以下）': [], '舒适型（200-500元）': [], '高档型（500-1000元）': [], '豪华型（1000元以上）': [] };

    list.forEach(h => {
      const d = h.district || '未知区域';
      if (!districts[d]) districts[d] = [];
      districts[d].push(h);
      if (h.brand) brands[h.brand] = (brands[h.brand] || 0) + 1;
      priceGroups[priceRange(h.price || 0)].push(h);
    });

    const avgPrice = Math.round(list.reduce((s, h) => s + (h.price || 0), 0) / list.length);
    const topBrands = Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const top5 = [...list]
      .filter(h => parseFloat(h.baiduOverallRating) > 0)
      .sort((a, b) => parseFloat(b.baiduOverallRating || 0) - parseFloat(a.baiduOverallRating || 0))
      .slice(0, 5);

    const cheapTop = [...list]
      .filter(h => (h.price || 999) < 300 && parseFloat(h.baiduOverallRating) >= 3.5)
      .sort((a, b) => parseFloat(b.baiduOverallRating || 0) - parseFloat(a.baiduOverallRating || 0))
      .slice(0, 5);

    let md = `# ${city}酒店概览\n\n`;
    md += `${city}共有 ${list.length} 家酒店，均价 ¥${avgPrice}/晚。\n\n`;

    md += `## 价格分布\n`;
    Object.entries(priceGroups).forEach(([label, arr]) => {
      if (arr.length === 0) return;
      const avg = Math.round(arr.reduce((s, h) => s + (h.price || 0), 0) / arr.length);
      md += `- ${label}：${arr.length} 家，均价 ¥${avg}\n`;
    });

    if (topBrands.length > 0) {
      md += `\n## 热门品牌\n`;
      md += topBrands.map(([b, n]) => `${b}(${n}家)`).join('、') + '\n';
    }

    const districtEntries = Object.entries(districts).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
    if (districtEntries.length > 0) {
      md += `\n## 热门区域\n`;
      districtEntries.forEach(([d, arr]) => {
        const dAvg = Math.round(arr.reduce((s, h) => s + (h.price || 0), 0) / arr.length);
        md += `- ${d}：${arr.length} 家，均价 ¥${dAvg}\n`;
      });
    }

    if (top5.length > 0) {
      md += `\n## 高评分推荐（Top ${top5.length}）\n`;
      top5.forEach((h, i) => {
        md += `${i + 1}. ${h.name} | ID:${h.id} | ${starText(h.rating)} | ¥${h.price}/晚 | 评分${h.baiduOverallRating} | ${h.district || ''}\n`;
      });
    }

    if (cheapTop.length > 0) {
      md += `\n## 性价比之选（300元以下高评分）\n`;
      cheapTop.forEach((h, i) => {
        md += `${i + 1}. ${h.name} | ID:${h.id} | ¥${h.price}/晚 | 评分${h.baiduOverallRating} | ${h.district || ''}\n`;
      });
    }

    fs.writeFileSync(path.join(OUT_DIR, 'cities', `${city}.md`), md, 'utf8');
  });

  console.log(`已生成 ${Object.keys(byCity).length} 个城市文档`);
}

// ============ 旅游城市指南 ============
function buildTravelDocs() {
  ensureDir(path.join(OUT_DIR, 'travel'));

  const TRAVEL_INFO = {
    '三亚市': { season: '11月至次年4月（避寒度假）', highlights: '亚龙湾、天涯海角、南山寺、蜈支洲岛', stayTip: '亚龙湾/海棠湾适合度假，三亚湾性价比高，市区靠近商圈' },
    '丽江市': { season: '3-5月（春花）和9-11月（秋色）', highlights: '丽江古城、玉龙雪山、束河古镇、泸沽湖', stayTip: '古城内体验民宿客栈，新城区酒店性价比高' },
    '大理白族自治州': { season: '3-6月和9-11月', highlights: '洱海、大理古城、苍山、双廊', stayTip: '古城内靠近酒吧街热闹，洱海东岸海景民宿安静' },
    '桂林市': { season: '4-10月', highlights: '漓江、阳朔、龙脊梯田、象鼻山', stayTip: '市区靠近两江四湖，阳朔西街附近夜生活丰富' },
    '张家界市': { season: '4-6月和9-11月', highlights: '张家界国家森林公园、天门山、玻璃栈道', stayTip: '武陵源景区入口附近方便游览，市区价格更低' },
    '黄山市': { season: '3-5月和9-11月', highlights: '黄山风景区、宏村、西递、屯溪老街', stayTip: '汤口镇靠近黄山南大门，屯溪老街适合休闲' },
    '厦门市': { season: '3-5月和9-11月', highlights: '鼓浪屿、曾厝垵、南普陀、环岛路', stayTip: '思明区靠近主要景点，曾厝垵文艺气息浓' },
    '成都市': { season: '3-6月和9-11月', highlights: '宽窄巷子、锦里、大熊猫基地、都江堰', stayTip: '春熙路/太古里商圈便利，宽窄巷子附近体验感好' },
    '西安市': { season: '3-5月和9-11月', highlights: '兵马俑、大雁塔、古城墙、回民街', stayTip: '钟楼/鼓楼附近是市中心，大雁塔附近靠近景区' },
    '杭州市': { season: '3-5月和9-11月', highlights: '西湖、灵隐寺、西溪湿地、千岛湖', stayTip: '西湖周边景观好但价格高，武林广场附近交通便利' },
    '青岛市': { season: '5-10月', highlights: '栈桥、八大关、崂山、金沙滩', stayTip: '市南区老城区靠近海边景点，崂山区安静适合度假' },
    '重庆市': { season: '3-5月和9-11月', highlights: '洪崖洞、磁器口、解放碑、长江索道', stayTip: '解放碑/洪崖洞周边是核心区，南岸区可观夜景' },
    '北海市': { season: '4-11月', highlights: '银滩、涠洲岛、老街', stayTip: '银滩附近度假氛围好，老城区体验当地生活' },
    '西双版纳傣族自治州': { season: '11月至次年4月', highlights: '热带植物园、野象谷、曼听公园', stayTip: '告庄西双景夜市热闹，景洪市区交通方便' },
    '敦煌市': { season: '5-10月', highlights: '莫高窟、鸣沙山月牙泉、雅丹地貌', stayTip: '市区酒店集中，沙漠附近有特色民宿' },
    '拉萨市': { season: '6-9月', highlights: '布达拉宫、大昭寺、纳木错', stayTip: '八廓街附近体验藏文化，注意初到高原不宜住太高楼层' },
    '腾冲市': { season: '2-4月和9-11月', highlights: '和顺古镇、火山地质公园、热海温泉', stayTip: '和顺古镇民宿体验佳，温泉度假村适合放松' },
    '澳门特别行政区': { season: '10月至次年3月', highlights: '大三巴、威尼斯人、官也街', stayTip: '路氹城区度假酒店集中，澳门半岛靠近历史景点' },
    '香港特别行政区': { season: '10月至次年3月', highlights: '维多利亚港、太平山顶、迪士尼、海洋公园', stayTip: '尖沙咀/铜锣湾购物便利，上环体验港式文化' },
  };

  Object.entries(TRAVEL_INFO).forEach(([city, info]) => {
    const cityHotels = hotels.filter(h => h.city === city || h.city.includes(city.replace(/市|特别行政区|白族自治州|傣族自治州/, '')));
    if (cityHotels.length === 0) return;

    let md = `# ${city}旅游住宿指南\n\n`;
    md += `## 最佳旅游季节\n${info.season}\n\n`;
    md += `## 核心景点\n${info.highlights}\n\n`;
    md += `## 住宿区域建议\n${info.stayTip}\n\n`;

    md += `## 当地酒店概况\n`;
    md += `共 ${cityHotels.length} 家酒店可选，价格区间 ¥${Math.min(...cityHotels.map(h => h.price || 999))}-¥${Math.max(...cityHotels.map(h => h.price || 0))}/晚。\n\n`;

    const topPicks = [...cityHotels]
      .filter(h => parseFloat(h.baiduOverallRating) > 0)
      .sort((a, b) => parseFloat(b.baiduOverallRating || 0) - parseFloat(a.baiduOverallRating || 0))
      .slice(0, 5);

    if (topPicks.length > 0) {
      md += `## 精选推荐\n`;
      topPicks.forEach((h, i) => {
        const tags = (h.tags || []).slice(0, 3).join('、');
        md += `${i + 1}. ${h.name} | ID:${h.id} | ${starText(h.rating)} | ¥${h.price}/晚 | 评分${h.baiduOverallRating || '-'} | ${h.district || ''} | ${tags}\n`;
      });
    }

    fs.writeFileSync(path.join(OUT_DIR, 'travel', `${city.replace(/[\/\\]/g, '_')}旅游指南.md`), md, 'utf8');
  });

  console.log('已生成旅游城市指南文档');
}

// ============ FAQ 文档 ============
function buildFAQ() {
  const md = `# 易宿酒店预订 — 常见问题

## 预订流程
1. 在首页搜索或浏览酒店列表
2. 进入酒店详情页，选择房型和入住日期
3. 确认预订信息，点击"立即预订"
4. 系统生成订单，可在"订单"页面查看

## 入住与退房
- 标准入住时间：14:00 之后
- 标准退房时间：12:00 之前
- 具体时间以各酒店规定为准

## 取消政策
- 可在"订单"页面找到对应订单点击取消
- 取消后订单状态变为"已取消"

## 价格说明
- 页面显示价格为每间每晚起步价
- 不同房型价格不同，详见酒店详情页
- 总价 = 房型单价 × 入住晚数

## 酒店星级说明
- 五星/豪华型：高端设施，配套齐全，适合商务和度假
- 四星/高档型：设施完善，服务优质
- 三星/舒适型：干净整洁，基本设施齐全，性价比好
- 经济型：满足基本住宿需求，价格亲民

## 设施说明
- "免费WiFi"：酒店公共区域及客房均可免费使用无线网络
- "含早餐"：房价已包含次日早餐
- "免费停车"：酒店提供免费停车位
- "泳池"：酒店配有游泳池（室内/室外请查看详情）
- "温泉"：酒店配有温泉设施

## 如何收藏酒店？
在酒店详情页点击右上角的爱心图标即可收藏，收藏的酒店可在"收藏"页面查看。

## 如何联系酒店？
在酒店详情页可以查看酒店电话，点击即可拨打。
`;

  fs.writeFileSync(path.join(OUT_DIR, 'faq.md'), md, 'utf8');
  console.log('已生成 FAQ 文档');
}

// ============ 设施与标签速查 ============
function buildAmenitiesGuide() {
  const allAmenities = new Set();
  const allTags = new Set();
  const allCategories = {};

  hotels.forEach(h => {
    (h.amenities || []).forEach(a => allAmenities.add(a));
    (h.tags || []).forEach(t => allTags.add(t));
    const cat = h.category || '未分类';
    allCategories[cat] = (allCategories[cat] || 0) + 1;
  });

  let md = `# 酒店设施与标签说明\n\n`;

  md += `## 酒店类型（${Object.keys(allCategories).length} 种）\n`;
  Object.entries(allCategories).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
    md += `- ${cat}：${n} 家\n`;
  });

  md += `\n## 设施列表（${allAmenities.size} 种）\n`;
  md += [...allAmenities].sort().join('、') + '\n';

  md += `\n## 标签列表（${allTags.size} 种）\n`;
  md += [...allTags].sort().join('、') + '\n';

  md += `\n## 常见需求与对应搜索关键词\n`;
  md += `- 想要安静：搜索"安静"或"隔音"\n`;
  md += `- 带小孩出行：搜索"亲子"或"儿童"\n`;
  md += `- 商务出差：搜索"商务"或"会议"\n`;
  md += `- 度假放松：搜索"度假"、"温泉"或"泳池"\n`;
  md += `- 交通便利：搜索"地铁"或"机场"\n`;
  md += `- 看海：搜索"海景"\n`;
  md += `- 情侣出行：搜索"情侣"或"蜜月"\n`;

  fs.writeFileSync(path.join(OUT_DIR, 'amenities.md'), md, 'utf8');
  console.log('已生成设施标签速查文档');
}

// ============ 执行 ============
ensureDir(OUT_DIR);
buildCityDocs();
buildTravelDocs();
buildFAQ();
buildAmenitiesGuide();
console.log(`\n全部完成！文档输出到：${OUT_DIR}`);
console.log('请将 kb_output/ 目录下的所有 .md 文件上传到 Coze 知识库。');
