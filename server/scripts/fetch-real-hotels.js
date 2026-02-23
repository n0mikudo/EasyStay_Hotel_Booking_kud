/**
 * 全国真实酒店原始数据采集脚本（大规模版）
 * 
 * 使用百度地图 Place API v2 广泛采集全国酒店原始信息。
 * 不做任何数据伪造，仅保存 API 返回的原始字段。
 * 后续可由用户自行做数据清洗与 NLP 处理。
 * 
 * 用法：
 *   cd server
 *   node scripts/fetch-real-hotels.js              # 全量采集
 *   node scripts/fetch-real-hotels.js --resume      # 断点续采（跳过已采集城市）
 *   node scripts/fetch-real-hotels.js --test        # 仅测试 3 个城市
 * 
 * 输出：
 *   data/hotels_raw.json        — 全量原始数据（追加模式，自动去重）
 *   data/fetch_progress.json    — 采集进度（支持断点续采）
 * 
 * 配额说明：
 *   百度个人开发者 Place API 配额约 100~300 次/天。
 *   脚本内含限流，配额耗尽会自动保存并退出，明天 --resume 继续。
 *   全量采集约需 100城 × 5关键词 × 5页 = 2500 次请求，约需 8~25 天。
 *   若配额充裕（企业认证 5万次/天），一次即可跑完。
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');
const fs = require('fs');
const path = require('path');

const AK = process.env.BAIDU_MAP_AK;
if (!AK) {
  console.error('错误：未配置 BAIDU_MAP_AK，请在 server/.env 中添加');
  process.exit(1);
}

// ==================== 城市列表（100+ 城市，覆盖全部省份） ====================
const CITIES = [
  // 直辖市
  '北京市', '上海市', '天津市', '重庆市',
  // 广东
  '广州市', '深圳市', '珠海市', '东莞市', '佛山市', '惠州市', '中山市', '汕头市', '湛江市',
  // 江苏
  '南京市', '苏州市', '无锡市', '常州市', '南通市', '扬州市', '徐州市',
  // 浙江
  '杭州市', '宁波市', '温州市', '绍兴市', '嘉兴市', '金华市', '台州市',
  // 山东
  '济南市', '青岛市', '烟台市', '威海市', '潍坊市', '淄博市',
  // 四川
  '成都市', '绵阳市', '乐山市', '泸州市', '宜宾市',
  // 湖北
  '武汉市', '宜昌市', '襄阳市', '十堰市',
  // 湖南
  '长沙市', '张家界市', '岳阳市', '衡阳市',
  // 河南
  '郑州市', '洛阳市', '开封市', '南阳市',
  // 河北
  '石家庄市', '秦皇岛市', '唐山市', '承德市', '保定市',
  // 福建
  '福州市', '厦门市', '泉州市', '漳州市',
  // 辽宁
  '沈阳市', '大连市', '鞍山市',
  // 吉林
  '长春市', '吉林市', '延吉市',
  // 黑龙江
  '哈尔滨市', '牡丹江市', '齐齐哈尔市',
  // 安徽
  '合肥市', '黄山市', '芜湖市', '安庆市',
  // 江西
  '南昌市', '九江市', '景德镇市', '上饶市',
  // 陕西
  '西安市', '延安市', '宝鸡市', '咸阳市',
  // 云南
  '昆明市', '大理白族自治州', '丽江市', '西双版纳傣族自治州', '腾冲市',
  // 贵州
  '贵阳市', '遵义市', '安顺市',
  // 广西
  '南宁市', '桂林市', '北海市', '柳州市',
  // 海南
  '海口市', '三亚市', '万宁市', '琼海市',
  // 甘肃
  '兰州市', '敦煌市', '张掖市', '嘉峪关市',
  // 山西
  '太原市', '大同市', '平遥县', '运城市',
  // 内蒙古
  '呼和浩特市', '包头市', '呼伦贝尔市', '鄂尔多斯市',
  // 新疆
  '乌鲁木齐市', '吐鲁番市', '喀什市', '伊宁市',
  // 西藏
  '拉萨市', '日喀则市', '林芝市',
  // 青海
  '西宁市', '海东市',
  // 宁夏
  '银川市', '中卫市',
  // 港澳
  '香港特别行政区', '澳门特别行政区'
];

// 多关键词搜索，最大化数据覆盖
const QUERY_KEYWORDS = ['酒店', '宾馆', '民宿', '客栈', '度假村'];

const PAGES_PER_QUERY = 5;   // 每个关键词采集页数（每页20条）
const DELAY_MS = 400;         // 请求间隔（毫秒）

// ==================== 文件路径 ====================
const RAW_FILE = path.join(__dirname, '..', 'data', 'hotels_raw.json');
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'fetch_progress.json');

// ==================== 工具函数 ====================
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadRawData() {
  try {
    return JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  } catch { return []; }
}

function saveRawData(data) {
  fs.writeFileSync(RAW_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch { return { completed: {}, totalRequests: 0, startedAt: new Date().toISOString() }; }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

// ==================== 主采集逻辑 ====================
async function fetchPage(city, keyword, pageNum) {
  const url = `https://api.map.baidu.com/place/v2/search?` +
    `query=${encodeURIComponent(keyword)}` +
    `&region=${encodeURIComponent(city)}` +
    `&output=json&ak=${AK}` +
    `&page_size=20&page_num=${pageNum}` +
    `&scope=2`;  // scope=2 返回详细信息

  const json = await httpGet(url);
  return json;
}

async function main() {
  const isResume = process.argv.includes('--resume');
  const isTest = process.argv.includes('--test');

  const cities = isTest ? CITIES.slice(0, 3) : CITIES;

  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  全国真实酒店原始数据采集（百度地图 Place API） ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(`AK: ${AK.slice(0, 6)}...${AK.slice(-4)}`);
  console.log(`城市: ${cities.length} 个`);
  console.log(`关键词: ${QUERY_KEYWORDS.join('、')}（${QUERY_KEYWORDS.length} 个）`);
  console.log(`每关键词页数: ${PAGES_PER_QUERY}（每页20条）`);
  console.log(`理论最大请求: ${cities.length * QUERY_KEYWORDS.length * PAGES_PER_QUERY} 次`);
  console.log(`模式: ${isResume ? '断点续采' : isTest ? '测试模式' : '全量采集'}`);
  console.log('');

  let rawData = loadRawData();
  let progress = isResume ? loadProgress() : { completed: {}, totalRequests: 0, startedAt: new Date().toISOString() };

  // 建立已有数据的去重索引
  const seen = new Set();
  for (const h of rawData) {
    seen.add(h._dedup_key || `${h.name}_${h.city}`);
  }

  let requestCount = 0;
  let newCount = 0;
  let quotaExhausted = false;

  for (let ci = 0; ci < cities.length; ci++) {
    const city = cities[ci];

    for (const keyword of QUERY_KEYWORDS) {
      const taskKey = `${city}__${keyword}`;

      if (progress.completed[taskKey]) {
        continue; // 已完成，跳过
      }

      let taskResults = 0;
      let emptyPages = 0;

      for (let page = 0; page < PAGES_PER_QUERY; page++) {
        try {
          const json = await fetchPage(city, keyword, page);
          requestCount++;
          progress.totalRequests++;

          // 配额耗尽检测
          if (json.status === 302 || json.status === 401 || json.status === 4) {
            console.warn(`\n⚠ API 配额耗尽或权限不足 (status=${json.status}: ${json.message || ''})`);
            console.warn('已采集数据已保存，明天使用 --resume 继续。');
            quotaExhausted = true;
            break;
          }

          if (json.status !== 0) {
            console.warn(`  ⚠ [${city}][${keyword}] 页${page}: status=${json.status} ${json.message || ''}`);
            emptyPages++;
            if (emptyPages >= 2) break;
            await sleep(DELAY_MS);
            continue;
          }

          if (!json.results || json.results.length === 0) {
            emptyPages++;
            if (emptyPages >= 2) break;
            await sleep(DELAY_MS);
            continue;
          }

          for (const item of json.results) {
            const dedupKey = item.uid || `${item.name}_${city}`;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);

            // 保存完整原始数据，不做任何加工
            rawData.push({
              _dedup_key: dedupKey,
              _fetch_city: city,
              _fetch_keyword: keyword,
              _fetch_time: new Date().toISOString(),
              // 百度 API 原始字段
              uid: item.uid || '',
              name: item.name || '',
              address: item.address || '',
              province: item.province || '',
              city: item.city || city,
              area: item.area || '',
              telephone: item.telephone || '',
              location: item.location || {},
              detail: item.detail || 0,
              // scope=2 详细信息
              detail_info: item.detail_info || {},
              // 完整原始对象备份
              _raw: item
            });
            newCount++;
            taskResults++;
          }

          process.stdout.write(`\r  [${ci + 1}/${cities.length}] ${city} | ${keyword} | 页${page} | 本轮新增${taskResults} | 总计${rawData.length} | 请求${requestCount}`);

        } catch (e) {
          console.warn(`\n  ✖ [${city}][${keyword}] 页${page}: ${e.message}`);
        }

        await sleep(DELAY_MS);
      }

      if (quotaExhausted) break;

      // 标记该 city+keyword 组合已完成
      progress.completed[taskKey] = {
        count: taskResults,
        finishedAt: new Date().toISOString()
      };

      // 每完成一个 city+keyword 组合就保存，防丢失
      if (requestCount % 10 === 0 || taskResults > 0) {
        saveRawData(rawData);
        saveProgress(progress);
      }
    }

    if (quotaExhausted) break;

    // 每完成一个城市打印换行
    process.stdout.write('\n');
  }

  // 最终保存
  saveRawData(rawData);
  saveProgress(progress);

  // 统计
  const completedTasks = Object.keys(progress.completed).length;
  const totalTasks = cities.length * QUERY_KEYWORDS.length;

  console.log('\n');
  console.log('═══════════════ 采集结果 ═══════════════');
  console.log(`总酒店数据:   ${rawData.length} 条（去重后）`);
  console.log(`本次新增:     ${newCount} 条`);
  console.log(`本次请求:     ${requestCount} 次`);
  console.log(`累计请求:     ${progress.totalRequests} 次`);
  console.log(`任务进度:     ${completedTasks}/${totalTasks}（${(completedTasks / totalTasks * 100).toFixed(1)}%）`);
  console.log(`输出文件:     ${RAW_FILE}`);
  console.log(`进度文件:     ${PROGRESS_FILE}`);

  if (quotaExhausted) {
    console.log('\n⚠ 配额耗尽，明天运行以下命令继续：');
    console.log('  node scripts/fetch-real-hotels.js --resume');
  } else if (completedTasks >= totalTasks) {
    console.log('\n✅ 全部城市采集完成！');
    console.log('后续步骤：');
    console.log('  1. 查看原始数据: data/hotels_raw.json');
    console.log('  2. 自行编写数据清洗脚本，或运行:');
    console.log('     node scripts/clean-and-import.js');
  }
}

main().catch(e => {
  console.error('脚本执行失败:', e);
  process.exit(1);
});
