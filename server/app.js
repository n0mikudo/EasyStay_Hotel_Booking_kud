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

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'hotels.json');

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
};

initDataFile();

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
  if (!hotel.price || hotel.price <= 0) {
    return { valid: false, message: '价格必须大于0' };
  }
  if (!hotel.description || hotel.description.trim() === '') {
    return { valid: false, message: '酒店介绍不能为空' };
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
    const { status, keyword, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let filteredHotels = hotels;
    
    // 按状态筛选
    if (status) {
      filteredHotels = filteredHotels.filter(h => h.status === status);
    }
    
    // 按关键词搜索（名称、城市、地址）
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredHotels = filteredHotels.filter(h => 
        h.name.toLowerCase().includes(lowerKeyword) ||
        h.city.toLowerCase().includes(lowerKeyword) ||
        h.address.toLowerCase().includes(lowerKeyword)
      );
    }
    
    // 排序
    filteredHotels.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    res.json({
      success: true,
      data: filteredHotels,
      count: filteredHotels.length
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
    const hotels = readHotels();
    
    // 验证数据
    const validation = validateHotel(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    const newHotel = {
      id: generateId(),
      name: req.body.name.trim(),
      city: req.body.city.trim(),
      address: req.body.address.trim(),
      description: req.body.description.trim(),
      price: parseFloat(req.body.price),
      images: req.body.images || [],
      amenities: req.body.amenities || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    hotels.push(newHotel);
    writeHotels(hotels);
    
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
    
    // 验证数据
    const validation = validateHotel(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    hotels[index] = {
      ...hotels[index],
      name: req.body.name.trim(),
      city: req.body.city.trim(),
      address: req.body.address.trim(),
      description: req.body.description.trim(),
      price: parseFloat(req.body.price),
      images: req.body.images || [],
      amenities: req.body.amenities || [],
      updatedAt: new Date().toISOString()
    };
    
    writeHotels(hotels);
    
    res.json({
      success: true,
      data: hotels[index],
      message: '酒店更新成功'
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
    
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值，必须是 pending、approved 或 rejected'
      });
    }
    
    hotels[index].status = status;
    hotels[index].updatedAt = new Date().toISOString();
    
    writeHotels(hotels);
    
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
    
    const deletedHotel = hotels[index];
    hotels.splice(index, 1);
    writeHotels(hotels);
    
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
