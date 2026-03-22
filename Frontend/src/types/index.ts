// ============================================================
// Enums
// ============================================================

export enum DegreeLevel {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  UNDERGRADUATE = 'UNDERGRADUATE',
  POSTGRADUATE = 'POSTGRADUATE',
  PHD = 'PHD',
  POSTDOCTORAL = 'POSTDOCTORAL',
  DIPLOMA = 'DIPLOMA',
  CERTIFICATE = 'CERTIFICATE',
  ANY = 'ANY',
}

export enum FundingType {
  FULL_FUNDING = 'FULL_FUNDING',
  PARTIAL_FUNDING = 'PARTIAL_FUNDING',
  TUITION_ONLY = 'TUITION_ONLY',
  LIVING_ALLOWANCE = 'LIVING_ALLOWANCE',
  RESEARCH_GRANT = 'RESEARCH_GRANT',
  TRAVEL_GRANT = 'TRAVEL_GRANT',
  LOAN = 'LOAN',
  OTHER = 'OTHER',
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTITUTION = 'INSTITUTION',
  ADMIN = 'ADMIN',
}

export enum NotificationType {
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  NEW_MATCH = 'NEW_MATCH',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  GENERAL = 'GENERAL',
}

export enum DocumentType {
  TRANSCRIPT = 'TRANSCRIPT',
  RECOMMENDATION_LETTER = 'RECOMMENDATION_LETTER',
  STATEMENT_OF_PURPOSE = 'STATEMENT_OF_PURPOSE',
  RESUME = 'RESUME',
  PASSPORT = 'PASSPORT',
  LANGUAGE_TEST = 'LANGUAGE_TEST',
  FINANCIAL_DOCUMENT = 'FINANCIAL_DOCUMENT',
  OTHER = 'OTHER',
}

// ============================================================
// Core Interfaces
// ============================================================

export interface Education {
  level: DegreeLevel
  fieldOfStudy: string
  currentGPA: number
  institution: string
  graduationYear: number
}

export interface Preferences {
  targetCountries: string[]
  fundingTypes: FundingType[]
  notifications: {
    email: boolean
    push: boolean
    deadlineReminder: boolean
    newMatches: boolean
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl?: string
  emailVerified: boolean
  profileCompletion: number
  bio?: string
  phone?: string
  nationality?: string
  dateOfBirth?: string
  education: Education
  preferences: Preferences
  createdAt: string
  updatedAt?: string
}

export interface ScoreBreakdown {
  countryMatch: number
  degreeLevel: number
  fieldOfStudy: number
  gpaScore: number
  fundingType: number
  nlpSimilarity: number
  popularity: number
}

export interface Scholarship {
  id: string
  name: string
  provider: string
  description: string
  country: string
  degreeLevel: DegreeLevel
  fieldOfStudy: string
  fundingType: FundingType
  fundingAmount: number
  currency: string
  deadline: string
  eligibility: string
  requirements: string[]
  applicationUrl?: string
  featured: boolean
  active: boolean
  tags: string[]
  viewCount: number
  applicationCount: number
  daysUntilDeadline: number
  matchScore?: number
  scoreBreakdown?: ScoreBreakdown
  createdAt: string
  updatedAt?: string
  institutionId?: string
  imageUrl?: string
}

export interface ApplicationDocument {
  id: string
  name: string
  type: DocumentType
  url: string
}

export interface Application {
  id: string
  scholarshipId: string
  scholarshipName: string
  scholarshipProvider?: string
  userId: string
  status: ApplicationStatus
  coverLetter: string
  documents: ApplicationDocument[]
  matchScore?: number
  submittedAt: string
  updatedAt: string
  remarks?: string
  scholarshipDeadline?: string
  scholarshipCountry?: string
  scholarshipFundingAmount?: number
}

export interface Document {
  id: string
  name: string
  originalName: string
  type: DocumentType
  fileSize: number
  mimeType: string
  uploadedAt: string
  verified: boolean
  url: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: Record<string, string>
}

export interface Recommendation {
  scholarship: Scholarship
  matchScore: number
  scoreBreakdown: ScoreBreakdown
  reasons: string[]
}

// ============================================================
// API Response Types
// ============================================================

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
  first: boolean
  last: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

export interface DashboardStats {
  totalScholarships: number
  totalApplications: number
  totalUsers: number
  activeScholarships: number
}

export interface MyStats {
  applied: number
  pending: number
  accepted: number
  rejected: number
  shortlisted: number
  underReview: number
}

export interface InstitutionStats {
  totalScholarships: number
  totalApplications: number
  activeScholarships: number
  avgMatchScore: number
  applicationsThisMonth: number
}

// ============================================================
// Form Types
// ============================================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

export interface ScholarshipForm {
  name: string
  provider: string
  description: string
  country: string
  degreeLevel: DegreeLevel
  fieldOfStudy: string
  fundingType: FundingType
  fundingAmount: number
  currency: string
  deadline: string
  eligibility: string
  requirements: string
  applicationUrl: string
  tags: string
  featured: boolean
}

export interface ApplicationForm {
  scholarshipId: string
  coverLetter: string
  documentIds: string[]
}

export interface ProfileForm {
  firstName: string
  lastName: string
  bio?: string
  phone?: string
  nationality?: string
  dateOfBirth?: string
  education: Education
  preferences: Preferences
}

export interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ============================================================
// Filter/Query Types
// ============================================================

export interface ScholarshipFilters {
  search?: string
  country?: string
  degreeLevel?: DegreeLevel | ''
  fundingType?: FundingType | ''
  featured?: boolean
  page?: number
  size?: number
  sort?: 'matchScore' | 'deadline' | 'newest' | 'mostApplied'
}

export interface AdminUserFilters {
  page?: number
  size?: number
  role?: UserRole | ''
  search?: string
}
