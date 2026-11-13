package id.rzhf.projecti.dto.response;

import id.rzhf.projecti.entity.Report;
import id.rzhf.projecti.enums.ReportStatus;
import id.rzhf.projecti.enums.ReportType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long categoryId;
    private String categoryName;
    private ReportType type;
    private String title;
    private String description;
    private String location;
    private LocalDate eventDate;
    private String imagePath;
    private ReportStatus status;
    private String rejectionReason;
    private String verificationDetails;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReportResponse from(Report report) {
        return from(report, false);
    }

    public static ReportResponse from(Report report, boolean includePrivate) {
        return ReportResponse.builder()
                .id(report.getId())
                .userId(report.getUser().getId())
                .userName(report.getUser().getName())
                .categoryId(report.getCategory().getId())
                .categoryName(report.getCategory().getName())
                .type(report.getType())
                .title(report.getTitle())
                .description(report.getDescription())
                .location(report.getLocation())
                .eventDate(report.getEventDate())
                .imagePath(report.getImagePath())
                .status(report.getStatus())
                .rejectionReason(report.getRejectionReason())
                .verificationDetails((includePrivate && report.getPrivateDetail() != null)
                        ? report.getPrivateDetail().getVerificationDetails()
                        : null)
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
