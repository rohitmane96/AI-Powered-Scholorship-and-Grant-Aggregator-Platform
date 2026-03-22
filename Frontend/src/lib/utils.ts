import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { DegreeLevel, FundingType, ApplicationStatus, UserRole, DocumentType, NotificationType } from '@/types'

// ============================================================
// Class utility
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// Date utilities
// ============================================================

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return 'Invalid date'
  }
}

export function formatRelativeDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function getDaysUntilDeadline(deadline: string): number {
  try {
    const d = parseISO(deadline)
    return differenceInDays(d, new Date())
  } catch {
    return 0
  }
}

export function getDeadlineColor(daysLeft: number): string {
  if (daysLeft < 0) return 'text-slate-500'
  if (daysLeft <= 7) return 'text-rose-400'
  if (daysLeft <= 30) return 'text-amber-400'
  return 'text-emerald-400'
}

export function getDeadlineBadgeClass(daysLeft: number): string {
  if (daysLeft < 0) return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  if (daysLeft <= 7) return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  if (daysLeft <= 30) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
}

// ============================================================
// Score utilities
// ============================================================

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-rose-400'
}

export function getScoreRingColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#f43f5e'
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (score >= 40) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
}

// ============================================================
// Enum display utilities
// ============================================================

export function formatDegreeLevel(level: DegreeLevel): string {
  const map: Record<DegreeLevel, string> = {
    [DegreeLevel.HIGH_SCHOOL]: 'High School',
    [DegreeLevel.UNDERGRADUATE]: 'Undergraduate',
    [DegreeLevel.POSTGRADUATE]: 'Postgraduate',
    [DegreeLevel.PHD]: 'PhD',
    [DegreeLevel.POSTDOCTORAL]: 'Postdoctoral',
    [DegreeLevel.DIPLOMA]: 'Diploma',
    [DegreeLevel.CERTIFICATE]: 'Certificate',
    [DegreeLevel.ANY]: 'Any Level',
  }
  return map[level] ?? level
}

export function formatFundingType(type: FundingType): string {
  const map: Record<FundingType, string> = {
    [FundingType.FULL_FUNDING]: 'Full Funding',
    [FundingType.PARTIAL_FUNDING]: 'Partial Funding',
    [FundingType.TUITION_ONLY]: 'Tuition Only',
    [FundingType.LIVING_ALLOWANCE]: 'Living Allowance',
    [FundingType.RESEARCH_GRANT]: 'Research Grant',
    [FundingType.TRAVEL_GRANT]: 'Travel Grant',
    [FundingType.LOAN]: 'Loan',
    [FundingType.OTHER]: 'Other',
  }
  return map[type] ?? type
}

export function formatApplicationStatus(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
    [ApplicationStatus.SHORTLISTED]: 'Shortlisted',
    [ApplicationStatus.ACCEPTED]: 'Accepted',
    [ApplicationStatus.REJECTED]: 'Rejected',
    [ApplicationStatus.WITHDRAWN]: 'Withdrawn',
  }
  return map[status] ?? status
}

export function getApplicationStatusClass(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [ApplicationStatus.UNDER_REVIEW]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    [ApplicationStatus.SHORTLISTED]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    [ApplicationStatus.ACCEPTED]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    [ApplicationStatus.REJECTED]: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    [ApplicationStatus.WITHDRAWN]: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }
  return map[status] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
}

export function formatUserRole(role: UserRole): string {
  const map: Record<UserRole, string> = {
    [UserRole.STUDENT]: 'Student',
    [UserRole.INSTITUTION]: 'Institution',
    [UserRole.ADMIN]: 'Admin',
  }
  return map[role] ?? role
}

export function formatDocumentType(type: DocumentType): string {
  const map: Record<DocumentType, string> = {
    [DocumentType.TRANSCRIPT]: 'Transcript',
    [DocumentType.RECOMMENDATION_LETTER]: 'Recommendation Letter',
    [DocumentType.STATEMENT_OF_PURPOSE]: 'Statement of Purpose',
    [DocumentType.RESUME]: 'Resume / CV',
    [DocumentType.PASSPORT]: 'Passport',
    [DocumentType.LANGUAGE_TEST]: 'Language Test Result',
    [DocumentType.FINANCIAL_DOCUMENT]: 'Financial Document',
    [DocumentType.OTHER]: 'Other',
  }
  return map[type] ?? type
}

export function getNotificationIcon(type: NotificationType): string {
  const map: Record<NotificationType, string> = {
    [NotificationType.APPLICATION_STATUS]: '📋',
    [NotificationType.DEADLINE_REMINDER]: '⏰',
    [NotificationType.NEW_MATCH]: '✨',
    [NotificationType.DOCUMENT_VERIFIED]: '✅',
    [NotificationType.GENERAL]: '🔔',
  }
  return map[type] ?? '🔔'
}

// ============================================================
// Number / Currency utilities
// ============================================================

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (!amount) return 'N/A'
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

// ============================================================
// File utilities
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('word') || mimeType.includes('doc')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
  return '📁'
}

// ============================================================
// Country flag emoji utility
// ============================================================

export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'India': '🇮🇳',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Singapore': '🇸🇬',
    'New Zealand': '🇳🇿',
    'Switzerland': '🇨🇭',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Ireland': '🇮🇪',
    'Global': '🌍',
  }
  return flags[country] ?? '🌐'
}

// ============================================================
// Misc utilities
// ============================================================

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
