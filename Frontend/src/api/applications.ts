import api from '@/lib/axios'
import { Application, PageResponse, ApplicationStatus } from '@/types'

export const applicationsApi = {
  apply: async (data: {
    scholarshipId: string
    coverLetter: string
    documents: string[]
  }): Promise<Application> => {
    const res = await api.post('/api/applications', data)
    return res.data
  },

  getMyApplications: async (page = 0, size = 20): Promise<PageResponse<Application>> => {
    const res = await api.get(`/api/applications/my?page=${page}&size=${size}`)
    return res.data
  },

  getById: async (id: string): Promise<Application> => {
    const res = await api.get(`/api/applications/${id}`)
    return res.data
  },

  withdraw: async (id: string): Promise<Application> => {
    const res = await api.put(`/api/applications/${id}/withdraw`)
    return res.data
  },

  getByScholarship: async (scholarshipId: string): Promise<Application[]> => {
    const res = await api.get(`/api/applications/scholarship/${scholarshipId}`)
    return res.data
  },

  updateStatus: async (
    id: string,
    data: { status: ApplicationStatus; remarks?: string }
  ): Promise<Application> => {
    const res = await api.put(`/api/applications/${id}/status`, data)
    return res.data
  },
}
