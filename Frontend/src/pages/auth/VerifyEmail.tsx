import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/api/auth'

type VerificationState = 'loading' | 'success' | 'error'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('Verifying your email address...')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setState('error')
      setMessage('Verification link is missing a token. Request a new verification email and try again.')
      return
    }

    let cancelled = false

    authApi.verifyEmail(token)
      .then(() => {
        if (cancelled) {
          return
        }
        setState('success')
        setMessage('Your email has been verified. You can sign in now.')
        toast.success('Email verified successfully.')
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        const err = error as { response?: { data?: { message?: string } } }
        setState('error')
        setMessage(err?.response?.data?.message ?? 'This verification link is invalid or has already been used.')
      })

    return () => {
      cancelled = true
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
              🎓
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ScholarAI
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Email verification</h1>
          <p className="text-slate-400 text-sm mt-1">Confirm your account so you can continue securely.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8"
        >
          <div className="flex flex-col items-center text-center gap-4">
            {state === 'loading' && <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />}
            {state === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-400" />}
            {state === 'error' && <AlertCircle className="w-12 h-12 text-amber-400" />}

            <div>
              <p className="text-lg font-semibold text-slate-100">
                {state === 'loading' ? 'Checking your link' : state === 'success' ? 'Verification complete' : 'Verification failed'}
              </p>
              <p className="text-sm text-slate-400 mt-2">{message}</p>
            </div>

            {state === 'success' && (
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
                Go to login
              </Button>
            )}

            {state === 'error' && (
              <div className="w-full space-y-3">
                <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
                  Back to login
                </Button>
                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-800/40 rounded-xl p-3 text-left">
                  <MailCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>If the link expired, sign in and request another verification email from the app.</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
