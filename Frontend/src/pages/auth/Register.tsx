import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, GraduationCap, Building2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRegister } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole),
  institutionName: z.string().optional(),
  institutionType: z.string().optional(),
  country: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  if (data.role === UserRole.INSTITUTION) {
    if (!data.institutionName || data.institutionName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Institution name is required',
        path: ['institutionName'],
      })
    }

    if (!data.institutionType || data.institutionType.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Institution type is required',
        path: ['institutionType'],
      })
    }

    if (!data.country || data.country.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Country is required',
        path: ['country'],
      })
    }
  }
})

type RegisterFormData = z.infer<typeof registerSchema>

const roles = [
  {
    value: UserRole.STUDENT,
    label: 'Student',
    description: 'Find and apply for scholarships',
    icon: GraduationCap,
    color: 'indigo',
  },
  {
    value: UserRole.INSTITUTION,
    label: 'Institution',
    description: 'Post scholarships and manage applications',
    icon: Building2,
    color: 'purple',
  },
]

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: register, isPending } = useRegister()

  const {
    register: registerField,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: UserRole.STUDENT },
  })

  const selectedRole = watch('role')

  function onSubmit(data: RegisterFormData) {
    register(data)
  }

  const submitRegister = handleSubmit(onSubmit)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
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
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Start finding scholarships in minutes</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8"
        >
          <form onSubmit={submitRegister} noValidate className="space-y-5">
            {/* Role selection */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(role => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.value
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setValue('role', role.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <div>
                        <p className="text-sm font-semibold">{role.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{role.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...registerField('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...registerField('lastName')}
              />
            </div>

            {selectedRole === UserRole.INSTITUTION && (
              <>
                <Input
                  label="Institution Name"
                  placeholder="Massachusetts Institute of Technology"
                  error={errors.institutionName?.message}
                  {...registerField('institutionName')}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Institution Type"
                    placeholder="University"
                    error={errors.institutionType?.message}
                    {...registerField('institutionType')}
                  />
                  <Input
                    label="Country"
                    placeholder="US"
                    error={errors.country?.message}
                    {...registerField('country')}
                  />
                </div>
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...registerField('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              hint="Must be at least 8 characters"
              rightIcon={
                <button type="button" onClick={() => setShowPassword(prev => !prev)} className="text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...registerField('password')}
            />

            <Input
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(prev => !prev)} className="text-slate-400 hover:text-slate-200">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...registerField('confirmPassword')}
            />

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-800/40 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                By creating an account, you agree to our{' '}
                <a href="#" className="text-indigo-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-400 hover:underline">Privacy Policy</a>.
                Your data is encrypted and secure.
              </span>
            </div>

            <Button
              type="submit"
              onClick={submitRegister}
              variant="primary"
              size="lg"
              isLoading={isPending}
              className="w-full"
            >
              {isPending ? 'Creating account...' : 'Create Free Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
