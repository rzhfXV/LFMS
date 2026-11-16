package id.rzhf.projecti.repository;

import id.rzhf.projecti.entity.Report;
import id.rzhf.projecti.enums.ReportStatus;
import id.rzhf.projecti.enums.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    @EntityGraph(attributePaths = {"user", "category", "privateDetail"})
    Page<Report> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "category", "privateDetail"})
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "category", "privateDetail"})
    Page<Report> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "category", "privateDetail"})
    Optional<Report> findById(Long id);

    @EntityGraph(attributePaths = {"user", "category", "privateDetail"})
    @Query("""
        SELECT r FROM Report r
        WHERE r.status = :status
          AND (:type IS NULL OR r.type = :type)
          AND (:categoryId IS NULL OR r.category.id = :categoryId)
          AND (:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))
          AND (:eventDate IS NULL OR r.eventDate = :eventDate)
          AND (:keyword IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Report> findPublicReports(
            @Param("status") ReportStatus status,
            @Param("type") ReportType type,
            @Param("categoryId") Long categoryId,
            @Param("location") String location,
            @Param("eventDate") LocalDate eventDate,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("SELECT COUNT(r) FROM Report r WHERE r.status = :status")
    long countByStatus(@Param("status") ReportStatus status);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.type = :type AND r.status = :status")
    long countByTypeAndStatus(@Param("type") ReportType type, @Param("status") ReportStatus status);

    @Query("""
        SELECT r.category.name, COUNT(r) FROM Report r
        WHERE r.status = id.rzhf.projecti.enums.ReportStatus.PUBLISHED
        GROUP BY r.category.name
        """)
    List<Object[]> countByCategory();

    @Query("""
        SELECT COUNT(r) FROM Report r
        WHERE r.status = id.rzhf.projecti.enums.ReportStatus.RESOLVED
        """)
    long countResolved();
}
