import api from '@/lib/axios'
import { Scholarship, PageResponse, ScholarshipFilters, ScholarshipForm } from '@/types'
import { mapScholarshipResponse } from './mappers'

function mapScholarshipPage(response: PageResponse<any>): PageResponse<Scholarship> {
  return {
    ...response,
    content: Array.isArray(response.content) ? response.content.map(mapScholarshipResponse) : [],
  }
}

function toList(value: string, separatorPattern: RegExp): string[] {
  return value
    .split(separatorPattern)
    .map(item => item.trim())
    .filter(Boolean)
}

function toScholarshipPayload(data: ScholarshipForm) {
  return {
    name: data.name.trim(),
    provider: data.provider.trim(),
    description: data.description.trim(),
    country: data.country.trim(),
    degreeLevel: data.degreeLevel,
    fieldOfStudy: data.fieldOfStudy.trim(),
    fundingType: data.fundingType,
    fundingAmount: {
      min: Number(data.fundingAmount) || 0,
      max: Number(data.fundingAmount) || 0,
      currency: data.currency.trim() || 'USD',
    },
    deadline: `${data.deadline}T23:59:00`,
    eligibility: toList(data.eligibility, /\n+/),
    requirements: toList(data.requirements, /\n+/),
    applicationUrl: data.applicationUrl.trim() || undefined,
    featured: data.featured,
    active: true,
    tags: toList(data.tags, /,+/),
  }
}

export const scholarshipsApi = {
  getAll: async (filters: ScholarshipFilters = {}): Promise<PageResponse<Scholarship>> => {
    if (filters.search) {
      const res = await api.get(
        `/api/scholarships/search?q=${encodeURIComponent(filters.search)}&page=${filters.page ?? 0}&size=${filters.size ?? 20}`
      )
      return mapScholarshipPage(res.data)
    }

    const params = new URLSearchParams()
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.size !== undefined) params.set('size', String(filters.size))
    if (filters.country) params.set('country', filters.country)
    if (filters.degreeLevel) params.set('degreeLevel', filters.degreeLevel)
    if (filters.fundingType) params.set('fundingType', filters.fundingType)
    if (filters.featured !== undefined) params.set('featured', String(filters.featured))
    const res = await api.get(`/api/scholarships?${params.toString()}`)
    return mapScholarshipPage(res.data)
  },

  getById: async (id: string): Promise<Scholarship> => {
    const res = await api.get(`/api/scholarships/${id}`)
    return mapScholarshipResponse(res.data)
  },

  getFeatured: async (): Promise<Scholarship[]> => {
    const res = await api.get('/api/scholarships/featured')
    return Array.isArray(res.data) ? res.data.map(mapScholarshipResponse) : []
  },

  search: async (query: string, page = 0, size = 20): Promise<PageResponse<Scholarship>> => {
    const res = await api.get(`/api/scholarships/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`)
    return mapScholarshipPage(res.data)
  },

  create: async (data: ScholarshipForm): Promise<Scholarship> => {
    const res = await api.post('/api/scholarships', toScholarshipPayload(data))
    return mapScholarshipResponse(res.data)
  },

  update: async (id: string, data: Partial<ScholarshipForm>): Promise<Scholarship> => {
    const merged = {
      name: data.name ?? '',
      provider: data.provider ?? '',
      description: data.description ?? '',
      country: data.country ?? '',
      degreeLevel: data.degreeLevel!,
      fieldOfStudy: data.fieldOfStudy ?? '',
      fundingType: data.fundingType!,
      fundingAmount: data.fundingAmount ?? 0,
      currency: data.currency ?? 'USD',
      deadline: data.deadline ?? '',
      eligibility: data.eligibility ?? '',
      requirements: data.requirements ?? '',
      applicationUrl: data.applicationUrl ?? '',
      tags: data.tags ?? '',
      featured: data.featured ?? false,
    } as ScholarshipForm
    const res = await api.put(`/api/scholarships/${id}`, toScholarshipPayload(merged))
    return mapScholarshipResponse(res.data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/scholarships/${id}`)
  },
}
