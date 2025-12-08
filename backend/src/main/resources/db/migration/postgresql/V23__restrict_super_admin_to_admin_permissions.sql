DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND UPPER(r.name) = 'SUPER_ADMIN'
  AND UPPER(p.role_type) IN ('CUSTOMER', 'PHARMACIST');
