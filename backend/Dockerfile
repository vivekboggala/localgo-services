# Stage 1: Build stage using Maven 3.9 with Eclipse Temurin Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and resolve dependencies first for efficient layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the executable Spring Boot JAR
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Production runtime stage using Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a unprivileged non-root user for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the compiled JAR artifact from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose default port (Render dynamically provides PORT environment variable)
EXPOSE 8080

# Configure execution entrypoint resolving Render's $PORT at runtime
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
