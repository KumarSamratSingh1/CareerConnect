# Stage 1: Build the Spring Boot application
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Download dependencies in layer for caching
RUN ./mvnw dependency:go-offline -B

# Copy sources and package application
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime image optimized for Render 512MB container
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=builder /app/target/careerconnect-backend-*.jar app.jar

EXPOSE 8080
ENV PORT=8080
ENV JAVA_OPTS="-Xmx384m -Xms192m -XX:+UseG1GC -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]

