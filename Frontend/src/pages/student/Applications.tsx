import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, MinusCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { applicationsApi } from '@/api/applications'
import { ApplicationStatus } from '@/types'
import { ApplicationStatusBadge, ApplicationTimeline } from '@/components/common/ApplicationStatus'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonRow } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatRelativeDate } from '@/lib/utils'

const tabs = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: ApplicationStatus.SUBMITTED },
  { label: 'Under Review', value: ApplicationStatus.UNDER_REVIEW },
  { label: 'Shortlisted', value: ApplicationStatus.SHORTLISTED },
  { label: 'Accepted', value: ApplicationStatus.ACCEPTED },
  { label: 'Rejected', value: ApplicationStatus.REJECTED },
]

export default function Applications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('')
  const [page, setPage] = useState(0)
  const [withdrawId, setWithdrawId] = useState<string | null>(null)
  const [detailApp, setDetailApp] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'my', page],
    queryFn: () => applicationsApi.getMyApplications(page, 10),
  })

  const withdrawMutation = useMutation({
    mutationFn: applicationsApi.withdraw,
    onSuccess: () => {
      toast.success('Application withdrawn.')
      setWithdrawId(null)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: () => toast.error('Failed to withdraw application.'),
  })

  const allApplications = data?.content ?? []
  const filtered = activeTab
    ? allApplications.filter(a => a.status === activeTab)
    : allApplications

  const totalPages = data?.totalPages ?? 0

  const { data: selectedApp } = useQuery({
    queryKey: ['applications', detailApp],
    queryFn: () => applicationsApi.getById(detailApp!),
    enabled: !!detailApp,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Applications</h1>
        <p className="text-slate-400 text-sm mt-1">Track and manage your scholarship applications</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(0) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.value
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
            {tab.value === '' && data?.totalElements != null && (
              <span className="ml-1.5 text-xs text-slate-500">({data.totalElements})</span>
            )}
          </button>
        ))}
      </div>

      {/* Applications list */}
      <div className="card-glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-800/50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📝"
            title={activeTab ? `No ${activeTab.toLowerCase().replace(/_/g, ' ')} applications` : 'No applications yet'}
            description="Browse scholarships and start applying!"
            action={{ label: 'Browse Scholarships', onClick: () => navigate('/scholarships') }}
          />
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filtered.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-5 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Scholarship info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 text-lg">
                        🎓
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100">{app.scholarshipName}</h3>
                        {app.scholarshipProvider && (
                          <p className="text-sm text-slate-400">{app.scholarshipProvider}</p>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 overflow-x-auto no-scrollbar">
                      <ApplicationTimeline status={app.status} />
                    </div>

                    {app.remarks && (
                      <p className="mt-3 text-sm text-slate-400 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <span className="font-medium text-slate-300">Remarks: </span>
                        {app.remarks}
                      </p>
                    )}
                  </div>

                  {/* Right side info */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <ApplicationStatusBadge status={app.status} />

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Submitted {formatDate(app.submittedAt)}
                      </div>
                      {app.updatedAt !== app.submittedAt && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Updated {formatRelativeDate(app.updatedAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDetailApp(app.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View
                      </Button>
                      {app.status === ApplicationStatus.SUBMITTED && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWithdrawId(app.id)}
                          leftIcon={<MinusCircle className="w-3.5 h-3.5" />}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}
            leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-slate-400 px-3">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            rightIcon={<ChevronRight className="w-4 h-4" />}>
            Next
          </Button>
        </div>
      )}

      {/* Withdraw confirmation modal */}
      <Modal
        open={!!withdrawId}
        onClose={() => setWithdrawId(null)}
        title="Withdraw Application"
        description="Are you sure? This action cannot be undone."
        size="sm"
      >
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setWithdrawId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={withdrawMutation.isPending}
            onClick={() => withdrawId && withdrawMutation.mutate(withdrawId)}
          >
            Yes, Withdraw
          </Button>
        </div>
      </Modal>

      {/* Application detail modal */}
      <Modal
        open={!!detailApp}
        onClose={() => setDetailApp(null)}
        title="Application Details"
        size="lg"
      >
        {selectedApp ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">{selectedApp.scholarshipName}</h3>
                {selectedApp.scholarshipProvider && (
                  <p className="text-sm text-slate-400">{selectedApp.scholarshipProvider}</p>
                )}
              </div>
              <ApplicationStatusBadge status={selectedApp.status} />
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2 font-medium">Cover Letter</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedApp.coverLetter}
              </p>
            </div>

            {selectedApp.remarks && (
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-400 mb-1 font-medium">Reviewer Remarks</p>
                <p className="text-sm text-slate-300">{selectedApp.remarks}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Submitted</p>
                <p className="text-slate-200">{formatDate(selectedApp.submittedAt)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Last Updated</p>
                <p className="text-slate-200">{formatRelativeDate(selectedApp.updatedAt)}</p>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setDetailApp(null)
                navigate(`/scholarships/${selectedApp.scholarshipId}`)
              }}
            >
              View Scholarship
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin" />
          </div>
        )}
      </Modal>
    </div>
  )
}
