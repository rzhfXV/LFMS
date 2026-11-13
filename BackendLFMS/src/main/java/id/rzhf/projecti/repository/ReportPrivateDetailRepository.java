package id.rzhf.projecti.repository;

import id.rzhf.projecti.entity.ReportPrivateDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportPrivateDetailRepository extends JpaRepository<ReportPrivateDetail, Long> {
    Optional<ReportPrivateDetail> findByReportId(Long reportId);
}
