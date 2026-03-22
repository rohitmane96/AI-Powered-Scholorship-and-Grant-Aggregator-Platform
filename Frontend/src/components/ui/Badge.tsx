import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'cyan' | 'purple' | 'gold' | 'outline'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-700/60 text-slate-300 border-slate-600/50',
  primary: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  gold: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-amber-200 border-yellow-500/30',
  outline: 'bg-transparent text-slate-300 border-slate-600',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ variant = 'default', size = 'sm', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
