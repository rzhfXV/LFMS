package id.rzhf.projecti.dto.request;

import id.rzhf.projecti.enums.ReportType;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class ReportRequest {

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Report type is required")
    private ReportType type;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @NotNull(message = "Event date is required")
    @PastOrPresent(message = "Event date cannot be in the future")
    private LocalDate eventDate;

    // Optional: private verification details for FOUND reports
    private String verificationDetails;
}
