import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { parseISO, differenceInSeconds } from 'date-fns'
import { cn, getDeadlineColor } from '@/lib/utils'

interface DeadlineTimerProps {
  deadline: string
  showIcon?: boolean
  compact?: boolean
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(deadline: string): TimeLeft {
  const total = differenceInSeconds(parseISO(deadline), new Date())
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    days: Math.floor(total / (60 * 60 * 24)),
    hours: Math.floor((total % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((total % (60 * 60)) / 60),
    seconds: Math.floor(total % 60),
  }
}

export function DeadlineTimer({ deadline, showIcon = true, compact = false, className }: DeadlineTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(deadline))
  const daysLeft = timeLeft.days

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline))
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const isExpired = daysLeft === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0
  const colorClass = getDeadlineColor(daysLeft)

  if (compact) {
    return (
      <span className={cn('text-sm font-medium', colorClass, className)}>
        {isExpired ? 'Expired' : daysLeft > 0 ? `${daysLeft}d left` : `${timeLeft.hours}h ${timeLeft.minutes}m`}
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <Clock className={cn('w-4 h-4', colorClass)} />}
      {isExpired ? (
        <span className="text-slate-500 text-sm">Deadline passed</span>
      ) : daysLeft >= 1 ? (
        <div className="flex items-center gap-1.5">
          <span className={cn('text-2xl font-bold tabular-nums', colorClass)}>{daysLeft}</span>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 leading-tight">days</span>
            <span className="text-xs text-slate-500 leading-tight">{timeLeft.hours}h {timeLeft.minutes}m</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 tabular-nums">
          <div className="text-center">
            <div className={cn('text-lg font-bold', colorClass)}>{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-xs text-slate-500">hrs</div>
          </div>
          <span className={cn('text-lg font-bold', colorClass)}>:</span>
          <div className="text-center">
            <div className={cn('text-lg font-bold', colorClass)}>{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-xs text-slate-500">min</div>
          </div>
          <span className={cn('text-lg font-bold', colorClass)}>:</span>
          <div className="text-center">
            <div className={cn('text-lg font-bold', colorClass)}>{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-xs text-slate-500">sec</div>
          </div>
        </div>
      )}
    </div>
  )
}
