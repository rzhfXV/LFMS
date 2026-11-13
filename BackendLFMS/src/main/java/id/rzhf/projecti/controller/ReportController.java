package id.rzhf.projecti.controller;

import id.rzhf.projecti.dto.request.ReportRequest;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.dto.response.ReportResponse;
import id.rzhf.projecti.enums.ReportType;
import id.rzhf.projecti.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // ── Public ─────────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<PageResponse<ReportResponse>> findPublic(
            @RequestParam(required = false) ReportType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                reportService.findPublic(type, categoryId, location, eventDate, q, page, size));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<ReportResponse> findPublicById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.findPublicById(id));
    }

    // ── User ────────────────────────────────────────────────────────────────────

    @PostMapping(value = "/reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportResponse> create(
            @Valid @ModelAttribute ReportRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                reportService.create(request, image, authentication.getName()));
    }

    @GetMapping("/user/reports")
    public ResponseEntity<PageResponse<ReportResponse>> findMyReports(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.findMyReports(authentication.getName(), page, size));
    }

    @GetMapping("/user/reports/{id}")
    public ResponseEntity<ReportResponse> findMyReportById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.findMyReportById(id, authentication.getName()));
    }

    @PutMapping(value = "/user/reports/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportResponse> update(
            @PathVariable Long id,
            @Valid @ModelAttribute ReportRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.update(id, request, image, authentication.getName()));
    }

    @DeleteMapping("/user/reports/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        reportService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
