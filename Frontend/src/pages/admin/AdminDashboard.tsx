import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Users,
  GraduationCap,
  FileText,
  Activity,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { dashboardApi, adminApi } from '@/api/dashboard'
import { StatsCard } from '@/components/common/StatsCard'
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatus'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonStats } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatUserRole } from '@/lib/utils'
import { ApplicationStatus, UserRole } from '@/types'

const applicationStatusData = [
  { name: 'Submitted', value: 45, color: '#6366f1' },
  { name: 'Under Review', value: 30, color: '#f59e0b' },
  { name: 'Shortlisted', value: 15, color: '#a855f7' },
  { name: 'Accepted', value: 20, color: '#10b981' },
  { name: 'Rejected', value: 25, color: '#f43f5e' },
]

const platformGrowth = [
  { month: 'Aug', users: 120, scholarships: 45 },
  { month: 'Sep', users: 180, scholarships: 52 },
  { month: 'Oct', users: 250, scholarships: 68 },
  { month: 'Nov', users: 320, scholarships: 75 },
  { month: 'Dec', users: 280, scholarships: 80 },
  { month: 'Jan', users: 410, scholarships: 95 },
  { month: 'Feb', users: 520, scholarships: 110 },
  { month: 'Mar', users: 640, scholarships: 128 },
]

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  color: '#f1f5f9',
}

const roleColors: Record<string, string> = {
  [UserRole.STUDENT]: 'primary',
  [UserRole.INSTITUTION]: 'purple',
  [UserRole.ADMIN]: 'danger',
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: dashboardApi.getStats,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 0],
    queryFn: () => adminApi.getUsers(0, 8),
  })

  const { data: appsData } = useQuery({
    queryKey: ['admin', 'applications', 0],
    queryFn: () => adminApi.getAdminApplications(0, 5),
  })

  const toggleUserMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      adminApi.updateUserStatus(userId, active),
    onSuccess: () => {
      toast.success('User status updated.')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Failed to update user status.'),
  })

  const users = usersData?.content ?? []
  const applications = appsData?.content ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-7 h-7 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">Platform-wide overview and management</p>
        </div>
      </div>

      {/* System health indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
      >
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-300">All Systems Operational</p>
          <p className="text-xs text-slate-400">API healthy · WebSocket connected · Database responding</p>
        </div>
        <Badge variant="success">
          <Activity className="w-3 h-3" /> 99.9% Uptime
        </Badge>
      </motion.div>

      {/* Stats */}
      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<Users className="w-5 h-5" />}
            color="indigo"
            trend={{ value: 12, label: 'vs last month' }}
          />
          <StatsCard
            title="Total Scholarships"
            value={stats?.totalScholarships ?? 0}
            icon={<GraduationCap className="w-5 h-5" />}
            color="purple"
            trend={{ value: 8 }}
          />
          <StatsCard
            title="Total Applications"
            value={stats?.totalApplications ?? 0}
            icon={<FileText className="w-5 h-5" />}
            color="emerald"
            trend={{ value: 23 }}
          />
          <StatsCard
            title="Active Scholarships"
            value={stats?.activeScholarships ?? 0}
            icon={<Activity className="w-5 h-5" />}
            color="cyan"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Application status pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-6"
        >
          <h2 className="font-bold text-slate-100 mb-6">Applications by Status</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={applicationStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {applicationStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {applicationStatusData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Platform growth area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-slate-100">Platform Growth</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={platformGrowth}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="scholarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#userGrad)" name="Users" />
              <Area type="monotone" dataKey="scholarships" stroke="#06b6d4" strokeWidth={2} fill="url(#scholarGrad)" name="Scholarships" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h2 className="font-bold text-slate-100">Recent Users</h2>
            <Badge variant="primary">{usersData?.totalElements ?? 0} total</Badge>
          </div>
          {usersLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon="👥" title="No users yet" />
          ) : (
            <div className="divide-y divide-slate-800/50">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/20"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                    {user.firstName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleColors[user.role] as 'primary' | 'purple' | 'danger'}>
                      {formatUserRole(user.role)}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h2 className="font-bold text-slate-100">Recent Applications</h2>
            <Badge variant="cyan">{appsData?.totalElements ?? 0} total</Badge>
          </div>
          {applications.length === 0 ? (
            <EmptyState icon="📝" title="No applications yet" />
          ) : (
            <div className="divide-y divide-slate-800/50">
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{app.scholarshipName}</p>
                    <p className="text-xs text-slate-500">{formatDate(app.submittedAt)}</p>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
