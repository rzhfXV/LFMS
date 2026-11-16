package id.rzhf.projecti.service;

import id.rzhf.projecti.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.upload.max-size-bytes}")
    private long maxSizeBytes;

    @Value("${app.upload.allowed-extensions}")
    private String allowedExtensions;

    @Value("${app.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.supabase.key:}")
    private String supabaseKey;

    @Value("${app.supabase.bucket:reports}")
    private String supabaseBucket;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        validateFile(file);

        String extension = FilenameUtils.getExtension(file.getOriginalFilename()).toLowerCase();
        String filename = UUID.randomUUID() + "." + extension;

        // If Supabase credentials are configured, upload directly to Supabase Storage
        if (StringUtils.hasText(supabaseUrl) && StringUtils.hasText(supabaseKey)) {
            return storeToSupabase(file, filename);
        }

        // Fallback: local disk storage
        return storeToLocal(file, filename);
    }

    private String storeToSupabase(MultipartFile file, String filename) {
        String baseUrl = supabaseUrl.replaceAll("/+$", "");
        String uploadUrl = String.format("%s/storage/v1/object/%s/%s", baseUrl, supabaseBucket, filename);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .header("Authorization", "Bearer " + supabaseKey.trim())
                    .header("apikey", supabaseKey.trim())
                    .header("Content-Type", file.getContentType())
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", baseUrl, supabaseBucket, filename);
                log.info("File uploaded successfully to Supabase Storage: {}", publicUrl);
                return publicUrl;
            } else {
                log.error("Failed to upload to Supabase Storage. Status: {}, Body: {}",
                        response.statusCode(), response.body());
                throw new BadRequestException("Failed to upload image to Supabase Storage. Please check bucket settings.");
            }
        } catch (IOException | InterruptedException ex) {
            log.error("Error connecting to Supabase Storage: {}", ex.getMessage(), ex);
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new BadRequestException("Storage service connection error: " + ex.getMessage());
        }
    }

    private String storeToLocal(MultipartFile file, String filename) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path targetLocation = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + filename;
        } catch (IOException ex) {
            log.error("Failed to store file locally: {}", filename, ex);
            throw new BadRequestException("Failed to store file locally. Please try again.");
        }
    }

    public void delete(String imagePath) {
        if (!StringUtils.hasText(imagePath)) return;

        // If stored in Supabase Storage
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            if (StringUtils.hasText(supabaseUrl) && StringUtils.hasText(supabaseKey)) {
                deleteFromSupabase(imagePath);
            }
            return;
        }

        // If stored locally
        try {
            String filename = imagePath.replace("/uploads/", "");
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete local file: {}", imagePath, ex);
        }
    }

    private void deleteFromSupabase(String imageUrl) {
        try {
            String baseUrl = supabaseUrl.replaceAll("/+$", "");
            String prefix = String.format("%s/storage/v1/object/public/%s/", baseUrl, supabaseBucket);
            if (!imageUrl.startsWith(prefix)) return;

            String filename = imageUrl.substring(prefix.length());
            String deleteUrl = String.format("%s/storage/v1/object/%s/%s", baseUrl, supabaseBucket, filename);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(deleteUrl))
                    .header("Authorization", "Bearer " + supabaseKey.trim())
                    .header("apikey", supabaseKey.trim())
                    .DELETE()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ex) {
            log.warn("Failed to delete file from Supabase Storage: {}", imageUrl, ex);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > maxSizeBytes) {
            throw new BadRequestException("File size exceeds the maximum allowed limit (5MB)");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Invalid file name");
        }

        String extension = FilenameUtils.getExtension(originalFilename).toLowerCase();
        List<String> allowed = Arrays.asList(allowedExtensions.split(","));
        if (!allowed.contains(extension)) {
            throw new BadRequestException("File type not allowed. Allowed types: " + allowedExtensions);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file content type");
        }

        // Check for path traversal
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BadRequestException("Invalid file name");
        }
    }
}
