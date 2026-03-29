# AI-Powered Scholarship and Grant Aggregator Platform

End-to-end scholarship discovery and application platform with:

- `Frontend/`: React 18 + Vite + TypeScript + Tailwind
- `Backend/backend/`: Spring Boot 3 + MongoDB + JWT auth

The platform supports three roles:

- `STUDENT`: discover scholarships, get AI recommendations, apply, upload documents
- `INSTITUTION`: register an institution account, create scholarships, review applications
- `ADMIN`: platform analytics, user oversight, scholarship oversight

## Repository Layout

```text
AI-Powered-Scholorship-and-Grant-Aggregator-Platform/
├── Backend/
│   └── backend/
│       ├── src/main/java/com/scholarship/platform/
│       ├── src/main/resources/
│       └── build.gradle
├── Frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
└── README.md
```

## Tech Stack

Frontend:

- React 18
- Vite 5
- TypeScript
- React Router 6
- TanStack Query
- Zustand
- Axios
- React Hook Form + Zod
- Recharts
- Radix UI

Backend:

- Java 17
- Spring Boot 3.4
- Spring Security
- Spring Data MongoDB
- JWT
- Spring Mail
- Thymeleaf
- Actuator
- WebSocket
- ModelMapper
- OpenAPI / Swagger

Database:

- MongoDB

## Features

- JWT-based login and refresh flow
- Role-based access control
- Profile management and profile completion scoring
- AI recommendation engine based on profile rules and text similarity
- Scholarship create/update/delete for institution and admin users
- Application lifecycle management
- Document upload and verification flow
- Notifications
- Dashboard analytics for student, institution, and admin users
- Email verification and password reset flow

## Current Project State

Implemented and verified in this codebase:

- frontend and backend API routes aligned
- live recommendation endpoint works once active scholarships exist
- institution scholarship creation form sends valid backend payloads
- dashboard cards and charts are wired to backend aggregates instead of hardcoded mock data
- registration response includes `verificationUrl` for local development
- when SMTP fails locally, backend logs a verification fallback URL/token
- admin user deletion is now hard delete, so deleted emails are reusable

Important local-development note:

- Gmail SMTP is not guaranteed to work unless valid `EMAIL_USERNAME` and `EMAIL_PASSWORD` are configured with an App Password
- even when SMTP fails, verification is still possible through `verificationUrl`

## Prerequisites

- Node.js 18+
- npm
- Java 17
- MongoDB running locally on `mongodb://localhost:27017`

## Environment and Configuration

Backend config is driven primarily from:

- [Backend/backend/src/main/resources/application.yml](./Backend/backend/src/main/resources/application.yml)

Key backend environment variables:

- `MONGODB_URI`
- `SERVER_PORT`
- `JWT_SECRET`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- `APP_FRONTEND_URL`
- `FILE_UPLOAD_DIR`

Recommended local values:

```bash
export MONGODB_URI="mongodb://localhost:27017/scholarship_db"
export SERVER_PORT="8080"
export APP_FRONTEND_URL="http://localhost:5173"
export EMAIL_USERNAME="your-email@gmail.com"
export EMAIL_PASSWORD="your-gmail-app-password"
```

Frontend uses:

- `VITE_API_BASE_URL`

Default frontend API base:

- `http://localhost:8080`

Optional frontend env:

```bash
export VITE_API_BASE_URL="http://localhost:8080"
```

## Run Locally

### 1. Start MongoDB

Make sure MongoDB is running locally on port `27017`.

### 2. Start the backend

```bash
cd Backend/backend
export APP_FRONTEND_URL="http://localhost:5173"
export EMAIL_USERNAME="your-email@gmail.com"
export EMAIL_PASSWORD="your-app-password"
./gradlew bootRun
```

Useful restart command:

```bash
fuser -k 8080/tcp || true
cd Backend/backend
./gradlew bootRun
```

### 3. Start the frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

Backend URL:

- `http://localhost:8080`

Swagger / OpenAPI:

- `http://localhost:8080/swagger-ui/index.html`

Health check:

- `http://localhost:8080/actuator/health`

## Build

Frontend:

```bash
cd Frontend
npm run build
```

Backend:

```bash
cd Backend/backend
./gradlew build -x test
```

## Roles and Account Details

This repository should not contain real personal credentials or production accounts.

Use one of these approaches:

- register fresh users from the UI
- register via Postman
- use the optional dev seeder by running the backend with the `dev` Spring profile

### Default dev-seeded accounts

These are created only when running with the `dev` profile and an empty database:

- Admin:
  - email: `admin@scholarmatch.ai`
  - password: `Admin@1234`
- Student:
  - email: `alice@student.com`
  - password: `Student@1234`
- Institution:
  - email: `admissions@mit.edu`
  - password: `Inst@1234`

The dev seeder lives in:

- [Backend/backend/src/main/java/com/scholarship/platform/util/DataSeeder.java](./Backend/backend/src/main/java/com/scholarship/platform/util/DataSeeder.java)

### Recommended manual local accounts

Student:

```json
{
  "fullName": "Student User",
  "email": "student@example.com",
  "password": "Password123A",
  "role": "STUDENT"
}
```

Institution:

```json
{
  "fullName": "MIT Admissions",
  "email": "admissions@example.com",
  "password": "Password123A",
  "role": "INSTITUTION",
  "institutionName": "Massachusetts Institute of Technology",
  "institutionType": "University",
  "country": "US"
}
```

Admin:

```json
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "Password123A",
  "role": "ADMIN"
}
```

## Registration and Verification Flow

### Register

Endpoint:

- `POST /api/auth/register`

Successful register response includes:

- `accessToken`
- `refreshToken`
- `role`
- `verificationUrl`

Example:

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "verificationUrl": "http://localhost:5173/verify-email?token=..."
  }
}
```

### Verify email

If SMTP works, user receives an email.

If SMTP fails locally, use either:

- the `verificationUrl` returned by register
- the fallback verification URL/token logged by the backend

Postman verification request:

```http
POST http://localhost:8080/api/auth/verify-email
Content-Type: application/json
```

```json
{
  "token": "YOUR_TOKEN_HERE"
}
```

## Authentication API Summary

Core auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Scholarship Workflow

### Institution creates a scholarship

Endpoint:

- `POST /api/scholarships`

Required auth:

- `INSTITUTION` or `ADMIN`

The frontend institution form now transforms user input into the backend payload:

- `fundingAmount` -> object with `min`, `max`, `currency`
- `eligibility` -> string array
- `requirements` -> string array
- `tags` -> string array
- `deadline` -> full datetime

### Public scholarship discovery

Endpoints:

- `GET /api/scholarships`
- `GET /api/scholarships/search?q=...`
- `GET /api/scholarships/featured`
- `GET /api/scholarships/{id}`

## Application Workflow

### Application lifecycle states

Current backend statuses:

- `DRAFT`
- `SUBMITTED`
- `UNDER_REVIEW`
- `ACCEPTED`
- `REJECTED`
- `WITHDRAWN`

### Student applies

Endpoint:

- `POST /api/applications`

Application creation stores:

- `scholarshipId`
- `userId`
- `status`
- `matchScore`
- `notes`
- `timeline`

### Institution / admin reviews

Status updates are handled through the application update/status endpoints and reflected in:

- student dashboard
- institution dashboard
- admin dashboard

## AI Recommendation Engine

The recommendation engine combines:

- country preference match
- degree level match
- field-of-study match
- GPA tier
- funding type match
- text similarity score
- popularity score

Key backend file:

- [Backend/backend/src/main/java/com/scholarship/platform/service/RecommendationService.java](./Backend/backend/src/main/java/com/scholarship/platform/service/RecommendationService.java)

Recommendations endpoint:

- `GET /api/scholarships/recommendations?limit=10`

Important:

- recommendations require active scholarships in the database
- if scholarship count is zero, recommendation candidate count will be zero

## Documents

Document endpoints support:

- user-level listing
- application-scoped listing
- upload
- delete

Important current behavior:

- backend accepts common document/image MIME types listed in `application.yml` and constants
- frontend document flow was aligned to supported backend routes

## Dashboards

### Student dashboard

Live data:

- applications sent
- under review
- accepted
- rejected
- upcoming deadlines
- recent applications
- AI recommendations

### Institution dashboard

Now driven by backend aggregates:

- total scholarships
- total applications
- active scholarships
- average match score
- applications this month
- applications per scholarship chart
- applications over time chart
- recent applications

### Admin dashboard

Now driven by backend aggregates:

- total users
- total scholarships
- total applications
- active scholarships
- application status distribution chart
- platform growth chart
- recent users
- recent applications

## Known Limitations

- SMTP email delivery requires valid Gmail App Password credentials
- the UI still uses local-development assumptions in some non-critical areas such as decorative labels and empty-state messaging
- if MongoDB has no scholarship data, recommendations and some dashboard sections will be empty by design

## Verification Checklist

After starting both apps:

1. Register a student.
2. Register an institution.
3. Verify email using `verificationUrl`.
4. Log in as institution and create at least one scholarship.
5. Log in as student and complete profile.
6. Open recommendations and confirm matches are shown.
7. Open dashboards for each role and confirm values update from live data.

## Git / Deployment Note

Before pushing:

- do not commit `.idea/`
- do not commit uploaded files under `Backend/backend/uploads/`
- do not commit secrets in `application.yml`

This repository now ignores those files through `.gitignore`.
