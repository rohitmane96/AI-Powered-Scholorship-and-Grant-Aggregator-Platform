import {
  Application,
  Document,
  DashboardStats,
  MyStats,
  Preferences,
  Recommendation,
  Scholarship,
  ScoreBreakdown,
  User,
} from '@/types'

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function defaultPreferences(): Preferences {
  return {
    targetCountries: [],
    fundingTypes: [],
    notifications: {
      email: true,
      push: true,
      deadlineReminder: true,
      newMatches: true,
    },
  }
}

export function mapUserResponse(payload: any): User {
  const names = splitFullName(toString(payload?.fullName))

  return {
    id: toString(payload?.id ?? payload?.userId),
    email: toString(payload?.email),
    firstName: names.firstName,
    lastName: names.lastName,
    role: payload?.role,
    avatarUrl: toString(payload?.avatar),
    emailVerified: Boolean(payload?.verified),
    profileCompletion: toNumber(payload?.profileCompletion),
    bio: '',
    phone: '',
    nationality: toString(payload?.country),
    dateOfBirth: undefined,
    education: payload?.education ?? {
      level: 'UNDERGRADUATE',
      fieldOfStudy: '',
      currentGPA: 0,
      institution: '',
      graduationYear: new Date().getFullYear(),
    },
    preferences: payload?.preferences ?? defaultPreferences(),
    createdAt: toString(payload?.createdAt),
    updatedAt: toString(payload?.lastLogin ?? payload?.updatedAt),
  }
}

export function mapScholarshipResponse(payload: any): Scholarship {
  const fundingAmount = payload?.fundingAmount ?? {}

  return {
    id: toString(payload?.id),
    name: toString(payload?.name),
    provider: toString(payload?.provider),
    description: toString(payload?.description),
    country: toString(payload?.country),
    degreeLevel: payload?.degreeLevel,
    fieldOfStudy: toString(payload?.fieldOfStudy),
    fundingType: payload?.fundingType,
    fundingAmount: toNumber(fundingAmount?.max ?? fundingAmount?.min),
    currency: toString(fundingAmount?.currency, 'USD'),
    deadline: toString(payload?.deadline),
    eligibility: Array.isArray(payload?.eligibility)
      ? payload.eligibility.join('\n')
      : toString(payload?.eligibility),
    requirements: Array.isArray(payload?.requirements) ? payload.requirements : [],
    applicationUrl: toString(payload?.applicationUrl),
    featured: Boolean(payload?.featured),
    active: Boolean(payload?.active),
    tags: Array.isArray(payload?.tags) ? payload.tags : [],
    viewCount: toNumber(payload?.viewCount),
    applicationCount: toNumber(payload?.applicationCount),
    daysUntilDeadline: toNumber(payload?.daysUntilDeadline),
    matchScore: payload?.matchScore != null ? toNumber(payload?.matchScore) : undefined,
    scoreBreakdown: undefined,
    createdAt: toString(payload?.createdAt),
    updatedAt: toString(payload?.updatedAt),
    institutionId: undefined,
    imageUrl: undefined,
  }
}

export function mapApplicationResponse(payload: any): Application {
  const scholarship = payload?.scholarship
  const submittedAt = toString(payload?.submittedAt ?? payload?.createdAt)
  const fundingAmount = scholarship?.fundingAmount ?? {}

  return {
    id: toString(payload?.id),
    scholarshipId: toString(payload?.scholarshipId ?? scholarship?.id),
    scholarshipName: toString(scholarship?.name),
    scholarshipProvider: toString(scholarship?.provider),
    userId: toString(payload?.userId),
    status: payload?.status,
    coverLetter: toString(payload?.notes),
    documents: [],
    matchScore: payload?.matchScore != null ? toNumber(payload?.matchScore) : undefined,
    submittedAt,
    updatedAt: toString(payload?.updatedAt, submittedAt),
    remarks: undefined,
    scholarshipDeadline: scholarship?.deadline ? toString(scholarship.deadline) : undefined,
    scholarshipCountry: scholarship?.country ? toString(scholarship.country) : undefined,
    scholarshipFundingAmount: scholarship
      ? toNumber(fundingAmount?.max ?? fundingAmount?.min)
      : undefined,
  }
}

export function mapDashboardStatsResponse(payload: any): DashboardStats {
  const totalUsers = toNumber(payload?.totalUsers)
    || (toNumber(payload?.totalStudents) + toNumber(payload?.totalInstitutions))

  return {
    totalScholarships: toNumber(payload?.totalScholarships),
    totalApplications: toNumber(payload?.totalApplications),
    totalUsers,
    activeScholarships: toNumber(payload?.activeScholarships || payload?.totalScholarships),
  }
}

export function mapMyStatsResponse(payload: any): MyStats {
  const applied = toNumber(payload?.totalApplications)
  const accepted = toNumber(payload?.acceptedApplications)
  const submitted = toNumber(payload?.submittedApplications)
  const underReview = toNumber(payload?.underReviewApplications)
  const rejected = toNumber(payload?.rejectedApplications)
  const shortlisted = toNumber(payload?.shortlistedApplications)

  return {
    applied,
    pending: submitted + underReview,
    accepted,
    rejected,
    shortlisted,
    underReview,
  }
}

export function mapRecommendationResponse(payload: any): Recommendation {
  const breakdown = payload?.scoreBreakdown ?? {}

  const scoreBreakdown: ScoreBreakdown = {
    countryMatch: toNumber(breakdown?.country),
    degreeLevel: toNumber(breakdown?.degreeLevel),
    fieldOfStudy: toNumber(breakdown?.fieldOfStudy),
    gpaScore: toNumber(breakdown?.gpa),
    fundingType: toNumber(breakdown?.fundingType),
    nlpSimilarity: toNumber(breakdown?.nlpSimilarity),
    popularity: toNumber(breakdown?.popularityScore),
  }

  return {
    scholarship: {
      ...mapScholarshipResponse(payload),
      scoreBreakdown,
    },
    matchScore: toNumber(payload?.matchScore),
    scoreBreakdown,
    reasons: [],
  }
}

export function mapDocumentResponse(payload: any): Document {
  return {
    id: toString(payload?.id),
    name: toString(payload?.fileName),
    originalName: toString(payload?.fileName),
    type: payload?.type,
    fileSize: toNumber(payload?.fileSize),
    mimeType: toString(payload?.mimeType),
    uploadedAt: toString(payload?.uploadedAt),
    verified: Boolean(payload?.verified),
    url: toString(payload?.fileUrl),
  }
}
