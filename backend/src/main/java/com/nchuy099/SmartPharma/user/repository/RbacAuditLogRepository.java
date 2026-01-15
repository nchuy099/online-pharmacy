package com.nchuy099.SmartPharma.user.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.user.entity.RbacAuditLogEntity;

@Repository
public interface RbacAuditLogRepository extends JpaRepository<RbacAuditLogEntity, UUID> {
}
