// ==============================================================================
// ANOMALY DETECTION ENGINE & VELOCITY ANALYTICS SERVICE
// File: backend/api/src/services/anomaly.service.js
// ==============================================================================

const db = require('../config/database');
const logger = require('../utils/logger');

// Known coordinates for Indian pharmaceutical logistic hubs and cities
const CITY_COORDINATES = {
    'kolkata': { lat: 22.5726, lon: 88.3639 },
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'delhi': { lat: 28.6139, lon: 77.2090 },
    'bengaluru': { lat: 12.9716, lon: 77.5946 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'chennai': { lat: 13.0827, lon: 80.2707 },
    'ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'pune': { lat: 18.5204, lon: 73.8567 },
    'bhubaneswar': { lat: 20.2961, lon: 85.8245 },
    'kharagpur': { lat: 22.3460, lon: 87.2320 },
    'patna': { lat: 25.5941, lon: 85.1376 },
    'guwahati': { lat: 26.1445, lon: 91.7362 }
};

// In-memory fallback scan history cache (for fast unit testing and offline database resilience)
const inMemoryScanHistory = new Map();

class AnomalyService {
    /**
     * Calculate Great-Circle Distance between two geographic points using Haversine Formula
     * @param {number} lat1 Latitude 1 (degrees)
     * @param {number} lon1 Longitude 1 (degrees)
     * @param {number} lat2 Latitude 2 (degrees)
     * @param {number} lon2 Longitude 2 (degrees)
     * @returns {number} Distance in kilometers
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's mean radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Resolve latitude and longitude from metadata or city name
     */
    resolveCoordinates(metadata = {}) {
        if (metadata.latitude != null && metadata.longitude != null) {
            return {
                lat: parseFloat(metadata.latitude),
                lon: parseFloat(metadata.longitude)
            };
        }

        if (metadata.coordinates && typeof metadata.coordinates === 'string') {
            const parts = metadata.coordinates.split(',').map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return { lat: parts[0], lon: parts[1] };
            }
        }

        if (metadata.city && typeof metadata.city === 'string') {
            const key = metadata.city.trim().toLowerCase();
            if (CITY_COORDINATES[key]) {
                return CITY_COORDINATES[key];
            }
        }

        return null;
    }

    /**
     * Retrieve scan history for a given serial number (PostgreSQL with in-memory fallback)
     */
    async getScanHistory(serialNumber) {
        let scans = [];
        try {
            const res = await db.query(`
                SELECT id, scanned_serial_raw, scanner_ip, location_city, location_coordinates,
                       verification_result, scan_timestamp
                FROM verification_logs
                WHERE scanned_serial_raw = $1
                ORDER BY scan_timestamp DESC
                LIMIT 20;
            `, [serialNumber]);

            if (res.rows && res.rows.length > 0) {
                scans = res.rows.map(r => {
                    let lat = null, lon = null;
                    if (r.location_coordinates) {
                        const parts = r.location_coordinates.split(',').map(s => parseFloat(s.trim()));
                        if (parts.length === 2) {
                            lat = parts[0];
                            lon = parts[1];
                        }
                    }
                    if (!lat && r.location_city && CITY_COORDINATES[r.location_city.toLowerCase()]) {
                        lat = CITY_COORDINATES[r.location_city.toLowerCase()].lat;
                        lon = CITY_COORDINATES[r.location_city.toLowerCase()].lon;
                    }
                    return {
                        id: r.id,
                        serialNumber: r.scanned_serial_raw,
                        ip: r.scanner_ip,
                        city: r.location_city,
                        lat,
                        lon,
                        result: r.verification_result,
                        timestamp: new Date(r.scan_timestamp).getTime()
                    };
                });
            }
        } catch (e) {
            // Fallback to in-memory store
            scans = inMemoryScanHistory.get(serialNumber) || [];
        }

        // If DB returned nothing, also check in-memory cache
        if (scans.length === 0 && inMemoryScanHistory.has(serialNumber)) {
            scans = inMemoryScanHistory.get(serialNumber);
        }

        return scans;
    }

    /**
     * Analyze a verification request against past scans, blockchain state, and velocity metrics
     * 
     * @param {string} serialNumber Packaging serial code
     * @param {object} metadata Scan metadata { ip, city, coordinates, latitude, longitude, userAgent }
     * @param {object} fabricVerification Blockchain evaluation response
     * @param {object} dbUnit Optional database record for serial unit
     * @returns {object} Detailed anomaly report with risk scoring
     */
    async analyzeScan(serialNumber, metadata = {}, fabricVerification = null, dbUnit = null) {
        const now = Date.now();
        const coords = this.resolveCoordinates(metadata);
        const currentCity = metadata.city || 'Unknown';
        const pastScans = await this.getScanHistory(serialNumber);
        const scanCount = pastScans.length + 1;

        // Base assessment defaults
        let isAnomaly = false;
        let anomalyType = 'NONE';
        let riskScore = 0; // 0 (genuine authentic) to 100 (critical counterfeit / anomaly)
        let alertMessage = 'Genuine Product: Product authenticity and cryptographic signature verified on blockchain.';
        let verificationStatus = 'AUTHENTIC';
        let velocityDetails = null;

        // RULE 1: Blockchain non-existence or unregistered serial
        if (!fabricVerification || !fabricVerification.exists) {
            return {
                isAnomaly: true,
                anomalyType: 'UNKNOWN_SERIAL',
                riskScore: 90,
                verificationStatus: 'UNKNOWN_SERIAL',
                alertMessage: 'This serial number is not registered in the pharmaceutical ledger. Potential counterfeit product!',
                scanCount,
                velocityDetails: null
            };
        }

        // RULE 2: Critical Batch Recall
        if (fabricVerification.verificationStatus === 'RECALLED' || (dbUnit && dbUnit.is_recalled)) {
            return {
                isAnomaly: true,
                anomalyType: 'RECALLED_BATCH',
                riskScore: 100,
                verificationStatus: 'RECALLED',
                alertMessage: '⚠️ CRITICAL RECALL ALERT: This batch has been officially recalled by the manufacturer/regulator. Do not dispense or consume!',
                scanCount,
                velocityDetails: null
            };
        }

        // RULE 3: Expired Product Batch
        if (fabricVerification.verificationStatus === 'EXPIRED') {
            return {
                isAnomaly: true,
                anomalyType: 'EXPIRED_BATCH',
                riskScore: 85,
                verificationStatus: 'EXPIRED',
                alertMessage: '⚠️ EXPIRED PRODUCT: This medicine batch has passed its expiration date. Dispensing prohibited.',
                scanCount,
                velocityDetails: null
            };
        }

        // RULE 4: Already Sold Unit Rescan (Clone / Tamper Warning)
        if (fabricVerification.verificationStatus === 'ALREADY_SOLD' || (dbUnit && dbUnit.status === 'SOLD')) {
            isAnomaly = true;
            anomalyType = 'ALREADY_SOLD';
            riskScore = 95;
            verificationStatus = 'ALREADY_SOLD';
            alertMessage = '🚨 SUSPICIOUS DUPLICATE SCAN: This serial number was previously recorded as sold. Potential counterfeit clone detected!';
        }

        // RULE 5: High-Frequency Scan Burst (Spam / Bot / Bulk Cloning)
        const recent60sScans = pastScans.filter(s => (now - s.timestamp) <= 60000);
        if (recent60sScans.length >= 5) {
            isAnomaly = true;
            anomalyType = 'HIGH_FREQUENCY_SCAN';
            riskScore = Math.max(riskScore, 80);
            alertMessage = '⚠️ HIGH FREQUENCY SCAN BURST: Unusually rapid scans detected for this serial number. Automated bot or unauthorized bulk cloning suspected.';
        }

        // RULE 6: Velocity Anomaly (Impossible Travel / Simultaneous Multi-City Clones)
        if (coords && pastScans.length > 0) {
            // Find most recent past scan with valid coordinates
            const priorScan = pastScans.find(s => s.lat != null && s.lon != null);
            if (priorScan) {
                const distanceKm = this.haversineDistance(coords.lat, coords.lon, priorScan.lat, priorScan.lon);
                const deltaMs = Math.max(now - priorScan.timestamp, 1000); // minimum 1 second to avoid div by zero
                const deltaHours = deltaMs / (1000 * 60 * 60);
                const deltaMinutes = deltaMs / (1000 * 60);
                const velocityKmh = distanceKm / deltaHours;

                velocityDetails = {
                    distanceKm: Math.round(distanceKm * 10) / 10,
                    timeDeltaMinutes: Math.round(deltaMinutes * 10) / 10,
                    velocityKmh: Math.round(velocityKmh),
                    priorLocation: {
                        city: priorScan.city,
                        lat: priorScan.lat,
                        lon: priorScan.lon,
                        timestamp: priorScan.timestamp
                    },
                    currentLocation: {
                        city: currentCity,
                        lat: coords.lat,
                        lon: coords.lon,
                        timestamp: now
                    }
                };

                // Thresholds:
                // 1. If distance > 500 km and delta t < 30 minutes, OR
                // 2. If velocity > 850 km/h (exceeds commercial aviation transit + ground handling)
                if ((distanceKm > 500 && deltaMinutes < 30) || (distanceKm > 50 && velocityKmh > 850)) {
                    isAnomaly = true;
                    anomalyType = 'SUSPICIOUS_VELOCITY';
                    riskScore = 98;
                    verificationStatus = 'SUSPICIOUS_VELOCITY';
                    alertMessage = `🚨 IMPOSSIBLE VELOCITY DETECTED: Serial scanned in ${currentCity} after prior scan in ${priorScan.city} (${velocityDetails.distanceKm} km apart) within ${velocityDetails.timeDeltaMinutes} mins (${velocityDetails.velocityKmh} km/h). Counterfeit cloning alert!`;
                }
            }
        }

        // RULE 7: Legitimate repeat scan of authentic unit
        if (!isAnomaly && pastScans.length > 0) {
            // Mild risk elevation for frequent consumer inquiries
            riskScore = Math.min(pastScans.length * 5, 25);
            alertMessage = `Genuine Product: Product authenticity verified on blockchain (Scan count: ${scanCount}).`;
        }

        return {
            isAnomaly,
            anomalyType,
            riskScore,
            verificationStatus,
            alertMessage,
            scanCount,
            velocityDetails
        };
    }

    /**
     * Record a scan event into both persistent DB and in-memory cache
     */
    async recordScan(serialNumber, metadata = {}, assessment = {}) {
        const now = Date.now();
        const coords = this.resolveCoordinates(metadata);
        const coordString = coords ? `${coords.lat},${coords.lon}` : null;
        const currentCity = metadata.city || 'Unknown';
        const scannerIp = metadata.ip || '127.0.0.1';
        const userAgent = metadata.userAgent || 'PharmaTrace-Scanner';
        const status = assessment.verificationStatus || 'AUTHENTIC';

        // 1. Update in-memory history cache
        const scanRecord = {
            serialNumber,
            ip: scannerIp,
            userAgent,
            city: currentCity,
            lat: coords ? coords.lat : null,
            lon: coords ? coords.lon : null,
            result: status,
            timestamp: now
        };

        const existing = inMemoryScanHistory.get(serialNumber) || [];
        existing.unshift(scanRecord); // prepend newest
        inMemoryScanHistory.set(serialNumber, existing);

        // 2. Insert into PostgreSQL verification_logs
        try {
            await db.query(`
                INSERT INTO verification_logs (
                    scanned_serial_raw, scanner_ip, scanner_user_agent,
                    location_city, location_coordinates, verification_result, scan_timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
            `, [serialNumber, scannerIp, userAgent, currentCity, coordString, status]);

            // Increment verification count in serial_units
            await db.query(`
                UPDATE serial_units
                SET verification_count = verification_count + 1,
                    status = CASE 
                        WHEN $2 IN ('SUSPICIOUS_VELOCITY', 'ALREADY_SOLD') THEN 'SUSPICIOUS'
                        ELSE status
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE serial_number = $1;
            `, [serialNumber, status]);
        } catch (e) {
            logger.warn(`Could not persist verification_log to database: ${e.message}`);
        }

        return scanRecord;
    }

    /**
     * Reset in-memory cache (primarily for automated unit tests)
     */
    clearCache() {
        inMemoryScanHistory.clear();
    }
}

module.exports = new AnomalyService();

