package com.solvad.backend.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Transformation;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(@Value("${cloudinary.url}") String cloudinaryUrl) {
        this.cloudinary = new Cloudinary(cloudinaryUrl);
        this.cloudinary.config.secure = true;
        System.out.println("Cloudinary service initialized for Solvad");
    }

    /**
     * Upload aaa file to Cloudinary and return both URL and format
     * @param file The multipart file to upload
     * @param folder The folder path in Cloudinary (e.g., "problem-attachments")
     * @return CloudinaryUploadResult containing URL and format
     */
    @SuppressWarnings("unchecked")
    public CloudinaryUploadResult uploadFileWithMeta(MultipartFile file, String folder) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "solvad/" + folder,
                            "resource_type", "auto", // Auto-detect: image, video, raw, etc.
                            "quality", "auto:good",
                            "fetch_format", "auto"
                    )
            );

            String url = uploadResult.get("secure_url").toString();
            Object formatObj = uploadResult.get("format");
            String format = formatObj != null ? formatObj.toString() : null;

            return new CloudinaryUploadResult(url, format);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Upload aaa file to Cloudinary and return the URL
     * @param file The multipart file to upload
     * @param folder The folder path in Cloudinary
     * @return The secure URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) {
        CloudinaryUploadResult result = uploadFileWithMeta(file, folder);
        return result.getUrl();
    }

    /**
     * Upload aaa byte array to Cloudinary (e.g., generated PDFs)
     * @param bytes The byte array to upload
     * @param filename The desired filename (including extension)
     * @param folder The folder path in Cloudinary
     * @return The secure URL of the uploaded file
     */
    @SuppressWarnings("unchecked")
    public String uploadBytes(byte[] bytes, String filename, String folder) {
        try {
            if (bytes == null || bytes.length == 0) {
                throw new RuntimeException("Byte array is empty");
            }

            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    bytes,
                    ObjectUtils.asMap(
                            "folder", "solvad/" + folder,
                            "resource_type", "raw", // For PDFs and other documents
                            "public_id", filename.substring(0, filename.lastIndexOf('.')), // Remove extension
                            "format", filename.substring(filename.lastIndexOf('.') + 1) // Set format from extension
                    )
            );

            return uploadResult.get("secure_url").toString();

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload bytes to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Delete aaa file from Cloudinary using its URL
     * @param fileUrl The Cloudinary URL of the file to delete
     */
    public void deleteFile(String fileUrl) {
        try {
            String publicId = extractPublicIdFromUrl(fileUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Extract the public ID from aaa Cloudinary URL
     * Example: https://res.cloudinary.com/xxx/image/upload/v123456/solvad/folder/file.jpg
     * Returns: solvad/folder/file
     */
    private String extractPublicIdFromUrl(String url) {
        try {
            String[] parts = url.split("/upload/");
            if (parts.length > 1) {
                String path = parts[1];
                // Remove version number (e.g., v1234567890/)
                if (path.startsWith("v")) {
                    path = path.substring(path.indexOf('/') + 1);
                }
                // Remove file extension
                int lastDot = path.lastIndexOf('.');
                if (lastDot != -1) {
                    path = path.substring(0, lastDot);
                }
                return path;
            }
            throw new RuntimeException("Invalid Cloudinary URL format");
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract public ID from URL: " + url, e);
        }
    }

    /**
     * Upload an optimized profile picture to Cloudinary.
     * Automatically crops to a 400x400 square centered on the user's face to save storage.
     *
     * @param file The multipart file to upload
     * @param folder The folder path (e.g., "profiles")
     * @return The secure URL of the optimized image
     */
    @SuppressWarnings("unchecked")
    public String uploadProfilePicture(MultipartFile file, String folder) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            // 🚀 Force Cloudinary to crop, resize, and compress BEFORE saving
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", "solvad/" + folder,
                    "transformation", new Transformation<>()
                            .width(400)
                            .height(400)
                            .crop("fill")             // Fill the 400x400 box
                            .gravity("face")          // Use AI to center crop on the face
                            .quality("auto")          // Apply aggressive compression
                            .fetchFormat("auto")      // Convert to modern formats like WebP/AVIF
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    uploadParams
            );

            return uploadResult.get("secure_url").toString();

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload profile picture: " + e.getMessage(), e);
        }
    }
}
