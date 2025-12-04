package com.nchuy099.SmartPharma.user.repository;

import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PharmacistRepository extends JpaRepository<PharmacistEntity, UUID>, JpaSpecificationExecutor<PharmacistEntity> {
    Optional<PharmacistEntity> findByUserId(UUID userId);

    @Query("select p from PharmacistEntity p left join fetch p.specialty where p.user.id = :userId")
    Optional<PharmacistEntity> findByUserIdWithSpecialty(@Param("userId") UUID userId);
}
