package id.rzhf.projecti.service;

import id.rzhf.projecti.entity.AuditLog;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(User user, String action, String entityType, Long entityId, String description) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .build();
        auditLogRepository.save(log);
    }

    @Async
    public void log(User user, String action, String entityType, Long entityId,
                    String description, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }
}
