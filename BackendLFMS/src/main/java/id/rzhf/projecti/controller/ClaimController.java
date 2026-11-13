package id.rzhf.projecti.controller;

import id.rzhf.projecti.dto.request.ClaimRequest;
import id.rzhf.projecti.dto.response.ClaimResponse;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping("/claims")
    public ResponseEntity<ClaimResponse> submit(
            @Valid @RequestBody ClaimRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                claimService.submit(request, authentication.getName()));
    }

    @GetMapping("/user/claims")
    public ResponseEntity<PageResponse<ClaimResponse>> findMyClaims(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(claimService.findMyClaims(authentication.getName(), page, size));
    }

    @GetMapping("/user/claims/{id}")
    public ResponseEntity<ClaimResponse> findMyClaimById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(claimService.findMyClaimById(id, authentication.getName()));
    }

    @DeleteMapping("/user/claims/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id, Authentication authentication) {
        claimService.cancel(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
