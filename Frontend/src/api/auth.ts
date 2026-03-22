import api from '@/lib/axios'
import { AuthResponse } from '@/types'

export const authApi = {
  register: async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
  }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/register', data)
    return res.data
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', data)
    return res.data
  },

  refresh: async (refreshToken: string): Promise<{ token: string }> => {
    const res = await api.post('/api/auth/refresh', { refreshToken })
    return res.data
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post(`/api/auth/verify-email?token=${token}`)
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/api/auth/forgot-password', { email })
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<void> => {
    await api.post('/api/auth/reset-password', data)
  },
}
