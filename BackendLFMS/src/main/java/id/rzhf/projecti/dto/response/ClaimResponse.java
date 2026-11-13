package id.rzhf.projecti.dto.response;

import id.rzhf.projecti.entity.Claim;
import id.rzhf.projecti.enums.ClaimStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClaimResponse {
    private Long id;
    private Long foundReportId;
    private String foundReportTitle;
    private String foundReportVerificationDetails;
    private Long claimantId;
    private String claimantName;
    private String claimantEmail;
    private String evidence;
    private ClaimStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ClaimResponse from(Claim claim) {
        return from(claim, false);
    }

    public static ClaimResponse from(Claim claim, boolean includePrivate) {
        String verificationDetails = null;
        if (includePrivate && claim.getFoundReport().getPrivateDetail() != null) {
            verificationDetails = claim.getFoundReport().getPrivateDetail().getVerificationDetails();
        }

        return ClaimResponse.builder()
                .id(claim.getId())
                .foundReportId(claim.getFoundReport().getId())
                .foundReportTitle(claim.getFoundReport().getTitle())
                .foundReportVerificationDetails(verificationDetails)
                .claimantId(claim.getClaimant().getId())
                .claimantName(claim.getClaimant().getName())
                .claimantEmail(includePrivate ? claim.getClaimant().getEmail() : null)
                .evidence(claim.getEvidence())
                .status(claim.getStatus())
                .adminNote(claim.getAdminNote())
                .createdAt(claim.getCreatedAt())
                .updatedAt(claim.getUpdatedAt())
                .build();
    }
}
