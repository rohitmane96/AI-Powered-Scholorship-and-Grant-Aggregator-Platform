import api from '@/lib/axios'
import { Notification, PageResponse } from '@/types'

export const notificationsApi = {
  getNotifications: async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
    const res = await api.get(`/api/notifications?page=${page}&size=${size}`)
    return res.data
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.put(`/api/notifications/${id}/read`)
    return res.data
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/api/notifications/read-all')
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await api.get('/api/notifications/unread-count')
    return res.data
  },
}
