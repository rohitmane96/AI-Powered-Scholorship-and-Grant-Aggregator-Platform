import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Upload,
  UserCircle,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { dashboardApi } from '@/api/dashboard'
import { recommendationsApi } from '@/api/recommendations'
import { applicationsApi } from '@/api/applications'
import { StatsCard } from '@/components/common/StatsCard'
import { ScholarshipCard } from '@/components/common/ScholarshipCard'
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatus'
import { DeadlineTimer } from '@/components/common/DeadlineTimer'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonStats, SkeletonCard } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatCurrency, truncate } from '@/lib/utils'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: myStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'my-stats'],
    queryFn: dashboardApi.getMyStats,
  })

  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations', 5],
    queryFn: () => recommendationsApi.getRecommendations(5),
  })

  const { data: applicationsPage, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', 'my', 0],
    queryFn: () => applicationsApi.getMyApplications(0, 5),
  })

  const applications = applicationsPage?.content ?? []

  const upcomingDeadlines = applications
    .filter(a => {
      if (!a.scholarshipDeadline) return false
      const days = Math.floor((new Date(a.scholarshipDeadline).getTime() - Date.now()) / 86400000)
      return days >= 0 && days <= 30
    })
    .sort((a, b) => new Date(a.scholarshipDeadline!).getTime() - new Date(b.scholarshipDeadline!).getTime())
    .slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/60 border border-indigo-500/20 p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome back, {user?.firstName}! 👋
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              You have {myStats?.pending ?? 0} applications under review. Keep pushing!
            </p>

            {user && (
              <div className="mt-4 max-w-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Profile Completion</span>
                  <span className="text-xs font-semibold text-indigo-300">
                    {user.profileCompletion ?? 0}%
                  </span>
                </div>
                <Progress
                  value={user.profileCompletion ?? 0}
                  size="sm"
                  color="gradient"
                />
                {(user.profileCompletion ?? 0) < 100 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Complete your profile to get better AI matches
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => navigate('/scholarships')}>
              Browse
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/recommendations')}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              AI Matches
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Applications Sent"
            value={myStats?.applied ?? 0}
            icon={<FileText className="w-5 h-5" />}
            color="indigo"
          />
          <StatsCard
            title="Under Review"
            value={myStats?.underReview ?? 0}
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title="Accepted"
            value={myStats?.accepted ?? 0}
            icon={<CheckCircle className="w-5 h-5" />}
            color="emerald"
          />
          <StatsCard
            title="Shortlisted"
            value={myStats?.shortlisted ?? 0}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
        </div>
      )}

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">AI Recommendations</h2>
            <Badge variant="cyan">
              <Sparkles className="w-3 h-3" /> Powered by AI
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/recommendations')}
            rightIcon={<ArrowRight className="w-4 h-4" />}>
            View all
          </Button>
        </div>

        {recsLoading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {recommendations.map((rec, i) => (
              <div key={rec.scholarship.id} className="w-72 shrink-0">
                <ScholarshipCard
                  scholarship={{ ...rec.scholarship, matchScore: rec.matchScore, scoreBreakdown: rec.scoreBreakdown }}
                  onApply={() => navigate(`/scholarships/${rec.scholarship.id}`)}
                  delay={i * 0.05}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="✨"
            title="No recommendations yet"
            description="Complete your profile to get personalized AI scholarship recommendations."
            action={{ label: 'Complete Profile', onClick: () => navigate('/profile') }}
          />
        )}
      </div>

      {/* Bottom two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card-glass rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h2 className="font-bold text-slate-100">Recent Applications</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/applications')}
              rightIcon={<ArrowRight className="w-4 h-4" />}>
              View all
            </Button>
          </div>

          {appsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No applications yet"
              description="Browse scholarships and start applying!"
              action={{ label: 'Browse Scholarships', onClick: () => navigate('/scholarships') }}
            />
          ) : (
            <div className="divide-y divide-slate-800/50">
              {applications.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
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

        {/* Upcoming Deadlines */}
        <div className="card-glass rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h2 className="font-bold text-slate-100">Upcoming Deadlines</h2>
            <Badge variant="warning">
              <Calendar className="w-3 h-3" /> {upcomingDeadlines.length} soon
            </Badge>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No upcoming deadlines"
              description="Apply to scholarships to track their deadlines here."
            />
          ) : (
            <div className="divide-y divide-slate-800/50">
              {upcomingDeadlines.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{app.scholarshipName}</p>
                    <p className="text-xs text-slate-500">{formatDate(app.scholarshipDeadline!)}</p>
                  </div>
                  {app.scholarshipDeadline && (
                    <DeadlineTimer deadline={app.scholarshipDeadline} compact showIcon={false} />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Browse Scholarships', icon: <Zap className="w-5 h-5" />, color: 'text-indigo-400 bg-indigo-500/10', path: '/scholarships' },
          { label: 'AI Recommendations', icon: <Sparkles className="w-5 h-5" />, color: 'text-cyan-400 bg-cyan-500/10', path: '/recommendations' },
          { label: 'Upload Document', icon: <Upload className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/10', path: '/documents' },
          { label: 'Update Profile', icon: <UserCircle className="w-5 h-5" />, color: 'text-purple-400 bg-purple-500/10', path: '/profile' },
        ].map((action, i) => (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-200 group"
          >
            <div className={`p-2.5 rounded-xl ${action.color} group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors text-center">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
