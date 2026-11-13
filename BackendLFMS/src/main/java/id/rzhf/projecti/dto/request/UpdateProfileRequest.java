package id.rzhf.projecti.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String currentPassword;

    @Size(min = 8, max = 72, message = "New password must be between 8 and 72 characters")
    private String newPassword;
}
