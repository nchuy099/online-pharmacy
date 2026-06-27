package com.nchuy099.SmartPharma.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.consultation.dto.request.PrescriptionRequest;
import com.nchuy099.SmartPharma.consultation.entity.PrescriptionEntity;
import com.nchuy099.SmartPharma.consultation.repository.PrescriptionRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class ConsultationServiceTest {

    private UserRepository userRepository;
    private ProductRepository productRepository;
    private SecurityUtils securityUtils;
    private PrescriptionRepository prescriptionRepository;
    private ChatConversationRepository chatConversationRepository;
    private ConsultationService consultationService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        productRepository = mock(ProductRepository.class);
        securityUtils = mock(SecurityUtils.class);
        prescriptionRepository = mock(PrescriptionRepository.class);
        chatConversationRepository = mock(ChatConversationRepository.class);

        consultationService = new ConsultationService(
                prescriptionRepository,
                userRepository,
                productRepository,
                mock(OrderRepository.class),
                mock(OrderMapper.class),
                securityUtils,
                chatConversationRepository);
    }

    @Test
    void createPrescriptionShouldThrowWhenAnyProductNotFound() {
        UUID pharmacistId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        UUID missingProductId = UUID.randomUUID();

        UserEntity pharmacist = UserEntity.builder().fullName("Dr A").build();
        pharmacist.setId(pharmacistId);

        UserEntity customer = UserEntity.builder().fullName("Patient B").build();
        customer.setId(customerId);

        when(securityUtils.getCurrentUserId()).thenReturn(pharmacistId);
        when(userRepository.findById(pharmacistId)).thenReturn(Optional.of(pharmacist));
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(productRepository.findById(missingProductId)).thenReturn(Optional.empty());

        PrescriptionRequest request = PrescriptionRequest.builder()
                .customerId(customerId.toString())
                .diagnosis("Flu")
                .items(List.of(PrescriptionRequest.PrescriptionItemRequest.builder()
                        .productId(missingProductId.toString())
                        .quantity(1)
                        .instructions("2/day")
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () -> consultationService.createPrescription(request));
        assertEquals("Product not found: " + missingProductId, ex.getMessage());
    }

    @Test
    void createPrescriptionShouldLinkChatConversationWhenProvided() {
        UUID pharmacistId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID roomId = UUID.randomUUID();

        UserEntity pharmacist = UserEntity.builder().fullName("Dr A").build();
        pharmacist.setId(pharmacistId);

        UserEntity customer = UserEntity.builder().fullName("Patient B").build();
        customer.setId(customerId);

        ProductEntity product = ProductEntity.builder().name("Product A").webName("product-a").build();
        product.setId(productId);

        ChatConversationEntity room = ChatConversationEntity.builder().build();
        room.setId(roomId);

        when(securityUtils.getCurrentUserId()).thenReturn(pharmacistId);
        when(userRepository.findById(pharmacistId)).thenReturn(Optional.of(pharmacist));
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(prescriptionRepository.save(org.mockito.ArgumentMatchers.any(PrescriptionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PrescriptionRequest request = PrescriptionRequest.builder()
                .customerId(customerId.toString())
                .chatConversationId(roomId.toString())
                .diagnosis("Flu")
                .items(List.of(PrescriptionRequest.PrescriptionItemRequest.builder()
                        .productId(productId.toString())
                        .quantity(1)
                        .instructions("2/day")
                        .build()))
                .build();

        consultationService.createPrescription(request);

        verify(prescriptionRepository).save(org.mockito.ArgumentMatchers.argThat(
                prescription -> prescription.getChatConversation() != null
                        && roomId.equals(prescription.getChatConversation().getId())));
    }
}
