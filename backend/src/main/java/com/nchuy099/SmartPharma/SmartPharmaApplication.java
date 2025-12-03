package com.nchuy099.SmartPharma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartPharmaApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartPharmaApplication.class, args);
	}

}
