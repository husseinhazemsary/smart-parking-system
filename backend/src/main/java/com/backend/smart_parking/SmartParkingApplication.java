package com.backend.smart_parking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

@SpringBootApplication
@EnableScheduling
public class SmartParkingApplication {

	public static void main(String[] args) {
		loadEnv(".env");
		SpringApplication.run(SmartParkingApplication.class, args);
	}

	private static void loadEnv(String path) {
		try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
			String line;
			while ((line = reader.readLine()) != null) {
				line = line.trim();
				if (line.isEmpty() || line.startsWith("#")) continue;
				int eq = line.indexOf('=');
				if (eq < 1) continue;
				String key = line.substring(0, eq).trim();
				String value = line.substring(eq + 1).trim();
				if (System.getenv(key) == null) {
					System.setProperty(key, value);
				}
			}
		} catch (IOException ignored) {
		}
	}

}
