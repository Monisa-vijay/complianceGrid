import apiClient from './client';

export interface Notification {
  id: number;
  notification_type: 'DUE_SOON' | 'OVERDUE' | 'PENDING_APPROVAL' | 'CONTROL_ASSIGNED' | 'APPROVED' | 'REJECTED';
  title: string;
  message: string;
  category: number | null;
  category_name: string | null;
  category_id: number | null;
  submission: number | null;
  submission_id: number | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getAll: async (userId?: number, isRead?: boolean): Promise<Notification[]> => {
    const params: any = {};
    if (userId) params.user_id = userId;
    if (isRead !== undefined) params.is_read = isRead;
    
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  },

  getUnread: async (userId: number): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/', {
      params: { user_id: userId, is_read: false }
    });
    return response.data;
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    const response = await apiClient.get('/notifications/unread-count/', {
      params: { user_id: userId }
    });
    return response.data.unread_count;
  },

  markRead: async (notificationId: number): Promise<void> => {
    await apiClient.post(`/notifications/${notificationId}/mark-read/`);
  },

  markAllRead: async (userId: number): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read/', { user_id: userId });
  },

  generate: async (): Promise<{ notifications_created: number }> => {
    const response = await apiClient.get('/notifications/generate/');
    return response.data;
  },
};

