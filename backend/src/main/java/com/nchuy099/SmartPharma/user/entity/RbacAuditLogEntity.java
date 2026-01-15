package com.nchuy099.SmartPharma.user.entity;

import java.util.UUID;

import com.nchuy099.SmartPharma.common.entity.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "rbac_audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RbacAuditLogEntity extends AbstractEntity {

    @Column(name = "actor_user_id")
    UUID actorUserId;

    @Column(nullable = false)
    String action;

    @Column(name = "target_type", nullable = false)
    String targetType;

    @Column(name = "target_id", nullable = false)
    String targetId;

    @Column(name = "before_state", columnDefinition = "text")
    String beforeState;

    @Column(name = "after_state", columnDefinition = "text")
    String afterState;

    @Column(columnDefinition = "text")
    String reason;
}
