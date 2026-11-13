package id.rzhf.projecti.service;

import id.rzhf.projecti.dto.request.UpdateProfileRequest;
import id.rzhf.projecti.dto.response.DashboardResponse;
import id.rzhf.projecti.dto.response.NotificationResponse;
import id.rzhf.projecti.dto.response.PageResponse;
import id.rzhf.projecti.dto.response.UserResponse;
import id.rzhf.projecti.entity.Notification;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.enums.ClaimStatus;
import id.rzhf.projecti.exception.AccessDeniedException;
import id.rzhf.projecti.exception.BadRequestException;
import id.rzhf.projecti.exception.ResourceNotFoundException;
import id.rzhf.projecti.repository.ClaimRepository;
import id.rzhf.projecti.repository.NotificationRepository;
import id.rzhf.projecti.repository.ReportRepository;
import id.rzhf.projecti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ClaimRepository claimRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public DashboardResponse getUserDashboard(String email) {
        User user = getUserByEmail(email);
        long myReports = reportRepository.findByUserId(user.getId(), Pageable.unpaged()).getTotalElements();
        long myClaims = claimRepository.findByClaimantId(user.getId(), Pageable.unpaged()).getTotalElements();
        long activeClaimsCount = claimRepository.countByStatus(ClaimStatus.PENDING);

        return DashboardResponse.builder()
                .myTotalReports(myReports)
                .myActiveClaims(myClaims)
                .build();
    }

    public PageResponse<NotificationResponse> getNotifications(String email, int page, int size) {
        User user = getUserByEmail(email);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> result = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        return PageResponse.<NotificationResponse>builder()
                .content(result.getContent().stream().map(NotificationResponse::from).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional
    public void markNotificationRead(Long notificationId, String email) {
        User user = getUserByEmail(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsRead(String email) {
        User user = getUserByEmail(email);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    public long countUnreadNotifications(String email) {
        User user = getUserByEmail(email);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    public UserResponse getProfile(String email) {
        return UserResponse.from(getUserByEmail(email));
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserByEmail(email);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to change password");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);
        auditLogService.log(saved, "PROFILE_UPDATED", "User", saved.getId(), "User updated profile");
        return UserResponse.from(saved);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
