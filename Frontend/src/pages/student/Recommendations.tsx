import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw } from 'lucide-react'
import { recommendationsApi } from '@/api/recommendations'
import { profileApi } from '@/api/profile'
import { ScholarshipCard } from '@/components/common/ScholarshipCard'
import { ScoreBreakdown } from '@/components/common/ScoreBreakdown'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonCard } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function Recommendations() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [limit, setLimit] = useState(10)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const { data: recommendations, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['recommendations', limit],
    queryFn: () => recommendationsApi.getRecommendations(limit),
  })

  useEffect(() => {
    if (profile) {
      updateUser(profile)
    }
  }, [profile, updateUser])

  const profileCompletion = profile?.profileCompletion ?? user?.profileCompletion ?? 0
  const needsProfileCompletion = profileCompletion < 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">AI Recommendations</h1>
            <Badge variant="cyan">
              <Sparkles className="w-3 h-3" /> Powered by AI
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Scholarships matched to your profile using advanced NLP analysis
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* AI explanation banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/20 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h3 className="font-semibold text-cyan-300 mb-1">How AI Matching Works</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our AI analyzes your profile across 7 dimensions: country match, degree level, field of study,
              GPA score, funding type preference, NLP text similarity, and popularity score.
              Results are updated in real-time as you improve your profile.
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !recommendations || recommendations.length === 0 ? (
        <EmptyState
          icon="✨"
          title="No recommendations yet"
          description={needsProfileCompletion
            ? 'Complete your profile including education details and preferences to unlock AI-powered matches.'
            : 'Your profile is complete, but there are no strong AI matches right now. Refresh later or explore all scholarships.'}
          action={needsProfileCompletion
            ? { label: 'Complete Profile', onClick: () => navigate('/profile') }
            : { label: 'Browse Scholarships', onClick: () => navigate('/scholarships') }}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((rec, i) => (
              <div key={rec.scholarship.id} className="space-y-3">
                <ScholarshipCard
                  scholarship={{ ...rec.scholarship, matchScore: rec.matchScore, scoreBreakdown: rec.scoreBreakdown }}
                  onApply={() => navigate(`/scholarships/${rec.scholarship.id}`)}
                  delay={i * 0.04}
                  showScore
                />

                {/* Score breakdown below card */}
                {rec.scoreBreakdown && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="card-glass p-4"
                  >
                    <ScoreBreakdown
                      score={rec.matchScore}
                      breakdown={rec.scoreBreakdown}
                      compact
                    />
                    {rec.reasons && rec.reasons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-1.5">Why this matches you:</p>
                        <ul className="space-y-1">
                          {rec.reasons.slice(0, 3).map((reason, j) => (
                            <li key={j} className="text-xs text-slate-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-cyan-500 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {recommendations.length >= limit && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setLimit(l => l + 10)}
                isLoading={isFetching}
              >
                Load More Recommendations
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
