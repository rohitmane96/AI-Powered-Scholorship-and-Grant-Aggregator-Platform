import React from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: {
    value: number
    label?: string
  }
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple'
  prefix?: string
  suffix?: string
  animate?: boolean
  className?: string
}

const colorMap = {
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-600/5',
    icon: 'bg-indigo-500/20 text-indigo-400',
    border: 'border-indigo-500/20',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    icon: 'bg-emerald-500/20 text-emerald-400',
    border: 'border-emerald-500/20',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-600/5',
    icon: 'bg-amber-500/20 text-amber-400',
    border: 'border-amber-500/20',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-600/5',
    icon: 'bg-rose-500/20 text-rose-400',
    border: 'border-rose-500/20',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-600/5',
    icon: 'bg-cyan-500/20 text-cyan-400',
    border: 'border-cyan-500/20',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/5',
    icon: 'bg-purple-500/20 text-purple-400',
    border: 'border-purple-500/20',
  },
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, latest => `${prefix}${Math.round(latest).toLocaleString()}${suffix}`)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.5, ease: 'easeOut' })
    return controls.stop
  }, [motionValue, value])

  return <motion.span>{rounded}</motion.span>
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'indigo',
  prefix = '',
  suffix = '',
  animate: shouldAnimate = true,
  className,
}: StatsCardProps) {
  const colors = colorMap[color]
  const isNumeric = typeof value === 'number'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-xl',
        'border transition-all duration-300 p-6',
        colors.border,
        className
      )}
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', colors.bg)} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-2.5 rounded-xl', colors.icon)}>
            {icon}
          </div>
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                trend.value > 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : trend.value < 0
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-700/60 text-slate-400'
              )}
            >
              {trend.value > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : trend.value < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>

        <div className="text-3xl font-bold text-slate-100 mb-1">
          {isNumeric && shouldAnimate ? (
            <AnimatedNumber value={value as number} prefix={prefix} suffix={suffix} />
          ) : (
            `${prefix}${isNumeric ? (value as number).toLocaleString() : value}${suffix}`
          )}
        </div>

        <p className="text-sm text-slate-400">{title}</p>
        {trend?.label && (
          <p className="text-xs text-slate-500 mt-1">{trend.label}</p>
        )}
      </div>
    </motion.div>
  )
}
