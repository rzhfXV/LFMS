package id.rzhf.projecti.service;

import id.rzhf.projecti.dto.request.LoginRequest;
import id.rzhf.projecti.dto.request.RegisterRequest;
import id.rzhf.projecti.dto.response.AuthResponse;
import id.rzhf.projecti.dto.response.UserResponse;
import id.rzhf.projecti.entity.User;
import id.rzhf.projecti.exception.BadRequestException;
import id.rzhf.projecti.exception.DuplicateResourceException;
import id.rzhf.projecti.repository.UserRepository;
import id.rzhf.projecti.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        User saved = userRepository.save(user);
        auditLogService.log(saved, "USER_REGISTERED", "User", saved.getId(),
                "New user registered: " + saved.getEmail());

        log.info("New user registered: {}", saved.getEmail());
        return UserResponse.from(saved);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));

        auditLogService.log(user, "USER_LOGIN", "User", user.getId(),
                "User logged in: " + user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponse.from(user))
                .build();
    }
}
