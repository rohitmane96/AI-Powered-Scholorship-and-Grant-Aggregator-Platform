import api from '@/lib/axios'
import { Recommendation } from '@/types'

export const recommendationsApi = {
  getRecommendations: async (limit = 10): Promise<Recommendation[]> => {
    const res = await api.get(`/api/recommendations?limit=${limit}`)
    return res.data
  },
}
