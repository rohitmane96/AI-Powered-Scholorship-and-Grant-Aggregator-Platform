import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { institutionsApi } from '@/api/institutions'
import { scholarshipsApi } from '@/api/scholarships'
import { DegreeLevel, FundingType, ScholarshipForm } from '@/types'
import { formatDegreeLevel, formatFundingType, formatDate, formatCurrency, getDaysUntilDeadline, getDeadlineColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { NativeSelect } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonRow } from '@/components/ui/Spinner'

const scholarshipSchema = z.object({
  name: z.string().min(5, 'Required'),
  provider: z.string().min(2, 'Required'),
  description: z.string().min(50, 'Min 50 characters'),
  country: z.string().min(2, 'Required'),
  degreeLevel: z.nativeEnum(DegreeLevel),
  fieldOfStudy: z.string().min(2, 'Required'),
  fundingType: z.nativeEnum(FundingType),
  fundingAmount: z.number().min(0).or(z.string().transform(Number)),
  currency: z.string().default('USD'),
  deadline: z.string().min(1, 'Required'),
  eligibility: z.string().min(20, 'Min 20 characters'),
  requirements: z.string().default(''),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  tags: z.string().default(''),
  featured: z.boolean().default(false),
})

type ScholarshipFormData = z.infer<typeof scholarshipSchema>

const degreeLevelOptions = Object.values(DegreeLevel).map(v => ({ value: v, label: formatDegreeLevel(v) }))
const fundingTypeOptions = Object.values(FundingType).map(v => ({ value: v, label: formatFundingType(v) }))

export default function ManageScholarships() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['institution', 'my-scholarships', page],
    queryFn: () => institutionsApi.getMyScholarships(page, 10),
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ScholarshipFormData>({
    resolver: zodResolver(scholarshipSchema),
    defaultValues: {
      degreeLevel: DegreeLevel.UNDERGRADUATE,
      fundingType: FundingType.FULL_FUNDING,
      currency: 'USD',
      featured: false,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ScholarshipFormData) => scholarshipsApi.create(data as unknown as ScholarshipForm),
    onSuccess: () => {
      toast.success('Scholarship created!')
      setFormOpen(false)
      reset()
      queryClient.invalidateQueries({ queryKey: ['institution'] })
    },
    onError: () => toast.error('Failed to create scholarship.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScholarshipFormData }) =>
      scholarshipsApi.update(id, data as unknown as Partial<ScholarshipForm>),
    onSuccess: () => {
      toast.success('Scholarship updated!')
      setEditId(null)
      setFormOpen(false)
      reset()
      queryClient.invalidateQueries({ queryKey: ['institution'] })
    },
    onError: () => toast.error('Update failed.'),
  })

  const deleteMutation = useMutation({
    mutationFn: scholarshipsApi.delete,
    onSuccess: () => {
      toast.success('Scholarship deleted.')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['institution'] })
    },
    onError: () => toast.error('Delete failed.'),
  })

  const scholarships = data?.content ?? []

  function openCreate() {
    reset()
    setEditId(null)
    setFormOpen(true)
  }

  function openEdit(scholarship: typeof scholarships[0]) {
    setEditId(scholarship.id)
    reset({
      name: scholarship.name,
      provider: scholarship.provider,
      description: scholarship.description,
      country: scholarship.country,
      degreeLevel: scholarship.degreeLevel,
      fieldOfStudy: scholarship.fieldOfStudy,
      fundingType: scholarship.fundingType,
      fundingAmount: scholarship.fundingAmount,
      currency: scholarship.currency,
      deadline: scholarship.deadline?.substring(0, 10),
      eligibility: scholarship.eligibility,
      requirements: scholarship.requirements?.join('\n') ?? '',
      tags: scholarship.tags?.join(', ') ?? '',
      featured: scholarship.featured,
    })
    setFormOpen(true)
  }

  function onSubmit(data: ScholarshipFormData) {
    if (editId) {
      updateMutation.mutate({ id: editId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Manage Scholarships</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage your scholarship listings</p>
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Add Scholarship
        </Button>
      </div>

      {/* Table */}
      <div className="card-glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-800/50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : scholarships.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No scholarships yet"
            description="Create your first scholarship listing to attract applicants."
            action={{ label: 'Create Scholarship', onClick: openCreate }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Name', 'Deadline', 'Amount', 'Level', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {scholarships.map((s, i) => {
                  const daysLeft = getDaysUntilDeadline(s.deadline)
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-slate-200">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.provider}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-slate-300">{formatDate(s.deadline)}</p>
                        <p className={`text-xs ${getDeadlineColor(daysLeft)}`}>
                          {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-sm text-emerald-400 font-medium">
                        {formatCurrency(s.fundingAmount, s.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="primary">{formatDegreeLevel(s.degreeLevel)}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={s.active ? 'success' : 'default'}>
                          {s.active ? 'Active' : 'Inactive'}
                        </Badge>
                        {s.featured && <Badge variant="gold" className="ml-1">Featured</Badge>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditId(null); reset() }}
        title={editId ? 'Edit Scholarship' : 'Create New Scholarship'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[78vh] flex-col">
          <div className="space-y-5 overflow-y-auto pr-1 sm:pr-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Scholarship Name" error={errors.name?.message} {...register('name')} />
            <Input label="Provider/Institution" error={errors.provider?.message} {...register('provider')} />
          </div>
          <Textarea label="Description" rows={4} error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Country" placeholder="USA" error={errors.country?.message} {...register('country')} />
            <Input label="Field of Study" placeholder="Computer Science" error={errors.fieldOfStudy?.message} {...register('fieldOfStudy')} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NativeSelect label="Degree Level" options={degreeLevelOptions} error={errors.degreeLevel?.message} {...register('degreeLevel')} />
            <NativeSelect label="Funding Type" options={fundingTypeOptions} error={errors.fundingType?.message} {...register('fundingType')} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input label="Funding Amount" type="number" min="0" placeholder="50000" error={errors.fundingAmount?.message} {...register('fundingAmount', { valueAsNumber: true })} />
            </div>
            <Input label="Currency" placeholder="USD" {...register('currency')} />
          </div>
          <Input label="Application Deadline" type="date" error={errors.deadline?.message} {...register('deadline')} />
          <Textarea label="Eligibility Criteria" rows={3} error={errors.eligibility?.message} {...register('eligibility')} />
          <Textarea label="Requirements (one per line)" rows={3} placeholder="Transcript&#10;Recommendation Letter&#10;Statement of Purpose" {...register('requirements')} />
          <Input label="Application URL" placeholder="https://..." {...register('applicationUrl')} />
          <Input label="Tags (comma-separated)" placeholder="STEM, Research, Postgrad" {...register('tags')} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500" {...register('featured')} />
            <span className="text-sm text-slate-300">Feature this scholarship (highlights it on the platform)</span>
          </label>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setFormOpen(false); setEditId(null); reset() }}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editId ? 'Update' : 'Create'} Scholarship
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Scholarship" size="sm">
        <p className="text-slate-300 text-sm mb-4">
          Are you sure? This will permanently delete the scholarship and all associated data.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
