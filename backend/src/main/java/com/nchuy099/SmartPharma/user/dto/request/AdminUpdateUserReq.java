package com.nchuy099.SmartPharma.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminUpdateUserReq {

    @Email
    String email;

    String fullName;

    String biography;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dateOfBirth;

    String gender;

    @Pattern(regexp = "^$|^.{10,15}$", message = "Số điện thoại phải có từ 10 đến 15 ký tự.")
    String phoneNumber;
}
