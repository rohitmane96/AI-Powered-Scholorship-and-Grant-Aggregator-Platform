import api from '@/lib/axios'
import { Application, PageResponse, ApplicationStatus } from '@/types'
import { mapApplicationResponse } from './mappers'

function mapApplicationPage(response: PageResponse<any>): PageResponse<Application> {
  return {
    ...response,
    content: Array.isArray(response.content) ? response.content.map(mapApplicationResponse) : [],
  }
}

export const applicationsApi = {
  apply: async (data: {
    scholarshipId: string
    coverLetter: string
    documents: string[]
  }): Promise<Application> => {
    const res = await api.post('/api/applications', {
      scholarshipId: data.scholarshipId,
      notes: data.coverLetter,
    })
    return mapApplicationResponse(res.data)
  },

  getMyApplications: async (page = 0, size = 20): Promise<PageResponse<Application>> => {
    const res = await api.get(`/api/applications?page=${page}&size=${size}`)
    return mapApplicationPage(res.data)
  },

  getById: async (id: string): Promise<Application> => {
    const res = await api.get(`/api/applications/${id}`)
    return mapApplicationResponse(res.data)
  },

  withdraw: async (id: string): Promise<Application> => {
    const res = await api.delete(`/api/applications/${id}`)
    return mapApplicationResponse(res.data)
  },

  getByScholarship: async (
    scholarshipId: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Application>> => {
    const res = await api.get(
      `/api/applications/scholarship/${scholarshipId}?page=${page}&size=${size}`
    )
    return mapApplicationPage(res.data)
  },

  updateStatus: async (
    id: string,
    data: { status: ApplicationStatus; remarks?: string }
  ): Promise<Application> => {
    const res = await api.patch(`/api/applications/${id}/status`, {
      status: data.status,
      note: data.remarks,
    })
    return mapApplicationResponse(res.data)
  },
}
