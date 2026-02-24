import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const messageService = {
  getMessages: async (params) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error('获取消息通知失败:', error);
      throw error;
    }
  },

  markAsRead: async (messageId, adminId = null) => {
    try {
      const body = adminId ? { adminId } : {};
      const response = await axios.put(`${API_BASE_URL}/messages/${messageId}/read`, body);
      return response.data;
    } catch (error) {
      console.error('标记消息失败:', error);
      throw error;
    }
  },

  markAsProcessed: async (messageId, adminId, adminUsername) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/messages/${messageId}/process`, {
        adminId,
        adminUsername
      });
      return response.data;
    } catch (error) {
      console.error('标记处理失败:', error);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('删除消息失败:', error);
      throw error;
    }
  }
};

export default messageService;
