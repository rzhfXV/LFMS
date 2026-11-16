package id.rzhf.projecti.service;

import id.rzhf.projecti.dto.request.ClaimRequest;
import id.rzhf.projecti.dto.request.ReviewClaimRequest;
import id.rzhf.projecti.dto.response.ClaimResponse;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.entity.Claim;
import id.rzhf.projecti.entity.Report;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.enums.ClaimStatus;
import id.rzhf.projecti.enums.ReportStatus;
import id.rzhf.projecti.enums.ReportType;
import id.rzhf.projecti.exception.AccessDeniedException;
import id.rzhf.projecti.exception.BadRequestException;
import id.rzhf.projecti.exception.ResourceNotFoundException;
import id.rzhf.projecti.repository.ClaimRepository;
import id.rzhf.projecti.repository.ReportRepository;
import id.rzhf.projecti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional
    public ClaimResponse submit(ClaimRequest request, String userEmail) {
        User claimant = getUserByEmail(userEmail);
        Report report = reportRepository.findById(request.getFoundReportId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        // BR-05: Only FOUND reports that are PUBLISHED
        if (report.getType() != ReportType.FOUND || report.getStatus() != ReportStatus.PUBLISHED) {
            throw new BadRequestException("Claim can only be submitted for published FOUND reports");
        }

        // BR-06: Cannot claim own found report
        if (report.getUser().getId().equals(claimant.getId())) {
            throw new BadRequestException("You cannot claim a report you submitted");
        }

        // Prevent duplicate active claims
        boolean alreadyClaimed = claimRepository.existsByFoundReportIdAndClaimantIdAndStatusNotIn(
                report.getId(), claimant.getId(),
                List.of(ClaimStatus.REJECTED, ClaimStatus.CANCELLED)
        );
        if (alreadyClaimed) {
            throw new BadRequestException("You already have an active claim on this report");
        }

        Claim claim = Claim.builder()
                .foundReport(report)
                .claimant(claimant)
                .evidence(request.getEvidence().trim())
                .build();

        Claim saved = claimRepository.save(claim);
        auditLogService.log(claimant, "CLAIM_SUBMITTED", "Claim", saved.getId(),
                "Claim submitted for report: " + report.getId());

        // Notify report owner
        notificationService.send(report.getUser(), "Klaim Baru Masuk",
                "Ada pengajuan klaim baru untuk barang temuan Anda: '" + report.getTitle() + "'");

        return ClaimResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> findMyClaims(String userEmail, int page, int size) {
        User user = getUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Claim> result = claimRepository.findByClaimantId(user.getId(), pageable);
        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public ClaimResponse findMyClaimById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Claim claim = claimRepository.findByIdAndClaimantId(id, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Claim not found or access denied"));
        return ClaimResponse.from(claim, false);
    }

    @Transactional
    public void cancel(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Claim claim = claimRepository.findByIdAndClaimantId(id, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Claim not found or access denied"));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("Only PENDING claims can be cancelled");
        }

        claim.setStatus(ClaimStatus.CANCELLED);
        claimRepository.save(claim);
        auditLogService.log(user, "CLAIM_CANCELLED", "Claim", id, "Claim cancelled by user");
    }

    // ── Admin ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> findAll(ClaimStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Claim> result = (status != null)
                ? claimRepository.findByStatus(status, pageable)
                : claimRepository.findAll(pageable);
        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public ClaimResponse findById(Long id) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));
        return ClaimResponse.from(claim, true);
    }

    @Transactional
    public ClaimResponse review(Long id, ReviewClaimRequest request, String adminEmail) {
        User admin = getUserByEmail(adminEmail);
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("Only PENDING claims can be reviewed");
        }

        Set<ClaimStatus> allowedStatuses = Set.of(ClaimStatus.APPROVED, ClaimStatus.REJECTED);
        if (!allowedStatuses.contains(request.getStatus())) {
            throw new BadRequestException("Admin can only APPROVE or REJECT a claim");
        }

        claim.setStatus(request.getStatus());
        claim.setReviewedBy(admin);
        if (request.getAdminNote() != null) {
            claim.setAdminNote(request.getAdminNote().trim());
        }

        Claim saved = claimRepository.save(claim);
        auditLogService.log(admin, "CLAIM_REVIEWED", "Claim", id,
                "Claim status changed to: " + request.getStatus());

        // Notify claimant
        String notifTitle = "Status Klaim Diperbarui";
        String notifMsg = request.getStatus() == ClaimStatus.APPROVED
                ? "Klaim Anda untuk '" + claim.getFoundReport().getTitle() + "' telah disetujui! Hubungi admin untuk pengambilan barang."
                : "Klaim Anda untuk '" + claim.getFoundReport().getTitle() + "' ditolak." +
                  (request.getAdminNote() != null ? " Catatan: " + request.getAdminNote() : "");
        notificationService.send(claim.getClaimant(), notifTitle, notifMsg);

        return ClaimResponse.from(saved);
    }

    @Transactional
    public ClaimResponse complete(Long id, String adminEmail) {
        User admin = getUserByEmail(adminEmail);
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new BadRequestException("Only APPROVED claims can be marked as completed");
        }

        claim.setStatus(ClaimStatus.COMPLETED);
        Claim saved = claimRepository.save(claim);

        // Update the report status to RESOLVED
        Report report = claim.getFoundReport();
        report.setStatus(ReportStatus.RESOLVED);
        reportRepository.save(report);

        auditLogService.log(admin, "CLAIM_COMPLETED", "Claim", id, "Item returned to owner");

        notificationService.send(claim.getClaimant(), "Proses Selesai",
                "Barang '" + report.getTitle() + "' telah berhasil dikembalikan kepada Anda. Terima kasih!");
        notificationService.send(report.getUser(), "Barang Dikembalikan",
                "Barang temuan Anda '" + report.getTitle() + "' telah berhasil dikembalikan kepada pemiliknya.");

        return ClaimResponse.from(saved);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private PageResponse<ClaimResponse> toPageResponse(Page<Claim> page) {
        return PageResponse.<ClaimResponse>builder()
                .content(page.getContent().stream().map(ClaimResponse::from).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
