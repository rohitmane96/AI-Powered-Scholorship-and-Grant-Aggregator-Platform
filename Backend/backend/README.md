# ScholarMatch AI – Backend

> **AI-Driven Scholarship & Grant Aggregator Platform**
> Group 32 – Indira College of Engineering and Management

---

## Tech Stack

| Layer            | Technology                      |
|------------------|---------------------------------|
| Language         | Java 17                         |
| Framework        | Spring Boot 3.2.0               |
| Database         | MongoDB 6+                      |
| Authentication   | JWT (JJWT 0.12.x)              |
| API Docs         | Springdoc OpenAPI / Swagger UI  |
| Email            | Spring Mail + Thymeleaf         |
| Real-time        | STOMP over WebSocket            |
| Build tool       | Gradle 8                        |

---

## Project Structure

```
src/main/java/com/scholarship/platform/
├── config/          # Security, CORS, Swagger, WebSocket, Email configs
├── controller/      # REST controllers (Auth, User, Scholarship, Application, …)
├── dto/             # Request & Response DTOs
├── exception/       # Global exception handling
├── model/           # MongoDB documents + enums
├── repository/      # Spring Data MongoDB repositories
├── scheduler/       # Cron jobs (deadline reminders, data sync)
├── security/        # JWT filter, provider, UserDetailsService
├── service/         # Business logic layer
└── util/            # Constants, validators, file/date helpers + DataSeeder
```

---

## Prerequisites

- **Java 17+** (`java -version`)
- **MongoDB** running locally on `mongodb://localhost:27017` (or set `MONGODB_URI`)
- **Gradle** (wrapper included – no install needed)
- Optional: SMTP credentials for email features

---

## Environment Variables

| Variable         | Default                                  | Description                         |
|------------------|------------------------------------------|-------------------------------------|
| `MONGODB_URI`    | `mongodb://localhost:27017/scholarship_db` | MongoDB connection string           |
| `JWT_SECRET`     | _see application.yml_                   | Base64-encoded HMAC-SHA256 key (**change in prod!**) |
| `EMAIL_USERNAME` | `noreply@scholarmatch.ai`               | SMTP sender address                 |
| `EMAIL_PASSWORD` | `changeme`                              | SMTP password                       |
| `SERVER_PORT`    | `8080`                                  | HTTP server port                    |
| `FILE_UPLOAD_DIR`| `./uploads`                             | Local file storage directory        |

---

## Running the Application

### 1. Clone & Build
```bash
cd backend
./gradlew build
```

### 2. Start MongoDB
```bash
# Docker (easiest)
docker run -d -p 27017:27017 --name mongo mongo:6

# Or use a local install
mongod --dbpath /data/db
```

### 3. Run the Application
```bash
# Default (no seed data)
./gradlew bootRun

# Development mode with sample data
./gradlew bootRun --args='--spring.profiles.active=dev'
```

The API will be available at `http://localhost:8080`.

---

## API Documentation

Swagger UI: **http://localhost:8080/swagger-ui.html**
OpenAPI JSON: **http://localhost:8080/api-docs**

### Quick-start flow

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Alice","email":"alice@test.com","password":"Alice@1234","role":"STUDENT"}'

# 2. Login – copy the accessToken from the response
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"Alice@1234"}'

# 3. List scholarships (public)
curl http://localhost:8080/api/scholarships

# 4. Get AI recommendations (requires token)
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/scholarships/recommendations
```

---

## API Reference

### Authentication `/api/auth`
| Method | Path              | Description                     |
|--------|-------------------|---------------------------------|
| POST   | `/register`       | Create a new account            |
| POST   | `/login`          | Login – returns JWT tokens      |
| POST   | `/refresh`        | Refresh access token            |
| POST   | `/logout`         | Logout (client discards tokens) |
| POST   | `/verify-email`   | Verify email address            |
| POST   | `/forgot-password`| Request password reset email    |
| POST   | `/reset-password` | Reset password with token       |

### Scholarships `/api/scholarships`
| Method | Path                  | Auth      | Description                |
|--------|-----------------------|-----------|----------------------------|
| GET    | `/`                   | Public    | List (paginated + filters) |
| GET    | `/search?q=`          | Public    | Full-text search           |
| GET    | `/featured`           | Public    | Featured listings          |
| GET    | `/recommendations`    | Student   | AI-matched scholarships    |
| GET    | `/{id}`               | Public    | Scholarship detail         |
| GET    | `/{id}/similar`       | Public    | Similar scholarships       |
| POST   | `/`                   | Inst/Admin| Create scholarship         |
| PUT    | `/{id}`               | Inst/Admin| Update scholarship         |
| DELETE | `/{id}`               | Inst/Admin| Delete scholarship         |

### Applications `/api/applications`
| Method | Path                       | Auth       | Description               |
|--------|----------------------------|------------|---------------------------|
| GET    | `/`                        | Student    | My applications           |
| GET    | `/{id}`                    | Student    | Application detail        |
| POST   | `/`                        | Student    | Submit application        |
| PUT    | `/{id}`                    | Student    | Update DRAFT application  |
| DELETE | `/{id}`                    | Student    | Delete DRAFT application  |
| PATCH  | `/{id}/status`             | Admin/Inst | Update status             |
| GET    | `/scholarship/{id}`        | Admin/Inst | Applications for a scholarship |
| GET    | `/{id}/timeline`           | Student    | Application timeline      |

### Documents `/api/documents`
| Method | Path                      | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/upload`                 | Upload a document        |
| GET    | `/{id}`                   | Download a document      |
| GET    | `/application/{id}`       | List application docs    |
| DELETE | `/{id}`                   | Delete a document        |
| PATCH  | `/{id}/verify`            | [Admin] Verify document  |

### Dashboard `/api/dashboard`
| Method | Path            | Auth        |
|--------|-----------------|-------------|
| GET    | `/student`      | Student     |
| GET    | `/admin`        | Admin       |
| GET    | `/institution`  | Institution |
| GET    | `/stats`        | Public      |

### Notifications `/api/notifications`
| Method | Path           | Description           |
|--------|----------------|-----------------------|
| GET    | `/`            | List notifications    |
| GET    | `/unread`      | Count unread          |
| PATCH  | `/{id}/read`   | Mark as read          |
| PATCH  | `/read-all`    | Mark all as read      |
| DELETE | `/{id}`        | Delete notification   |

---

## AI Matching Algorithm

Match score (0–100) calculated per scholarship:

| Criterion         | Points |
|-------------------|--------|
| Country match     | 20     |
| Degree level      | 25     |
| Field of study    | 25     |
| GPA ≥ 3.0         | 15     |
| Funding type      | 15     |

---

## Security

- BCrypt password hashing (strength 12)
- JWT access tokens (24 h) + refresh tokens (7 d)
- Role-based method security (`@PreAuthorize`)
- CORS restricted to `localhost:3000` and `localhost:5173`
- Input validation on all request DTOs
- NoSQL injection sanitisation in `ValidationUtil`
- Soft-delete (no hard deletes on sensitive data)
- Correlation ID tracing on every request

---

## Sample Credentials (dev profile)

| Role        | Email                     | Password       |
|-------------|---------------------------|----------------|
| Admin       | admin@scholarmatch.ai     | Admin@1234     |
| Student     | alice@student.com         | Student@1234   |
| Institution | admissions@mit.edu        | Inst@1234      |

---

## Running Tests

```bash
./gradlew test
# With coverage report
./gradlew test jacocoTestReport
```

---

## Docker (Optional)

```dockerfile
# Dockerfile (add to project root)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY build/libs/scholarship-platform-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongo:
    image: mongo:6
    ports: ["27017:27017"]
    volumes: [mongo_data:/data/db]

  backend:
    build: .
    ports: ["8080:8080"]
    environment:
      MONGODB_URI: mongodb://mongo:27017/scholarship_db
      JWT_SECRET: your-256-bit-secret-key-change-in-production
    depends_on: [mongo]

volumes:
  mongo_data:
```

```bash
docker-compose up --build
```

---

## Group 32 – Indira College of Engineering and Management
*Final Year Project – 2024–25*
