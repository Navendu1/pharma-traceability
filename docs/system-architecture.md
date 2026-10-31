# System Architecture: 4-Tier Hybrid Traceability Platform

**Academic Research Prototype**  
**Institution:** Rajendra Mishra School of Engineering Entrepreneurship, IIT Kharagpur  
**Project:** Unified Blockchain-Based Pharmaceutical Traceability Platform  
**Author:** Navendu Maiti (Roll: `25RJ92R01`)  

---

## 1. Architectural Overview & Component Hierarchy

The system employs a **Decoupled 4-Tier Enterprise Architecture** designed to balance high-throughput operational requirements with non-repudiable cryptographic immutability:

1. **Presentation Layer:** Multi-portal web applications (React 18 + Vite) customized for each stakeholder role, plus an Expo-based cross-platform consumer mobile scanner.
2. **Application & Microservices Layer:** Express.js REST API providing business orchestration, role-based access control (RBAC), GS1 formatting, and the Spatio-Temporal Anomaly Engine.
3. **Off-Chain Operational Data Layer:** PostgreSQL 16 relational database for sub-millisecond querying, relational joins, geospatial lookups, and session management, coupled with MinIO object storage for regulatory compliance certificates.
4. **On-Chain Consortium Blockchain Layer:** Hyperledger Fabric v2.5 consortium network enforcing multi-party state machine transitions, X.509 PKI governance, and cryptographic tamper-evidence.

```mermaid
flowchart TD
    subgraph Presentation_Layer["1. Presentation Layer"]
        M_UI["Manufacturer Portal\n(React 18 + Vite)"]
        D_UI["Distributor Portal\n(React 18 + Vite)"]
        W_UI["Wholesaler Portal\n(React 18 + Vite)"]
        P_UI["Pharmacy Portal\n(React 18 + Vite)"]
        A_UI["Regulator / Admin\n(React 18 + Vite)"]
        MOB["Consumer Mobile App\n(React Native + Expo)"]
    end

    subgraph API_Layer["2. Backend Application Layer (Node.js / Express)"]
        GATEWAY["API Gateway / Reverse Proxy\n(Rate Limiter, Helmet, CORS)"]
        AUTH_SVC["Auth & RBAC Service\n(Argon2id + JWT)"]
        SCM_SVC["Supply Chain Service\n(Products, Batches, Serials, Shipments)"]
        ANOM_SVC["Anomaly & Velocity Engine\n(Haversine Distance, Cloning Detection)"]
        VERIF_SVC["Verification Service\n(Public Consumer Verification)"]
        FABRIC_SVC["Blockchain Service\n(Fabric Gateway Client v1.7)"]
    end

    subgraph Data_Layer["3. Off-Chain Operational Store"]
        PG[("PostgreSQL 16 Database\n(Operational Records, Audit, Verification Logs)")]
        MINIO[("MinIO Object Storage\n(Lab Certificates, Stability Reports)")]
    end

    subgraph Blockchain_Layer["4. Consortium Blockchain Layer (Hyperledger Fabric v2.5)"]
        PEER1["Peer Org1\n(ManufacturerMSP)"]
        PEER2["Peer Org2\n(DistributorMSP)"]
        ORDERER["Raft Ordering Service\n(3-Node BFT / CFT Consensus)"]
        CC["Chaincode\n('pharma-contract')"]
        LEDGER[("Immutable Blockchain Ledger\n(State DB + Block Store)")]
    end

    Presentation_Layer -->|"HTTPS / REST JSON"| GATEWAY
    GATEWAY --> AUTH_SVC
    GATEWAY --> SCM_SVC
    GATEWAY --> ANOM_SVC
    GATEWAY --> VERIF_SVC
    
    SCM_SVC -->|"SQL / pg.Pool"| PG
    SCM_SVC -->|"S3 API"| MINIO
    SCM_SVC -->|"Idempotent Dual-Write"| FABRIC_SVC
    
    VERIF_SVC -->|"Fast Read"| PG
    VERIF_SVC --> ANOM_SVC
    VERIF_SVC -->|"Evaluate Query"| FABRIC_SVC

    FABRIC_SVC -->|"mTLS / gRPC"| PEER1
    FABRIC_SVC -->|"mTLS / gRPC"| PEER2
    PEER1 --> ORDERER
    PEER2 --> ORDERER
    PEER1 --- CC
    PEER2 --- CC
    CC --- LEDGER
```

---

## 2. On-Chain vs. Off-Chain Data Allocation Matrix

A fundamental architectural pitfall in enterprise blockchain projects is treating the distributed ledger as a general-purpose database ("blockchain bloat"). Storing large binary payloads, search strings, or high-volume telemetry directly on-chain degrades consensus throughput and violates data protection regulations (e.g. Right to Erasure / GDPR / DPDP Act).

The table below defines the strict data segregation adhered to by this platform:

| Data Entity / Field | Storage Location | Rationale & Governance |
|:---|:---|:---|
| **User Credentials & Passwords** | Off-Chain (PostgreSQL) | Sensitive PII. Stored as salted Argon2id hashes. Never written to blockchain. |
| **User Roles & Session Tokens** | Off-Chain (PostgreSQL) | Ephemeral authorization state managed by central auth service via signed JWTs. |
| **Product Master Data (Names, Form)**| Dual-Store | Off-chain for full-text catalog search; on-chain GTIN and cryptographic hash for tamper-evidence. |
| **Batch Manufacturing & Expiry** | Dual-Store | Off-chain for ERP sync; on-chain for immutable expiration and recall status enforcement. |
| **Proof Hash (Canonical SHA-256)**| On-Chain (Fabric) | 256-bit hash representing production batch metadata; ensures off-chain DB records cannot be silently modified. |
| **Individual Packaging Serials** | Dual-Store | Off-chain for fast barcode generation; on-chain for non-repudiable state transitions (\`CREATED\` $\rightarrow$ \`SOLD\`). |
| **Waybills & Shipment Tracking** | Dual-Store | Off-chain for logistic manifests; on-chain for multi-party dispatch and acceptance signatures. |
| **Custody Transfer History** | On-Chain (Fabric) | Immutable sequence of organizational MSP handovers with cryptographic timestamps. |
| **Lab Certificates & CoA PDFs** | MinIO Object Storage | Large binary assets stored in object storage; cryptographic SHA-256 digest committed on-chain. |
| **Consumer Verification Logs** | Off-Chain (PostgreSQL) | High-volume scanning telemetry (IPs, user-agents, GPS coordinates) analyzed by Anomaly Engine. |
| **Velocity Anomaly Alerts** | Off-Chain (PostgreSQL) | Real-time security scoring and incident management; flags unit as \`SUSPICIOUS\` on-chain if confirmed. |

---

## 3. End-to-End Medicine Lifecycle & Data Flow

The sequence diagram below visualizes the transition of a medicine pack across physical logistics and digital states:

```mermaid
sequenceDiagram
    autonumber
    actor M as Manufacturer
    actor D as Distributor
    actor P as Pharmacy
    actor C as Consumer
    participant API as Backend API Gateway
    participant DB as PostgreSQL 16
    participant GW as Fabric Gateway
    participant CC as Smart Contract
    participant ANOM as Anomaly Engine

    %% 1. Manufacturing & Serialization
    M->>API: 1. Register Batch & Generate Serials (GTIN, Expiry, Qty)
    API->>DB: Pre-commit write (status: PENDING_BLOCKCHAIN)
    API->>GW: SubmitTx('RegisterBatch', batchNo, gtin, expiry, proofHash)
    GW->>CC: Endorse & Order on Fabric
    CC-->>GW: Commit Confirmed (TxID: 0xabc...)
    API->>DB: Confirm write (status: COMMITTED, txId)
    API-->>M: Return GS1 DataMatrix QR Codes

    %% 2. Dispatch to Distributor
    M->>API: 2. Dispatch Shipment (waybill, receiver: DistributorMSP, serials)
    API->>GW: SubmitTx('DispatchShipment', waybill, serials)
    GW->>CC: Transition state: IN_TRANSIT
    CC-->>GW: Block Committed
    API->>DB: Update shipment status to DISPATCHED
    API-->>M: Shipment Dispatched Confirmation

    %% 3. Receipt by Distributor
    D->>API: 3. Inward Acceptance Scan (waybill)
    API->>GW: SubmitTx('ReceiveShipment', waybill)
    GW->>CC: Transition state: DELIVERED, Custodian -> DistributorMSP
    CC-->>GW: Block Committed
    API->>DB: Update shipment status to DELIVERED
    API-->>D: Inward Stocking Confirmed

    %% 4. Dispensing at Pharmacy
    P->>API: 4. Record Retail Sale (serialNumber, rxLicense)
    API->>GW: SubmitTx('RecordSale', serialNumber, rxLicense)
    GW->>CC: Transition state: SOLD, Custodian -> Consumer
    CC-->>GW: Block Committed
    API-->>P: Sale Confirmed

    %% 5. Consumer Verification Scan
    C->>API: 5. Scan QR via Mobile App (serialNumber, GPS: Kolkata)
    API->>GW: EvaluateTx('VerifyProduct', serialNumber)
    GW->>CC: Read-only ledger state query
    CC-->>GW: Return { status: SOLD, batch: B01, isRecalled: false }
    API->>ANOM: AnalyzeScan(metadata, fabricState)
    ANOM-->>API: Assessment: { isAnomaly: false, riskScore: 0, status: AUTHENTIC }
    API-->>C: Display Authentic Verification Certificate
```

---

## 4. Dual-Write Coordination Pattern & Consistency Guarantees

Hyperledger Fabric and PostgreSQL cannot participate in a shared distributed Two-Phase Commit (2PC) or XA transaction coordinator. Attempting naive concurrent writes without an explicit protocol leads to "Dual-Write Inconsistency" (e.g., database succeeds but blockchain transaction times out, or vice versa).

This platform implements an **Idempotent Outbox State-Machine Pattern**:

```mermaid
stateDiagram-v2
    [*] --> DRAFT_OR_PENDING: API Request Received
    
    state "Phase 1: Pre-Database Write" as S1
    state "Phase 2: Blockchain Gateway Submission" as S2
    state "Phase 3: Database Commit Confirmation" as S3
    state "Phase 4: Compensating Rollback / Retry" as S4

    DRAFT_OR_PENDING --> S1: Begin DB Transaction
    S1 --> S2: Insert row with status = 'PENDING_BLOCKCHAIN'
    
    S2 --> S3: Fabric Gateway confirms block commit (TxID received)
    S3 --> [*]: Update DB row status = 'COMMITTED', tx_id = TxID
    
    S2 --> S4: Fabric rejects (Endorsement Failure / Network Timeout)
    S4 --> [*]: Update DB row status = 'FAILED', record error reason
```

### Protocol Execution Details:
1. **Pre-Commit Write (PostgreSQL):** The operational record is persisted with an explicit status of \`PENDING\` or \`PENDING_BLOCKCHAIN\` and a unique business idempotency key.
2. **Blockchain Submission (Fabric Gateway):** The backend client submits the transaction to the endorsing peers and awaits block commitment notification via gRPC stream.
3. **Post-Commit Confirmation (PostgreSQL):** Upon receiving the cryptographically signed commit status and Fabric Transaction ID (\`txId\`), the local database row is updated to \`COMMITTED\` with the immutable transaction hash.
4. **Failure Compensation:** If the blockchain submission fails, the database row is transitioned to \`FAILED\`. Background reconciliation jobs periodically re-evaluate pending states to ensure eventual consistency.

