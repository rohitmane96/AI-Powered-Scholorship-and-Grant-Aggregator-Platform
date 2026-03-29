import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { applicationsApi } from '@/api/applications'
import { institutionsApi } from '@/api/institutions'
import { ApplicationStatus } from '@/types'
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatus'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { NativeSelect } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonRow } from '@/components/ui/Spinner'
import { formatDate, formatRelativeDate, formatApplicationStatus } from '@/lib/utils'

const statusOptions = [
  { value: ApplicationStatus.UNDER_REVIEW, label: 'Under Review' },
  { value: ApplicationStatus.SHORTLISTED, label: 'Shortlisted' },
  { value: ApplicationStatus.ACCEPTED, label: 'Accepted' },
  { value: ApplicationStatus.REJECTED, label: 'Rejected' },
]

export default function ViewApplications() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(ApplicationStatus.UNDER_REVIEW)
  const [remarks, setRemarks] = useState('')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [scholarshipId, setScholarshipId] = useState('')

  const { data: scholarshipsPage } = useQuery({
    queryKey: ['institution', 'my-scholarships', 'selector'],
    queryFn: () => institutionsApi.getMyScholarships(0, 100),
  })

  const scholarships = scholarshipsPage?.content ?? []
  const selectedScholarshipId = scholarshipId || scholarships[0]?.id || ''

  const { data, isLoading } = useQuery({
    queryKey: ['institution', 'all-applications', selectedScholarshipId, page],
    queryFn: () => applicationsApi.getByScholarship(selectedScholarshipId, page, 10),
    enabled: !!selectedScholarshipId,
  })

  const { data: appDetail } = useQuery({
    queryKey: ['applications', selectedApp],
    queryFn: () => applicationsApi.getById(selectedApp!),
    enabled: !!selectedApp && reviewModalOpen,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: ApplicationStatus; remarks: string }) =>
      applicationsApi.updateStatus(id, { status, remarks }),
    onSuccess: () => {
      toast.success(`Application status updated to ${formatApplicationStatus(newStatus)}!`)
      setReviewModalOpen(false)
      setSelectedApp(null)
      setRemarks('')
      queryClient.invalidateQueries({ queryKey: ['institution', 'all-applications'] })
    },
    onError: () => toast.error('Failed to update status.'),
  })

  const applications = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Review Applications</h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.totalElements ?? 0} total applications
        </p>
      </div>

      <NativeSelect
        label="Scholarship"
        value={selectedScholarshipId}
        onChange={e => setScholarshipId(e.target.value)}
        options={scholarships.map(s => ({ value: s.id, label: s.name }))}
      />

      <div className="card-glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-800/50">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : !selectedScholarshipId ? (
          <EmptyState icon="🎓" title="No scholarships found" description="Create a scholarship before reviewing applications." />
        ) : applications.length === 0 ? (
          <EmptyState icon="📋" title="No applications yet" description="Applications will appear here when students apply to your scholarships." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Scholarship', 'Submitted', 'Status', 'Match Score', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3">{h}</th>
                  ))}
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
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-200">{app.scholarshipName}</p>
                      <p className="text-xs text-slate-500">{formatRelativeDate(app.submittedAt)}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{formatDate(app.submittedAt)}</td>
                    <td className="px-5 py-3">
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3">
                      {app.matchScore !== undefined ? (
                        <span className={`text-sm font-bold ${app.matchScore >= 70 ? 'text-emerald-400' : app.matchScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {Math.round(app.matchScore)}%
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app.id)
                          setNewStatus(app.status === ApplicationStatus.SUBMITTED ? ApplicationStatus.UNDER_REVIEW : app.status)
                          setReviewModalOpen(true)
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Review
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}
            leftIcon={<ChevronLeft className="w-4 h-4" />}>Previous</Button>
          <span className="flex items-center text-sm text-slate-400 px-3">Page {page + 1} of {totalPages}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            rightIcon={<ChevronRight className="w-4 h-4" />}>Next</Button>
        </div>
      )}

      {/* Review modal */}
      <Modal open={reviewModalOpen} onClose={() => { setReviewModalOpen(false); setSelectedApp(null) }}
        title="Review Application" size="lg">
        {appDetail ? (
          <div className="space-y-5">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1 font-medium">Scholarship</p>
              <p className="text-slate-200 font-semibold">{appDetail.scholarshipName}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2 font-medium">Cover Letter</p>
              <p className="text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">
                {appDetail.coverLetter}
              </p>
            </div>

            <NativeSelect
              label="Update Status"
              options={statusOptions}
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as ApplicationStatus)}
            />

            <Textarea
              label="Remarks (Optional)"
              placeholder="Add feedback or notes for the applicant..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
            />

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setReviewModalOpen(false); setSelectedApp(null) }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                isLoading={updateStatusMutation.isPending}
                onClick={() => selectedApp && updateStatusMutation.mutate({ id: selectedApp, status: newStatus, remarks })}
              >
                Update Status
              </Button>
            </div>
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
