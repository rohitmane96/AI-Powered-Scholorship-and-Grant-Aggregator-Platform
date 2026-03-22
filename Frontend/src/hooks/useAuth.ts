import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { UserRole } from '@/types'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken)
      toast.success(`Welcome back, ${data.user.firstName}!`)

      switch (data.user.role) {
        case UserRole.ADMIN:
          navigate('/admin/dashboard')
          break
        case UserRole.INSTITUTION:
          navigate('/institution/dashboard')
          break
        default:
          navigate('/dashboard')
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'Login failed. Please check your credentials.')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken)
      toast.success('Account created successfully! Welcome to ScholarAI.')

      switch (data.user.role) {
        case UserRole.INSTITUTION:
          navigate('/institution/dashboard')
          break
        default:
          navigate('/dashboard')
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'Registration failed. Please try again.')
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return () => {
    authApi.logout().catch(() => {})
    logout()
    navigate('/login')
    toast.success('Logged out successfully.')
  }
}
