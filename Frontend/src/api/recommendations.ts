import api from '@/lib/axios'
import { Recommendation } from '@/types'
import { mapRecommendationResponse } from './mappers'

export const recommendationsApi = {
  getRecommendations: async (limit = 10): Promise<Recommendation[]> => {
    const res = await api.get(`/api/scholarships/recommendations?limit=${limit}`)
    const payload = Array.isArray(res.data?.data) ? res.data.data : []
    return payload.map(mapRecommendationResponse)
  },
}
