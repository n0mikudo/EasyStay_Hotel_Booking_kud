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
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'hotels.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const INVITE_CODES_FILE = path.join(__dirname, 'data', 'invite_codes.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'system_config.json');
const LOGS_FILE = path.join(__dirname, 'data', 'system_logs.json');

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
};

initDataFile();

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

/**
 * 读取用户数据
 */
const readUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.users || [];
  } catch (error) {
    console.error('读取用户数据失败:', error);
    return [];
  }
};

/**
 * 写入用户数据
 */
const writeUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
    return true;
  } catch (error) {
    console.error('写入用户数据失败:', error);
    return false;
  }
};

/**
 * 生成用户ID
 */
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 读取消息数据
 */
const readMessages = () => {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取消息数据失败:', error);
    return [];
  }
};

/**
 * 写入消息数据
 */
const writeMessages = (messages) => {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('写入消息数据失败:', error);
    return false;
  }
};

/**
 * 生成消息ID
 */
const generateMessageId = () => {
  return 'message_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 读取预订数据
 */
const readBookings = () => {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取预订数据失败:', error);
    return [];
  }
};

/**
 * 写入预订数据
 */
const writeBookings = (bookings) => {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return true;
  } catch (error) {
    console.error('写入预订数据失败:', error);
    return false;
  }
};

/**
 * 生成预订ID
 */
const generateBookingId = () => {
  return 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 创建消息通知
 * @param {Object} opts - { title, content, recipientRole, recipientId, actionType, linkTo, targetHotelId, targetMerchantId }
 */
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
 * 读取酒店数据
 * @returns {Array} 酒店列表
 */
const readHotels = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据失败:', error);
    return [];
  }
};

/**
 * 写入酒店数据
 * @param {Array} hotels - 酒店列表
 */
const writeHotels = (hotels) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(hotels, null, 2));
  } catch (error) {
    console.error('写入数据失败:', error);
  }
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
    const { status, keyword, sortBy = 'createdAt', order = 'desc', userId, city, star, price, tags, page = 1, limit } = req.query;

    let filteredHotels = hotels;

    // 按用户ID筛选（商户只能看到自己的酒店）
    if (userId) {
      filteredHotels = filteredHotels.filter(h => h.userId === userId);
    }

    // 按状态筛选
    if (status) {
      filteredHotels = filteredHotels.filter(h => h.status === status);
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
        '停车场': ['停车', '免费停车', '停车场'],
        '停车': ['停车', '免费停车'],
        '海景': ['海景', '海景房', '景观'],
        '海景房': ['海景', '海景房'],
        '海': ['海景', '海景房'],
        '早餐': ['早餐', '含早餐', '餐厅'],
        '地铁': ['地铁', '近地铁'],
        '机场': ['机场', '近机场'],
        '景区': ['景区', '近景区'],
        '亲子': ['亲子', '亲子游', '儿童'],
        '儿童': ['儿童', '儿童乐园', '亲子'],
        '泳池': ['泳池', '游泳池'],
        '健身': ['健身', '健身房'],
        'wifi': ['wifi', 'wifi', '免费wifi', '免费WiFi'],
        '免费wifi': ['wifi', '免费wifi', '免费WiFi']
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

    res.json({
      success: true,
      data: resultHotels,
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
    const limit = Math.min(20, Math.max(6, parseInt(req.query.limit) || 8));
    const tags = Object.entries(count)
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

    res.json({
      success: true,
      data: hotel
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

    writeHotels(hotels);

    const hotel = hotels[index];
    const hotelId = hotel.id;

    // 当管理员执行审核操作（通过/拒绝）时，自动标记相关待处理消息为已处理，并记录处理人（仅 hotel_add 需审核）
    const { adminId, adminUsername } = req.body || {};
    if ((status === 'approved' || status === 'rejected') && adminId && adminUsername) {
      const messages = readMessages();
      let changed = false;
      for (const msg of messages) {
        if (msg.needProcess && !msg.processed && String(msg.targetHotelId) === String(hotelId) &&
          msg.actionType === 'hotel_add') {
          msg.processed = true;
          msg.processedBy = adminUsername;
          msg.processedByAdminId = adminId;
          msg.processedAt = new Date().toISOString();
          if (status === 'approved') {
            msg.title = '酒店审核通过';
            msg.content = `商户新增酒店「${hotel.name}」已审核通过`;
            msg.actionType = 'hotel_approved';
          } else if (status === 'rejected') {
            msg.title = '酒店审核拒绝';
            msg.content = `商户新增酒店「${hotel.name}」未通过审核${rejectReason ? '：' + rejectReason : ''}`;
            msg.actionType = 'hotel_rejected';
          }
          changed = true;
        }
      }
      if (changed) writeMessages(messages);
    }
    const merchantId = hotel.userId;
    if (merchantId) {
      if (status === 'approved' && prevStatus === 'pending') {
        createMessage('酒店审核通过', `您的酒店「${hotel.name}」已审核通过并上线`, 'merchant', merchantId, { actionType: 'audit_approve', targetHotelId: hotel.id });
      } else if (status === 'rejected') {
        createMessage('酒店审核拒绝', `您的酒店「${hotel.name}」未通过审核${rejectReason ? '：' + rejectReason : ''}`, 'merchant', merchantId, { actionType: 'audit_reject', targetHotelId: hotel.id });
      } else if (status === 'offline') {
        createMessage('酒店已下线', `您的酒店「${hotel.name}」已被管理员下线`, 'merchant', merchantId, { actionType: 'hotel_offline', targetHotelId: hotel.id });
      } else if (status === 'approved' && prevStatus === 'offline') {
        createMessage('酒店已上线', `您的酒店「${hotel.name}」已重新上线`, 'merchant', merchantId, { actionType: 'hotel_online', targetHotelId: hotel.id });
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
      // 管理员只能删除已下线的酒店
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
      createMessage('酒店已删除', `您的酒店「${deletedHotel.name}」已被管理员删除`, 'merchant', merchantId, { actionType: 'hotel_delete', targetHotelId: deletedHotel.id });
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
    const stats = {
      total: hotels.length,
      pending: hotels.filter(h => h.status === 'pending').length,
      approved: hotels.filter(h => h.status === 'approved').length,
      rejected: hotels.filter(h => h.status === 'rejected').length,
      // 额外统计
      avgPrice: hotels.length > 0
        ? (hotels.reduce((sum, h) => sum + h.price, 0) / hotels.length).toFixed(2)
        : 0,
      cities: [...new Set(hotels.map(h => h.city))].length
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
      const user = users.find(u => u.id === hotel.userId);
      const username = user ? user.name : '未知用户';

      // 根据酒店状态生成活动
      let action = '';
      let type = '';

      if (hotel.status === 'pending') {
        action = `提交了新酒店「${hotel.name}」`;
        type = 'entry';
      } else if (hotel.status === 'approved') {
        action = `审核通过了酒店「${hotel.name}」`;
        type = 'audit';
      } else if (hotel.status === 'rejected') {
        action = `审核拒绝了酒店「${hotel.name}」`;
        type = 'audit';
      }

      activities.push({
        id: hotel.id,
        type: type,
        action: action,
        time: hotel.updatedAt,
        user: username
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

    if (role === 'merchant' && userId) {
      userMessages = userMessages.filter(msg => !msg.recipientId || msg.recipientId === userId);
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

    list.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return 0;
    });

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
    const { hotelId, hotelName, roomType, roomPrice, roomTypeDescription, roomTypeIndex, checkIn, checkOut, nights, guestCount, roomCount, totalPrice } = req.body;

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
      status: 'pending', // pending: 待入住, completed: 已完成, cancelled: 已取消
      createdAt: new Date().toISOString()
    };

    const bookings = readBookings();
    bookings.push(booking);
    writeBookings(bookings);

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
    const { hotelId, userId, role } = req.query;

    let filtered = bookings;

    // 按 hotelId 过滤（用户端或指定酒店）
    if (hotelId) {
      filtered = filtered.filter(b => b.hotelId === String(hotelId));
    }

    // 商户端数据隔离：仅返回该商户名下酒店的订单
    if (role === 'merchant' && userId) {
      const hotels = readHotels();
      const merchantHotelIds = new Set(
        hotels.filter(h => h.userId === userId).map(h => String(h.id))
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
    { module: '商户录入', permission: '录入新酒店', admin: false, merchant: true, desc: '商户专属' },
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
