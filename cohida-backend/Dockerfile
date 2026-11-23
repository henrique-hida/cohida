FROM maven:3.9-eclipse-temurin-25

RUN apt-get update && apt-get install -y --no-install-recommends imagemagick webp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pom.xml ./
RUN mvn dependency:go-offline

COPY src ./src

EXPOSE 8080

CMD ["mvn", "spring-boot:run"]
