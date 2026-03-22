import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-slate-800/50 border rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500',
              'focus:outline-none focus:ring-2 transition-all duration-200',
              error
                ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/70'
                : 'border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500/50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-rose-400 text-xs flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-slate-500 text-xs">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-slate-800/50 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 resize-none',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            error
              ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/70'
              : 'border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-rose-400 text-xs">⚠ {error}</p>}
        {hint && !error && <p className="text-slate-500 text-xs">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
