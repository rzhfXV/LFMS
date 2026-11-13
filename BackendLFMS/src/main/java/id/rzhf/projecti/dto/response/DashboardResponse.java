package id.rzhf.projecti.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DashboardResponse {
    private long totalLostReports;
    private long totalFoundReports;
    private long pendingReports;
    private long pendingClaims;
    private long resolvedItems;
    private Map<String, Long> reportsByCategory;
    // For user dashboard
    private long myTotalReports;
    private long myActiveClaims;
}
