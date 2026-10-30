# Unified Blockchain-Based Pharmaceutical Authentication and Supply-Chain Traceability Platform

[![Architecture](https://img.shields.io/badge/Architecture-Hybrid%20Off--Chain%20%2B%20Fabric-blue.svg)](#system-architecture)
[![Fabric Version](https://img.shields.io/badge/Hyperledger%20Fabric-v2.5%20LTS-green.svg)](https://www.hyperledger.org/projects/fabric)
[![Node Version](https://img.shields.io/badge/Node.js-v20%20LTS-orange.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

An academic research and implementation prototype developed at the **Rajendra Mishra School of Engineering Entrepreneurship, Indian Institute of Technology (IIT) Kharagpur**.

---

## 1. Research Overview & Philosophy

Pharmaceutical supply chains suffer from counterfeit penetration (10%–30% in developing markets according to the WHO), illegal gray-market diversion, and delayed recall distribution. 

This platform implements the paradigm:
> **"One Product → One Cryptographic Digital Identity → One Verifiable History"**

### The Hybrid Storage Design
- **PostgreSQL 16 (Off-Chain Operational Layer):** High-speed relational queries, user authentication, inventory tracking, role permissions, and consumer verification logs.
- **Hyperledger Fabric v2.5 LTS (On-Chain Decentralized Layer):** Cryptographically immutable state machine recording critical lifecycle transitions: batch registration, authorized custody handovers, batch recalls, and tamper-evident hash proofs.
- **Anti-Cloning Defense:** Unit-level GS1-compatible serialization, asymmetric digital signatures, tamper-evident packaging, and velocity/duplicate scan anomaly detection algorithms.

---

## 2. Monorepo Repository Structure

```text
pharma-traceability/
├── docs/                 # Architectural specs, security models, DB schemas
├── frontend/web/         # React + Vite + Tailwind CSS Web Portals
├── mobile/app/           # React Native + Expo Mobile Camera Scanner
├── backend/api/          # Node.js + Express REST API & Fabric Gateway Client
├── blockchain/network/   # Fabric test network (2 Orgs, Raft Orderer, Fabric CA)
├── blockchain/chaincode/ # Node.js Smart Contract (pharma-contract)
├── blockchain/gateway/   # Connection profiles and identity keystores
├── database/             # PostgreSQL schemas, migrations (001-007), seed data
├── storage/              # MinIO / local document storage configuration
├── scripts/              # Shell scripts for orchestration & health checks
└── tests/                # Unit, integration, and end-to-end evaluation tests
```

---

## 3. Technology Stack & Compatibility Matrix

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | React + Vite | 18.x / 5.x | Portals for Manufacturer, Distributor, Pharmacy, and Admin |
| **Mobile App** | React Native + Expo | SDK 51+ | Camera-based consumer verification scanner |
| **Backend API** | Node.js + Express | 20.x LTS / 4.x | REST API, RBAC, input validation, Fabric Gateway client |
| **Database** | PostgreSQL | 16-alpine | Operational storage for catalogs, users, serials, and scan logs |
| **Blockchain** | Hyperledger Fabric | v2.5.9 LTS | Immutable consortium ledger and smart contract execution |
| **Smart Contract**| Fabric Node SDK | v2.5.x | Business logic and client MSP certificate verification |
| **Object Storage**| MinIO | RELEASE.2024+ | Secure storage for drug compliance PDFs and certificates |

> **Compatibility Notice:** Fabric Gateway native gRPC bindings require **Node.js v20.x LTS** or v18.x LTS. Node.js v24 is not supported for Fabric Gateway operations.

---

## 4. Quick Start (Development Environment)

### Prerequisites
1. Windows 10/11 with **WSL2** (`Ubuntu-22.04 LTS`).
2. **Docker Desktop** with WSL2 integration enabled.
3. **Node.js v20 LTS** installed inside WSL2 (`nvm install 20`).

### Starting Operational Services
```bash
# 1. Clone or navigate to the repository
cd pharma-traceability

# 2. Copy the environment variables
cp .env.example .env

# 3. Start PostgreSQL and MinIO via Docker Compose
docker compose up -d

# 4. Verify containers are healthy
docker compose ps
```

---

## 5. Development Roadmap Summary
- **Stage 0:** Development Environment & Toolchain Verification
- **Stage 1:** Monorepo Foundation & Documentation Setup *(Current Stage)*
- **Stage 2:** PostgreSQL Database Architecture & Migrations
- **Stage 3:** Node.js Backend Core & Authentication
- **Stage 4:** Hyperledger Fabric 2-Org Test Network
- **Stage 5:** Smart Contract (`pharma-contract`) Implementation
- **Stage 6:** Fabric Gateway & Blockchain Service Integration
- **Stage 7:** Supply-Chain Handover & Custody Transfer Workflows
- **Stage 8:** Cryptographic Serialization & QR Engine
- **Stage 9:** React Web Dashboard Portals
- **Stage 10:** Expo Mobile Camera Scanner App
- **Stage 11:** Anomaly Detection & Batch Recall Engine
- **Stage 12:** Controlled Empirical Benchmarking & Academic Evaluation

