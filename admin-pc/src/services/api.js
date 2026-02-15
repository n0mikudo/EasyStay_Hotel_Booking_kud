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

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

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
  getHotelById: (id) => api.get(`/hotels/${id}`),

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
   * @returns {Promise} 请求Promise
   */
  updateHotel: (id, data) => api.put(`/hotels/${id}`, data),

  /**
   * 更新酒店状态
   * @param {string} id - 酒店ID
   * @param {string} status - 新状态
   * @returns {Promise} 请求Promise
   */
  updateHotelStatus: (id, status) => api.put(`/hotels/${id}/status`, { status }),

  /**
   * 删除酒店
   * @param {string} id - 酒店ID
   * @returns {Promise} 请求Promise
   */
  deleteHotel: (id) => api.delete(`/hotels/${id}`)
};

/**
 * 统计服务API
 */
export const statsService = {
  /**
   * 获取统计数据
   * @returns {Promise} 请求Promise
   */
  getStats: () => api.get('/stats')
};

export default api;
