import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  error?: string
  className?: string
  disabled?: boolean
}

export function Select({ value, onValueChange, options, placeholder, label, error, className, disabled }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            'flex items-center justify-between w-full bg-slate-800/50 border rounded-xl px-4 py-2.5 text-sm',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            error
              ? 'border-rose-500/50 focus:ring-rose-500/30 text-rose-300'
              : 'border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-slate-100',
            !value && 'text-slate-500',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder ?? 'Select...'} />
          <SelectPrimitive.Icon>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 min-w-[8rem] bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/50 overflow-hidden"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 text-slate-400">
              <ChevronDown className="w-4 h-4 rotate-180" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1">
              {options.map(option => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="flex items-center justify-between px-3 py-2 text-sm text-slate-300 rounded-lg hover:bg-slate-700 hover:text-slate-100 cursor-pointer focus:outline-none focus:bg-slate-700 transition-colors"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="text-rose-400 text-xs">⚠ {error}</p>}
    </div>
  )
}

// Native select for forms with react-hook-form
interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={selectId} className="text-sm font-medium text-slate-300">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full bg-slate-800/50 border rounded-xl px-4 py-2.5 text-sm appearance-none',
            'focus:outline-none focus:ring-2 transition-all duration-200',
            error
              ? 'border-rose-500/50 focus:ring-rose-500/30 text-rose-300'
              : 'border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-slate-100',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-rose-400 text-xs">⚠ {error}</p>}
      </div>
    )
  }
)
NativeSelect.displayName = 'NativeSelect'
