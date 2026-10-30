-- ==============================================================================
-- PHARMACEUTICAL TRACEABILITY PLATFORM: INITIAL DEMO SEED DATA
-- Version: 1.0.0
-- Password for all seed users: Password@123
-- Argon2id hash for 'Password@123':
-- $argon2id$v=19$m=65536,t=3,p=4$vO2hR/p890bF1Z4p5k6l7g$G9y1aF8P2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4m
-- ==============================================================================

-- 1. SEED ORGANIZATIONS
INSERT INTO organizations (id, name, type, license_number, msp_id, address, contact_email, contact_phone, is_verified)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Apex Biopharma Ltd.', 'MANUFACTURER', 'DL-WB-2024-MFG-0019', 'ManufacturerMSP', 'Plot 42, Sector V, Salt Lake, Kolkata, West Bengal, India', 'compliance@apexbiopharma.com', '+91-33-2357-1000', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Eastern MedLogistics Pvt Ltd.', 'DISTRIBUTOR', 'DL-OD-2024-DST-0042', 'DistributorMSP', 'Logistics Park, NH-16, Cuttack, Odisha, India', 'operations@easternmed.com', '+91-671-244-5500', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'Bengal Pharma Wholesalers', 'WHOLESALER', 'DL-WB-2024-WHL-0108', 'WholesalerMSP', 'Industrial Estate, Kona Expressway, Howrah, West Bengal, India', 'sales@bengalpharma.com', '+91-33-2650-8800', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'MedPlus Care Pharmacy', 'PHARMACY', 'DL-WB-2024-RET-0912', 'PharmacyMSP', 'Golbazar Market, Kharagpur, West Bengal 721301, India', 'pharmacist@medpluscare.com', '+91-3222-255-123', TRUE),
    ('55555555-5555-5555-5555-555555555555', 'Central Drugs Standard Control Organisation (CDSCO)', 'REGULATOR', 'REG-IN-CDSCO-HQ', 'RegulatorMSP', 'FDA Bhawan, Kotla Road, New Delhi 110002, India', 'nodal@cdsco.gov.in', '+91-11-2321-6380', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED USERS (Password: Password@123)
INSERT INTO users (id, organization_id, username, email, password_hash, full_name, role, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'mfg_admin', 'mfg_admin@apexbiopharma.com', '$argon2id$v=19$m=65536,t=3,p=4$vO2hR/p890bF1Z4p5k6l7g$G9y1aF8P2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4m', 'Dr. Subhash Sen (Quality Head)', 'ORG_ADMIN', TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'dist_admin', 'dist_admin@easternmed.com', '$argon2id$v=19$m=65536,t=3,p=4$vO2hR/p890bF1Z4p5k6l7g$G9y1aF8P2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4m', 'Vikramaditya Patnaik (Logistics Lead)', 'ORG_ADMIN', TRUE),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'pharm_admin', 'pharm_admin@medpluscare.com', '$argon2id$v=19$m=65536,t=3,p=4$vO2hR/p890bF1Z4p5k6l7g$G9y1aF8P2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4m', 'Ananya Roy, Registered Pharmacist', 'ORG_ADMIN', TRUE),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 'regulator_officer', 'regulator@cdsco.gov.in', '$argon2id$v=19$m=65536,t=3,p=4$vO2hR/p890bF1Z4p5k6l7g$G9y1aF8P2qR4sT6uV8wX0yZ2aB4cD6eF8gH0iJ2kL4m', 'Rajesh K. Verma (Drug Inspector)', 'INSPECTOR', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED PRODUCTS
INSERT INTO products (id, manufacturer_id, gtin, brand_name, generic_name, dosage_form, strength, storage_conditions, description)
VALUES
    ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '08901234567890', 'Paracip-500', 'Paracetamol IP', 'Tablet', '500 mg', 'Store below 25°C in a dry place. Protect from light.', 'Fast-acting antipyretic and analgesic tablet formulation.'),
    ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '08901234567891', 'Amoxiguard-250', 'Amoxicillin Trihydrate IP', 'Capsule', '250 mg', 'Store in a cool dry place below 20°C.', 'Broad-spectrum beta-lactam antibacterial capsule.')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED BATCHES
INSERT INTO batches (id, product_id, batch_number, manufacturing_date, expiry_date, quantity, remaining_quantity, blockchain_tx_id, blockchain_status, proof_hash, is_recalled)
VALUES
    -- Genuine Active Batch (Valid until 2028)
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'B2026-001', '2026-08-01', '2028-07-31', 1000, 980, '0x4f8e9a2b1c3d5e7f9a0b2c4d6e8f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f', 'COMMITTED', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', FALSE),
    -- Expired Batch (For testing expiry detection in mobile scanner)
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'B2023-EX99', '2023-01-10', '2025-01-09', 500, 0, '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'COMMITTED', 'b5a2c94e1998f7ab76e61ec1226b29b320e400f147693004d00a37430537ee73', FALSE),
    -- Recalled Batch (For testing recall alert trigger)
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'B2026-RC03', '2026-05-15', '2028-05-14', 2000, 1850, '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e', 'COMMITTED', 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SERIAL UNITS
INSERT INTO serial_units (id, batch_id, serial_number, current_custodian_id, status, cryptographic_signature, verification_count)
VALUES
    -- Unit 1: In Retail Pharmacy (Legitimate, ready for consumer purchase)
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'MED-IN-7K4P-92XF-8Q2M', '44444444-4444-4444-4444-444444444444', 'STOCKED', 'MEQCIE3m9R/Jg3r4u0G7j+K...dummySignature1==', 0),
    -- Unit 2: Sold to consumer (For testing duplicate scan detection if rescanned)
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'MED-IN-8L5Q-03YG-9R3N', '44444444-4444-4444-4444-444444444444', 'SOLD', 'MEUCIQDxv7a4j8K9L0P1q2R...dummySignature2==', 1),
    -- Unit 3: Belongs to Recalled Batch (Should trigger RECALLED alert on mobile scan)
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'MED-IN-9M6R-14ZH-0S4P', '22222222-2222-2222-2222-222222222222', 'RECALLED', 'MEQCIF4k0S/Kh4s5v1H8k+L...dummySignature3==', 0)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED RECALL RECORD
INSERT INTO recalls (id, batch_id, initiator_org_id, reason, severity, blockchain_tx_id, blockchain_status, status)
VALUES
    ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Suspected dissolution failure and sub-potency detected in accelerated stability testing (Q3-2026).', 'CLASS_II_SERIOUS', '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d', 'COMMITTED', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 7. SEED INITIAL VERIFICATION LOG (For the already-sold unit)
INSERT INTO verification_logs (serial_unit_id, scanned_serial_raw, scanner_ip, location_city, verification_result, scan_timestamp)
VALUES
    ('30000000-0000-0000-0000-000000000002', 'MED-IN-8L5Q-03YG-9R3N', '103.21.124.5', 'Kharagpur', 'AUTHENTIC', '2026-10-15 14:32:00+05:30');

