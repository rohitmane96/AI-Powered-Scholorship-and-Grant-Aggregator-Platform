import api from '@/lib/axios'
import { Scholarship, PageResponse, ScholarshipFilters, ScholarshipForm } from '@/types'

export const scholarshipsApi = {
  getAll: async (filters: ScholarshipFilters = {}): Promise<PageResponse<Scholarship>> => {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    if (filters.search) params.set('search', filters.search)
    if (filters.country) params.set('country', filters.country)
    if (filters.degreeLevel) params.set('degreeLevel', filters.degreeLevel)
    if (filters.fundingType) params.set('fundingType', filters.fundingType)
    if (filters.featured !== undefined) params.set('featured', String(filters.featured))
    const res = await api.get(`/api/scholarships?${params.toString()}`)
    return res.data
  },

  getById: async (id: string): Promise<Scholarship> => {
    const res = await api.get(`/api/scholarships/${id}`)
    return res.data
  },

  getFeatured: async (): Promise<Scholarship[]> => {
    const res = await api.get('/api/scholarships/featured')
    return res.data
  },

  search: async (query: string, page = 0, size = 20): Promise<PageResponse<Scholarship>> => {
    const res = await api.get(`/api/scholarships/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`)
    return res.data
  },

  create: async (data: ScholarshipForm): Promise<Scholarship> => {
    const res = await api.post('/api/scholarships', data)
    return res.data
  },

  update: async (id: string, data: Partial<ScholarshipForm>): Promise<Scholarship> => {
    const res = await api.put(`/api/scholarships/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/scholarships/${id}`)
  },
}
