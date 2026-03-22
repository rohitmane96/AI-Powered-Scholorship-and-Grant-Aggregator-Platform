import { Check, Clock, Eye, Star, X, MinusCircle } from 'lucide-react'
import { ApplicationStatus as AppStatus } from '@/types'
import { cn, formatApplicationStatus, getApplicationStatusClass } from '@/lib/utils'

interface ApplicationStatusBadgeProps {
  status: AppStatus
  className?: string
}

const statusIcons: Record<AppStatus, React.ReactNode> = {
  [AppStatus.SUBMITTED]: <Clock className="w-3 h-3" />,
  [AppStatus.UNDER_REVIEW]: <Eye className="w-3 h-3" />,
  [AppStatus.SHORTLISTED]: <Star className="w-3 h-3" />,
  [AppStatus.ACCEPTED]: <Check className="w-3 h-3" />,
  [AppStatus.REJECTED]: <X className="w-3 h-3" />,
  [AppStatus.WITHDRAWN]: <MinusCircle className="w-3 h-3" />,
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        getApplicationStatusClass(status),
        className
      )}
    >
      {statusIcons[status]}
      {formatApplicationStatus(status)}
    </span>
  )
}

interface ApplicationTimelineProps {
  status: AppStatus
}

const steps = [
  { status: AppStatus.SUBMITTED, label: 'Submitted' },
  { status: AppStatus.UNDER_REVIEW, label: 'Under Review' },
  { status: AppStatus.SHORTLISTED, label: 'Shortlisted' },
  { status: AppStatus.ACCEPTED, label: 'Decision' },
]

const statusOrder: Record<AppStatus, number> = {
  [AppStatus.SUBMITTED]: 0,
  [AppStatus.UNDER_REVIEW]: 1,
  [AppStatus.SHORTLISTED]: 2,
  [AppStatus.ACCEPTED]: 3,
  [AppStatus.REJECTED]: 3,
  [AppStatus.WITHDRAWN]: -1,
}

export function ApplicationTimeline({ status }: ApplicationTimelineProps) {
  const currentOrder = statusOrder[status]
  const isRejected = status === AppStatus.REJECTED
  const isWithdrawn = status === AppStatus.WITHDRAWN

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const stepOrder = statusOrder[step.status]
        const isCompleted = currentOrder > stepOrder
        const isCurrent = currentOrder === stepOrder
        const isFailed = (isRejected || isWithdrawn) && isCurrent

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  isCompleted
                    ? 'bg-indigo-500 text-white'
                    : isFailed
                    ? 'bg-rose-500 text-white'
                    : isCurrent
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isFailed ? (
                  <X className="w-3 h-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 mx-1 mb-4 transition-colors duration-300',
                  isCompleted ? 'bg-indigo-500' : 'bg-slate-800'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
