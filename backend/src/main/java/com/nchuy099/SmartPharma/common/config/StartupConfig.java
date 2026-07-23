package com.nchuy099.SmartPharma.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.nchuy099.SmartPharma.user.enums.RbacPermissions;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.PermissionRepository;
import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.catalog.service.LocationSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class StartupConfig {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CatalogRepository catalogRepository;
    private final LocationSyncService locationSyncService;

    @org.springframework.beans.factory.annotation.Value("${admin.super.email}")
    private String superAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${admin.super.password}")
    private String superAdminPassword;

    @org.springframework.beans.factory.annotation.Value("${admin.super.fullName}")
    private String superAdminFullName;

    @Bean
    CommandLineRunner initRoles() {
        return args -> {
            if (roleRepository.findByName("CUSTOMER").isEmpty()) {
                roleRepository.save(RoleEntity.builder()
                        .name("CUSTOMER")
                        .description("Default role for normal customers")
                        .roleType(RoleType.CUSTOMER)
                        .protectedRole(true)
                        .build());
            }

            if (roleRepository.findByName("PHARMACIST").isEmpty()) {
                roleRepository.save(RoleEntity.builder()
                        .name("PHARMACIST")
                        .description("Default role for pharmacist")
                        .roleType(RoleType.PHARMACIST)
                        .protectedRole(true)
                        .build());
            }
            RoleEntity staffRole = roleRepository.findByName("STAFF")
                    .orElseGet(() -> roleRepository.save(RoleEntity.builder()
                            .name("STAFF")
                            .description("Staff for product, inventory, order")
                            .roleType(RoleType.ADMIN)
                            .protectedRole(false)
                            .build()));

            RoleEntity adminRole = roleRepository.findByName("SUPER_ADMIN")
                    .orElseGet(() -> roleRepository.save(RoleEntity.builder()
                            .name("SUPER_ADMIN")
                            .description("Administrator with full access")
                            .roleType(RoleType.ADMIN)
                            .protectedRole(true)
                            .build()));

            if (userRepository.findByEmail("nchihuy099@gmail.com").isEmpty()) {
                userRepository.save(UserEntity.builder()
                        .email("nchihuy099@gmail.com")
                        .fullName("Super Admin")
                        .password(passwordEncoder.encode("huy123"))
                        .role(adminRole)
                        .build());
                log.info("Super admin initialized successfully");
            }

            if (userRepository.findByEmail(superAdminEmail).isEmpty()) {
                userRepository.save(UserEntity.builder()
                        .email(superAdminEmail)
                        .fullName(superAdminFullName)
                        .password(passwordEncoder.encode(superAdminPassword))
                        .role(adminRole)
                        .build());
                log.info("Additional Super admin initialized: {}", superAdminEmail);
            }

            log.info("Role Entity CUSTOMER, SUPER_ADMIN, STAFF, PHARMACIST initialized successfully");

            seedPermissions();

            seedProductCatalogs();

            // Sync locations from GHN
            try {
                locationSyncService.syncLocations();
            } catch (Exception e) {
                log.error("Failed to sync locations from GHN", e);
            }
        };
    }

    private void seedPermissions() {
        PermissionEntity productRead = upsertPermission(RbacPermissions.READ_PRODUCT, "Read product data", RoleType.ADMIN, false, true);
        PermissionEntity productCreate = upsertPermission(RbacPermissions.CREATE_PRODUCT, "Create product", RoleType.ADMIN, false, true);
        PermissionEntity productUpdate = upsertPermission(RbacPermissions.UPDATE_PRODUCT, "Update product", RoleType.ADMIN, false, true);
        PermissionEntity productDelete = upsertPermission(RbacPermissions.DELETE_PRODUCT, "Delete product", RoleType.ADMIN, false, true);
        PermissionEntity productImageUpload = upsertPermission(RbacPermissions.UPLOAD_PRODUCT_IMAGE, "Create product image upload url", RoleType.ADMIN, false, true);

        PermissionEntity categoryRead = upsertPermission(RbacPermissions.READ_CATEGORY, "Read category data", RoleType.ADMIN, false, true);
        PermissionEntity categoryCreate = upsertPermission(RbacPermissions.CREATE_CATEGORY, "Create category", RoleType.ADMIN, false, true);
        PermissionEntity categoryUpdate = upsertPermission(RbacPermissions.UPDATE_CATEGORY, "Update category", RoleType.ADMIN, false, true);
        PermissionEntity categoryDelete = upsertPermission(RbacPermissions.DELETE_CATEGORY, "Delete category", RoleType.ADMIN, false, true);

        PermissionEntity inventoryRead = upsertPermission(RbacPermissions.READ_INVENTORY, "Read inventory data", RoleType.ADMIN, false, true);
        PermissionEntity inventoryImport = upsertPermission(RbacPermissions.IMPORT_INVENTORY, "Import inventory stock", RoleType.ADMIN, false, true);

        PermissionEntity orderRead = upsertPermission(RbacPermissions.READ_ORDER, "Read orders", RoleType.ADMIN, false, true);
        PermissionEntity orderConfirm = upsertPermission(RbacPermissions.CONFIRM_ORDER, "Confirm orders", RoleType.ADMIN, false, true);
        PermissionEntity orderShip = upsertPermission(RbacPermissions.SHIP_ORDER, "Ship orders", RoleType.ADMIN, false, true);
        PermissionEntity orderReturnManage = upsertPermission(RbacPermissions.MANAGE_ORDER_RETURN, "Manage order return requests", RoleType.ADMIN, false, true);
        PermissionEntity paymentRead = upsertPermission(RbacPermissions.READ_PAYMENT, "Read payment details", RoleType.ADMIN, true, false);
        PermissionEntity paymentCollectionConfirm = upsertPermission(RbacPermissions.CONFIRM_PAYMENT_COLLECTION, "Confirm COD payment collection", RoleType.ADMIN, false, true);

        PermissionEntity analyticsRead = upsertPermission(RbacPermissions.READ_ANALYTICS, "Read analytics dashboard", RoleType.ADMIN, true, false);
        PermissionEntity flashSaleRead = upsertPermission(RbacPermissions.READ_FLASH_SALE, "Read flash sale campaigns", RoleType.ADMIN, false, true);
        PermissionEntity flashSaleManage = upsertPermission(RbacPermissions.MANAGE_FLASH_SALE, "Manage flash sale campaigns", RoleType.ADMIN, true, false);

        PermissionEntity userRead = upsertPermission(RbacPermissions.READ_USER, "Read users", RoleType.ADMIN, true, false);
        PermissionEntity userCreate = upsertPermission(RbacPermissions.CREATE_USER, "Create users", RoleType.ADMIN, true, false);
        PermissionEntity userUpdate = upsertPermission(RbacPermissions.UPDATE_USER, "Update users", RoleType.ADMIN, true, false);
        PermissionEntity userRoleAssign = upsertPermission(RbacPermissions.ASSIGN_USER_ROLE, "Assign roles to users", RoleType.ADMIN, true, false);
        PermissionEntity userStatusUpdate = upsertPermission(RbacPermissions.UPDATE_USER_STATUS, "Update user status", RoleType.ADMIN, true, false);
        PermissionEntity userPasswordReset = upsertPermission(RbacPermissions.RESET_USER_PASSWORD, "Reset user password", RoleType.ADMIN, true, false);

        PermissionEntity rbacRead = upsertPermission(RbacPermissions.READ_RBAC, "Read RBAC configuration", RoleType.ADMIN, true, false);
        PermissionEntity rbacManage = upsertPermission(RbacPermissions.MANAGE_RBAC, "Manage RBAC configuration", RoleType.ADMIN, true, false);

        assignPermissions("SUPER_ADMIN",
                productRead, productCreate, productUpdate, productDelete, productImageUpload,
                categoryRead, categoryCreate, categoryUpdate, categoryDelete,
                inventoryRead, inventoryImport,
                orderRead, orderConfirm, orderShip, orderReturnManage, paymentRead, paymentCollectionConfirm,
                analyticsRead,
                flashSaleRead, flashSaleManage,
                userRead, userCreate, userUpdate, userRoleAssign, userStatusUpdate, userPasswordReset,
                rbacRead, rbacManage);

        assignPermissions("STAFF",
                productRead, productCreate, productUpdate, productDelete, productImageUpload,
                categoryRead, categoryCreate, categoryUpdate, categoryDelete,
                inventoryRead, inventoryImport,
                orderRead, orderConfirm, orderShip, orderReturnManage, paymentCollectionConfirm);
    }

    private PermissionEntity upsertPermission(String name, String description, RoleType roleType, boolean critical, boolean assignable) {
        PermissionEntity permission = permissionRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> PermissionEntity.builder().name(name).build());
        permission.setName(name);
        permission.setDescription(description);
        permission.setRoleType(roleType);
        permission.setCritical(critical);
        permission.setAssignable(assignable);
        return permissionRepository.save(permission);
    }

    private void assignPermissions(String roleName, PermissionEntity... permissions) {
        RoleEntity role = roleRepository.findWithPermissionsByNameIgnoreCase(roleName)
                .orElseThrow(() -> new IllegalStateException("Role not found during RBAC seed: " + roleName));
        for (PermissionEntity permission : permissions) {
            role.getPermissions().add(permission);
        }
        roleRepository.save(role);
    }

    private void seedProductCatalogs() {
        upsertCatalog(CatalogType.BRAND, "DHG", "DHG Pharma", null);
        upsertCatalog(CatalogType.BRAND, "TRAPHACO", "Traphaco", null);
        upsertCatalog(CatalogType.BRAND, "HAU_GIANG", "Hậu Giang", null);

        upsertCatalog(CatalogType.BRAND_ORIGIN, "VN", "Việt Nam", null);
        upsertCatalog(CatalogType.BRAND_ORIGIN, "FR", "Pháp", null);
        upsertCatalog(CatalogType.BRAND_ORIGIN, "US", "Hoa Kỳ", null);
        upsertCatalog(CatalogType.BRAND_ORIGIN, "JP", "Nhật Bản", null);

        upsertCatalog(CatalogType.UNIT_TYPE, "HOP", "Hộp", null);
        upsertCatalog(CatalogType.UNIT_TYPE, "LO", "Lọ", null);
        upsertCatalog(CatalogType.UNIT_TYPE, "TUYP", "Tuýp", null);
        upsertCatalog(CatalogType.UNIT_TYPE, "VI", "Vỉ", null);

        upsertCatalog(CatalogType.DOSAGE_FORM, "VIEN", "Viên", null);
        upsertCatalog(CatalogType.DOSAGE_FORM, "VIEN_NEN", "Viên nén", "VIEN");
        upsertCatalog(CatalogType.DOSAGE_FORM, "VIEN_NANG", "Viên nang", "VIEN");
        upsertCatalog(CatalogType.DOSAGE_FORM, "KEM", "Kem", null);
        upsertCatalog(CatalogType.DOSAGE_FORM, "SIRUP", "Siro", null);

        upsertCatalog(CatalogType.INGREDIENT, "PARACETAMOL", "Paracetamol", null);
        upsertCatalog(CatalogType.INGREDIENT, "IBUPROFEN", "Ibuprofen", null);
        upsertCatalog(CatalogType.INGREDIENT, "AMOXICILLIN", "Amoxicillin", null);
        upsertCatalog(CatalogType.INGREDIENT, "VITAMIN_C", "Vitamin C", null);

        seedSpecialties();
    }

    private void seedSpecialties() {
        upsertCatalog(CatalogType.SPECIALTY, "GENERAL_MEDICINE", "Đa khoa", null);
        upsertCatalog(CatalogType.SPECIALTY, "CARDIOLOGY", "Tim mạch", null);
        upsertCatalog(CatalogType.SPECIALTY, "DERMATOLOGY", "Da liễu", null);
        upsertCatalog(CatalogType.SPECIALTY, "PEDIATRICS", "Nhi khoa", null);
        upsertCatalog(CatalogType.SPECIALTY, "NEUROLOGY", "Thần kinh", null);
        upsertCatalog(CatalogType.SPECIALTY, "RESPIRATORY", "Hô hấp", null);
        upsertCatalog(CatalogType.SPECIALTY, "ENDOCRINOLOGY", "Nội tiết", null);
    }

    private CatalogEntity upsertCatalog(CatalogType type, String code, String name, String parentCode) {
        CatalogEntity parent = null;
        if (parentCode != null && !parentCode.isBlank()) {
            parent = catalogRepository.findByTypeAndCode(type, parentCode).orElse(null);
        }

        CatalogEntity entity = catalogRepository.findByTypeAndCode(type, code)
                .orElseGet(() -> CatalogEntity.builder().type(type).code(code).build());

        entity.setName(name);
        entity.setParent(parent);
        entity.setIsActive(true);

        return catalogRepository.save(entity);
    }
}
