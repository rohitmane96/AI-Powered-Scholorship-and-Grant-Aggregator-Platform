import { motion } from 'framer-motion'
import { ScoreBreakdown as ScoreBreakdownType } from '@/types'
import { getScoreRingColor, getScoreColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ScoreBreakdownProps {
  score: number
  breakdown: ScoreBreakdownType
  compact?: boolean
}

interface CriterionBarProps {
  label: string
  value: number
  icon: string
  delay: number
}

function CriterionBar({ label, value, icon, delay }: CriterionBarProps) {
  const scoreColor = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500'
  const textColor = getScoreColor(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
        <span className={cn('text-xs font-bold', textColor)}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className={cn('h-full rounded-full', scoreColor)}
        />
      </div>
    </div>
  )
}

interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 80 }: ScoreRingProps) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = getScoreRingColor(score)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={6}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-xl font-bold', getScoreColor(score))}>{Math.round(score)}</span>
        <span className="text-xs text-slate-500">%</span>
      </div>
    </div>
  )
}

export function ScoreBreakdown({ score, breakdown, compact = false }: ScoreBreakdownProps) {
  const criteria = [
    { key: 'countryMatch', label: 'Country Match', icon: '🌍', value: breakdown.countryMatch },
    { key: 'degreeLevel', label: 'Degree Level', icon: '🎓', value: breakdown.degreeLevel },
    { key: 'fieldOfStudy', label: 'Field of Study', icon: '📚', value: breakdown.fieldOfStudy },
    { key: 'gpaScore', label: 'GPA Score', icon: '📊', value: breakdown.gpaScore },
    { key: 'fundingType', label: 'Funding Type', icon: '💰', value: breakdown.fundingType },
    { key: 'nlpSimilarity', label: 'NLP Similarity', icon: '🤖', value: breakdown.nlpSimilarity },
    { key: 'popularity', label: 'Popularity', icon: '⭐', value: breakdown.popularity },
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <ScoreRing score={score} size={56} />
        <div className="flex-1 space-y-1">
          {criteria.slice(0, 3).map((c, i) => (
            <CriterionBar key={c.key} label={c.label} value={c.value} icon={c.icon} delay={i * 0.1} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ScoreRing score={score} size={100} />
        <div>
          <p className="text-sm text-slate-400">Overall Match Score</p>
          <p className={cn('text-3xl font-bold', getScoreColor(score))}>{Math.round(score)}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {score >= 70 ? 'Excellent match!' : score >= 40 ? 'Good match' : 'Low match'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-300">Score Breakdown</p>
        <div className="space-y-2.5">
          {criteria.map((c, i) => (
            <CriterionBar key={c.key} label={c.label} value={c.value} icon={c.icon} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </div>
  )
}
