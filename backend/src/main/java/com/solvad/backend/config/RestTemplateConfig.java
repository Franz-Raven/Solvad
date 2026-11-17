package com.solvad.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    // Shared by Gemini (scope generation + gap analysis) and the Hugging Face embedding call.
    // The read timeout is sized to cover Gemini calls that include file attachments.
    @Value("${http.client.connect-timeout-ms:10000}")
    private long connectTimeoutMs;

    @Value("${http.client.read-timeout-ms:90000}")
    private long readTimeoutMs;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        return new RestTemplate(requestFactory);
    }
}
