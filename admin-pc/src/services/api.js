/**
 * API服务模块
 *
 * 功能：
 * 1. 配置axios实例
 * 2. 定义酒店相关API
 * 3. 定义统计相关API
 * 4. 统一错误处理
 */

import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 默认使用同源 /api，统一走 Nginx 反向代理，避免 IP:3000 直连在公网/手机端被拦截
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * 创建axios实例
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

/**
 * 请求拦截器
 * 可用于添加认证token等
 */
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 统一错误处理
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      console.error('API错误:', error.response.data);
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('网络错误: 无法连接到服务器');
    } else {
      // 请求配置出错
      console.error('请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 酒店服务API
 */
export const hotelService = {
  /**
   * 获取酒店列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 请求Promise
   */
  getHotels: (params) => api.get('/hotels', { params }),

  /**
   * 根据ID获取酒店详情
   * @param {string} id - 酒店ID
   * @returns {Promise} 请求Promise
   */
  getHotelById: (id, userId) => {
    const params = userId ? { userId } : {};
    return api.get(`/hotels/${id}`, { params });
  },

  /**
   * 创建酒店
   * @param {Object} data - 酒店数据
   * @returns {Promise} 请求Promise
   */
  createHotel: (data) => api.post('/hotels', data),

  /**
   * 更新酒店信息
   * @param {string} id - 酒店ID
   * @param {Object} data - 更新数据
   * @param {Object} options - 选项参数
   * @returns {Promise} 请求Promise
   */
  updateHotel: (id, data, options = {}) => {
    const params = {};
    if (options.userId) params.userId = options.userId;
    if (options.role) params.role = options.role;
    return api.put(`/hotels/${id}`, data, { params });
  },

  /**
   * 更新酒店状态
   * @param {string} id - 酒店ID
   * @param {string} status - 新状态
   * @returns {Promise} 请求Promise
   */
  updateHotelStatus: (id, status, adminInfo = {}) => api.put(`/hotels/${id}/status`, { status, adminId: adminInfo.id, adminUsername: adminInfo.username, rejectReason: adminInfo.rejectReason }),

  /**
   * 删除酒店
   * @param {string} id - 酒店ID
   * @returns {Promise} 请求Promise
   */
  deleteHotel: (id, options = {}) => {
    const params = {};
    if (options.userId) params.userId = options.userId;
    if (options.role) params.role = options.role;
    return api.delete(`/hotels/${id}`, { params });
  },

  /**
   * 批量更新酒店状态
   * @param {string[]} ids - 酒店ID数组
   * @param {string} status - 新状态
   */
  batchUpdateHotelStatus: (ids, status) => Promise.all(ids.map(id => api.put(`/hotels/${id}/status`, { status }))),

  /**
   * 批量删除酒店（仅已下线）
   * @param {string[]} ids - 酒店ID数组
   */
  batchDeleteHotels: (ids, options = {}) => Promise.all(ids.map(id => api.delete(`/hotels/${id}`, { params: { role: 'admin', ...options } }))),

  /**
   * 审核酒店
   * @param {string} id - 酒店ID
   * @param {string} status - 审核状态
   * @param {string} rejectReason - 拒绝原因（status为rejected时必填）
   * @returns {Promise} 请求Promise
   */
  auditHotel: (id, status, rejectReason = '', adminInfo = {}) =>
    api.put(`/hotels/${id}/status`, { status, rejectReason, adminId: adminInfo.id, adminUsername: adminInfo.username }),

  auditDismiss: (id) => api.put(`/hotels/${id}/audit-dismiss`),

  batchAuditDismiss: (ids) => api.post('/hotels/batch-audit-dismiss', { ids })
};

/**
 * 统计服务API
 */
export const statsService = {
  /**
   * 获取统计数据
   * @returns {Promise} 请求Promise
   */
  getStats: () => api.get('/stats'),
  getRiskAlerts: () => api.get('/stats/risk-alerts'),

  /**
   * 获取分析报表数据（服务端预计算，避免传输全部酒店数据）
   * @returns {Promise} 请求Promise
   */
  getAnalytics: () => api.get('/stats/analytics')
};

/**
 * 活动服务API
 */
export const activityService = {
  /**
   * 获取最近活动
   * @returns {Promise} 请求Promise
   */
  getActivities: () => api.get('/activities')
};

/**
 * 认证服务API
 */
export const authService = {
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @returns {Promise} 请求Promise
   */
  login: (credentials) => api.post('/auth/login', credentials),

  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Promise} 请求Promise
   */
  register: (userData) => api.post('/auth/register', userData)
};

/**
 * 预订服务API
 */
export const bookingService = {
  getBookings: (params) => api.get('/bookings', { params }),
  deleteBooking: (id) => api.delete(`/bookings/${id}`)
};

/**
 * 邀请码服务API（管理员生成新管理员邀请码）
 */
export const inviteCodeService = {
  create: (adminUserId) => api.post('/invite-codes', { adminUserId })
};

/**
 * 用户服务API
 */
export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  batchDeleteUsers: (ids) => api.post('/users/batch-delete', { ids })
};

/**
 * 系统设置API
 */
export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data)
};

/**
 * 权限与日志API
 */
export const systemService = {
  getPermissions: () => api.get('/permissions'),
  getLogs: (limit = 100) => api.get('/system-logs', { params: { limit } })
};

export default api;
