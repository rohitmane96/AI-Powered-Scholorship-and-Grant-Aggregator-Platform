import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import * as Tabs from '@radix-ui/react-tabs'
import { Camera, User, GraduationCap, Settings, Lock, Save } from 'lucide-react'
import { profileApi } from '@/api/profile'
import { useAuthStore } from '@/store/authStore'
import { DegreeLevel, FundingType } from '@/types'
import { formatDegreeLevel, formatFundingType, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { NativeSelect } from '@/components/ui/Select'
import { Progress } from '@/components/ui/Progress'
import { PageSpinner } from '@/components/ui/Spinner'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
})

const educationSchema = z.object({
  level: z.nativeEnum(DegreeLevel),
  fieldOfStudy: z.string().min(1, 'Required'),
  currentGPA: z.number().min(0).max(10).or(z.string().transform(Number)),
  institution: z.string().min(1, 'Required'),
  graduationYear: z.number().min(2000).max(2040).or(z.string().transform(Number)),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type EducationFormData = z.infer<typeof educationSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

const degreeLevelOptions = Object.values(DegreeLevel).map(v => ({ value: v, label: formatDegreeLevel(v) }))

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('basic')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '',
      nationality: profile?.nationality ?? '',
    },
  })

  const educationForm = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    values: {
      level: profile?.education?.level ?? DegreeLevel.UNDERGRADUATE,
      fieldOfStudy: profile?.education?.fieldOfStudy ?? '',
      currentGPA: profile?.education?.currentGPA ?? 0,
      institution: profile?.education?.institution ?? '',
      graduationYear: profile?.education?.graduationYear ?? new Date().getFullYear() + 1,
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const profileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      toast.success('Profile updated!')
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error('Update failed.'),
  })

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      profileApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success('Password changed successfully!')
      passwordForm.reset()
    },
    onError: () => toast.error('Current password is incorrect.'),
  })

  const avatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (data) => {
      toast.success('Avatar updated!')
      updateUser({ avatarUrl: data.avatarUrl })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error('Avatar upload failed.'),
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    avatarMutation.mutate(file)
  }

  if (isLoading) return <PageSpinner />

  const displayUser = profile ?? user

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile & Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Profile completion */}
      <div className="card-glass p-5">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold cursor-pointer overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview || displayUser?.avatarUrl ? (
                <img
                  src={avatarPreview ?? displayUser?.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(displayUser?.firstName ?? 'U', displayUser?.lastName ?? 'U')
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center cursor-pointer hover:bg-indigo-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1">
            <p className="font-semibold text-slate-100">
              {displayUser?.firstName} {displayUser?.lastName}
            </p>
            <p className="text-sm text-slate-400">{displayUser?.email}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Profile Completion</span>
            <span className="font-semibold text-indigo-300">{displayUser?.profileCompletion ?? 0}%</span>
          </div>
          <Progress value={displayUser?.profileCompletion ?? 0} size="md" color="gradient" />
          {(displayUser?.profileCompletion ?? 0) < 100 && (
            <p className="text-xs text-slate-500">
              Complete your profile to get better AI-powered scholarship matches
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-1.5 overflow-x-auto no-scrollbar">
          {[
            { value: 'basic', label: 'Basic Info', icon: User },
            { value: 'education', label: 'Education', icon: GraduationCap },
            { value: 'preferences', label: 'Preferences', icon: Settings },
            { value: 'security', label: 'Security', icon: Lock },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>

        {/* Basic Info */}
        <Tabs.Content value="basic">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass p-6"
          >
            <form onSubmit={profileForm.handleSubmit(data => profileMutation.mutate(data))} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  error={profileForm.formState.errors.firstName?.message}
                  {...profileForm.register('firstName')}
                />
                <Input
                  label="Last Name"
                  error={profileForm.formState.errors.lastName?.message}
                  {...profileForm.register('lastName')}
                />
              </div>
              <Textarea
                label="Bio"
                placeholder="Tell us about yourself..."
                rows={3}
                error={profileForm.formState.errors.bio?.message}
                {...profileForm.register('bio')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone" placeholder="+91 9876543210" {...profileForm.register('phone')} />
                <Input label="Nationality" placeholder="Indian" {...profileForm.register('nationality')} />
              </div>
              <Button type="submit" variant="primary" isLoading={profileMutation.isPending}
                leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </form>
          </motion.div>
        </Tabs.Content>

        {/* Education */}
        <Tabs.Content value="education">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-glass p-6">
            <form
              onSubmit={educationForm.handleSubmit(data =>
                profileMutation.mutate({ education: data as unknown as typeof data })
              )}
              className="space-y-5"
            >
              <NativeSelect
                label="Degree Level"
                options={degreeLevelOptions}
                error={educationForm.formState.errors.level?.message}
                {...educationForm.register('level')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Field of Study"
                  placeholder="Computer Science"
                  error={educationForm.formState.errors.fieldOfStudy?.message}
                  {...educationForm.register('fieldOfStudy')}
                />
                <Input
                  label="Institution"
                  placeholder="Your university"
                  error={educationForm.formState.errors.institution?.message}
                  {...educationForm.register('institution')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Current GPA"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="8.5"
                  error={educationForm.formState.errors.currentGPA?.message}
                  hint="Out of 10"
                  {...educationForm.register('currentGPA', { valueAsNumber: true })}
                />
                <Input
                  label="Graduation Year"
                  type="number"
                  min="2000"
                  max="2040"
                  placeholder="2025"
                  error={educationForm.formState.errors.graduationYear?.message}
                  {...educationForm.register('graduationYear', { valueAsNumber: true })}
                />
              </div>
              <Button type="submit" variant="primary" isLoading={profileMutation.isPending}
                leftIcon={<Save className="w-4 h-4" />}>
                Save Education
              </Button>
            </form>
          </motion.div>
        </Tabs.Content>

        {/* Preferences */}
        <Tabs.Content value="preferences">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-glass p-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Target Countries</label>
                <Input
                  placeholder="USA, UK, Germany, Australia..."
                  defaultValue={displayUser?.preferences?.targetCountries?.join(', ')}
                  hint="Comma-separated list of countries"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Preferred Funding Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(FundingType).map(ft => (
                    <label key={ft} className="flex items-center gap-2 p-3 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked={displayUser?.preferences?.fundingTypes?.includes(ft)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
                      />
                      <span className="text-sm text-slate-300">{formatFundingType(ft)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-3">Notification Preferences</label>
                <div className="space-y-2">
                  {[
                    { label: 'Email notifications', key: 'email' },
                    { label: 'Deadline reminders', key: 'deadlineReminder' },
                    { label: 'New scholarship matches', key: 'newMatches' },
                  ].map(pref => (
                    <label key={pref.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                      <span className="text-sm text-slate-300">{pref.label}</span>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Preferences
              </Button>
            </div>
          </motion.div>
        </Tabs.Content>

        {/* Security */}
        <Tabs.Content value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-glass p-6">
            <h3 className="font-semibold text-slate-100 mb-4">Change Password</h3>
            <form
              onSubmit={passwordForm.handleSubmit(({ currentPassword, newPassword }) =>
                passwordMutation.mutate({ currentPassword, newPassword })
              )}
              className="space-y-4"
            >
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min. 8 characters"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              <Button type="submit" variant="primary" isLoading={passwordMutation.isPending}
                leftIcon={<Lock className="w-4 h-4" />}>
                Update Password
              </Button>
            </form>
          </motion.div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
