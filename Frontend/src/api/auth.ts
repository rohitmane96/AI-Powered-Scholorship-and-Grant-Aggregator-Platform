import api from '@/lib/axios'
import { AuthResponse } from '@/types'
import { mapUserResponse } from './mappers'

export const authApi = {
  register: async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
    institutionName?: string
    institutionType?: string
    country?: string
  }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/register', {
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      password: data.password,
      role: data.role,
      institutionName: data.institutionName,
      institutionType: data.institutionType,
      country: data.country,
    })
    return {
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: mapUserResponse(res.data),
    }
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', data)
    return {
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: mapUserResponse(res.data),
    }
  },

  refresh: async (refreshToken: string): Promise<{ token: string }> => {
    const res = await api.post('/api/auth/refresh', { refreshToken })
    return res.data
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/api/auth/verify-email', { token })
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/api/auth/forgot-password', { email })
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<void> => {
    await api.post('/api/auth/reset-password', data)
  },
}
