package id.rzhf.projecti.controller;

import id.rzhf.projecti.dto.request.UpdateProfileRequest;
import id.rzhf.projecti.dto.response.DashboardResponse;
import id.rzhf.projecti.dto.response.NotificationResponse;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.dto.response.UserResponse;
import id.rzhf.projecti.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> dashboard(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserDashboard(authentication.getName()));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), request));
    }

    @GetMapping("/notifications")
    public ResponseEntity<PageResponse<NotificationResponse>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getNotifications(authentication.getName(), page, size));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        long count = userService.countUnreadNotifications(authentication.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication authentication) {
        userService.markNotificationRead(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        userService.markAllNotificationsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
