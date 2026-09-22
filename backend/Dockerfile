# Imagen del backend para Render/Railway/cualquier host con Docker.
# Etapa 1: compilar con el Maven Wrapper (no hace falta Maven en la imagen base).
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B package -DskipTests

# Etapa 2: solo el JRE y el jar. Usuario sin privilegios.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 app
COPY --from=build /app/target/*.jar app.jar
USER app
# El host inyecta PORT; application.yml ya hace server.port=${PORT:8080}
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
