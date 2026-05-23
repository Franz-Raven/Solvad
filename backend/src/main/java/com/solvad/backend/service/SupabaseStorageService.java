package com.solvad.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class SupabaseStorageService {

    private static final String BUCKET_NAME = "solution-files";

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Uploads a file to Supabase Storage and returns the public URL.
     * Path structure: solution-files/{attemptId}/{subtaskId}/{uuid-filename}
     */
    public String uploadFile(MultipartFile file, UUID attemptId, UUID subtaskId) {
        try {
            String originalFilename = file.getOriginalFilename() != null
                    ? file.getOriginalFilename() : "file";
            String extension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalFilename.substring(dotIndex);
            }
            String uniqueFilename = UUID.randomUUID() + extension;
            String filePath = attemptId + "/" + subtaskId + "/" + uniqueFilename;

            String uploadUrl = supabaseUrl + "/storage/v1/object/" + BUCKET_NAME + "/" + filePath;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.parseMediaType(
                    file.getContentType() != null ? file.getContentType() : "application/octet-stream"
            ));
            headers.set("x-upsert", "true");

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, HttpMethod.POST, requestEntity, String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                // Return the public URL
                return supabaseUrl + "/storage/v1/object/public/" + BUCKET_NAME + "/" + filePath;
            } else {
                throw new RuntimeException("Failed to upload file to Supabase: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a file from Supabase Storage given its public URL.
     */
    public void deleteFile(String publicUrl) {
        try {
            // Extract the file path from the public URL
            String prefix = supabaseUrl + "/storage/v1/object/public/" + BUCKET_NAME + "/";
            if (!publicUrl.startsWith(prefix)) return;

            String filePath = publicUrl.substring(prefix.length());
            String deleteUrl = supabaseUrl + "/storage/v1/object/" + BUCKET_NAME + "/" + filePath;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, requestEntity, String.class);

        } catch (Exception e) {
            // Log but don't throw — file cleanup failures shouldn't block the main flow
            System.err.println("Warning: Failed to delete file from Supabase: " + e.getMessage());
        }
    }
}