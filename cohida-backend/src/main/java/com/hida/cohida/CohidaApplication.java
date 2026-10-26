package com.hida.cohida;

import com.hida.cohida.auth.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
@EnableScheduling
public class CohidaApplication {

    public static void main(String[] args) {
        SpringApplication.run(CohidaApplication.class, args);
    }

}
