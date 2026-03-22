import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Eye,
  Share2,
  ExternalLink,
  CheckCircle2,
  Zap,
  Globe,
  GraduationCap,
  DollarSign,
  Tag,
  Star,
  FileText,
} from 'lucide-react'
import { scholarshipsApi } from '@/api/scholarships'
import { applicationsApi } from '@/api/applications'
import { documentsApi } from '@/api/documents'
import { ScoreBreakdown } from '@/components/common/ScoreBreakdown'
import { DeadlineTimer } from '@/components/common/DeadlineTimer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  formatDate,
  formatDegreeLevel,
  formatFundingType,
  formatCurrency,
  getCountryFlag,
  getDaysUntilDeadline,
  getDeadlineBadgeClass,
} from '@/lib/utils'

const applySchema = z.object({
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters').max(5000),
  documentIds: z.array(z.string()),
})
type ApplyFormData = z.infer<typeof applySchema>

export default function ScholarshipDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  const { data: scholarship, isLoading } = useQuery({
    queryKey: ['scholarships', id],
    queryFn: () => scholarshipsApi.getById(id!),
    enabled: !!id,
  })

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getDocuments,
  })

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: { coverLetter: '', documentIds: [] },
  })

  const coverLetterLength = watch('coverLetter')?.length ?? 0

  const applyMutation = useMutation({
    mutationFn: (data: ApplyFormData) =>
      applicationsApi.apply({ scholarshipId: id!, coverLetter: data.coverLetter, documents: data.documentIds }),
    onSuccess: () => {
      toast.success('Application submitted successfully!')
      setApplyModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message ?? 'Failed to submit application')
    },
  })

  function onApply(data: ApplyFormData) {
    applyMutation.mutate(data)
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  if (isLoading) return <PageSpinner />
  if (!scholarship) return (
    <div className="text-center py-20 text-slate-400">Scholarship not found.</div>
  )

  const daysLeft = getDaysUntilDeadline(scholarship.deadline)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
        Back to Scholarships
      </Button>

      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900/80 border border-slate-700/50 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            {scholarship.featured && (
              <Badge variant="gold">
                <Star className="w-3 h-3 fill-amber-400" /> Featured
              </Badge>
            )}
            <Badge variant={daysLeft <= 7 ? 'danger' : daysLeft <= 30 ? 'warning' : 'success'}>
              <Calendar className="w-3 h-3" />
              {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
            </Badge>
            {!scholarship.active && <Badge variant="default">Inactive</Badge>}
          </div>

          <h1 className="text-3xl font-black text-white mb-2">{scholarship.name}</h1>
          <p className="text-slate-300 text-lg mb-4">{scholarship.provider}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {getCountryFlag(scholarship.country)} {scholarship.country}
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {scholarship.viewCount?.toLocaleString()} views
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {scholarship.applicationCount?.toLocaleString()} applied
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold text-slate-100 mb-4">About This Scholarship</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{scholarship.description}</p>
          </div>

          {/* Eligibility */}
          <div className="card-glass p-6">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Eligibility Criteria
            </h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{scholarship.eligibility}</p>
          </div>

          {/* Requirements */}
          {scholarship.requirements && scholarship.requirements.length > 0 && (
            <div className="card-glass p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Required Documents
              </h2>
              <ul className="space-y-2">
                {scholarship.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {scholarship.tags && scholarship.tags.length > 0 && (
            <div className="card-glass p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-400" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {scholarship.tags.map(tag => (
                  <Badge key={tag} variant="purple">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — sticky apply card */}
        <div className="space-y-4">
          <div className="card-glass p-6 lg:sticky lg:top-24 space-y-5">
            {/* Funding amount */}
            {scholarship.fundingAmount > 0 && (
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-slate-400 mb-1">Funding Amount</p>
                <p className="text-3xl font-black text-emerald-400">
                  {formatCurrency(scholarship.fundingAmount, scholarship.currency)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{formatFundingType(scholarship.fundingType)}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="space-y-3">
              {[
                { icon: GraduationCap, label: 'Degree Level', value: formatDegreeLevel(scholarship.degreeLevel) },
                { icon: Globe, label: 'Country', value: `${getCountryFlag(scholarship.country)} ${scholarship.country}` },
                { icon: DollarSign, label: 'Funding Type', value: formatFundingType(scholarship.fundingType) },
                { icon: Calendar, label: 'Deadline', value: formatDate(scholarship.deadline) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <span className="text-slate-200 font-medium text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>

            {/* Deadline timer */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">Time Remaining</p>
              <DeadlineTimer deadline={scholarship.deadline} />
            </div>

            {/* AI Score */}
            {scholarship.matchScore !== undefined && scholarship.scoreBreakdown && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <ScoreBreakdown
                  score={scholarship.matchScore}
                  breakdown={scholarship.scoreBreakdown}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setApplyModalOpen(true)}
                disabled={daysLeft < 0 || !scholarship.active}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                {daysLeft < 0 ? 'Deadline Passed' : 'Apply Now'}
              </Button>

              {scholarship.applicationUrl && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => window.open(scholarship.applicationUrl, '_blank')}
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Official Website
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleShare}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      <Modal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Scholarship"
        description={scholarship.name}
        size="lg"
      >
        <form onSubmit={handleSubmit(onApply)} className="space-y-5">
          <Textarea
            label="Cover Letter"
            placeholder="Tell the scholarship committee about yourself, your goals, and why you deserve this scholarship..."
            rows={8}
            error={errors.coverLetter?.message}
            hint={`${coverLetterLength}/5000 characters (minimum 100)`}
            {...register('coverLetter')}
          />

          {documents && documents.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Attach Documents
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {documents.map(doc => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={doc.id}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
                      {...register('documentIds')}
                    />
                    <span className="text-sm text-slate-300">{doc.name}</span>
                    <Badge variant="default" className="ml-auto">{doc.type}</Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={applyMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
