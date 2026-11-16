package id.rzhf.projecti.repository;

import id.rzhf.projecti.entity.Claim;
import id.rzhf.projecti.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    @EntityGraph(attributePaths = {"foundReport", "foundReport.privateDetail", "claimant"})
    Page<Claim> findByClaimantId(Long claimantId, Pageable pageable);

    @EntityGraph(attributePaths = {"foundReport", "foundReport.privateDetail", "claimant"})
    Page<Claim> findByFoundReportId(Long reportId, Pageable pageable);

    boolean existsByFoundReportIdAndClaimantIdAndStatusNotIn(
            Long reportId, Long claimantId, java.util.List<ClaimStatus> statuses);

    @Query("SELECT COUNT(c) FROM Claim c WHERE c.status = :status")
    long countByStatus(@Param("status") ClaimStatus status);

    @EntityGraph(attributePaths = {"foundReport", "foundReport.privateDetail", "claimant"})
    Optional<Claim> findByIdAndClaimantId(Long id, Long claimantId);

    @EntityGraph(attributePaths = {"foundReport", "foundReport.privateDetail", "claimant"})
    Page<Claim> findByStatus(ClaimStatus status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"foundReport", "foundReport.privateDetail", "claimant"})
    Page<Claim> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"foundReport", "foundReport.privateDetail", "claimant"})
    Optional<Claim> findById(Long id);
}
