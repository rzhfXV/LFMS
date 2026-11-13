package id.rzhf.projecti.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClaimRequest {

    @NotNull(message = "Report ID is required")
    private Long foundReportId;

    @NotBlank(message = "Evidence is required")
    @Size(min = 20, max = 5000, message = "Evidence must be between 20 and 5000 characters")
    private String evidence;
}
