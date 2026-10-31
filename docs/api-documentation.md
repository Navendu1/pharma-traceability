# API Documentation: PharmaTrace RESTful Microservices

**Academic Research Prototype**  
**Institution:** Rajendra Mishra School of Engineering Entrepreneurship, IIT Kharagpur  
**Project:** Unified Blockchain-Based Pharmaceutical Traceability Platform  
**Author:** Navendu Maiti (Roll: `25RJ92R01`)  

---

## 1. Global Conventions & Standards

- **Base URL:** \`http://localhost:5000/api/v1\`
- **Transport Security:** Mandates HTTPS / TLS 1.3 in production environments.
- **Content-Type:** \`application/json\`
- **Authentication Scheme:** Bearer Token via HTTP Header: \`Authorization: Bearer <JWT_TOKEN>\`
- **Standard Success Response Format:**
  \`\`\`json
  {
    "success": true,
    "data": { ... }
  }
  \`\`\`
- **Standard Error Response Format:**
  \`\`\`json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Only organizations with Manufacturer permissions can register products."
    }
  }
  \`\`\`

---

## 2. Authentication Endpoints (\`/auth\`)

### 2.1 User Login
Authenticates an enterprise stakeholder and returns a signed JSON Web Token (JWT) with user roles and organizational MSP affiliation.

- **Method / Route:** \`POST /api/v1/auth/login\`
- **Access Level:** Public
- **Request Body:**
  \`\`\`json
  {
    "email": "mfg_admin@apexbiopharma.com",
    "password": "Password@123"
  }
  \`\`\`
- **Response (200 OK):**
  \`\`\`json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "11111111-1111-1111-1111-111111111112",
        "username": "mfg_admin",
        "email": "mfg_admin@apexbiopharma.com",
        "fullName": "Dr. Rajesh Sharma",
        "role": "ADMIN",
        "organization": {
          "id": "11111111-1111-1111-1111-111111111111",
          "name": "Apex Biopharma Ltd.",
          "type": "MANUFACTURER",
          "mspId": "ManufacturerMSP",
          "licenseNumber": "MFG-CDSCO-2026-001"
        }
      }
    }
  }
  \`\`\`

### 2.2 Current User Profile
- **Method / Route:** \`GET /api/v1/auth/me\`
- **Access Level:** Authenticated

---

## 3. Product & Batch Management (\`/products\`)

### 3.1 Register Product Master Data
Commits new pharmaceutical catalog entry to both PostgreSQL and the Hyperledger Fabric ledger via dual-write.

- **Method / Route:** \`POST /api/v1/products\`
- **Access Level:** \`MANUFACTURER\` (\`ADMIN\` or \`OPERATOR\`)
- **Request Headers:** \`Authorization: Bearer <TOKEN>\`
- **Request Body:**
  \`\`\`json
  {
    "gtin": "08901234567801",
    "brandName": "Paracip-650 Extra",
    "genericName": "Paracetamol IP",
    "dosageForm": "Tablet",
    "strength": "650 mg",
    "storageConditions": "Store below 25°C in a dry place",
    "description": "High-strength antipyretic formulation for severe fever"
  }
  \`\`\`
- **Response (201 Created):**
  \`\`\`json
  {
    "success": true,
    "data": {
      "id": "48fe2971-6a5c-4ae8-a28a-9dc27c372ad8",
      "gtin": "08901234567801",
      "brandName": "Paracip-650 Extra",
      "blockchainStatus": "COMMITTED",
      "blockchainTxId": "0xf9a656fb4c6f16ca3252307fd284888fbf063374fb40c4a01b77f6d926b252b3"
    }
  }
  \`\`\`

### 3.2 Register Production Batch
Registers a pharmaceutical manufacturing batch with deterministic proof hash generation.

- **Method / Route:** \`POST /api/v1/products/batches\`
- **Access Level:** \`MANUFACTURER\`
- **Request Body:**
  \`\`\`json
  {
    "gtin": "08901234567801",
    "batchNumber": "B2026-STG7",
    "manufacturingDate": "2026-09-01",
    "expiryDate": "2028-08-31",
    "quantity": 500
  }
  \`\`\`
- **Response (201 Created):** Returns batch ID, proof hash, and confirmed Fabric transaction hash.

---

## 4. Packaging Serialization & GS1 QR Codes

### 4.1 Generate Serial Identifiers
Generates cryptographically unique, unguessable serialization tokens for individual packages.

- **Method / Route:** \`POST /api/v1/products/serials/generate\`
- **Access Level:** \`MANUFACTURER\`
- **Request Body:**
  \`\`\`json
  {
    "batchNumber": "B2026-STG7",
    "count": 2
  }
  \`\`\`
- **Response (201 Created):**
  \`\`\`json
  {
    "success": true,
    "data": {
      "batchNumber": "B2026-STG7",
      "count": 2,
      "serials": [
        {
          "serialNumber": "MED-IN-9FXJ-3TEP-CGHB",
          "qrCodeUrl": "http://localhost:5000/api/v1/verification/verify/MED-IN-9FXJ-3TEP-CGHB"
        },
        {
          "serialNumber": "MED-IN-W4KL-8M2Q-PY9D",
          "qrCodeUrl": "http://localhost:5000/api/v1/verification/verify/MED-IN-W4KL-8M2Q-PY9D"
        }
      ]
    }
  }
  \`\`\`

---

## 5. Logistics & Custodial Shipments (\`/shipments\`)

### 5.1 Dispatch Consignment
- **Method / Route:** \`POST /api/v1/shipments/dispatch\`
- **Access Level:** Current Custodian
- **Request Body:**
  \`\`\`json
  {
    "shipmentCode": "WAYBILL-WB-OD-001",
    "receiverOrgId": "22222222-2222-2222-2222-222222222222",
    "receiverMspId": "DistributorMSP",
    "serialNumbers": [
      "MED-IN-9FXJ-3TEP-CGHB",
      "MED-IN-W4KL-8M2Q-PY9D"
    ],
    "notes": "Cold-chain temperature monitored (< 20°C)"
  }
  \`\`\`

### 5.2 Inward Acceptance & Custody Handover
- **Method / Route:** \`POST /api/v1/shipments/receive\`
- **Access Level:** Target Receiving Organization
- **Request Body:**
  \`\`\`json
  {
    "shipmentCode": "WAYBILL-WB-OD-001"
  }
  \`\`\`

---

## 6. Public Consumer Verification & Anomaly Engine (\`/verification\`)

### 6.1 Verify Medicine Package
Public endpoint queried by consumers and hospital dispensaries scanning 2D barcodes.

- **Method / Route:** \`GET /api/v1/verification/verify/:serialNumber\`
- **Access Level:** Public (No authentication required)
- **Query Parameters:**
  - \`city\` (string, optional): Scanner city name (e.g. \`Kolkata\`, \`Mumbai\`)
  - \`latitude\` (float, optional): Device GPS latitude
  - \`longitude\` (float, optional): Device GPS longitude
- **Sample Request:** \`GET /api/v1/verification/verify/MED-IN-9FXJ-3TEP-CGHB?city=Kolkata&latitude=22.5726&longitude=88.3639\`
- **Response (200 OK - Authentic Product):**
  \`\`\`json
  {
    "success": true,
    "data": {
      "serialNumber": "MED-IN-9FXJ-3TEP-CGHB",
      "verificationStatus": "AUTHENTIC",
      "alertMessage": "Genuine Product: Product authenticity and cryptographic signature verified on blockchain.",
      "blockchainVerified": true,
      "anomaly": {
        "isAnomaly": false,
        "anomalyType": "NONE",
        "riskScore": 0,
        "scanCount": 1,
        "velocityDetails": null
      },
      "details": {
        "product": {
          "brandName": "Paracip-650 Extra",
          "genericName": "Paracetamol IP",
          "strength": "650 mg",
          "dosageForm": "Tablet"
        },
        "batch": {
          "batchNumber": "B2026-STG7",
          "manufacturingDate": "2026-09-01",
          "expiryDate": "2028-08-31",
          "isRecalled": false
        },
        "currentCustodian": "DistributorMSP",
        "status": "STOCKED"
      }
    }
  }
  \`\`\`

- **Response (200 OK - Cloned Barcode Velocity Anomaly):**
  \`\`\`json
  {
    "success": true,
    "data": {
      "serialNumber": "MED-IN-9FXJ-3TEP-CGHB",
      "verificationStatus": "SUSPICIOUS_VELOCITY",
      "alertMessage": "🚨 IMPOSSIBLE VELOCITY DETECTED: Serial scanned in Mumbai after prior scan in Kolkata (1654.8 km apart) within 2.1 mins (effective speed: 47280 km/h). Counterfeit cloning alert!",
      "blockchainVerified": true,
      "anomaly": {
        "isAnomaly": true,
        "anomalyType": "SUSPICIOUS_VELOCITY",
        "riskScore": 98,
        "scanCount": 2,
        "velocityDetails": {
          "distanceKm": 1654.8,
          "timeDeltaMinutes": 2.1,
          "velocityKmh": 47280
        }
      }
    }
  }
  \`\`\`

### 6.2 Retrieve Verifiable On-Chain Provenance
- **Method / Route:** \`GET /api/v1/verification/history/:serialNumber\`
- **Access Level:** Public
- **Response (200 OK):** Complete array of immutable block transaction records with timestamps and MSP custodians.

