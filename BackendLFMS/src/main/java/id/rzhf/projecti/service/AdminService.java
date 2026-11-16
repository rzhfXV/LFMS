package id.rzhf.projecti.service;

import id.rzhf.projecti.dto.response.DashboardResponse;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.dto.response.UserResponse;
import id.rzhf.projecti.entity.AuditLog;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.enums.ClaimStatus;
import id.rzhf.projecti.enums.ReportStatus;
import id.rzhf.projecti.enums.ReportType;
import id.rzhf.projecti.enums.UserRole;
import id.rzhf.projecti.enums.UserStatus;
import id.rzhf.projecti.exception.BadRequestException;
import id.rzhf.projecti.exception.ResourceNotFoundException;
import id.rzhf.projecti.repository.AuditLogRepository;
import id.rzhf.projecti.repository.ClaimRepository;
import id.rzhf.projecti.repository.ReportRepository;
import id.rzhf.projecti.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ClaimRepository claimRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    // ── Dashboard ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalLost = reportRepository.countByTypeAndStatus(ReportType.LOST, ReportStatus.PUBLISHED);
        long totalFound = reportRepository.countByTypeAndStatus(ReportType.FOUND, ReportStatus.PUBLISHED);
        long pending = reportRepository.countByStatus(ReportStatus.PENDING_REVIEW);
        long pendingClaims = claimRepository.countByStatus(ClaimStatus.PENDING);
        long resolved = reportRepository.countResolved();

        Map<String, Long> byCategory = new LinkedHashMap<>();
        List<Object[]> rows = reportRepository.countByCategory();
        for (Object[] row : rows) {
            byCategory.put((String) row[0], (Long) row[1]);
        }

        return DashboardResponse.builder()
                .totalLostReports(totalLost)
                .totalFoundReports(totalFound)
                .pendingReports(pending)
                .pendingClaims(pendingClaims)
                .resolvedItems(resolved)
                .reportsByCategory(byCategory)
                .build();
    }

    // ── User Management ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> result = userRepository.findAll(pageable);
        return PageResponse.<UserResponse>builder()
                .content(result.getContent().stream().map(UserResponse::from).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, UserStatus status, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Cannot change status of an admin account");
        }

        user.setStatus(status);
        User saved = userRepository.save(user);
        auditLogService.log(admin, "USER_STATUS_UPDATED", "User", userId,
                "User status changed to: " + status + " for user: " + user.getEmail());
        return UserResponse.from(saved);
    }

    // ── Audit Logs ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLog> result = auditLogRepository.findByOrderByCreatedAtDesc(pageable);
        return PageResponse.<AuditLogResponse>builder()
                .content(result.getContent().stream().map(AuditLogResponse::from).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Data
    @Builder
    public static class AuditLogResponse {
        private Long id;
        private Long userId;
        private String userName;
        private String action;
        private String entityType;
        private Long entityId;
        private String ipAddress;
        private String description;
        private LocalDateTime createdAt;

        public static AuditLogResponse from(AuditLog log) {
            return AuditLogResponse.builder()
                    .id(log.getId())
                    .userId(log.getUser() != null ? log.getUser().getId() : null)
                    .userName(log.getUser() != null ? log.getUser().getName() : "System")
                    .action(log.getAction())
                    .entityType(log.getEntityType())
                    .entityId(log.getEntityId())
                    .ipAddress(log.getIpAddress())
                    .description(log.getDescription())
                    .createdAt(log.getCreatedAt())
                    .build();
        }
    }
}
