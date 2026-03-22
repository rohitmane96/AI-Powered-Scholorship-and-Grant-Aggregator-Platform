import api from '@/lib/axios'
import { DashboardStats, MyStats } from '@/types'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/api/dashboard/stats')
    return res.data
  },

  getMyStats: async (): Promise<MyStats> => {
    const res = await api.get('/api/dashboard/my-stats')
    return res.data
  },
}

export const adminApi = {
  getUsers: async (page = 0, size = 20): Promise<{ content: import('@/types').User[]; totalElements: number; totalPages: number }> => {
    const res = await api.get(`/api/admin/users?page=${page}&size=${size}`)
    return res.data
  },

  updateUserStatus: async (userId: string, active: boolean): Promise<import('@/types').User> => {
    const res = await api.put(`/api/admin/users/${userId}/status`, { active })
    return res.data
  },

  getAdminScholarships: async (page = 0, size = 20): Promise<import('@/types').PageResponse<import('@/types').Scholarship>> => {
    const res = await api.get(`/api/admin/scholarships?page=${page}&size=${size}`)
    return res.data
  },

  getAdminApplications: async (page = 0, size = 20): Promise<import('@/types').PageResponse<import('@/types').Application>> => {
    const res = await api.get(`/api/admin/applications?page=${page}&size=${size}`)
    return res.data
  },
}
