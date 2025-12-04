package com.nchuy099.SmartPharma.user.dto.request;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileReq {

    @Email
    String email;

    String fullName;

    String biography;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dateOfBirth;

    String gender;

    @Pattern(regexp = "^$|^.{10,15}$", message = "Số điện thoại phải có từ 10 đến 15 ký tự.")
    String phoneNumber;

    String avatarUrl;
}
