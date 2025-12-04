package com.nchuy099.SmartPharma.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nchuy099.SmartPharma.user.entity.AddressEntity;

@Repository
public interface AddressRepository extends JpaRepository<AddressEntity, UUID> {
    List<AddressEntity> findByUserId(UUID userId);

    Optional<AddressEntity> findByUserIdAndIsDefaultTrue(UUID userId);

    Optional<AddressEntity> findByIdAndUserId(UUID addressId, UUID userId);
    
    Page<AddressEntity> findByUserId(UUID userId, Pageable pageable);
}
