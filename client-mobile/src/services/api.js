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

/**
 * 获取API基础URL
 * 优先使用环境变量，否则使用默认值
 */
const getApiBaseUrl = () => {
  // 检查是否有环境变量配置
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 检查当前运行环境
  const hostname = window.location.hostname;

  // 如果是本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  // 如果是局域网IP访问（真机测试）
  // 假设后端运行在相同主机的3000端口
  return `http://${hostname}:3000/api`;
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
  timeout: 10000 // 10秒超时
});

/**
 * 请求拦截器
 */
api.interceptors.request.use(
  (config) => {
    console.log('API请求:', config.method.toUpperCase(), config.url);
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
      console.error('API错误:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('网络错误: 无法连接到服务器');
    } else {
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

export default api;
