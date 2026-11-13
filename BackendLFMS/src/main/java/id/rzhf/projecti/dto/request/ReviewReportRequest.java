package id.rzhf.projecti.dto.request;

import id.rzhf.projecti.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewReportRequest {

    @NotNull(message = "Status is required")
    private ReportStatus status;

    private String rejectionReason;
}
