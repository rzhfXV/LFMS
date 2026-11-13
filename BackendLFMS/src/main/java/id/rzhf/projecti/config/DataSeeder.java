package id.rzhf.projecti.config;

import id.rzhf.projecti.entity.Category;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.enums.UserRole;
import id.rzhf.projecti.repository.CategoryRepository;
import id.rzhf.projecti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@lfms.id}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@12345}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCategories();
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name("Administrator")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(UserRole.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Default admin account created: {}", adminEmail);
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            List<Category> categories = List.of(
                Category.builder().name("Elektronik")
                    .description("Smartphone, laptop, earphone, charger, dan perangkat elektronik lainnya").build(),
                Category.builder().name("Dokumen")
                    .description("KTP, KTM, SIM, paspor, buku, dan dokumen penting lainnya").build(),
                Category.builder().name("Aksesori")
                    .description("Jam tangan, kacamata, perhiasan, tas, dompet, dan aksesori lainnya").build(),
                Category.builder().name("Pakaian")
                    .description("Jaket, topi, sepatu, dan pakaian lainnya").build(),
                Category.builder().name("Lainnya")
                    .description("Barang yang tidak termasuk dalam kategori di atas").build()
            );
            categoryRepository.saveAll(categories);
            log.info("Default categories seeded: {} categories", categories.size());
        }
    }
}
