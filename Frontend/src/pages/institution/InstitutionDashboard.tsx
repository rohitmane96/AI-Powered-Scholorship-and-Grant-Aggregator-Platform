import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { applicationsApi } from '@/api/applications'
import { scholarshipsApi } from '@/api/scholarships'
import { StatsCard } from '@/components/common/StatsCard'
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatus'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonStats } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'

const mockApplicationsByScholarship = [
  { name: 'Rhodes Scholarship', applications: 45 },
  { name: 'Fulbright Program', applications: 32 },
  { name: 'Gates Cambridge', applications: 28 },
  { name: 'Chevening', applications: 19 },
  { name: 'DAAD Fellowship', applications: 14 },
]

const mockApplicationsOverTime = [
  { month: 'Aug', applications: 12 },
  { month: 'Sep', applications: 19 },
  { month: 'Oct', applications: 27 },
  { month: 'Nov', applications: 34 },
  { month: 'Dec', applications: 22 },
  { month: 'Jan', applications: 41 },
  { month: 'Feb', applications: 55 },
  { month: 'Mar', applications: 48 },
]

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  color: '#f1f5f9',
}

export default function InstitutionDashboard() {
  const { data: scholarshipsPage, isLoading: scholarsLoading } = useQuery({
    queryKey: ['institution', 'scholarships'],
    queryFn: () => scholarshipsApi.getAll({ page: 0, size: 5 }),
  })

  const { data: applicationsPage, isLoading: appsLoading } = useQuery({
    queryKey: ['institution', 'applications'],
    queryFn: () => applicationsApi.getMyApplications(0, 8),
  })

  const scholarships = scholarshipsPage?.content ?? []
  const applications = applicationsPage?.content ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Institution Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your scholarships and applications</p>
      </div>

      {/* Stats */}
      {scholarsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Scholarships"
            value={scholarshipsPage?.totalElements ?? 0}
            icon={<BookOpen className="w-5 h-5" />}
            color="indigo"
          />
          <StatsCard
            title="Total Applications"
            value={applicationsPage?.totalElements ?? 0}
            icon={<Users className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="Active Scholarships"
            value={scholarships.filter(s => s.active).length}
            icon={<Zap className="w-5 h-5" />}
            color="emerald"
          />
          <StatsCard
            title="Avg Match Score"
            value={72}
            suffix="%"
            icon={<TrendingUp className="w-5 h-5" />}
            color="cyan"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Applications per scholarship */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-slate-100">Applications per Scholarship</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockApplicationsByScholarship}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
                axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
              <Bar dataKey="applications" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Applications over time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-slate-100">Applications Over Time</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockApplicationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Applications */}
      <div className="card-glass rounded-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-slate-100">Recent Applications</h2>
          <Badge variant="primary">{applicationsPage?.totalElements ?? 0} total</Badge>
        </div>

        {appsLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <EmptyState icon="📋" title="No applications yet" description="Applications will appear here when students apply." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Scholarship</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {applications.map((app, i) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm text-slate-200 font-medium">{app.scholarshipName}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">Student #{app.userId?.slice(-4)}</td>
                    <td className="px-5 py-3">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{formatDate(app.submittedAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
