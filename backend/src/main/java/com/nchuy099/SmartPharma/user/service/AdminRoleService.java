package com.nchuy099.SmartPharma.user.service;

import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private final RoleRepository roleRepository;

    // Permissions have been removed. Basic role management can be added here if needed.
}
