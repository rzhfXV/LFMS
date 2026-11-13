package id.rzhf.projecti.dto.request;

import id.rzhf.projecti.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewClaimRequest {

    @NotNull(message = "Status is required")
    private ClaimStatus status;

    private String adminNote;
}
