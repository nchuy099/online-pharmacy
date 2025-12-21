package com.nchuy099.SmartPharma.chat.repository;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversationEntity, UUID>, JpaSpecificationExecutor<ChatConversationEntity> {
    List<ChatConversationEntity> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    List<ChatConversationEntity> findByPharmacistIdOrderByUpdatedAtDesc(UUID pharmacistId);

    long countByPharmacistId(UUID pharmacistId);

    long countByType(String type);

    long countByTypeAndCreatedAtBetween(String type, Instant startOfDay, Instant endExclusive);

    long countByStatusIgnoreCase(String status);

    long countByPharmacistIsNull();

    long countByCreatedAtBetween(java.time.Instant startOfDay, java.time.Instant endOfDay);

    long countByCreatedAtBefore(java.time.Instant endExclusive);

    @Override
    @EntityGraph(attributePaths = { "user", "pharmacist", "pharmacist.user", "pharmacist.specialty" })
    Page<ChatConversationEntity> findAll(Specification<ChatConversationEntity> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "user", "pharmacist", "pharmacist.user", "pharmacist.specialty" })
    java.util.Optional<ChatConversationEntity> findById(UUID id);
}
