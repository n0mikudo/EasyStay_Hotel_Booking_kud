/**
 * 易宿酒店预订平台 - 后端服务
 * 
 * 技术栈：Node.js + Express
 * 数据存储：JSON文件
 * 
 * 主要功能：
 * 1. 酒店CRUD操作（增删改查）
 * 2. 酒店审核流程（待审核/已通过/已拒绝）
 * 3. 数据统计分析
 * 4. 搜索筛选功能
 * 
 * @author 前端训练营第五期学员
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const openapi = require('./openapi');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(compression());
app.use(cors());
app.use(bodyParser.json());

// API 文档（Swagger UI）
app.get('/api-docs.json', (req, res) => {
  res.json(openapi);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: '易宿酒店预订平台 API 文档',
  swaggerOptions: { docExpansion: 'none', defaultModelsExpandDepth: 1 },
}));

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'hotels.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const INVITE_CODES_FILE = path.join(__dirname, 'data', 'invite_codes.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'system_config.json');
const LOGS_FILE = path.join(__dirname, 'data', 'system_logs.json');
const CLIENT_USERS_FILE = path.join(__dirname, 'data', 'client_users.json');
const CHAT_SESSIONS_FILE = path.join(__dirname, 'data', 'chat_sessions.json');

/**
 * 初始化数据文件
 * 如果数据目录或文件不存在，则自动创建
 */
const initDataFile = () => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(INVITE_CODES_FILE)) {
    const seedCode = {
      code: 'EASYSTAY-ADMIN-2024',
      createdBy: 'system',
      used: false,
      usedAt: null,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify([seedCode], null, 2));
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
      systemName: '易宿酒店预订平台',
      systemDescription: '专业的酒店预订管理系统',
      enableRegistration: true,
      enableAudit: true,
      updatedAt: new Date().toISOString()
    }, null, 2));
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CLIENT_USERS_FILE)) {
    fs.writeFileSync(CLIENT_USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CHAT_SESSIONS_FILE)) {
    fs.writeFileSync(CHAT_SESSIONS_FILE, JSON.stringify([], null, 2));
  }
};

initDataFile();

// ==================== 内存缓存层 ====================
// 所有数据在内存中维护，读操作 ~0ms；写操作更新内存后异步落盘，合并高频写入

/**
 * 系统配置读写
 */
const readConfig = () => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {
    console.error('读取配置失败:', e);
    return null;
  }
};

const writeConfig = (config) => {
  try {
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('写入配置失败:', e);
    return false;
  }
};

/**
 * 系统日志
 */
const appendLog = (action, detail, userId, userRole) => {
  try {
    let logs = [];
    if (fs.existsSync(LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    }
    logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      action,
      detail,
      userId: userId || 'anonymous',
      userRole: userRole || '-',
      createdAt: new Date().toISOString()
    });
    if (logs.length > 500) logs = logs.slice(0, 500);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('写入日志失败:', e);
  }
};

const readLogs = (limit = 100) => {
  try {
    if (!fs.existsSync(LOGS_FILE)) return [];
    const logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    return logs.slice(0, limit);
  } catch (e) {
    console.error('读取日志失败:', e);
    return [];
  }
};

/**
 * 读取邀请码（确保始终返回数组）
 */
const readInviteCodes = () => {
  try {
    if (!fs.existsSync(INVITE_CODES_FILE)) return [];
    const data = fs.readFileSync(INVITE_CODES_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('读取邀请码失败:', error);
    return [];
  }
};

/**
 * 写入邀请码
 */
const writeInviteCodes = (codes) => {
  try {
    fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify(codes, null, 2));
    return true;
  } catch (error) {
    console.error('写入邀请码失败:', error);
    return false;
  }
};

/**
 * 生成随机邀请码（8位字母数字）
 */
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==================== 内存缓存层 ====================
// 所有数据在内存中维护，读操作 ~0ms；写操作更新内存后异步落盘，合并高频写入

const _cache = {
  hotels: null,
  users: null,
  messages: null,
  bookings: null,
  clientUsers: null,
  chatSessions: null
};

const _writePending = {};

function _scheduleFlush(key, filePath, serialize) {
  if (_writePending[key]) return;
  _writePending[key] = true;
  setImmediate(() => {
    _writePending[key] = false;
    const data = _cache[key];
    if (data === null) return;
    try {
      const json = serialize ? serialize(data) : JSON.stringify(data, null, 2);
      fs.writeFile(filePath, json, (err) => {
        if (err) console.error(`写入 ${key} 失败:`, err);
      });
    } catch (e) {
      console.error(`序列化 ${key} 失败:`, e);
    }
  });
}

const readHotels = () => {
  if (_cache.hotels) return _cache.hotels;
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    _cache.hotels = JSON.parse(data);
  } catch (error) {
    console.error('读取酒店数据失败:', error);
    _cache.hotels = [];
  }
  return _cache.hotels;
};

const writeHotels = (hotels) => {
  _cache.hotels = hotels;
  _scheduleFlush('hotels', DATA_FILE);
  rebuildAiIndex();
};

const readUsers = () => {
  if (_cache.users) return _cache.users;
  try {
    if (!fs.existsSync(USERS_FILE)) return (_cache.users = []);
    const parsed = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    _cache.users = parsed.users || [];
  } catch (error) {
    console.error('读取用户数据失败:', error);
    _cache.users = [];
  }
  return _cache.users;
};

const writeUsers = (users) => {
  _cache.users = users;
  _scheduleFlush('users', USERS_FILE, (d) => JSON.stringify({ users: d }, null, 2));
  return true;
};

const readMessages = () => {
  if (_cache.messages) return _cache.messages;
  try {
    if (!fs.existsSync(MESSAGES_FILE)) return (_cache.messages = []);
    _cache.messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  } catch (error) {
    console.error('读取消息数据失败:', error);
    _cache.messages = [];
  }
  return _cache.messages;
};

const writeMessages = (messages) => {
  _cache.messages = messages;
  _scheduleFlush('messages', MESSAGES_FILE);
  return true;
};

const readBookings = () => {
  if (_cache.bookings) return _cache.bookings;
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) return (_cache.bookings = []);
    _cache.bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
  } catch (error) {
    console.error('读取预订数据失败:', error);
    _cache.bookings = [];
  }
  return _cache.bookings;
};

const writeBookings = (bookings) => {
  _cache.bookings = bookings;
  _scheduleFlush('bookings', BOOKINGS_FILE);
  return true;
};

const readClientUsers = () => {
  if (_cache.clientUsers) return _cache.clientUsers;
  try {
    if (!fs.existsSync(CLIENT_USERS_FILE)) return (_cache.clientUsers = []);
    _cache.clientUsers = JSON.parse(fs.readFileSync(CLIENT_USERS_FILE, 'utf8'));
  } catch (error) {
    console.error('读取客户端用户数据失败:', error);
    _cache.clientUsers = [];
  }
  return _cache.clientUsers;
};

const writeClientUsers = (users) => {
  _cache.clientUsers = users;
  _scheduleFlush('clientUsers', CLIENT_USERS_FILE);
  return true;
};

const readChatSessions = () => {
  if (_cache.chatSessions) return _cache.chatSessions;
  try {
    if (!fs.existsSync(CHAT_SESSIONS_FILE)) return (_cache.chatSessions = []);
    _cache.chatSessions = JSON.parse(fs.readFileSync(CHAT_SESSIONS_FILE, 'utf8'));
  } catch (error) {
    console.error('读取聊天会话数据失败:', error);
    _cache.chatSessions = [];
  }
  return _cache.chatSessions;
};

const writeChatSessions = (sessions) => {
  _cache.chatSessions = sessions;
  _scheduleFlush('chatSessions', CHAT_SESSIONS_FILE);
  return true;
};

// 启动预热：服务启动时将所有数据加载到内存
const warmUpCache = () => {
  const t = Date.now();
  readHotels();
  readUsers();
  readMessages();
  readBookings();
  readClientUsers();
  readChatSessions();
  console.log(`缓存预热完成: hotels=${_cache.hotels.length}, users=${_cache.users.length}, messages=${_cache.messages.length}, bookings=${_cache.bookings.length}, clientUsers=${_cache.clientUsers.length}, chatSessions=${_cache.chatSessions.length} (${Date.now() - t}ms)`);
};

warmUpCache();

// AI 搜索索引：城市 -> 已审核酒店列表（按评分预排序）
let _aiCityIndex = new Map();
let _aiApprovedByRating = [];

function rebuildAiIndex() {
  const t = Date.now();
  const approved = readHotels().filter(h => h.status === 'approved');
  approved.sort((a, b) => parseFloat(b.baiduOverallRating || 0) - parseFloat(a.baiduOverallRating || 0));
  _aiApprovedByRating = approved;

  _aiCityIndex = new Map();
  for (const h of approved) {
    const city = (h.city || '').trim();
    if (!city) continue;
    if (!_aiCityIndex.has(city)) _aiCityIndex.set(city, []);
    _aiCityIndex.get(city).push(h);
  }
  console.log(`AI搜索索引构建完成: ${approved.length}条已审核酒店, ${_aiCityIndex.size}个城市 (${Date.now() - t}ms)`);
}

rebuildAiIndex();

const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateMessageId = () => {
  return 'message_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateBookingId = () => {
  return 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const createMessage = (title, content, recipientRole, recipientId = null, opts = {}) => {
  const message = {
    id: generateMessageId(),
    title,
    content,
    recipientRole,
    recipientId,
    read: recipientRole === 'merchant' ? false : undefined,
    readBy: recipientRole === 'admin' ? {} : undefined,
    processed: opts.needProcess ? false : undefined,
    needProcess: opts.needProcess || false,
    processedBy: null,
    processedAt: null,
    actionType: opts.actionType || null,
    linkTo: opts.linkTo || null,
    targetHotelId: opts.targetHotelId || null,
    targetMerchantId: opts.targetMerchantId || null,
    createdAt: new Date().toISOString()
  };
  const messages = readMessages();
  messages.push(message);
  writeMessages(messages);
  return message;
};

/**
 * 生成唯一ID
 * @returns {string} 时间戳格式的ID
 */
const generateId = () => {
  return Date.now().toString();
};

/**
 * 验证酒店数据
 * @param {Object} hotel - 酒店数据
 * @returns {Object} 验证结果 {valid: boolean, message: string}
 */
const ROOM_TYPE_LINE_REGEX = /^(.+):\s*(\d+(?:\.\d+)?)$/;

function parseAndValidateRoomTypes(str) {
  if (!str || typeof str !== 'string') return { valid: false, roomTypes: [], message: '房型信息不能为空' };
  const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
  const roomTypes = [];
  for (const line of lines) {
    const pipeIdx = line.indexOf('|');
    const mainPart = pipeIdx >= 0 ? line.slice(0, pipeIdx).trim() : line;
    const description = pipeIdx >= 0 ? line.slice(pipeIdx + 1).trim() : '';
    const m = mainPart.match(ROOM_TYPE_LINE_REGEX);
    if (m) {
      const name = m[1].trim();
      const price = parseFloat(m[2]);
      if (name && price > 0) {
        roomTypes.push({ name, price, description: description || undefined });
      }
    }
  }
  if (roomTypes.length === 0) return { valid: false, roomTypes: [], message: '至少需要一个有效房型，格式：房型名称:价格（如 标准间:299）' };
  const invalidCount = lines.length - roomTypes.length;
  if (invalidCount > 0) return { valid: false, roomTypes: [], message: `有${invalidCount}行格式无效，每行须为「房型名称:价格」` };
  return { valid: true, roomTypes, message: '' };
}

const validateHotel = (hotel) => {
  if (!hotel.name || hotel.name.trim() === '') {
    return { valid: false, message: '酒店名称不能为空' };
  }
  if (!hotel.city || hotel.city.trim() === '') {
    return { valid: false, message: '城市不能为空' };
  }
  if (!hotel.address || hotel.address.trim() === '') {
    return { valid: false, message: '地址不能为空' };
  }
  if (!hotel.description || hotel.description.trim() === '') {
    return { valid: false, message: '酒店介绍不能为空' };
  }
  if (!hotel.rating || hotel.rating < 1 || hotel.rating > 5) {
    return { valid: false, message: '请选择有效的酒店星级' };
  }
  if (!hotel.phone || hotel.phone.trim() === '') {
    return { valid: false, message: '联系电话不能为空' };
  }
  const rtResult = parseAndValidateRoomTypes(hotel.roomTypesStr);
  if (!rtResult.valid) {
    return { valid: false, message: rtResult.message };
  }
  return { valid: true, message: '' };
};

// ==================== API路由 ====================

/**
 * 获取酒店列表
 * 支持筛选：状态、关键词
 * 支持排序：按创建时间、价格
 * 
 * GET /api/hotels?status=approved&keyword=北京&sortBy=price&order=asc
 */
app.get('/api/hotels', (req, res) => {
  try {
    const hotels = readHotels();
    const { status, keyword, sortBy = 'createdAt', order = 'desc', userId, role, city, star, price, tags, page = 1, limit } = req.query;
    
    let filteredHotels = hotels;

    if (role === 'merchant' && !userId) {
      return res.status(400).json({
        success: false,
        message: '商户查询酒店时必须提供 userId'
      });
    }
    
    // 按用户ID筛选（商户只能看到自己的酒店）
    if (userId) {
      filteredHotels = filteredHotels.filter(h => String(h.userId || '') === String(userId));
    }
    
    // 按状态筛选（支持逗号分隔多状态，如 status=approved,offline）
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        filteredHotels = filteredHotels.filter(h => h.status === statuses[0]);
      } else if (statuses.length > 1) {
        const statusSet = new Set(statuses);
        filteredHotels = filteredHotels.filter(h => statusSet.has(h.status));
      }
    }
    
    // 按城市筛选
    if (city && city.trim()) {
      filteredHotels = filteredHotels.filter(h => 
        (h.city && h.city.includes(city)) || (h.address && h.address.includes(city))
      );
    }
    
    // 按星级筛选
    if (star && star !== '') {
      const starNum = parseInt(star);
      filteredHotels = filteredHotels.filter(h => (h.rating || 0) >= starNum);
    }
    
    // 按价格区间筛选
    if (price && price !== '') {
      if (price === '0-200') {
        filteredHotels = filteredHotels.filter(h => (h.price || 0) < 200);
      } else if (price === '200-500') {
        filteredHotels = filteredHotels.filter(h => (h.price || 0) >= 200 && (h.price || 0) < 500);
      } else if (price === '500-1000') {
        filteredHotels = filteredHotels.filter(h => (h.price || 0) >= 500 && (h.price || 0) < 1000);
      } else if (price === '1000+') {
        filteredHotels = filteredHotels.filter(h => (h.price || 0) >= 1000);
      }
    }
    
    // 按快捷标签筛选（模糊匹配：tags、amenities、description 任一包含关键词即可）
    if (tags && tags.trim()) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        const tagMap = { family: '亲子', luxury: '豪华', parking: '停车', breakfast: '早餐', seaview: '海景', center: '市中心', subway: '地铁', popular: '网红' };
        filteredHotels = filteredHotels.filter(h => {
          const hTags = (h.tags || []).map(String);
          const hAmenities = (h.amenities || []).map(String);
          const hDesc = (h.description || '').toString();
          const matchOne = (keyword) => {
            const kw = (tagMap[keyword] || keyword).trim();
            if (!kw) return true;
            const inTags = hTags.some(t => t.includes(kw) || kw.includes(t));
            const inAmenities = hAmenities.some(a => a.includes(kw) || kw.includes(a));
            const inDesc = hDesc.includes(kw);
            return inTags || inAmenities || inDesc;
          };
          return tagList.every(tag => matchOne(tag));
        });
      }
    }
    
    // 智能关键词搜索：同义词扩展 + 语义优先（设施/标签优先于名称）
    if (keyword && keyword.trim()) {
      const raw = keyword.trim();
      const KEYWORD_SYNONYMS = {
        '停车场': ['停车', '免费停车', '停车场', '收费停车', '代客泊车'],
        '停车': ['停车', '免费停车', '收费停车', '代客泊车'],
        '充电': ['充电', '充电桩', '新能源充电桩'],
        '海景': ['海景', '海景房', '景观'],
        '海景房': ['海景', '海景房'],
        '海': ['海景', '海景房'],
        '早餐': ['早餐', '含早餐', '自助早餐', '餐厅'],
        '含早': ['含早餐', '自助早餐', '早餐'],
        '地铁': ['地铁', '近地铁'],
        '机场': ['机场', '近机场', '机场接送', '机场附近'],
        '景区': ['景区', '近景区'],
        '亲子': ['亲子', '亲子游', '儿童', '儿童乐园', '儿童泳池'],
        '儿童': ['儿童', '儿童乐园', '亲子', '亲子游', '儿童泳池'],
        '泳池': ['泳池', '游泳池', '室内泳池', '室外泳池', '无边泳池', '儿童泳池'],
        '游泳': ['游泳', '游泳池', '室内泳池', '室外泳池', '无边泳池'],
        '健身': ['健身', '健身房'],
        'wifi': ['wifi', '免费wifi', '免费WiFi'],
        '免费wifi': ['wifi', '免费wifi', '免费WiFi'],
        '浴缸': ['浴缸', '浴室', '浴袍'],
        '温泉': ['温泉', '泡温泉', '温泉池', '露天温泉'],
        '接送': ['接送', '机场接送', '接送服务'],
        '棋牌': ['棋牌', '棋牌室', '麻将'],
        '茶': ['茶室', '大堂茶饮', '茶'],
        '阅读': ['阅读', '阅读空间', '书吧'],
        '厨房': ['厨房', '共享厨房', '自助厨房'],
        '酒廊': ['酒廊', '行政酒廊'],
        '网红': ['网红', '网红打卡'],
        '花园': ['花园', '露台', '花园/露台'],
        '安静': ['安静', '安静舒适', '隔音', '隔音客房'],
        '隔音': ['隔音', '隔音客房', '安静'],
        '夜景': ['夜景', '夜景绝佳'],
        '设计师': ['设计师', '设计师酒店'],
        '商务': ['商务', '商务出行', '商务中心', '会议室'],
        '会议': ['会议', '会议室', '会议会展', '多功能厅'],
        'SPA': ['SPA', 'SPA水疗', '水疗'],
        '水疗': ['水疗', 'SPA水疗', 'SPA'],
        '管家': ['管家', '管家服务'],
        '民宿': ['民宿', '温馨民宿', '民宿客栈'],
        '度假': ['度假', '度假村', '休闲度假'],
        '情侣': ['情侣', '情侣蜜月'],
        '酒吧': ['酒吧', '大堂吧', '天台酒吧'],
        '咖啡': ['咖啡', '咖啡厅'],
        '瑜伽': ['瑜伽', '瑜伽室'],
        'KTV': ['KTV', '棋牌室'],
        '洗衣': ['洗衣', '洗衣服务'],
        '湖景': ['湖景', '湖'],
        '山景': ['山景', '山'],
        '江景': ['江景', '江']
      };
      const expand = (kw) => {
        const keys = Object.keys(KEYWORD_SYNONYMS).sort((a, b) => b.length - a.length);
        const k = keys.find(x => kw.includes(x) || x.includes(kw));
        return k ? [kw, ...KEYWORD_SYNONYMS[k]].filter((v, i, a) => a.indexOf(v) === i) : [kw];
      };
      const terms = expand(raw);
      const shortAmbiguous = raw.length <= 2 && ['海', '中', '北', '上'].includes(raw);
      filteredHotels = filteredHotels.filter(h => {
        const inTags = (h.tags || []).some(t => terms.some(term => String(t).includes(term) || term.includes(String(t))));
        const inAmenities = (h.amenities || []).some(a => terms.some(term => String(a).includes(term) || term.includes(String(a))));
        const inDesc = terms.some(term => (h.description || '').includes(term));
        const inCity = terms.some(term => (h.city || '').toLowerCase().includes(term.toLowerCase()));
        const inAddress = terms.some(term => (h.address || '').includes(term));
        const inName = !shortAmbiguous && terms.some(term => (h.name || '').toLowerCase().includes(term.toLowerCase()));
        return inTags || inAmenities || inDesc || inCity || inAddress || inName;
      });
    }
    
    // 排除已归档的审核条目
    if (req.query.excludeAuditArchived === 'true') {
      filteredHotels = filteredHotels.filter(h => !h.auditArchived);
    }

    // 审核列表专用搜索（按字段精确匹配）
    const { searchType, searchValue } = req.query;
    if (searchValue && searchValue.trim() && searchType) {
      const sv = searchValue.trim().toLowerCase();
      switch (searchType) {
        case 'name':
          filteredHotels = filteredHotels.filter(h => (h.name || '').toLowerCase().includes(sv));
          break;
        case 'city':
          filteredHotels = filteredHotels.filter(h => (h.city || '').toLowerCase().includes(sv));
          break;
        case 'auditBy':
          filteredHotels = filteredHotels.filter(h => {
            const ab = h.auditBy || ((h.status === 'approved' || h.status === 'rejected') ? '系统管理员' : '');
            return ab.toLowerCase().includes(sv);
          });
          break;
        case 'owner': {
          const allUsers = readUsers();
          const userMap = {};
          allUsers.forEach(u => { userMap[u.id] = u; });
          filteredHotels = filteredHotels.filter(h => {
            const u = userMap[h.userId];
            return u && ((u.name || '').toLowerCase().includes(sv) || (u.username || '').toLowerCase().includes(sv));
          });
          break;
        }
        default:
          break;
      }
    }

    // 排序：支持 sort 参数 (default|price_asc|price_desc|rating)
    const sortParam = req.query.sort || sortBy;
    if (sortParam === 'price_asc' || (sortParam === 'default' && req.query.sort === 'price_asc')) {
      filteredHotels.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortParam === 'price_desc') {
      filteredHotels.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortParam === 'rating') {
      filteredHotels.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      filteredHotels.sort((a, b) => {
        let aVal = a[sortBy] || a.createdAt;
        let bVal = b[sortBy] || b.createdAt;
        if (order === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }
    
    const total = filteredHotels.length;
    
    // 分页
    let resultHotels = filteredHotels;
    if (limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const start = (pageNum - 1) * limitNum;
      resultHotels = filteredHotels.slice(start, start + limitNum);
    }
    
    const BRIEF_FIELDS = ['id','name','city','province','district','address','description','price','rating','status','createdAt','updatedAt','userId','auditBy','auditAt','auditArchived','phone'];
    const outputHotels = req.query.brief === 'true'
      ? resultHotels.map(h => {
          const o = {};
          for (const k of BRIEF_FIELDS) if (h[k] !== undefined) o[k] = h[k];
          return o;
        })
      : resultHotels;

    res.json({
      success: true,
      data: outputHotels,
      count: total,
      total: total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取酒店列表失败',
      error: error.message
    });
  }
});

/**
 * 获取热门筛选标签（从实际酒店数据中统计，保证可匹配）
 * GET /api/hotels/hot-tags?limit=8
 */
app.get('/api/hotels/hot-tags', (req, res) => {
  try {
    const hotels = readHotels().filter(h => h.status === 'approved');
    const count = {};
    for (const h of hotels) {
      for (const t of (h.tags || [])) {
        if (t && String(t).trim()) count[t] = (count[t] || 0) + 1;
      }
      for (const a of (h.amenities || [])) {
        if (a && String(a).trim()) count[a] = (count[a] || 0) + 1;
      }
    }
    const totalHotels = hotels.length;
    const BASIC_EXCLUDE = new Set([
      '免费WiFi', '空调', '暖气', '有线电视', '电热水壶', '独立卫浴',
      '吹风机', '一次性洗漱用品', '拖鞋', '衣架', '书桌', '穿衣镜',
      '电梯', '行李寄存', '遮光窗帘', '每日客房清洁', '浴袍',
      '24小时前台', '叫醒服务'
    ]);
    const limit = Math.min(20, Math.max(6, parseInt(req.query.limit) || 8));
    const tags = Object.entries(count)
      .filter(([label, v]) => !BASIC_EXCLUDE.has(label) && v < totalHotels * 0.8)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label]) => ({ label, value: label }));
    res.json({ success: true, data: tags });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * 获取酒店详情
 * GET /api/hotels/:id
 */
app.get('/api/hotels/:id', (req, res) => {
  try {
    const hotels = readHotels();
    const hotel = hotels.find(h => h.id === req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }
    
    // 检查用户权限（商户只能查看自己的酒店）
    const { userId } = req.query;
    if (userId && hotel.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问该酒店信息'
      });
    }
    
    const baseScore = parseFloat(hotel.baiduOverallRating) || hotel.rating || 3.0;
    const hash = (hotel.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const clamp = (v) => +(Math.max(1, Math.min(5, v))).toFixed(1);
    const enriched = {
      ...hotel,
      scores: {
        environment: clamp(baseScore + ((hash % 7 - 3) * 0.1)),
        service:     clamp(baseScore + ((hash % 11 - 5) * 0.08)),
        facility:    clamp(baseScore + ((hash % 13 - 6) * 0.12))
      },
      baiduRating: hotel.baiduOverallRating ? parseFloat(hotel.baiduOverallRating) : null,
      commentCount: hotel.baiduCommentNum ? parseInt(hotel.baiduCommentNum, 10) : null
    };

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取酒店详情失败',
      error: error.message
    });
  }
});

/**
 * 添加新酒店
 * POST /api/hotels
 * 默认状态为 pending（待审核）
 */
app.post('/api/hotels', (req, res) => {
  try {
    console.log('收到的酒店数据:', req.body);
    console.log('req.body.rating:', req.body.rating);
    console.log('req.body.phone:', req.body.phone);
    const hotels = readHotels();
    
    // 验证数据
    const validation = validateHotel(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    const rtResult = parseAndValidateRoomTypes(req.body.roomTypesStr);
    if (!rtResult.valid) {
      return res.status(400).json({
        success: false,
        message: rtResult.message
      });
    }
    const roomTypes = rtResult.roomTypes;
    const minPrice = Math.min(...roomTypes.map(rt => rt.price));

    const newHotel = {
      id: generateId(),
      userId: req.body.userId,
      name: req.body.name.trim(),
      nameEn: req.body.nameEn ? req.body.nameEn.trim() : '',
      city: req.body.city.trim(),
      address: req.body.address.trim(),
      description: req.body.description.trim(),
      price: minPrice,
      rating: parseInt(req.body.rating) || 3,
      phone: req.body.phone || '13800138000',
      images: Array.isArray(req.body.images) ? req.body.images : (req.body.images ? String(req.body.images).split(',').map(u => u.trim()).filter(Boolean) : []),
      amenities: req.body.amenities || [],
      roomTypes,
      openDate: req.body.openDate || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('创建的酒店对象:', newHotel);
    
    hotels.push(newHotel);
    writeHotels(hotels);
    createMessage(
      '新酒店待审核',
      `商户新增酒店「${newHotel.name}」，请审核`,
      'admin',
      null,
      { needProcess: true, actionType: 'hotel_add', linkTo: '/admin/audit', targetHotelId: newHotel.id, targetMerchantId: newHotel.userId }
    );
    
    res.status(201).json({
      success: true,
      data: newHotel,
      message: '酒店添加成功，等待审核'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加酒店失败',
      error: error.message
    });
  }
});

/**
 * 更新酒店信息
 * PUT /api/hotels/:id
 */
app.put('/api/hotels/:id', (req, res) => {
  try {
    const hotels = readHotels();
    const index = hotels.findIndex(h => h.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }
    
    // 检查用户权限（商户只能更新自己的酒店）
    const { userId, role } = req.query;
    if (userId && hotels[index].userId !== userId && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权更新该酒店信息'
      });
    }
    
    // 检查是否只更新状态（上线/下线）
    const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.status;
    
    if (role === 'admin' && isOnlyStatusUpdate) {
      // 管理员只更新酒店状态，直接生效
      hotels[index] = {
        ...hotels[index],
        status: req.body.status,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 验证数据
      const validation = validateHotel(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
      
      const rtResult = parseAndValidateRoomTypes(req.body.roomTypesStr);
      if (!rtResult.valid) {
        return res.status(400).json({
          success: false,
          message: rtResult.message
        });
      }
      const roomTypes = rtResult.roomTypes;
      const minPrice = Math.min(...roomTypes.map(rt => rt.price));
      const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? String(req.body.images).split(',').map(u => u.trim()).filter(Boolean) : hotels[index].images || []);

      const updateFields = {
        name: req.body.name.trim(),
        city: req.body.city.trim(),
        address: req.body.address.trim(),
        description: req.body.description.trim(),
        price: minPrice,
        rating: req.body.rating !== undefined && req.body.rating !== null ? parseInt(req.body.rating) : hotels[index].rating,
        phone: req.body.phone !== undefined && req.body.phone !== null ? req.body.phone : hotels[index].phone,
        images,
        amenities: req.body.amenities || [],
        roomTypes,
        openDate: req.body.openDate !== undefined ? req.body.openDate : (hotels[index].openDate || ''),
        updatedAt: new Date().toISOString()
      };

      // 更新酒店信息
      if (role === 'admin') {
        // 管理员更新酒店信息，需要商户确认
        hotels[index] = {
          ...hotels[index],
          ...updateFields,
          status: 'pending_merchant_confirm',
          adminEditData: req.body,
          updatedAt: updateFields.updatedAt
        };
      } else {
        // 商户更新酒店信息
        if (hotels[index].status === 'pending_merchant_confirm') {
          hotels[index] = {
            ...hotels[index],
            ...updateFields,
            status: 'approved',
            adminEditData: undefined,
            updatedAt: updateFields.updatedAt
          };
        } else {
          hotels[index] = {
            ...hotels[index],
            ...updateFields
          };
        }
      }
    }
    
    writeHotels(hotels);
    
    // 生成通知：商户修改酒店信息通知admin（仅告知，无需审核，商户编辑自动通过）
    const users = readUsers();
    const adminUsers = users.filter(u => u.role === 'admin');
    if (adminUsers.length > 0 && role !== 'admin') {
      createMessage(
        '酒店信息已修改',
        `商户修改了酒店信息：${hotels[index].name}`,
        'admin',
        null,
        { needProcess: false, actionType: 'hotel_edit_inform', targetHotelId: hotels[index].id }
      );
    }
    
    // 生成通知：管理员修改酒店信息通知商户
    if (role === 'admin') {
      console.log(`[通知] 管理员修改了酒店信息：${hotels[index].name}`);
      console.log(`[通知] 已通知商户：${hotels[index].userId}`);
      
      // 创建消息通知
      createMessage(
        '酒店信息已被修改',
        `管理员修改了酒店信息：${hotels[index].name}，请确认`,
        'merchant',
        hotels[index].userId,
        { actionType: 'hotel_admin_edit', targetHotelId: hotels[index].id }
      );
    }
    
    res.json({
      success: true,
      data: hotels[index],
      message: role === 'admin' ? '更新成功，等待商户确认' : '酒店更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新酒店失败',
      error: error.message
    });
  }
});

/**
 * 更新酒店审核状态
 * PUT /api/hotels/:id/status
 * 状态：pending(待审核)、approved(已通过)、rejected(已拒绝)
 */
app.put('/api/hotels/:id/status', (req, res) => {
  try {
    const hotels = readHotels();
    const index = hotels.findIndex(h => h.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }
    
    const { status, rejectReason } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'offline'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值，必须是 pending、approved、rejected 或 offline'
      });
    }
    
    const prevStatus = hotels[index].status;
    hotels[index].status = status;
    hotels[index].updatedAt = new Date().toISOString();
    if (status === 'rejected' && rejectReason) {
      hotels[index].rejectReason = rejectReason;
    } else if (status !== 'rejected') {
      delete hotels[index].rejectReason;
    }

    const { adminId, adminUsername } = req.body || {};

    // 记录审核管理员
    if ((status === 'approved' || status === 'rejected') && (prevStatus === 'pending' || prevStatus === 'rejected' || prevStatus === 'approved')) {
      hotels[index].auditBy = adminUsername || '系统管理员';
      hotels[index].auditAt = new Date().toISOString();
    }
    
    writeHotels(hotels);
    
    const hotel = hotels[index];
    const hotelId = hotel.id;

    // 当管理员执行审核操作（通过/拒绝）时，自动标记相关待处理消息为已处理，并记录处理人（仅 hotel_add 需审核）
    if (status === 'approved' || status === 'rejected') {
      const messages = readMessages();
      let changed = false;
      for (const msg of messages) {
        if (msg.needProcess && !msg.processed && String(msg.targetHotelId) === String(hotelId) &&
            msg.actionType === 'hotel_add') {
          msg.processed = true;
          msg.processedBy = adminUsername || '管理员';
          msg.processedByAdminId = adminId || '';
          msg.processedAt = new Date().toISOString();
          changed = true;
        }
      }
      if (changed) writeMessages(messages);
    }
    const merchantId = hotel.userId;
    if (merchantId) {
      if (status === 'approved' && prevStatus === 'pending') {
        createMessage('酒店审核通过', `您的酒店「${hotel.name}」已审核通过并上线`, 'merchant', merchantId, { actionType: 'audit_approve', targetHotelId: hotel.id, linkTo: '/merchant/my-hotels' });
      } else if (status === 'rejected') {
        createMessage('酒店审核拒绝', `您的酒店「${hotel.name}」未通过审核${rejectReason ? '：' + rejectReason : ''}`, 'merchant', merchantId, { actionType: 'audit_reject', targetHotelId: hotel.id, linkTo: '/merchant/my-hotels' });
      } else if (status === 'offline') {
        createMessage('酒店已下线', `您的酒店「${hotel.name}」已被管理员下线`, 'merchant', merchantId, { actionType: 'hotel_offline', targetHotelId: hotel.id, linkTo: '/merchant/my-hotels' });
      } else if (status === 'approved' && prevStatus === 'offline') {
        createMessage('酒店已上线', `您的酒店「${hotel.name}」已重新上线`, 'merchant', merchantId, { actionType: 'hotel_online', targetHotelId: hotel.id, linkTo: '/merchant/my-hotels' });
      }
    }
    
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝'
    };
    
    res.json({
      success: true,
      data: hotels[index],
      message: `酒店状态已更新为${statusMap[status]}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
});

/**
 * 删除酒店
 * DELETE /api/hotels/:id
 */
app.delete('/api/hotels/:id', (req, res) => {
  try {
    const hotels = readHotels();
    const index = hotels.findIndex(h => h.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }
    
    // 检查用户权限
    const { userId, role } = req.query;
    if (role === 'admin') {
      if (hotels[index].status !== 'offline') {
        return res.status(400).json({
          success: false,
          message: '请先将酒店下线后再删除'
        });
      }
    } else if (userId) {
      // 商户只能删除自己的酒店
      if (hotels[index].userId !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权删除该酒店信息'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '缺少权限参数'
      });
    }
    
    const deletedHotel = hotels[index];
    const merchantId = deletedHotel.userId;
    if (merchantId) {
      createMessage('酒店已删除', `您的酒店「${deletedHotel.name}」已被管理员删除`, 'merchant', merchantId, { actionType: 'hotel_delete', targetHotelId: deletedHotel.id, linkTo: '/merchant/my-hotels' });
    }
    hotels.splice(index, 1);
    writeHotels(hotels);

    // 若商户名下酒店数为0，记录最后有房时间（即最后一个酒店被删除的时间）
    const remainingCount = hotels.filter(h => h.userId === merchantId).length;
    if (merchantId && remainingCount === 0) {
      const users = readUsers();
      const userIndex = users.findIndex(u => u.id === merchantId);
      if (userIndex !== -1) {
        users[userIndex].lastHotelDeletedAt = new Date().toISOString();
        writeUsers(users);
      }
    }
    
    res.json({
      success: true,
      message: '酒店删除成功',
      data: deletedHotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除酒店失败',
      error: error.message
    });
  }
});

/**
 * Admin更新酒店信息（需要商户确认）
 * PUT /api/hotels/:id/admin
 * @param {string} id - 酒店ID
 * @param {Object} body - 酒店信息
 */
app.put('/api/hotels/:id/admin', (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const hotels = readHotels();
    const users = readUsers();
    
    // 查找酒店
    const hotelIndex = hotels.findIndex(h => h.id === id);
    if (hotelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }
    
    const hotel = hotels[hotelIndex];
    const merchantUser = users.find(u => u.id === hotel.userId);
    
    // 生成通知：admin修改酒店信息需要商户确认
    if (merchantUser) {
      console.log(`[通知] 管理员修改了酒店信息，需要商户确认：${hotel.name}`);
      console.log(`[通知] 已通知商户：${merchantUser.name}`);
    }
    
    // 这里可以添加确认请求的存储逻辑
    // 暂时返回需要确认的状态
    res.json({
      success: true,
      message: '酒店信息已提交，等待商户确认',
      data: {
        ...hotel,
        ...updateData,
        needsConfirmation: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新酒店信息失败',
      error: error.message
    });
  }
});

/**
 * 获取统计数据
 * GET /api/stats
 * 返回酒店总数、各状态数量
 */
app.get('/api/stats', (req, res) => {
  try {
    const hotels = readHotels();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayNewHotels = 0;
    let todayAudits = 0;
    for (const h of hotels) {
      if (new Date(h.createdAt) >= today) todayNewHotels++;
      if (new Date(h.updatedAt) >= today && (h.status === 'approved' || h.status === 'rejected')) todayAudits++;
    }

    const stats = {
      total: hotels.length,
      pending: hotels.filter(h => h.status === 'pending').length,
      approved: hotels.filter(h => h.status === 'approved').length,
      rejected: hotels.filter(h => h.status === 'rejected').length,
      avgPrice: hotels.length > 0 
        ? (hotels.reduce((sum, h) => sum + h.price, 0) / hotels.length).toFixed(2)
        : 0,
      cities: [...new Set(hotels.map(h => h.city))].length,
      todayNewHotels,
      todayAudits
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

/**
 * 获取经营风险预警
 * GET /api/stats/risk-alerts
 */
app.get('/api/stats/risk-alerts', (req, res) => {
  try {
    const hotels = readHotels();
    const bookings = readBookings();
    const users = readUsers();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const range30d = now - 30 * dayMs;
    const range24h = now - dayMs;
    const range72h = now - 3 * dayMs;

    const recentBookedHotelIds = new Set(
      bookings
        .filter(b => {
          const t = new Date(b.createdAt || 0).getTime();
          return Number.isFinite(t) && t >= range30d;
        })
        .map(b => String(b.hotelId))
    );
    const longNoOrderHotels = hotels
      .filter(h => h.status === 'approved' && !recentBookedHotelIds.has(String(h.id)))
      .slice(0, 10)
      .map(h => ({ hotelId: h.id, hotelName: h.name, city: h.city || '未知' }));

    const rejectCountByMerchant = {};
    for (const h of hotels) {
      if (h.status !== 'rejected') continue;
      const t = new Date(h.updatedAt || h.createdAt || 0).getTime();
      if (!Number.isFinite(t) || t < range30d) continue;
      const uid = String(h.userId || '');
      if (!uid) continue;
      rejectCountByMerchant[uid] = (rejectCountByMerchant[uid] || 0) + 1;
    }
    const repeatedRejectedMerchants = Object.entries(rejectCountByMerchant)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, count]) => {
        const u = users.find(x => String(x.id) === uid);
        return {
          merchantId: uid,
          merchantName: u?.name || u?.username || '未知商户',
          rejectCount: count
        };
      });

    let over24hCount = 0;
    let over72hCount = 0;
    const backlogSamples = [];
    for (const h of hotels) {
      if (h.status !== 'pending') continue;
      const t = new Date(h.createdAt || 0).getTime();
      if (!Number.isFinite(t)) continue;
      if (t < range24h) over24hCount++;
      if (t < range72h) over72hCount++;
      if (t < range24h && backlogSamples.length < 10) {
        backlogSamples.push({
          hotelId: h.id,
          hotelName: h.name,
          waitingHours: Math.floor((now - t) / (60 * 60 * 1000))
        });
      }
    }

    const alerts = [
      {
        id: 'long_no_order_hotels',
        title: '长期无订单酒店',
        level: longNoOrderHotels.length > 20 ? 'warning' : 'info',
        count: longNoOrderHotels.length,
        description: '已上线酒店近30天无订单',
        actionRoute: '/admin/hotels',
        items: longNoOrderHotels
      },
      {
        id: 'repeated_reject_merchants',
        title: '连续拒审商户',
        level: repeatedRejectedMerchants.length > 0 ? 'warning' : 'info',
        count: repeatedRejectedMerchants.length,
        description: '近30天被拒审次数 >= 3 的商户',
        actionRoute: '/admin/audit',
        items: repeatedRejectedMerchants
      },
      {
        id: 'pending_backlog',
        title: '待审核积压',
        level: over72hCount > 0 ? 'danger' : (over24hCount > 0 ? 'warning' : 'info'),
        count: over24hCount,
        description: `待审核超过24小时 ${over24hCount} 条，其中超过72小时 ${over72hCount} 条`,
        actionRoute: '/admin/audit',
        items: backlogSamples
      }
    ];

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        alerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取经营风险预警失败',
      error: error.message
    });
  }
});

/**
 * 获取分析报表数据（服务端预计算）
 * GET /api/stats/analytics
 */
app.get('/api/stats/analytics', (req, res) => {
  try {
    const hotels = readHotels();

    const statusCounts = { pending: 0, approved: 0, rejected: 0, offline: 0 };
    const priceRanges = [
      { min: 0, max: 200, name: '¥200以下', count: 0 },
      { min: 200, max: 500, name: '¥200-500', count: 0 },
      { min: 500, max: 1000, name: '¥500-1000', count: 0 },
      { min: 1000, max: Infinity, name: '¥1000+', count: 0 }
    ];
    const cityCount = {};
    let priceSum = 0;

    for (const h of hotels) {
      const s = h.status || 'pending';
      if (statusCounts[s] !== undefined) statusCounts[s]++;

      const p = h.price || 0;
      priceSum += p;
      const r = priceRanges.find(x => p >= x.min && p < x.max);
      if (r) r.count++;

      const c = h.city || '未知';
      cityCount[c] = (cityCount[c] || 0) + 1;
    }

    const cityTop8 = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));

    res.json({
      success: true,
      data: {
        total: hotels.length,
        ...statusCounts,
        avgPrice: hotels.length > 0 ? (priceSum / hotels.length).toFixed(2) : 0,
        cities: Object.keys(cityCount).length,
        priceRanges: priceRanges.map(r => ({ name: r.name, count: r.count })),
        cityTop8
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分析数据失败',
      error: error.message
    });
  }
});

/**
 * 生成管理员邀请码（仅管理员可调用）
 * POST /api/invite-codes
 * body: { adminUserId }
 */
app.post('/api/invite-codes', (req, res) => {
  try {
    const { adminUserId } = req.body;
    if (!adminUserId) {
      return res.status(400).json({
        success: false,
        message: '缺少管理员ID'
      });
    }
    const users = readUsers();
    const admin = users.find(u => u.id === adminUserId && u.role === 'admin');
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: '仅管理员可生成邀请码'
      });
    }
    // 确保 invite_codes.json 存在
    if (!fs.existsSync(INVITE_CODES_FILE)) {
      initDataFile();
    }
    const code = generateInviteCode();
    const codes = readInviteCodes();
    codes.push({
      code,
      createdBy: adminUserId,
      used: false,
      usedAt: null,
      createdAt: new Date().toISOString()
    });
    const written = writeInviteCodes(codes);
    if (!written) {
      return res.status(500).json({
        success: false,
        message: '写入邀请码失败'
      });
    }
    appendLog('GENERATE_INVITE_CODE', `生成邀请码`, adminUserId, 'admin');
    res.json({
      success: true,
      data: { code },
      message: '邀请码已生成，请妥善保管，仅可使用一次'
    });
  } catch (error) {
    console.error('生成邀请码异常:', error);
    res.status(500).json({
      success: false,
      message: '生成邀请码失败',
      error: error.message
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;
    appendLog('LOGIN', `用户 ${username} 登录`, user.id, user.role);
    
    res.json({
      success: true,
      data: userInfo,
      message: '登录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

/**
 * 用户注册
 * POST /api/auth/register
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, role, name, phone, email } = req.body;
    
    // 验证必填字段
    if (!username || !password || !role || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号'
      });
    }
    
    // 验证邮箱格式（如果提供）
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的邮箱地址'
      });
    }
    
    // 验证角色
    if (!['merchant', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色类型'
      });
    }
    
    // 管理员注册需要有效邀请码（来自邀请码池，一次性使用）
    if (role === 'admin') {
      const { inviteCode } = req.body;
      if (!inviteCode || typeof inviteCode !== 'string') {
        return res.status(400).json({
          success: false,
          message: '请输入邀请码'
        });
      }
      const codeInput = inviteCode.trim().toUpperCase();
      const codes = readInviteCodes();
      const idx = codes.findIndex(c => c.code === codeInput && !c.used);
      if (idx === -1) {
        return res.status(400).json({
          success: false,
          message: '邀请码无效或已被使用'
        });
      }
      codes[idx].used = true;
      codes[idx].usedAt = new Date().toISOString();
      writeInviteCodes(codes);
    }
    
    const users = readUsers();
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 创建新用户
    const newUser = {
      id: generateUserId(),
      username: username.trim(),
      password: password,
      role: role,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeUsers(users);
    appendLog('REGISTER', `新用户注册: ${username} (${role})`, newUser.id, role);
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = newUser;
    
    res.status(201).json({
      success: true,
      data: userInfo,
      message: '注册成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
});

/**
 * 归档单条审核条目（从审核列表中移除，不删除酒店）
 * PUT /api/hotels/:id/audit-dismiss
 */
app.put('/api/hotels/:id/audit-dismiss', (req, res) => {
  try {
    const hotels = readHotels();
    const index = hotels.findIndex(h => h.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '酒店不存在' });
    }
    if (hotels[index].status === 'pending') {
      return res.status(400).json({ success: false, message: '待审核酒店不能从审核列表中移除' });
    }
    hotels[index].auditArchived = true;
    writeHotels(hotels);
    res.json({ success: true, message: '已从审核列表移除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
});

/**
 * 批量归档审核条目
 * POST /api/hotels/batch-audit-dismiss
 * body: { ids: [...] }
 */
app.post('/api/hotels/batch-audit-dismiss', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要移除的酒店ID列表' });
    }
    const hotels = readHotels();
    let dismissed = 0;
    let skippedPending = 0;
    const idSet = new Set(ids.map(String));
    for (const h of hotels) {
      if (idSet.has(String(h.id))) {
        if (h.status === 'pending') {
          skippedPending++;
        } else {
          h.auditArchived = true;
          dismissed++;
        }
      }
    }
    writeHotels(hotels);
    res.json({
      success: true,
      data: { dismissed, skippedPending },
      message: `已移除 ${dismissed} 条${skippedPending > 0 ? `，${skippedPending} 条待审核已跳过` : ''}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
});

/**
 * 获取最近活动
 * GET /api/activities
 * 返回最近的酒店相关活动
 */
app.get('/api/activities', (req, res) => {
  try {
    const hotels = readHotels();
    const users = readUsers();
    
    // 生成活动数据
    const activities = [];
    
    // 按更新时间排序酒店
    const sortedHotels = [...hotels].sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    ).slice(0, 10); // 只取最近10条
    
    sortedHotels.forEach(hotel => {
      const merchant = users.find(u => u.id === hotel.userId);
      const merchantName = merchant ? merchant.name : '未知用户';
      
      let action = '';
      let type = '';
      let displayUser = merchantName;
      
      if (hotel.status === 'pending') {
        action = `提交了新酒店「${hotel.name}」`;
        type = 'entry';
      } else if (hotel.status === 'approved') {
        action = `审核通过了酒店「${hotel.name}」`;
        type = 'audit';
        displayUser = hotel.auditBy || '系统管理员';
      } else if (hotel.status === 'rejected') {
        action = `审核拒绝了酒店「${hotel.name}」`;
        type = 'audit';
        displayUser = hotel.auditBy || '系统管理员';
      }
      
      activities.push({
        id: hotel.id,
        type: type,
        action: action,
        time: hotel.updatedAt,
        user: displayUser
      });
    });
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取活动数据失败',
      error: error.message
    });
  }
});

/**
 * 获取用户消息通知
 * GET /api/messages?role=admin&adminId=xxx 或 ?role=merchant&userId=xxx
 */
app.get('/api/messages', (req, res) => {
  try {
    const { role, userId, adminId } = req.query;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: '角色参数不能为空'
      });
    }
    
    const messages = readMessages();
    let userMessages = messages.filter(msg => msg.recipientRole === role);
    
    if (role === 'merchant') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '商户查询消息时必须提供 userId'
        });
      }
      userMessages = userMessages.filter(msg => String(msg.recipientId || '') === String(userId));
    }
    
    if (role === 'admin') {
      userMessages = userMessages.map(msg => {
        const m = { ...msg };
        m.read = (m.readBy && m.readBy[adminId]) || false;
        return m;
      });
    }
    
    userMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: userMessages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取消息通知失败',
      error: error.message
    });
  }
});

/**
 * 标记消息为已读
 * PUT /api/messages/:id/read
 * body: { adminId } 管理员需传，商户不需要
 */
app.put('/api/messages/:id/read', (req, res) => {
  try {
    const { adminId } = req.body || {};
    const messages = readMessages();
    const messageIndex = messages.findIndex(msg => msg.id === req.params.id);
    
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    const msg = messages[messageIndex];
    if (msg.recipientRole === 'admin' && adminId) {
      if (!msg.readBy) msg.readBy = {};
      msg.readBy[adminId] = true;
    } else {
      msg.read = true;
    }
    writeMessages(messages);
    
    res.json({
      success: true,
      data: messages[messageIndex],
      message: '消息已标记为已读'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '标记消息失败',
      error: error.message
    });
  }
});

/**
 * 标记消息为已处理（仅管理员）
 * PUT /api/messages/:id/process
 * body: { adminId, adminUsername }
 */
app.put('/api/messages/:id/process', (req, res) => {
  try {
    const { adminId, adminUsername } = req.body || {};
    if (!adminId || !adminUsername) {
      return res.status(400).json({
        success: false,
        message: '缺少 adminId 或 adminUsername'
      });
    }
    const messages = readMessages();
    const messageIndex = messages.findIndex(msg => msg.id === req.params.id);
    
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    const msg = messages[messageIndex];
    msg.processed = true;
    msg.processedBy = adminUsername;
    msg.processedAt = new Date().toISOString();
    writeMessages(messages);
    
    res.json({
      success: true,
      data: messages[messageIndex],
      message: '已标记为已处理'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '标记失败',
      error: error.message
    });
  }
});

/**
 * 删除消息
 * DELETE /api/messages/:id
 */
app.delete('/api/messages/:id', (req, res) => {
  try {
    const messages = readMessages();
    const filteredMessages = messages.filter(msg => msg.id !== req.params.id);
    
    if (filteredMessages.length === messages.length) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    writeMessages(filteredMessages);
    
    res.json({
      success: true,
      message: '消息已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除消息失败',
      error: error.message
    });
  }
});

/**
 * 获取用户列表
 * GET /api/users
 */
app.get('/api/users', (req, res) => {
  try {
    const users = readUsers();
    const hotels = readHotels();
    const { q, hotelZero } = req.query;

    const hotelCountByUser = {};
    for (const h of hotels) {
      const uid = h.userId || '';
      if (uid && (h.status === 'approved' || h.status === 'pending' || h.status === 'pending_merchant_confirm')) {
        hotelCountByUser[uid] = (hotelCountByUser[uid] || 0) + 1;
      }
    }

    // lastHotelDeletedAt：商户名下酒店数为0时，最后一个酒店被删除的时间（存于用户数据）
    let list = users.map(u => ({
      ...u,
      hotelCount: hotelCountByUser[u.id] || 0,
      lastHotelDeletedAt: u.lastHotelDeletedAt || null
    }));

    if (q && q.trim()) {
      const kw = q.trim().toLowerCase();
      list = list.filter(u =>
        (u.username && u.username.toLowerCase().includes(kw)) ||
        (u.name && u.name.toLowerCase().includes(kw))
      );
    }

    if (hotelZero === '1' || hotelZero === 'true') {
      list = list.filter(u => u.role === 'merchant' && u.hotelCount === 0);
    }

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

/**
 * 删除用户
 * DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res) => {
  try {
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const user = users[userIndex];
    
    // 管理员之间不能互相删除
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '管理员之间不能互相删除'
      });
    }
    
    // 检查用户是否有酒店
    const hotels = readHotels();
    // 检查有userId字段且匹配的酒店
    const userHotelsWithId = hotels.filter(h => h.userId === user.id && (h.status === 'approved' || h.status === 'pending' || h.status === 'pending_merchant_confirm'));
    // 检查没有userId字段的酒店（可能是默认用户创建的）
    const userHotelsWithoutId = hotels.filter(h => !h.userId && (h.status === 'approved' || h.status === 'pending' || h.status === 'pending_merchant_confirm'));
    
    // 如果是默认用户（如merchant1），且有未关联的酒店，则阻止删除
    if (user.username === 'merchant1' && userHotelsWithoutId.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该商户名下还有酒店，无法删除'
      });
    }
    
    // 如果用户名下有已关联的酒店，则阻止删除
    if (userHotelsWithId.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该商户名下还有酒店，无法删除'
      });
    }
    
    // 删除用户
    users.splice(userIndex, 1);
    writeUsers(users);
    appendLog('DELETE_USER', `删除用户 ${user.username}(${user.id})`, req.headers['x-admin-id'] || 'system', 'admin');
    
    res.json({
      success: true,
      message: '用户已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

/**
 * 批量删除用户
 * POST /api/users/batch-delete
 * body: { ids: ['id1', 'id2', ...] }
 */
app.post('/api/users/batch-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的用户ID列表'
      });
    }

    const users = readUsers();
    const hotels = readHotels();
    const toDelete = [];
    const errors = [];

    for (const id of ids) {
      const user = users.find(u => u.id === id);
      if (!user) {
        errors.push(`${id}: 用户不存在`);
        continue;
      }
      if (user.role === 'admin') {
        errors.push(`${user.username}: 管理员不能删除`);
        continue;
      }
      const userHotels = hotels.filter(h => h.userId === user.id && (h.status === 'approved' || h.status === 'pending' || h.status === 'pending_merchant_confirm'));
      if (userHotels.length > 0) {
        errors.push(`${user.username}: 名下还有酒店`);
        continue;
      }
      toDelete.push(user);
    }

    const newUsers = users.filter(u => !toDelete.some(d => d.id === u.id));
    writeUsers(newUsers);

    for (const u of toDelete) {
      appendLog('DELETE_USER', `批量删除用户 ${u.username}(${u.id})`, req.headers['x-admin-id'] || 'system', 'admin');
    }

    res.json({
      success: true,
      data: { deleted: toDelete.length, errors },
      message: `已删除 ${toDelete.length} 个用户${errors.length ? `，${errors.length} 个跳过` : ''}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  }
});

/**
 * 创建预订
 * POST /api/bookings
 * 用户端预订酒店
 */
app.post('/api/bookings', (req, res) => {
  try {
    const { hotelId, hotelName, roomType, roomPrice, roomTypeDescription, roomTypeIndex, checkIn, checkOut, nights, guestCount, roomCount, totalPrice, clientUserId } = req.body;

    if (!hotelId || !hotelName || !roomType || roomPrice === undefined || !checkIn || !checkOut || !nights || !roomCount || totalPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：hotelId, hotelName, roomType, roomPrice, checkIn, checkOut, nights, roomCount, totalPrice'
      });
    }

    const hotels = readHotels();
    const hotel = hotels.find(h => h.id === String(hotelId));
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }
    if (hotel.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: '该酒店暂不可预订'
      });
    }
    const roomTypes = hotel.roomTypes || [];
    const rtMatch = roomTypes.find(rt => rt.name === roomType && rt.price === parseFloat(roomPrice));
    if (!rtMatch && roomTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: '所选房型不存在或价格已变更，请刷新后重选'
      });
    }

    const booking = {
      id: generateBookingId(),
      hotelId: String(hotelId),
      hotelName: hotelName || hotel.name,
      roomType: String(roomType),
      roomPrice: parseFloat(roomPrice),
      roomTypeDescription: roomTypeDescription ? String(roomTypeDescription) : undefined,
      roomTypeIndex: roomTypeIndex != null ? parseInt(roomTypeIndex) : undefined,
      checkIn,
      checkOut,
      nights: parseInt(nights) || 1,
      guestCount: parseInt(guestCount) || 1,
      roomCount: parseInt(roomCount) || 1,
      totalPrice: parseFloat(totalPrice) || 0,
      clientUserId: clientUserId || undefined,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const bookings = readBookings();
    bookings.push(booking);
    writeBookings(bookings);

    // 商户订单通知
    if (hotel.userId) {
      const content = `您的酒店「${booking.hotelName}」收到新订单：订单号 ${booking.id}，入住 ${booking.checkIn}，离店 ${booking.checkOut}，总价 ¥${booking.totalPrice}`;
      createMessage('酒店新订单', content, 'merchant', String(hotel.userId), {
        actionType: 'booking_created',
        targetHotelId: hotel.id,
        linkTo: '/merchant/bookings'
      });
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: '预订成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '预订失败',
      error: error.message
    });
  }
});

/**
 * 获取预订列表
 * GET /api/bookings?hotelId=xxx
 * 商户端数据隔离：需传 userId 与 role=merchant，仅返回该商户名下酒店的订单
 * 管理员：传 role=admin 或不传，返回全部订单
 */
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = readBookings();
    const { hotelId, userId, role, clientUserId } = req.query;

    let filtered = bookings;

    if (hotelId) {
      filtered = filtered.filter(b => b.hotelId === String(hotelId));
    }

    if (clientUserId) {
      filtered = filtered.filter(b => b.clientUserId === clientUserId);
    }

    if (role === 'merchant') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '商户查询订单时必须提供 userId'
        });
      }
      const hotels = readHotels();
      const merchantHotelIds = new Set(
        hotels.filter(h => String(h.userId || '') === String(userId)).map(h => String(h.id))
      );
      filtered = filtered.filter(b => merchantHotelIds.has(String(b.hotelId)));
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预订列表失败',
      error: error.message
    });
  }
});

/**
 * 获取单个预订详情
 * GET /api/bookings/:id
 */
app.get('/api/bookings/:id', (req, res) => {
  try {
    const bookings = readBookings();
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
});

/**
 * 取消预订
 * PATCH /api/bookings/:id/cancel
 */
app.patch('/api/bookings/:id/cancel', (req, res) => {
  try {
    const bookings = readBookings();
    const idx = bookings.findIndex(b => b.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    const b = bookings[idx];
    if (b.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '订单已取消'
      });
    }
    if (b.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '已完成订单无法取消'
      });
    }
    bookings[idx] = { ...b, status: 'cancelled', cancelledAt: new Date().toISOString() };
    writeBookings(bookings);
    res.json({
      success: true,
      data: bookings[idx],
      message: '订单已取消'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消失败',
      error: error.message
    });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  try {
    const bookings = readBookings();
    const idx = bookings.findIndex(b => b.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    bookings.splice(idx, 1);
    writeBookings(bookings);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败', error: error.message });
  }
});

/**
 * 系统配置（需管理员）
 * GET /api/settings
 * PUT /api/settings - body: { systemName, systemDescription, enableRegistration, enableAudit }
 */
app.get('/api/settings', (req, res) => {
  try {
    const config = readConfig();
    if (!config) {
      return res.status(500).json({ success: false, message: '读取配置失败' });
    }
    res.json({ success: true, data: config });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const { systemName, systemDescription, enableRegistration, enableAudit } = req.body;
    const config = readConfig() || {};
    if (systemName !== undefined) config.systemName = systemName;
    if (systemDescription !== undefined) config.systemDescription = systemDescription;
    if (enableRegistration !== undefined) config.enableRegistration = !!enableRegistration;
    if (enableAudit !== undefined) config.enableAudit = !!enableAudit;
    if (!writeConfig(config)) {
      return res.status(500).json({ success: false, message: '保存配置失败' });
    }
    appendLog('UPDATE_SETTINGS', JSON.stringify(config), req.body.adminUserId, 'admin');
    res.json({ success: true, data: config, message: '配置已保存' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * 权限矩阵（静态，供前端展示）
 * GET /api/permissions
 */
app.get('/api/permissions', (req, res) => {
  const matrix = [
    { module: '数据看板', permission: '查看统计', admin: true, merchant: true, desc: '管理员看全平台，商户看自有' },
    { module: '审核管理', permission: '审核酒店', admin: true, merchant: false, desc: '仅管理员' },
    { module: '酒店管理', permission: '管理全部酒店', admin: true, merchant: false, desc: '仅管理员' },
    { module: '酒店管理', permission: '管理自有酒店', admin: true, merchant: true, desc: '商户仅能管理自己录入的' },
    { module: '酒店录入', permission: '录入新酒店', admin: false, merchant: true, desc: '商户专属' },
    { module: '预订管理', permission: '查看全部订单', admin: true, merchant: false, desc: '仅管理员' },
    { module: '预订管理', permission: '管理自有订单', admin: true, merchant: true, desc: '商户看自己酒店的订单' },
    { module: '数据分析', permission: '查看分析报表', admin: true, merchant: false, desc: '仅管理员' },
    { module: '系统设置', permission: '访问系统设置', admin: true, merchant: false, desc: '仅管理员' },
    { module: '用户管理', permission: '增删用户', admin: true, merchant: false, desc: '仅管理员' },
    { module: '邀请码', permission: '生成管理员邀请码', admin: true, merchant: false, desc: '仅管理员' },
    { module: '权限配置', permission: '查看/修改权限', admin: true, merchant: false, desc: '仅管理员' },
    { module: '系统日志', permission: '查看操作日志', admin: true, merchant: false, desc: '仅管理员' }
  ];
  res.json({ success: true, data: matrix });
});

/**
 * 系统日志
 * GET /api/system-logs?limit=50
 */
app.get('/api/system-logs', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const logs = readLogs(limit);
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * IP 定位（当浏览器 GPS 不可用时备用，如桌面端）
 * GET /api/geo/ip
 */
app.get('/api/geo/ip', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (forwarded ? forwarded.split(',')[0].trim() : null) || req.ip || req.connection?.remoteAddress || '';
  const ip = (clientIp === '::1' || clientIp === '127.0.0.1') ? '' : clientIp.replace(/^::ffff:/, '');
  const url = ip ? `http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,city,regionName` : 'http://ip-api.com/json/?lang=zh-CN&fields=status,city,regionName';
  http.get(url, (r) => {
    let data = '';
    r.on('data', (chunk) => { data += chunk; });
    r.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.status === 'success' && (json.city || json.regionName)) {
          const city = json.city || json.regionName || '';
          res.json({ success: true, data: { city } });
        } else {
          res.json({ success: false, message: 'IP 定位失败' });
        }
      } catch (e) {
        res.status(500).json({ success: false, message: '解析失败' });
      }
    });
  }).on('error', () => {
    res.status(502).json({ success: false, message: 'IP 定位服务不可用' });
  });
});

/**
 * 逆地理编码（百度地图，携程式定位）
 * GET /api/geo/reverse?lat=39.9&lng=116.4
 * 需配置环境变量 BAIDU_MAP_AK，在百度地图开放平台申请：https://lbsyun.baidu.com/
 */
app.get('/api/geo/reverse', (req, res) => {
  const ak = process.env.BAIDU_MAP_AK;
  if (!ak) {
    return res.status(503).json({ success: false, message: '未配置百度地图AK' });
  }
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: '无效的经纬度' });
  }
  const url = `https://api.map.baidu.com/reverse_geocoding/v3/?ak=${ak}&output=json&coordtype=wgs84ll&location=${lat},${lng}`;
  const lib = url.startsWith('https') ? https : http;
  lib.get(url, (r) => {
    let data = '';
    r.on('data', (chunk) => { data += chunk; });
    r.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.status === 0 && json.result && json.result.addressComponent) {
          const comp = json.result.addressComponent;
          const city = comp.city || comp.province || comp.district || '';
          res.json({ success: true, data: { city } });
        } else {
          res.json({ success: false, message: json.message || '解析失败' });
        }
      } catch (e) {
        res.status(500).json({ success: false, message: '解析响应失败' });
      }
    });
  }).on('error', (e) => {
    res.status(502).json({ success: false, message: '请求百度API失败' });
  });
});

// =============================================
// AI Agent 专用接口
// =============================================

/**
 * AI 搜索端点 — 为 Coze Plugin 优化
 * GET /api/ai/search
 * 
 * 参数: city, keyword, price_min, price_max, star, tags, sort, limit
 * 返回精简结构，便于 LLM 直接引用
 */
app.get('/api/ai/search', (req, res) => {
  try {
    const t0 = Date.now();
    const { city, keyword, price_min, price_max, star, tags, sort = 'rating', limit = 5 } = req.query;

    let result;
    if (city && city.trim()) {
      const c = city.trim();
      result = _aiCityIndex.get(c) || _aiApprovedByRating.filter(h => (h.city && h.city.includes(c)) || (h.address && h.address.includes(c)));
    } else {
      result = _aiApprovedByRating;
    }

    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(h => {
        const searchable = [h.name, h.description, h.address, h.brand, ...(h.tags || []), ...(h.amenities || [])].join(' ').toLowerCase();
        return searchable.includes(kw);
      });
    }

    if (star) {
      const starNum = parseInt(star);
      if (!isNaN(starNum) && starNum > 0) result = result.filter(h => (h.rating || 0) >= starNum);
    }

    if (price_min) {
      const min = parseFloat(price_min);
      if (!isNaN(min) && min > 0) result = result.filter(h => (h.price || 0) >= min);
    }
    if (price_max) {
      const max = parseFloat(price_max);
      if (!isNaN(max) && max > 0) result = result.filter(h => (h.price || 0) <= max);
    }

    if (tags && tags.trim()) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      result = result.filter(h => {
        const hAll = [...(h.tags || []), ...(h.amenities || [])].map(String).join(' ');
        return tagList.every(t => hAll.includes(t));
      });
    }

    if (sort === 'price_asc') result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price_desc') result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));

    const total = result.length;
    const items = result.slice(0, Math.min(parseInt(limit) || 5, 10)).map(h => ({
      id: h.id,
      name: h.name,
      city: h.city,
      district: h.district || '',
      price: h.price,
      rating: h.rating,
      overallRating: h.baiduOverallRating || '',
      commentCount: h.baiduCommentNum || '',
      brand: h.brand || '',
      category: h.category || '',
      amenities: (h.amenities || []).slice(0, 6),
      tags: (h.tags || []).slice(0, 4),
      summary: `${h.name}，位于${h.city}${h.district || ''}，${h.category || starText(h.rating)}，¥${h.price}/晚${h.baiduOverallRating ? '，评分' + h.baiduOverallRating : ''}${h.brand ? '，' + h.brand + '品牌' : ''}`
    }));

    function starText(r) {
      return r >= 5 ? '五星豪华' : r >= 4 ? '四星高档' : r >= 3 ? '三星舒适' : '经济型';
    }

    console.log(`[AI搜索] city=${city||'-'} keyword=${keyword||'-'} 命中${total}条 返回${items.length}条 耗时${Date.now()-t0}ms`);
    res.json({ success: true, total, count: items.length, hotels: items });
  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ success: false, message: 'AI搜索服务暂不可用' });
  }
});

// ==================== 客户端用户认证 API ====================

app.post('/api/client/auth/login', (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: '手机号和验证码不能为空' });
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入正确的手机号' });
    }
    if (code !== '8888') {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    const users = readClientUsers();
    let user = users.find(u => u.phone === phone);

    if (!user) {
      const last4 = phone.slice(-4);
      user = {
        id: 'cu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        phone,
        nickname: '旅行者' + last4,
        avatar: null,
        created_at: new Date().toISOString()
      };
      users.push(user);
      writeClientUsers(users);
    }

    res.json({ success: true, data: user, message: '登录成功' });
  } catch (error) {
    console.error('客户端登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

app.get('/api/client/auth/profile', (req, res) => {
  try {
    const uid = req.headers['x-client-uid'];
    if (!uid) return res.status(401).json({ success: false, message: '未登录' });

    const users = readClientUsers();
    const user = users.find(u => u.id === uid);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取信息失败' });
  }
});

app.put('/api/client/auth/profile', (req, res) => {
  try {
    const uid = req.headers['x-client-uid'];
    if (!uid) return res.status(401).json({ success: false, message: '未登录' });

    const users = readClientUsers();
    const idx = users.findIndex(u => u.id === uid);
    if (idx === -1) return res.status(404).json({ success: false, message: '用户不存在' });

    const { nickname } = req.body;
    if (nickname) users[idx].nickname = nickname.slice(0, 20);
    writeClientUsers(users);

    res.json({ success: true, data: users[idx] });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// ==================== 对话会话管理 API ====================

app.get('/api/client/chat/sessions', (req, res) => {
  try {
    const uid = req.query.user_id || req.headers['x-client-uid'];
    if (!uid) return res.status(401).json({ success: false, message: '未登录' });

    const sessions = readChatSessions()
      .filter(s => s.user_id === uid)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map(({ id, title, mode, updated_at, created_at }) => ({ id, title, mode, updated_at, created_at }));

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取会话列表失败' });
  }
});

app.post('/api/client/chat/sessions', (req, res) => {
  try {
    const uid = req.body.user_id || req.headers['x-client-uid'];
    if (!uid) return res.status(401).json({ success: false, message: '未登录' });

    const session = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      user_id: uid,
      title: '新对话',
      coze_conversation_id: null,
      coze_conversation_ids: { fast: null, deep: null },
      dialog_state: {
        last_recommended_hotels: [],
        last_selected_hotel_id: null,
        last_intent: 'idle',
        recent_hotels: []
      },
      mode: req.body.mode || 'fast',
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const sessions = readChatSessions();
    sessions.push(session);
    writeChatSessions(sessions);

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建会话失败' });
  }
});

app.get('/api/client/chat/sessions/:id', (req, res) => {
  try {
    const sessions = readChatSessions();
    const session = sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: '会话不存在' });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取会话失败' });
  }
});

app.put('/api/client/chat/sessions/:id', (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: '标题不能为空' });

    const sessions = readChatSessions();
    const session = sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: '会话不存在' });

    session.title = title.trim().slice(0, 50);
    session.updated_at = new Date().toISOString();
    writeChatSessions(sessions);

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

app.delete('/api/client/chat/sessions/:id', (req, res) => {
  try {
    const sessions = readChatSessions();
    const idx = sessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: '会话不存在' });

    sessions.splice(idx, 1);
    writeChatSessions(sessions);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// ==================== Coze Chat 代理端点 ====================

const DETAIL_EDGE_REGEX = /(详情|详细信息|介绍|看看|信息|什么样|地址|房型|设施|电话|价格明细)/;
const BOOKING_EDGE_REGEX = /(预订|预定|下单|订房|订这家|帮我订|立即订)/;
const REF_HOTEL_REGEX = /(这家|这个酒店|上一家|上一个)/;
const RECOMMEND_INTENT_REGEX = /(推荐|帮我找|找酒店|住哪|哪里好|适合|民宿|酒店|有没有|想住)/;
const HOTEL_NAME_HINT_REGEX = /([\u4e00-\u9fa5A-Za-z0-9·\-\s]{2,40}(?:酒店|宾馆|旅馆|客栈|民宿|度假村|大酒店))/;

function normalizeSessionState(sess) {
  if (!sess) return;
  if (!sess.coze_conversation_ids || typeof sess.coze_conversation_ids !== 'object') {
    sess.coze_conversation_ids = { fast: null, deep: null };
  } else {
    sess.coze_conversation_ids.fast = sess.coze_conversation_ids.fast || null;
    sess.coze_conversation_ids.deep = sess.coze_conversation_ids.deep || null;
  }
  if (!sess.dialog_state || typeof sess.dialog_state !== 'object') {
    sess.dialog_state = {
      last_recommended_hotels: [],
      last_selected_hotel_id: null,
      last_intent: 'idle',
      recent_hotels: []
    };
  }
  if (!Array.isArray(sess.dialog_state.last_recommended_hotels)) {
    sess.dialog_state.last_recommended_hotels = [];
  }
  if (typeof sess.dialog_state.last_selected_hotel_id !== 'string') {
    sess.dialog_state.last_selected_hotel_id = sess.dialog_state.last_selected_hotel_id || null;
  }
  if (!Array.isArray(sess.dialog_state.recent_hotels)) {
    sess.dialog_state.recent_hotels = [];
  }
}

function cnNumberToInt(input) {
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (!input) return null;
  if (/^\d+$/.test(input)) return parseInt(input, 10);
  if (map[input]) return map[input];
  if (input === '十一') return 11;
  if (input === '十二') return 12;
  return null;
}

function resolveHotelIdFromMessage(text, dialogState) {
  if (!text || !dialogState) return null;
  const explicitTag = text.match(/\[\[hotel:([^\]|]+)\|/);
  if (explicitTag?.[1]) return String(explicitTag[1]);

  const explicitId = text.match(/酒店\s*ID[:：]?\s*([a-zA-Z0-9_-]+)/i);
  if (explicitId?.[1]) return String(explicitId[1]);

  const ranked = dialogState.last_recommended_hotels || [];
  const nth = text.match(/第([一二三四五六七八九十\d]+)家/);
  if (nth?.[1]) {
    const idx = cnNumberToInt(nth[1]);
    if (idx && ranked[idx - 1]) return String(ranked[idx - 1]);
  }
  if (REF_HOTEL_REGEX.test(text)) {
    if (dialogState.last_selected_hotel_id) return String(dialogState.last_selected_hotel_id);
    if (ranked[0]) return String(ranked[0]);
  }
  return null;
}

function normalizeHotelNameForMatch(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/[\s()（）【】\[\]·.、,，:：'"“”‘’\-]/g, '')
    .replace(/(大酒店|酒店公寓|酒店|宾馆|旅馆|客栈|民宿|度假村)$/g, '');
}

function charSetSimilarity(a, b) {
  if (!a || !b) return 0;
  const sa = new Set(a.split(''));
  const sb = new Set(b.split(''));
  let inter = 0;
  for (const ch of sa) {
    if (sb.has(ch)) inter += 1;
  }
  const base = Math.max(sa.size, sb.size);
  return base ? inter / base : 0;
}

function scoreHotelName(query, candidate) {
  const q = normalizeHotelNameForMatch(query);
  const c = normalizeHotelNameForMatch(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q)) return Math.min(0.95, 0.8 + q.length / Math.max(c.length, 1) * 0.15);
  if (q.includes(c)) return Math.min(0.92, 0.75 + c.length / Math.max(q.length, 1) * 0.15);
  return charSetSimilarity(q, c) * 0.72;
}

function extractHotelNameHint(text) {
  if (!text) return null;
  const m = text.match(HOTEL_NAME_HINT_REGEX);
  return m?.[1]?.trim() || null;
}

function resolveHotelIdByNameHint(nameHint, dialogState) {
  if (!nameHint || !dialogState) return null;
  const recent = Array.isArray(dialogState.recent_hotels) ? dialogState.recent_hotels : [];
  if (recent.length === 0) return null;
  let best = null;
  for (const item of recent) {
    const score = scoreHotelName(nameHint, item.name || '');
    if (!best || score > best.score) best = { id: item.id, score };
  }
  if (best && best.score >= 0.82) return String(best.id);
  return null;
}

function extractRecommendedHotels(content) {
  if (!content) return [];
  const regex = /\[\[hotel:([^\]|]+)\|([^\]]+)\]\]/g;
  const seen = new Set();
  const hotels = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const id = match[1] ? String(match[1]) : '';
    const name = match[2] ? String(match[2]) : '';
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    hotels.push({ id, name });
  }
  return hotels;
}

function upsertRecentHotels(dialogState, hotels) {
  if (!dialogState) return;
  if (!Array.isArray(dialogState.recent_hotels)) dialogState.recent_hotels = [];
  const map = new Map(dialogState.recent_hotels.map(h => [String(h.id), h]));
  const now = new Date().toISOString();
  for (const h of hotels || []) {
    if (!h?.id || !h?.name) continue;
    const prev = map.get(String(h.id)) || {};
    map.set(String(h.id), {
      id: String(h.id),
      name: h.name,
      last_seen_at: now,
      source_turn: 'assistant',
      city: prev.city || ''
    });
  }
  dialogState.recent_hotels = [...map.values()]
    .sort((a, b) => new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0))
    .slice(0, 30);
}

function extractRecommendedHotelIds(content) {
  if (!content) return [];
  const regex = /\[\[hotel:([^\]|]+)\|[^\]]+\]\]/g;
  const ids = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) ids.push(String(match[1]));
  }
  return [...new Set(ids)];
}

function buildEdgeReply(intent, resolvedHotelId, dialogState) {
  const hotels = readHotels();
  const pickHotel = resolvedHotelId
    ? hotels.find(h => String(h.id) === String(resolvedHotelId))
    : null;

  if (!pickHotel) {
    const ranked = dialogState?.last_recommended_hotels || [];
    if (ranked.length > 0) {
      return `我还不能确定你指的是哪一家。请说“第1家/第2家”或直接点酒店卡片后再问我详情。`;
    }
    return '我还没有当前可引用的酒店。请先让我为你推荐酒店，再继续问“这家/第几家”的问题。';
  }

  if (intent === 'booking') {
    return [
      `可以，已为你定位到：[[hotel:${pickHotel.id}|${pickHotel.name}]]。`,
      '',
      '预订请按这 3 步操作：',
      '1. 点击上面的酒店名称进入详情页',
      '2. 选择房型与入住/离店日期',
      '3. 点击“立即预订”提交订单',
      '',
      '如果你愿意，我也可以先帮你对比这家不同房型的性价比。'
    ].join('\n');
  }

  return [
    `你指的应该是：[[hotel:${pickHotel.id}|${pickHotel.name}]]`,
    '',
    `城市：${pickHotel.city || '-'}  地址：${pickHotel.address || '-'}`,
    `参考价：¥${pickHotel.price || '-'} / 晚  评分：${pickHotel.rating || '-'}`,
    '',
    `${pickHotel.description || '这家酒店暂无详细描述。'}`
  ].join('\n');
}

/**
 * POST /api/chat
 * Body: { message, conversation_id?, mode?, session_id?, user_id? }
 * 转发到 Coze Chat API，流式返回
 * mode: 'fast'(默认) 或 'deep'
 */
app.post('/api/chat', async (req, res) => {
  const { message, conversation_id, mode = 'fast', session_id, user_id } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: '消息不能为空' });
  }

  const COZE_API_TOKEN = process.env.COZE_API_TOKEN;
  const COZE_BOT_ID_DEEP = process.env.COZE_BOT_ID;
  const COZE_BOT_ID_FAST = process.env.COZE_BOT_ID_FAST || COZE_BOT_ID_DEEP;
  const modeKey = mode === 'deep' ? 'deep' : 'fast';
  const botId = modeKey === 'deep' ? COZE_BOT_ID_DEEP : COZE_BOT_ID_FAST;
  const inputText = message.trim();

  if (!COZE_API_TOKEN || !botId) {
    return res.status(503).json({
      success: false,
      message: 'AI 助手尚未配置，请联系管理员设置 COZE_API_TOKEN 和 COZE_BOT_ID'
    });
  }

  let sessions = null;
  let currentSession = null;
  let resolvedHotelIdFromUser = null;
  let hotelNameHintFromUser = null;

  // 保存用户消息到会话，并读取会话状态用于边界路由
  if (session_id && user_id) {
    try {
      sessions = readChatSessions();
      currentSession = sessions.find(s => s.id === session_id && s.user_id === user_id);
      if (currentSession) {
        normalizeSessionState(currentSession);
        resolvedHotelIdFromUser = resolveHotelIdFromMessage(inputText, currentSession.dialog_state);
        hotelNameHintFromUser = extractHotelNameHint(inputText);
        if (!resolvedHotelIdFromUser && hotelNameHintFromUser) {
          resolvedHotelIdFromUser = resolveHotelIdByNameHint(hotelNameHintFromUser, currentSession.dialog_state);
        }
        if (resolvedHotelIdFromUser) {
          currentSession.dialog_state.last_selected_hotel_id = resolvedHotelIdFromUser;
        }
        currentSession.messages.push({ role: 'user', content: inputText, time: new Date().toISOString() });
        if (currentSession.messages.filter(m => m.role === 'user').length === 1) {
          currentSession.title = inputText.slice(0, 15) + (inputText.length > 15 ? '...' : '');
        }
        currentSession.mode = modeKey;
        currentSession.updated_at = new Date().toISOString();
        writeChatSessions(sessions);
      }
    } catch (e) {
      console.error('保存用户消息失败:', e);
    }
  }

  const cozeUserId = user_id || `user_${req.ip || 'anonymous'}`;

  // 先处理边界问题（详情/预订），避免模型二次推荐或编造酒店ID
  const isBookingEdge = BOOKING_EDGE_REGEX.test(inputText);
  const isDetailEdge = DETAIL_EDGE_REGEX.test(inputText) &&
    (REF_HOTEL_REGEX.test(inputText) || /第[一二三四五六七八九十\d]+家/.test(inputText) || /酒店\s*ID/i.test(inputText));
  const hasRecommendIntent = RECOMMEND_INTENT_REGEX.test(inputText);

  const edgeIntent = isBookingEdge ? 'booking' : (isDetailEdge ? 'detail' : null);
  let edgeConfidence = 'low';
  if (edgeIntent === 'booking') {
    edgeConfidence = resolvedHotelIdFromUser ? 'high' : (hasRecommendIntent ? 'low' : 'mid');
  } else if (edgeIntent === 'detail') {
    edgeConfidence = resolvedHotelIdFromUser ? 'high' : (hotelNameHintFromUser ? 'mid' : 'low');
  }

  if (currentSession && edgeIntent && edgeConfidence === 'high') {
    try {
      const resolvedHotelId = resolvedHotelIdFromUser || resolveHotelIdFromMessage(inputText, currentSession.dialog_state);
      const edgeReply = buildEdgeReply(edgeIntent, resolvedHotelId, currentSession.dialog_state);
      currentSession.dialog_state.last_intent = edgeIntent;
      if (resolvedHotelId) currentSession.dialog_state.last_selected_hotel_id = resolvedHotelId;
      currentSession.messages.push({ role: 'assistant', content: edgeReply, time: new Date().toISOString() });
      currentSession.updated_at = new Date().toISOString();
      writeChatSessions(sessions);

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      const safeMsg = JSON.stringify(edgeReply);
      res.write(`data: {"event":"conversation.message.completed","data":{"type":"answer","content":${safeMsg}}}\n\n`);
      res.end();
      return;
    } catch (e) {
      console.error('边界路由处理失败:', e);
    }
  }

  // 获取 coze_conversation_id 用于多轮对话（按 fast/deep 分离）
  let cozeConvId = conversation_id;
  if (!cozeConvId && currentSession) {
    normalizeSessionState(currentSession);
    cozeConvId = currentSession.coze_conversation_ids[modeKey] || currentSession.coze_conversation_id || null;
  }

  const body = JSON.stringify({
    bot_id: botId,
    user_id: cozeUserId,
    stream: true,
    auto_save_history: true,
    additional_messages: [{
      role: 'user',
      content: inputText,
      content_type: 'text'
    }],
    ...(cozeConvId ? { conversation_id: cozeConvId } : {})
  });

  const options = {
    hostname: 'api.coze.cn',
    port: 443,
    path: '/v3/chat',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COZE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let fullAssistantContent = '';
  let savedConvId = cozeConvId;

  const cozeReq = https.request(options, (cozeRes) => {
    cozeRes.setEncoding('utf8');

    if (cozeRes.statusCode !== 200) {
      let errBody = '';
      cozeRes.on('data', chunk => errBody += chunk);
      cozeRes.on('end', () => {
        console.error(`Coze API 错误 [${cozeRes.statusCode}]:`, errBody);
        const safeMsg = JSON.stringify(`AI 服务暂时不可用 (HTTP ${cozeRes.statusCode})`);
        res.write(`data: {"event":"conversation.message.completed","data":{"type":"answer","content":${safeMsg}}}\n\n`);
        res.end();
      });
      return;
    }

    let sseBuffer = '';
    cozeRes.on('data', (chunk) => {
      res.write(chunk);

      // 解析 SSE 数据以收集完整回复和 conversation_id
      sseBuffer += chunk;
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || '';
      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event:')) { currentEvent = line.slice(6).trim(); continue; }
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') { currentEvent = ''; continue; }
        try {
          const data = JSON.parse(dataStr);
          if (data.conversation_id && !savedConvId) savedConvId = data.conversation_id;
          if (currentEvent === 'conversation.message.delta' && data.type === 'answer' && data.content) {
            fullAssistantContent += data.content;
          }
          if (currentEvent === 'conversation.message.completed' && data.type === 'answer' && data.content) {
            fullAssistantContent = data.content;
          }
        } catch (e) {}
        currentEvent = '';
      }
    });

    cozeRes.on('end', () => {
      res.end();

      // 流结束后保存助手回复到会话
      if (session_id && user_id && fullAssistantContent) {
        try {
          const storedSessions = readChatSessions();
          const sess = storedSessions.find(s => s.id === session_id && s.user_id === user_id);
          if (sess) {
            normalizeSessionState(sess);
            sess.messages.push({ role: 'assistant', content: fullAssistantContent, time: new Date().toISOString() });
            if (savedConvId) {
              sess.coze_conversation_ids[modeKey] = savedConvId;
              sess.coze_conversation_id = savedConvId; // 兼容旧字段
            }
            const recommendedHotels = extractRecommendedHotels(fullAssistantContent);
            const rankedHotels = recommendedHotels.map(h => h.id);
            if (rankedHotels.length > 0) {
              sess.dialog_state.last_recommended_hotels = rankedHotels;
              sess.dialog_state.last_selected_hotel_id = rankedHotels[0];
              sess.dialog_state.last_intent = 'search';
              upsertRecentHotels(sess.dialog_state, recommendedHotels);
            } else {
              sess.dialog_state.last_intent = 'chat';
            }
            sess.updated_at = new Date().toISOString();
            writeChatSessions(storedSessions);
          }
        } catch (e) {
          console.error('保存助手回复失败:', e);
        }
      } else if (session_id && user_id) {
        // 即使本轮无文本，也刷新模式会话链，降低上下文错配概率
        try {
          const storedSessions = readChatSessions();
          const sess = storedSessions.find(s => s.id === session_id && s.user_id === user_id);
          if (sess && savedConvId) {
            normalizeSessionState(sess);
            sess.coze_conversation_ids[modeKey] = savedConvId;
            sess.coze_conversation_id = savedConvId;
            sess.updated_at = new Date().toISOString();
            writeChatSessions(storedSessions);
          }
        } catch (e) {
          console.error('保存会话链失败:', e);
        }
      }
    });
  });

  cozeReq.on('error', (err) => {
    console.error('Coze API network error:', err.message);
    const safeMsg = JSON.stringify('AI 服务连接失败，请稍后再试');
    res.write(`data: {"event":"conversation.message.completed","data":{"type":"answer","content":${safeMsg}}}\n\n`);
    res.end();
  });

  cozeReq.write(body);
  cozeReq.end();
});

/**
 * 健康检查接口
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器 - 监听所有网络接口，支持局域网访问
app.listen(PORT, '0.0.0.0', () => {
  appendLog('SERVER_START', '后端服务启动', 'system', 'system');
  console.log('=================================');
  console.log('  易宿酒店预订平台 - 后端服务');
  console.log('=================================');
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`🌐 局域网访问: http://192.168.2.20:${PORT}`);
  console.log(`📊 API地址: http://localhost:${PORT}/api`);
  console.log('=================================');
  console.log('💡 提示: 确保手机和电脑在同一WiFi网络');
  console.log('=================================');
});

module.exports = app;
