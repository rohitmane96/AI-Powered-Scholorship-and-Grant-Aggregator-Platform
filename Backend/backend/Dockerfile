# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build the application with Gradle
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy Gradle wrapper and build scripts first (layer caching)
COPY gradlew .
COPY gradle/ gradle/
COPY settings.gradle .
COPY build.gradle .

# Download dependencies (cached unless build.gradle changes)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# Copy source code and build
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Lean runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="Group 32 – ICEM <group32@icem.edu.in>"
LABEL description="ScholarMatch AI – Scholarship & Grant Aggregator Platform"

# Create a non-root user for security
RUN addgroup -S scholarship && adduser -S scholarship -G scholarship

WORKDIR /app

# Copy built JAR from build stage
COPY --from=builder /app/build/libs/scholarship-platform-*.jar app.jar

# Create uploads directory
RUN mkdir -p uploads && chown -R scholarship:scholarship /app

USER scholarship

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
