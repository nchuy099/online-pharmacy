package com.nchuy099.SmartPharma.consultation.repository;

import java.util.UUID;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.consultation.entity.PrescriptionEntity;

@Repository
public interface PrescriptionRepository extends JpaRepository<PrescriptionEntity, UUID> {

    @Query("SELECT p FROM PrescriptionEntity p WHERE p.customer.id = :customerId ORDER BY p.createdAt DESC")
    Page<PrescriptionEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    @Query("SELECT p FROM PrescriptionEntity p WHERE p.pharmacist.id = :pharmacistId ORDER BY p.createdAt DESC")
    Page<PrescriptionEntity> findByPharmacistIdOrderByCreatedAtDesc(UUID pharmacistId, Pageable pageable);

    @Query("SELECT DISTINCT p.customer.id FROM PrescriptionEntity p WHERE p.pharmacist.id = :pharmacistId")
    List<UUID> findDistinctCustomerIdsByPharmacistId(UUID pharmacistId);

    @Query("""
            SELECT DISTINCT p
            FROM PrescriptionEntity p
            LEFT JOIN FETCH p.items items
            LEFT JOIN FETCH items.product
            WHERE p.chatConversation.id = :chatConversationId
            ORDER BY p.createdAt DESC
            """)
    List<PrescriptionEntity> findByChatConversationIdOrderByCreatedAtDesc(UUID chatConversationId);
}
