import api from '@/lib/axios'
import { Application, InstitutionStats, PageResponse, Scholarship } from '@/types'
import { mapApplicationResponse, mapScholarshipResponse } from './mappers'

export const institutionsApi = {
  getMyScholarships: async (page = 0, size = 20): Promise<PageResponse<Scholarship>> => {
    const res = await api.get(`/api/institutions/my-scholarships?page=${page}&size=${size}`)
    return {
      ...res.data,
      content: Array.isArray(res.data.content) ? res.data.content.map(mapScholarshipResponse) : [],
    }
  },

  getDashboard: async (): Promise<InstitutionStats> => {
    const res = await api.get('/api/institutions/dashboard')
    return {
      ...(res.data as InstitutionStats),
      recentApplications: Array.isArray((res.data as any)?.recentApplications)
        ? (res.data as any).recentApplications.map(mapApplicationResponse)
        : [],
    }
  },

  getScholarshipApplications: async (
    scholarshipId: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Application>> => {
    const res = await api.get(
      `/api/applications/scholarship/${scholarshipId}?page=${page}&size=${size}`
    )
    return {
      ...res.data,
      content: Array.isArray(res.data.content) ? res.data.content.map(mapApplicationResponse) : [],
    }
  },
}
