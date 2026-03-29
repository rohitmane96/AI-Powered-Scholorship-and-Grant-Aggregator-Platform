import api from '@/lib/axios'
import { DashboardStats, MyStats } from '@/types'
import { mapApplicationResponse, mapDashboardStatsResponse, mapMyStatsResponse, mapUserResponse } from './mappers'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/api/dashboard/stats')
    return mapDashboardStatsResponse(res.data)
  },

  getMyStats: async (): Promise<MyStats> => {
    const res = await api.get('/api/users/me/stats')
    return mapMyStatsResponse(res.data)
  },
}

export const adminApi = {
  getUsers: async (page = 0, size = 20): Promise<{ content: import('@/types').User[]; totalElements: number; totalPages: number }> => {
    const res = await api.get(`/api/admin/users?page=${page}&size=${size}`)
    return {
      ...res.data,
      content: Array.isArray(res.data.content) ? res.data.content.map(mapUserResponse) : [],
    }
  },

  getAdminScholarships: async (page = 0, size = 20): Promise<import('@/types').PageResponse<import('@/types').Scholarship>> => {
    const res = await api.get(`/api/admin/scholarships?page=${page}&size=${size}`)
    return res.data
  },

  getAdminAnalytics: async (): Promise<DashboardStats> => {
    const res = await api.get('/api/admin/analytics')
    return mapDashboardStatsResponse(res.data)
  },

  getAdminApplications: async (
    scholarshipId: string,
    page = 0,
    size = 20
  ): Promise<import('@/types').PageResponse<import('@/types').Application>> => {
    const query = scholarshipId
      ? `scholarshipId=${encodeURIComponent(scholarshipId)}&page=${page}&size=${size}`
      : `page=${page}&size=${size}`
    const res = await api.get(`/api/admin/applications?${query}`)
    return {
      ...res.data,
      content: Array.isArray(res.data.content) ? res.data.content.map(mapApplicationResponse) : [],
    }
  },
}
