package com.nchuy099.SmartPharma.token.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.token.entity.BlackListToken;
import com.nchuy099.SmartPharma.token.entity.ResetPasswordToken;

@Repository
public interface ResetPasswordTokenRepository extends JpaRepository<ResetPasswordToken, UUID> {
    Optional<ResetPasswordToken> findByJti(UUID jti);
}
