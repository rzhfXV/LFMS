package id.rzhf.projecti.service;

import id.rzhf.projecti.dto.request.ReportRequest;
import id.rzhf.projecti.dto.request.ReviewReportRequest;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.dto.response.ReportResponse;
import id.rzhf.projecti.entity.Category;
import id.rzhf.projecti.entity.Report;
import id.rzhf.projecti.entity.ReportPrivateDetail;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.enums.ReportStatus;
import id.rzhf.projecti.enums.ReportType;
import id.rzhf.projecti.enums.UserRole;
import id.rzhf.projecti.exception.AccessDeniedException;
import id.rzhf.projecti.exception.BadRequestException;
import id.rzhf.projecti.exception.ResourceNotFoundException;
import id.rzhf.projecti.repository.CategoryRepository;
import id.rzhf.projecti.repository.ReportPrivateDetailRepository;
import id.rzhf.projecti.repository.ReportRepository;
import id.rzhf.projecti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ReportPrivateDetailRepository privateDetailRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    // ── Public ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> findPublic(
            ReportType type, Long categoryId, String location,
            LocalDate eventDate, String keyword, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Specification<Report> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), ReportStatus.PUBLISHED));

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (location != null && !location.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (eventDate != null) {
                predicates.add(cb.equal(root.get("eventDate"), eventDate));
            }
            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Report> result = reportRepository.findAll(spec, pageable);

        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public ReportResponse findPublicById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        if (report.getStatus() != ReportStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Report not found");
        }
        return ReportResponse.from(report);
    }

    // ── User ────────────────────────────────────────────────────────────────────

    @Transactional
    public ReportResponse create(ReportRequest request, MultipartFile image,
                                  String userEmail) {
        User user = getUserByEmail(userEmail);
        Category category = getCategoryById(request.getCategoryId());

        String imagePath = fileStorageService.store(image);

        Report report = Report.builder()
                .user(user)
                .category(category)
                .type(request.getType())
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .location(request.getLocation().trim())
                .eventDate(request.getEventDate())
                .imagePath(imagePath)
                .build();

        Report saved = reportRepository.save(report);

        // Store private details for FOUND reports
        if (request.getType() == ReportType.FOUND
                && request.getVerificationDetails() != null
                && !request.getVerificationDetails().isBlank()) {
            ReportPrivateDetail detail = ReportPrivateDetail.builder()
                    .report(saved)
                    .verificationDetails(request.getVerificationDetails().trim())
                    .build();
            privateDetailRepository.save(detail);
            saved.setPrivateDetail(detail);
        }

        auditLogService.log(user, "REPORT_CREATED", "Report", saved.getId(),
                "Report created: " + saved.getTitle());

        return ReportResponse.from(saved, true);
    }

    @Transactional
    public ReportResponse update(Long id, ReportRequest request, MultipartFile image,
                                  String userEmail) {
        User user = getUserByEmail(userEmail);
        Report report = getReportById(id);

        // IDOR protection
        if (!report.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only edit your own reports");
        }

        // Only allow edit if PENDING_REVIEW or REJECTED
        if (!Set.of(ReportStatus.PENDING_REVIEW, ReportStatus.REJECTED).contains(report.getStatus())) {
            throw new BadRequestException("Cannot edit a report with status: " + report.getStatus());
        }

        Category category = getCategoryById(request.getCategoryId());

        if (image != null && !image.isEmpty()) {
            fileStorageService.delete(report.getImagePath());
            report.setImagePath(fileStorageService.store(image));
        }

        report.setCategory(category);
        report.setType(request.getType());
        report.setTitle(request.getTitle().trim());
        report.setDescription(request.getDescription().trim());
        report.setLocation(request.getLocation().trim());
        report.setEventDate(request.getEventDate());
        report.setStatus(ReportStatus.PENDING_REVIEW);

        // Update private details
        if (request.getVerificationDetails() != null) {
            ReportPrivateDetail detail = privateDetailRepository
                    .findByReportId(id).orElse(ReportPrivateDetail.builder().report(report).build());
            detail.setVerificationDetails(request.getVerificationDetails().trim());
            privateDetailRepository.save(detail);
            report.setPrivateDetail(detail);
        }

        Report saved = reportRepository.save(report);
        auditLogService.log(user, "REPORT_UPDATED", "Report", saved.getId(), "Report updated");
        return ReportResponse.from(saved, true);
    }

    @Transactional
    public void delete(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Report report = getReportById(id);

        if (!report.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("You can only delete your own reports");
        }

        if (report.getStatus() == ReportStatus.PUBLISHED) {
            throw new BadRequestException("Cannot delete a published report. Please contact admin.");
        }

        fileStorageService.delete(report.getImagePath());
        auditLogService.log(user, "REPORT_DELETED", "Report", id, "Report deleted: " + report.getTitle());
        reportRepository.delete(report);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> findMyReports(String userEmail, int page, int size) {
        User user = getUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Report> result = reportRepository.findByUserId(user.getId(), pageable);
        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public ReportResponse findMyReportById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Report report = getReportById(id);
        if (!report.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("You can only view your own reports");
        }
        return ReportResponse.from(report, true);
    }

    // ── Admin ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> findAll(ReportStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Report> result = (status != null)
                ? reportRepository.findByStatus(status, pageable)
                : reportRepository.findAll(pageable);
        return toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public ReportResponse findById(Long id) {
        return ReportResponse.from(getReportById(id), true);
    }

    @Transactional
    public ReportResponse review(Long id, ReviewReportRequest request, String adminEmail) {
        User admin = getUserByEmail(adminEmail);
        Report report = getReportById(id);

        Set<ReportStatus> allowedTransitions = Set.of(
                ReportStatus.PUBLISHED, ReportStatus.REJECTED,
                ReportStatus.RESOLVED, ReportStatus.CLOSED
        );

        if (!allowedTransitions.contains(request.getStatus())) {
            throw new BadRequestException("Invalid status transition: " + request.getStatus());
        }

        if (report.getStatus() != ReportStatus.PENDING_REVIEW
                && request.getStatus() == ReportStatus.PUBLISHED) {
            throw new BadRequestException("Only PENDING_REVIEW reports can be published");
        }

        if (request.getStatus() == ReportStatus.REJECTED
                && (request.getRejectionReason() == null || request.getRejectionReason().isBlank())) {
            throw new BadRequestException("Rejection reason is required when rejecting a report");
        }

        report.setStatus(request.getStatus());
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());
        if (request.getRejectionReason() != null) {
            report.setRejectionReason(request.getRejectionReason().trim());
        }

        Report saved = reportRepository.save(report);

        auditLogService.log(admin, "REPORT_REVIEWED", "Report", id,
                "Report status changed to: " + request.getStatus());

        // Notify report owner
        String notifTitle = "Laporan Anda Diperbarui";
        String notifMsg = switch (request.getStatus()) {
            case PUBLISHED -> "Laporan '" + report.getTitle() + "' Anda telah disetujui dan dipublikasikan.";
            case REJECTED -> "Laporan '" + report.getTitle() + "' Anda ditolak. Alasan: " + request.getRejectionReason();
            case RESOLVED -> "Laporan '" + report.getTitle() + "' telah ditandai sebagai selesai.";
            default -> "Status laporan '" + report.getTitle() + "' telah diperbarui menjadi " + request.getStatus();
        };
        notificationService.send(report.getUser(), notifTitle, notifMsg);

        return ReportResponse.from(saved);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Report getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
    }

    private Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    private PageResponse<ReportResponse> toPageResponse(Page<Report> page) {
        return PageResponse.<ReportResponse>builder()
                .content(page.getContent().stream().map(ReportResponse::from).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
