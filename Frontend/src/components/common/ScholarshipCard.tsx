import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Eye, Users, Calendar, MapPin, Star, ArrowRight, Zap } from 'lucide-react'
import { Scholarship } from '@/types'
import {
  cn,
  formatDate,
  formatDegreeLevel,
  formatFundingType,
  formatCurrency,
  getCountryFlag,
  getDeadlineColor,
  getDaysUntilDeadline,
  truncate,
  getScoreColor,
  getScoreRingColor,
} from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ScholarshipCardProps {
  scholarship: Scholarship
  onApply?: (id: string) => void
  showScore?: boolean
  delay?: number
  compact?: boolean
}

function ScoreMiniRing({ score }: { score: number }) {
  const size = 52
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = getScoreRingColor(score)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={4} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-xs font-bold', getScoreColor(score))}>{Math.round(score)}</span>
      </div>
    </div>
  )
}

function ProviderAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
      style={{ background: `hsl(${hue}, 60%, 40%)` }}
    >
      {initials}
    </div>
  )
}

export function ScholarshipCard({
  scholarship,
  onApply,
  showScore = true,
  delay = 0,
  compact = false,
}: ScholarshipCardProps) {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const daysLeft = getDaysUntilDeadline(scholarship.deadline)
  const deadlineColor = getDeadlineColor(daysLeft)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all duration-300',
        'bg-slate-900/60 backdrop-blur-xl',
        isHovered
          ? 'border-indigo-500/40 shadow-xl shadow-indigo-500/10'
          : 'border-slate-700/50'
      )}
    >
      {/* Featured badge */}
      {scholarship.featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-amber-500/30">
            <Star className="w-3 h-3 fill-current" /> Featured
          </span>
        </div>
      )}

      {/* Gradient top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600" />

      <div className={cn('p-5', compact && 'p-4')}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <ProviderAvatar name={scholarship.provider} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 text-sm leading-tight line-clamp-2 group-hover:text-indigo-300 transition-colors">
              {scholarship.name}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">{scholarship.provider}</p>
          </div>
          {showScore && scholarship.matchScore !== undefined && (
            <div className="shrink-0">
              <ScoreMiniRing score={scholarship.matchScore} />
            </div>
          )}
        </div>

        {/* Description */}
        {!compact && (
          <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">
            {truncate(scholarship.description, 100)}
          </p>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="primary">
            {formatDegreeLevel(scholarship.degreeLevel)}
          </Badge>
          <Badge variant="cyan">
            {formatFundingType(scholarship.fundingType)}
          </Badge>
          {scholarship.fieldOfStudy && (
            <Badge variant="purple">
              {scholarship.fieldOfStudy}
            </Badge>
          )}
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{getCountryFlag(scholarship.country)} {scholarship.country}</span>
          </div>
          {scholarship.fundingAmount > 0 && (
            <div className="flex items-center gap-1">
              <span>💰</span>
              <span className="text-emerald-400 font-medium">
                {formatCurrency(scholarship.fundingAmount, scholarship.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        {!compact && (
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{scholarship.viewCount?.toLocaleString() ?? 0} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{scholarship.applicationCount?.toLocaleString() ?? 0} applied</span>
            </div>
          </div>
        )}

        {/* Deadline */}
        <div className={cn('flex items-center gap-1.5 text-xs font-medium mb-4', deadlineColor)}>
          <Calendar className="w-3.5 h-3.5" />
          {daysLeft < 0 ? (
            <span className="text-slate-500">Deadline passed</span>
          ) : (
            <span>
              {daysLeft === 0 ? 'Today!' : `${daysLeft} days left`} — {formatDate(scholarship.deadline)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/scholarships/${scholarship.id}`)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Details
          </Button>
          {onApply && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onApply(scholarship.id)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Apply
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
