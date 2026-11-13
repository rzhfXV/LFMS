package id.rzhf.projecti.service;

import id.rzhf.projecti.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path targetLocation = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + filename;
        } catch (IOException ex) {
            log.error("Failed to store file: {}", filename, ex);
            throw new BadRequestException("Failed to store file. Please try again.");
        }
    }

    public void delete(String imagePath) {
        if (imagePath == null || imagePath.isBlank()) return;

        try {
            String filename = imagePath.replace("/uploads/", "");
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete file: {}", imagePath, ex);
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
