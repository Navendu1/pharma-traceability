-- ==============================================================================
-- PHARMACEUTICAL TRACEABILITY PLATFORM: POSTGRESQL RELATIONAL SCHEMA
-- Version: 1.0.0
-- Database: PostgreSQL 16
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'REGULATOR', 'ADMIN')),
    license_number VARCHAR(100) NOT NULL UNIQUE,
    msp_id VARCHAR(100) NOT NULL, -- Hyperledger Fabric Membership Service Provider ID (e.g. 'ManufacturerMSP')
    public_key TEXT,               -- Digital signature public key for signing invoices/custody
    address TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    contact_phone VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_msp_id ON organizations(msp_id);

-- ------------------------------------------------------------------------------
-- 2. USERS
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Stored as Argon2id hash
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'INSPECTOR', 'AUDITOR')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS
-- ------------------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    gtin VARCHAR(14) NOT NULL UNIQUE, -- Global Trade Item Number (14 numeric digits)
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL, -- e.g. 'Tablet', 'Capsule', 'Syrup', 'Injectable'
    strength VARCHAR(100) NOT NULL,    -- e.g. '500 mg', '250 mg/5ml'
    storage_conditions VARCHAR(255) NOT NULL DEFAULT 'Store below 25°C in a dry place',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX idx_products_gtin ON products(gtin);

-- ------------------------------------------------------------------------------
-- 4. BATCHES
-- ------------------------------------------------------------------------------
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    blockchain_tx_id VARCHAR(128),
    blockchain_status VARCHAR(50) DEFAULT 'PENDING' CHECK (blockchain_status IN ('PENDING', 'COMMITTED', 'FAILED')),
    proof_hash VARCHAR(64) NOT NULL, -- SHA-256 canonical hash of batch attributes
    is_recalled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number),
    CONSTRAINT chk_batch_dates CHECK (expiry_date > manufacturing_date)
);

CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_batches_number ON batches(batch_number);
CREATE INDEX idx_batches_blockchain_status ON batches(blockchain_status);

-- ------------------------------------------------------------------------------
-- 5. SERIAL_UNITS (Individual medicine packs)
-- ------------------------------------------------------------------------------
CREATE TABLE serial_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    serial_number VARCHAR(100) NOT NULL UNIQUE, -- Unique packaging serial token
    current_custodian_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED' 
        CHECK (status IN ('CREATED', 'PACKED', 'IN_TRANSIT', 'STOCKED', 'SOLD', 'RECALLED', 'SUSPICIOUS')),
    cryptographic_signature TEXT, -- Asymmetric signature generated by manufacturer key
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_serials_batch ON serial_units(batch_id);
CREATE INDEX idx_serials_number ON serial_units(serial_number);
CREATE INDEX idx_serials_custodian ON serial_units(current_custodian_id);
CREATE INDEX idx_serials_status ON serial_units(status);

-- ------------------------------------------------------------------------------
-- 6. SHIPMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_code VARCHAR(100) NOT NULL UNIQUE,
    sender_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    receiver_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED' 
        CHECK (status IN ('CREATED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'ACCEPTED', 'REJECTED')),
    dispatch_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(100),
    blockchain_tx_id VARCHAR(128),
    blockchain_status VARCHAR(50) DEFAULT 'PENDING' CHECK (blockchain_status IN ('PENDING', 'COMMITTED', 'FAILED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_shipment_parties CHECK (sender_org_id <> receiver_org_id)
);

CREATE INDEX idx_shipments_sender ON shipments(sender_org_id);
CREATE INDEX idx_shipments_receiver ON shipments(receiver_org_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- ------------------------------------------------------------------------------
-- 7. SHIPMENT_ITEMS (Many-to-many junction)
-- ------------------------------------------------------------------------------
CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    serial_unit_id UUID NOT NULL REFERENCES serial_units(id) ON DELETE RESTRICT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shipment_serial UNIQUE (shipment_id, serial_unit_id)
);

CREATE INDEX idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_serial ON shipment_items(serial_unit_id);

-- ------------------------------------------------------------------------------
-- 8. SUPPLY_EVENTS (Audit trail of every physical/digital event)
-- ------------------------------------------------------------------------------
CREATE TABLE supply_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_unit_id UUID NOT NULL REFERENCES serial_units(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL 
        CHECK (event_type IN ('MANUFACTURED', 'PACKED', 'DISPATCHED', 'CUSTODY_TRANSFER', 'RECEIVED', 'SOLD', 'RECALLED')),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    location_city VARCHAR(100),
    location_coordinates VARCHAR(100),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blockchain_tx_id VARCHAR(128)
);

CREATE INDEX idx_supply_events_serial ON supply_events(serial_unit_id);
CREATE INDEX idx_supply_events_org ON supply_events(organization_id);

-- ------------------------------------------------------------------------------
-- 9. VERIFICATION_LOGS (Consumer & inspector scanning records)
-- ------------------------------------------------------------------------------
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_unit_id UUID REFERENCES serial_units(id) ON DELETE SET NULL,
    scanned_serial_raw VARCHAR(255) NOT NULL,
    scanner_ip VARCHAR(50),
    scanner_user_agent TEXT,
    location_city VARCHAR(100),
    location_coordinates VARCHAR(100),
    verification_result VARCHAR(50) NOT NULL 
        CHECK (verification_result IN ('AUTHENTIC', 'EXPIRED', 'RECALLED', 'ALREADY_SOLD', 'UNKNOWN_SERIAL', 'SUSPICIOUS_VELOCITY')),
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_logs_serial ON verification_logs(serial_unit_id);
CREATE INDEX idx_verification_logs_timestamp ON verification_logs(scan_timestamp);
CREATE INDEX idx_verification_logs_result ON verification_logs(verification_result);

-- ------------------------------------------------------------------------------
-- 10. RECALLS
-- ------------------------------------------------------------------------------
CREATE TABLE recalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    initiator_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('CLASS_I_CRITICAL', 'CLASS_II_SERIOUS', 'CLASS_III_MINOR')),
    recall_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blockchain_tx_id VARCHAR(128),
    blockchain_status VARCHAR(50) DEFAULT 'PENDING' CHECK (blockchain_status IN ('PENDING', 'COMMITTED', 'FAILED')),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED'))
);

CREATE INDEX idx_recalls_batch ON recalls(batch_id);

-- ------------------------------------------------------------------------------
-- 11. AUDIT_LOGS (Administrative and security modifications)
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
