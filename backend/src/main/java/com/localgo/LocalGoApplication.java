package com.localgo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LocalGoApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocalGoApplication.class, args);
    }
}
