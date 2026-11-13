package id.rzhf.projecti.repository;

import id.rzhf.projecti.entity.Claim;
import id.rzhf.projecti.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    Page<Claim> findByClaimantId(Long claimantId, Pageable pageable);

    Page<Claim> findByFoundReportId(Long reportId, Pageable pageable);

    boolean existsByFoundReportIdAndClaimantIdAndStatusNotIn(
            Long reportId, Long claimantId, java.util.List<ClaimStatus> statuses);

    @Query("SELECT COUNT(c) FROM Claim c WHERE c.status = :status")
    long countByStatus(@Param("status") ClaimStatus status);

    Optional<Claim> findByIdAndClaimantId(Long id, Long claimantId);

    Page<Claim> findByStatus(ClaimStatus status, Pageable pageable);
}
