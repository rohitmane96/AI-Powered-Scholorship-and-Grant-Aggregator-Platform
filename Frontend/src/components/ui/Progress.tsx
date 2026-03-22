import * as ProgressPrimitive from '@radix-ui/react-progress'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'gradient'
  animated?: boolean
}

const colors = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  label,
  size = 'md',
  color = 'gradient',
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className="w-full space-y-1">
      {(showLabel || label) && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="text-sm font-semibold text-slate-300">{Math.round(percentage)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        value={value}
        max={max}
        className={cn(
          'relative overflow-hidden rounded-full bg-slate-800',
          sizes[size],
          className
        )}
      >
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colors[color], barClassName)}
        />
      </ProgressPrimitive.Root>
    </div>
  )
}
