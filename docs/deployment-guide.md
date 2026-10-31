# Deployment Guide: Local Development & Production Orchestration

**Academic Research Prototype**  
**Institution:** Rajendra Mishra School of Engineering Entrepreneurship, IIT Kharagpur  
**Project:** Unified Blockchain-Based Pharmaceutical Traceability Platform  
**Author:** Navendu Maiti (Roll: `25RJ92R01`)  

---

## 1. System Requirements & Prerequisites

### Minimum Hardware Requirements:
- **CPU:** 4 physical cores (Intel Core i5 / AMD Ryzen 5 or higher)
- **RAM:** 8 GB minimum (16 GB recommended for running full multi-peer Fabric network)
- **Disk Space:** 10 GB free SSD storage

### Software Dependencies:
- **Operating System:** Windows 10/11 (with WSL2 Ubuntu 22.04 LTS enabled) OR native Ubuntu 22.04 / macOS
- **Node.js Runtime:** Node.js v20 LTS (Active LTS) or v24 LTS
- **Containerization:** Docker Desktop 4.30+ with Docker Compose v2.x
- **Version Control:** Git 2.40+

---

## 2. Step-by-Step Local Setup & Execution

### Step 1: Repository Configuration & Environment Files
Clone the repository and set up environment variables:

```bash
cd "F:\Ph.D IIT KGP\sem 2\Digital Entrepreneurship\Project\pharma-traceability"

# Copy environment template
cp .env.example .env
```

Verify or adjust `.env` parameters if needed:
```ini
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmatrace_db
DB_USER=pharmatrace_admin
DB_PASSWORD=PharmaTrace2026SecurePass!

# JWT Secret & Argon2 Calibration
JWT_SECRET=super_secret_pharmatrace_jwt_key_2026_iitkgp_research
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
```

---

### Step 2: Launch Database & Storage via Docker Compose
Start PostgreSQL 16 and MinIO in detached mode:

```bash
docker compose up -d
```

Verify that containers are healthy:
```bash
docker compose ps
```

*Expected Output:*
- `pharma-postgres` listening on port `5432` (healthy)
- `pharma-minio` listening on port `9000` (API) and `9001` (Web Console)

---

### Step 3: Run Database Migrations & Seed Indian Pharma Data
Execute schema creation and realistic seed scripts against the running PostgreSQL container:

```bash
# Apply schema
docker exec -i pharma-postgres psql -U pharmatrace_admin -d pharmatrace_db < database/schema.sql

# Apply realistic Indian pharmaceutical seeds
docker exec -i pharma-postgres psql -U pharmatrace_admin -d pharmatrace_db < database/seeds/001_initial_seed_data.sql
```

---

### Step 4: Install & Start Express API Backend
Navigate to the backend directory, install npm packages, and start the server:

```bash
cd backend/api
npm install
npm run dev
```

*Expected Output:*
```text
[INFO]  PostgreSQL Connection Pool initialized successfully.
[INFO]  Fabric Gateway configured (Simulation/Live Mode active).
[INFO]  PharmaTrace REST API server listening on http://localhost:5000
```

---

### Step 5: Start React Web Dashboards
In a new terminal, launch the Vite development server for the stakeholder portals:

```bash
cd frontend/web
npm install
npm run dev
```

Open your browser at `http://localhost:5173`. Use the **1-Click Stakeholder Switcher** to seamlessly test:
- **Manufacturer:** `mfg_admin@apexbiopharma.com`
- **Distributor:** `dist_admin@easternmed.com`
- **Wholesaler:** `wholesaler@bengalpharma.com`
- **Pharmacy:** `dispenser@medpluscare.com`
- **Regulator:** `inspector@cdsco.gov.in`

*(Password for all seeded accounts: `Password@123`)*

---

### Step 6: Start React Native Mobile App
In another terminal, start the Expo mobile developer client:

```bash
cd mobile/app
npm install
npx expo start
```

Scan the QR code displayed in your terminal using the **Expo Go** app on your physical iOS/Android device, or press `w` to open in a web browser.

---

## 3. Production Multi-Host Hyperledger Fabric Network Deployment

For production deployments across multi-cloud environments (e.g., AWS, Azure, Google Cloud):

### 1. Cryptographic Identity Generation (Fabric CA)
Instead of test certificates, production networks deploy independent Fabric Certificate Authorities for each participating organization:
```bash
fabric-ca-server start -b admin:adminpw -d
```
Each organization enrolls their admin, peers, and client identities.

### 2. Channel Creation & Peer Joining
```bash
# Generate Genesis Block & Channel Transaction
configtxgen -profile TwoOrgsOrdererGenesis -channelID sys-channel -outputBlock ./channel-artifacts/genesis.block
configtxgen -profile TwoOrgsChannel -channelID pharmachannel -outputCreateChannelTx ./channel-artifacts/channel.tx

# Create Channel on Orderer
peer channel create -o orderer.pharmatrace.com:7050 -c pharmachannel -f ./channel-artifacts/channel.tx --tls --cafile $ORDERER_CA

# Join Peers to Channel
peer channel join -b pharmachannel.block
```

### 3. Smart Contract Lifecycle Packaging & Deployment
Under Fabric v2.x lifecycle:
```bash
# Step 1: Package Chaincode
peer lifecycle chaincode package pharma-contract.tar.gz --path ../chaincode/pharma-contract --lang node --label pharma_1.0

# Step 2: Install Chaincode on Peers
peer lifecycle chaincode install pharma-contract.tar.gz

# Step 3: Approve Chaincode Definition for Organization
peer lifecycle chaincode approveformyorg -o orderer.pharmatrace.com:7050 --channelID pharmachannel --name pharma-contract --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile $ORDERER_CA

# Step 4: Commit Chaincode Definition to Channel
peer lifecycle chaincode commit -o orderer.pharmatrace.com:7050 --channelID pharmachannel --name pharma-contract --version 1.0 --sequence 1 --tls --cafile $ORDERER_CA --peerAddresses peer0.org1.pharmatrace.com:7051 --peerAddresses peer0.org2.pharmatrace.com:9051
```

---

## 4. Troubleshooting & Diagnostic Commands

| Symptom | Probable Cause | Diagnostic & Resolution Action |
|:---|:---|:---|
| `Port 5432 already in use` | Local PostgreSQL instance running on host OS | Stop host service: `net stop postgresql-x64-16` or alter `DB_PORT` in `.env` to `5433`. |
| `Cannot connect to Fabric Gateway` | Peer containers offline or TLS certificate path mismatch | Verify `isLiveNetworkAvailable` in `blockchain.service.js`; system automatically falls back to in-process simulation engine. |
| `CORS Error in Browser` | Frontend connecting to wrong API origin | Ensure `VITE_API_URL` in `frontend/web/.env` points to `http://localhost:5000/api/v1`. |
| `Docker not recognized` | Docker Desktop not running or WSL2 integration disabled | Launch Docker Desktop; in Settings $\rightarrow$ Resources $\rightarrow$ WSL Integration, enable your Linux distro. |

