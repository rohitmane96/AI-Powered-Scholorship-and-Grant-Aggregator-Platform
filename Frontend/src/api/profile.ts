import api from '@/lib/axios'
import { User, ProfileForm } from '@/types'
import { mapUserResponse } from './mappers'

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get('/api/profile')
    return mapUserResponse(res.data)
  },

  updateProfile: async (data: Partial<ProfileForm>): Promise<User> => {
    const res = await api.put('/api/profile', {
      fullName: [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || undefined,
      education: data.education,
      preferences: data.preferences,
      country: data.nationality,
    })
    return mapUserResponse(res.data)
  },

  changePassword: async (data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> => {
    await api.put('/api/users/me/password', data)
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/api/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return { avatarUrl: res.data }
  },
}
