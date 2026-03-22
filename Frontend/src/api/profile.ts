import api from '@/lib/axios'
import { User, ProfileForm } from '@/types'

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get('/api/profile')
    return res.data
  },

  updateProfile: async (data: Partial<ProfileForm>): Promise<User> => {
    const res = await api.put('/api/profile', data)
    return res.data
  },

  changePassword: async (data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> => {
    await api.put('/api/profile/password', data)
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await api.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
