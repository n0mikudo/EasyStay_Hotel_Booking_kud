/**
 * API服务模块 - 移动端
 *
 * 功能：
 * 1. 配置axios实例
 * 2. 定义酒店相关API
 * 3. 支持环境变量配置API地址
 * 4. 统一错误处理
 */

import axios from 'axios';

const isDev = process.env.NODE_ENV !== 'production';

const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.status) return `HTTP ${error.response.status}`;
  if (error?.request) return '网络错误: 无法连接到服务器';
  return error?.message || '未知错误';
};

/**
 * 获取API基础URL
 * 优先使用环境变量，否则使用默认值
 */
const getApiBaseUrl = () => {
  // 检查是否有环境变量配置
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 默认同源走 /api，兼容域名与IP访问，避免直连 :3000 被安全组/运营商策略拦截
  return '/api';
};

// API基础URL
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
 */
api.interceptors.request.use(
  (config) => {
    if (isDev) {
      console.log('API请求:', config.method?.toUpperCase(), config.url);
    }
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
    console.error('API错误:', getErrorMessage(error));
    return Promise.reject(error);
  }
);

/**
 * 酒店服务API
 */
export const hotelService = {
  /**
   * 获取酒店列表
   * @param {Object} params - 查询参数（默认 status: 'approved' 仅展示已上线酒店）
   * @returns {Promise} 请求Promise
   */
  getHotels: (params) => api.get('/hotels', { params }),

  /**
   * 根据ID获取酒店详情
   * @param {string} id - 酒店ID
   * @returns {Promise} 请求Promise
   */
  getHotelById: (id) => api.get(`/hotels/${id}`),

  getHotTags: (limit = 8) => api.get('/hotels/hot-tags', { params: { limit } })
};

/**
 * 地理服务（逆地理编码，优先百度地图）
 */
export const geoService = {
  reverseGeocode: (lat, lng) => api.get('/geo/reverse', { params: { lat, lng } })
};

/**
 * 预订服务API
 */
export const bookingService = {
  /**
   * 创建预订
   * @param {Object} data - 预订数据
   * @returns {Promise} 请求Promise
   */
  createBooking: (data) => api.post('/bookings', data),

  /**
   * 获取预订列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 请求Promise
   */
  getBookings: (params) => api.get('/bookings', { params }),

  /**
   * 获取单个订单详情
   * @param {string} id - 订单ID
   * @returns {Promise} 请求Promise
   */
  getBookingById: (id) => api.get(`/bookings/${id}`),

  /**
   * 取消订单
   * @param {string} id - 订单ID
   * @returns {Promise} 请求Promise
   */
  cancelBooking: (id) => api.patch(`/bookings/${id}/cancel`)
};

export const chatService = {
  getApiBaseUrl: () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    return '/api';
  }
};

export const clientAuthService = {
  login: (phone, code) => api.post('/client/auth/login', { phone, code }),
  getProfile: (uid) => api.get('/client/auth/profile', { headers: { 'x-client-uid': uid } }),
  updateProfile: (uid, nickname) => api.put('/client/auth/profile', { nickname }, { headers: { 'x-client-uid': uid } }),
};

export const chatSessionService = {
  getSessions: (userId) => api.get('/client/chat/sessions', { params: { user_id: userId } }),
  createSession: (userId, mode) => api.post('/client/chat/sessions', { user_id: userId, mode }),
  getSession: (sessionId) => api.get(`/client/chat/sessions/${sessionId}`),
  deleteSession: (sessionId) => api.delete(`/client/chat/sessions/${sessionId}`),
  renameSession: (sessionId, title) => api.put(`/client/chat/sessions/${sessionId}`, { title }),
};

export default api;
