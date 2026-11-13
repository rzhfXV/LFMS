package id.rzhf.projecti.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "report_private_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportPrivateDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false, unique = true)
    private Report report;

    @Column(name = "verification_details", columnDefinition = "TEXT", nullable = false)
    private String verificationDetails;
}
