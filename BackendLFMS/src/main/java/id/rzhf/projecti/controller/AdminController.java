package id.rzhf.projecti.controller;

import id.rzhf.projecti.dto.request.CategoryRequest;
import id.rzhf.projecti.dto.request.ReviewClaimRequest;
import id.rzhf.projecti.dto.request.ReviewReportRequest;
import id.rzhf.projecti.dto.response.*;
import id.rzhf.projecti.enums.ClaimStatus;
import id.rzhf.projecti.enums.ReportStatus;
import id.rzhf.projecti.enums.UserStatus;
import id.rzhf.projecti.service.AdminService;
import id.rzhf.projecti.service.CategoryService;
import id.rzhf.projecti.service.ClaimService;
import id.rzhf.projecti.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;
    private final ClaimService claimService;
    private final CategoryService categoryService;

    // ── Dashboard ───────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> dashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    // ── Reports ─────────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<PageResponse<ReportResponse>> findAllReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.findAll(status, page, size));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<ReportResponse> findReport(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.findById(id));
    }

    @PatchMapping("/reports/{id}/review")
    public ResponseEntity<ReportResponse> reviewReport(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReportRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.review(id, request, authentication.getName()));
    }

    // CSV Export
    @GetMapping("/reports/export")
    public void exportReports(HttpServletResponse response,
                              @RequestParam(required = false) ReportStatus status)
            throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=reports.csv");

        PageResponse<ReportResponse> reports = reportService.findAll(status, 0, Integer.MAX_VALUE);

        try (PrintWriter writer = response.getWriter()) {
            writer.println("ID,Type,Title,Category,Location,EventDate,Status,ReporterName,CreatedAt");
            for (ReportResponse r : reports.getContent()) {
                writer.printf("%d,%s,\"%s\",%s,\"%s\",%s,%s,%s,%s%n",
                        r.getId(), r.getType(), r.getTitle().replace("\"", "\"\""),
                        r.getCategoryName(), r.getLocation().replace("\"", "\"\""),
                        r.getEventDate(), r.getStatus(), r.getUserName(), r.getCreatedAt());
            }
        }
    }

    // ── Claims ──────────────────────────────────────────────────────────────────

    @GetMapping("/claims")
    public ResponseEntity<PageResponse<ClaimResponse>> findAllClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(claimService.findAll(status, page, size));
    }

    @GetMapping("/claims/{id}")
    public ResponseEntity<ClaimResponse> findClaim(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.findById(id));
    }

    @PatchMapping("/claims/{id}/review")
    public ResponseEntity<ClaimResponse> reviewClaim(
            @PathVariable Long id,
            @Valid @RequestBody ReviewClaimRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(claimService.review(id, request, authentication.getName()));
    }

    @PatchMapping("/claims/{id}/complete")
    public ResponseEntity<ClaimResponse> completeClaim(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(claimService.complete(id, authentication.getName()));
    }

    // ── Users ───────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> findAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.findAllUsers(page, size));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(adminService.updateUserStatus(id, status, authentication.getName()));
    }

    // ── Categories ──────────────────────────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> findAllCategories() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Audit Logs ──────────────────────────────────────────────────────────────

    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AdminService.AuditLogResponse>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAuditLogs(page, size));
    }
}
