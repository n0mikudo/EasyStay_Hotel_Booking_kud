import api, { logApiError } from './api';

export const messageService = {
  getMessages: async (params) => {
    try {
      const response = await api.get('/messages', { params });
      return response.data;
    } catch (error) {
      logApiError('messages.getMessages', error);
      throw error;
    }
  },

  markAsRead: async (messageId, adminId = null) => {
    try {
      const body = adminId ? { adminId } : {};
      const response = await api.put(`/messages/${messageId}/read`, body);
      return response.data;
    } catch (error) {
      logApiError('messages.markAsRead', error);
      throw error;
    }
  },

  markAsProcessed: async (messageId, adminId, adminUsername) => {
    try {
      const response = await api.put(`/messages/${messageId}/process`, {
        adminId,
        adminUsername
      });
      return response.data;
    } catch (error) {
      logApiError('messages.markAsProcessed', error);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      logApiError('messages.deleteMessage', error);
      throw error;
    }
  }
};

export default messageService;
