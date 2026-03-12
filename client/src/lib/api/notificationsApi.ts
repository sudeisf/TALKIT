import API from './axiosInstance';

export interface NotificationApiItem {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  question_id?: number | null;
}

export const getNotifications = async () => {
  const response = await API.get<NotificationApiItem[]>('/notifications/');
  return response.data;
};

export const markNotificationRead = async (notificationId: number) => {
  await API.patch(`/notifications/${notificationId}/read/`);
};

export const markAllNotificationsRead = async () => {
  await API.patch('/notifications/read-all/');
};

export const deleteNotificationById = async (notificationId: number) => {
  await API.delete(`/notifications/${notificationId}/`);
};

export const clearReadNotifications = async () => {
  await API.delete('/notifications/clear-read/');
};
