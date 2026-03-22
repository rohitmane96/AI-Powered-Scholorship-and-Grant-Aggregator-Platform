import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { scholarshipsApi } from '@/api/scholarships'
import { ScholarshipCard } from '@/components/common/ScholarshipCard'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonCard } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { NativeSelect } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DegreeLevel, FundingType, ScholarshipFilters } from '@/types'
import { formatDegreeLevel, formatFundingType, debounce } from '@/lib/utils'

const degreeLevelOptions = [
  { value: '', label: 'All Levels' },
  ...Object.values(DegreeLevel).map(v => ({ value: v, label: formatDegreeLevel(v) })),
]

const fundingTypeOptions = [
  { value: '', label: 'All Types' },
  ...Object.values(FundingType).map(v => ({ value: v, label: formatFundingType(v) })),
]

const sortOptions = [
  { value: 'matchScore', label: 'Best Match' },
  { value: 'deadline', label: 'Deadline Soon' },
  { value: 'newest', label: 'Newest First' },
  { value: 'mostApplied', label: 'Most Applied' },
]

export default function Scholarships() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [filters, setFilters] = useState<ScholarshipFilters>({
    search: searchParams.get('search') ?? '',
    country: '',
    degreeLevel: '',
    fundingType: '',
    featured: false,
    page: 0,
    size: 12,
    sort: 'matchScore',
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['scholarships', filters],
    queryFn: () => scholarshipsApi.getAll(filters),
    placeholderData: prev => prev,
  })

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value, page: 0 }))
    }, 300),
    []
  )

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchInput(val)
    debouncedSearch(val)
  }

  function clearSearch() {
    setSearchInput('')
    setFilters(prev => ({ ...prev, search: '', page: 0 }))
  }

  function handleFilterChange(key: keyof ScholarshipFilters, value: unknown) {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }))
  }

  function clearAllFilters() {
    setSearchInput('')
    setFilters({ search: '', country: '', degreeLevel: '', fundingType: '', featured: false, page: 0, size: 12, sort: 'matchScore' })
  }

  const activeFilterCount = [
    filters.country,
    filters.degreeLevel,
    filters.fundingType,
    filters.featured,
  ].filter(Boolean).length

  const scholarships = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Browse Scholarships</h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalElements > 0 ? `${totalElements.toLocaleString()} scholarships found` : 'Search and filter scholarships'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect
            options={sortOptions}
            value={filters.sort}
            onChange={e => handleFilterChange('sort', e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name, provider, field of study..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(prev => !prev)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            className="relative"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full bg-indigo-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4"
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Country</label>
                <input
                  value={filters.country}
                  onChange={e => handleFilterChange('country', e.target.value)}
                  placeholder="e.g. USA, UK, Germany"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <NativeSelect
                label="Degree Level"
                options={degreeLevelOptions}
                value={filters.degreeLevel}
                onChange={e => handleFilterChange('degreeLevel', e.target.value)}
              />
              <NativeSelect
                label="Funding Type"
                options={fundingTypeOptions}
                value={filters.fundingType}
                onChange={e => handleFilterChange('fundingType', e.target.value)}
              />
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Other</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={e => handleFilterChange('featured', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30"
                  />
                  <span className="text-sm text-slate-300">Featured only</span>
                </label>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                <div className="flex flex-wrap gap-1.5">
                  {filters.country && (
                    <Badge variant="primary">
                      {filters.country}
                      <button onClick={() => handleFilterChange('country', '')}><X className="w-3 h-3" /></button>
                    </Badge>
                  )}
                  {filters.degreeLevel && (
                    <Badge variant="primary">
                      {formatDegreeLevel(filters.degreeLevel as DegreeLevel)}
                      <button onClick={() => handleFilterChange('degreeLevel', '')}><X className="w-3 h-3" /></button>
                    </Badge>
                  )}
                  {filters.fundingType && (
                    <Badge variant="primary">
                      {formatFundingType(filters.fundingType as FundingType)}
                      <button onClick={() => handleFilterChange('fundingType', '')}><X className="w-3 h-3" /></button>
                    </Badge>
                  )}
                  {filters.featured && (
                    <Badge variant="gold">
                      Featured
                      <button onClick={() => handleFilterChange('featured', false)}><X className="w-3 h-3" /></button>
                    </Badge>
                  )}
                </div>
                <button onClick={clearAllFilters} className="text-xs text-slate-500 hover:text-slate-300">
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : scholarships.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No scholarships found"
          description="Try adjusting your search or filters to find more results."
          action={{ label: 'Clear Filters', onClick: clearAllFilters }}
        />
      ) : (
        <>
          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating results...
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {scholarships.map((scholarship, i) => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                onApply={() => navigate(`/scholarships/${scholarship.id}`)}
                delay={i * 0.04}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page ?? 0) - 1 }))}
                disabled={(filters.page ?? 0) === 0}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i
                  const current = filters.page ?? 0
                  const isActive = page === current
                  return (
                    <button
                      key={page}
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                      }`}
                    >
                      {page + 1}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page ?? 0) + 1 }))}
                disabled={(filters.page ?? 0) >= totalPages - 1}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
