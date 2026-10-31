// ==============================================================================
// PRODUCT VERIFICATION RESULT SCREEN
// File: mobile/app/src/screens/ProductResultScreen.js
// ==============================================================================

import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView 
} from 'react-native';
import { StatusBadge } from '../components/StatusBadge';

export const ProductResultScreen = ({ 
    result, 
    onViewHistory, 
    onReportSuspicious, 
    onScanAgain 
}) => {
    if (!result) return null;

    const { serialNumber, verificationStatus, alertMessage, details } = result;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Result Card */}
                <View style={styles.headerCard}>
                    <StatusBadge status={verificationStatus} />
                    <Text style={styles.serialText}>{serialNumber}</Text>
                    <Text style={styles.alertText}>{alertMessage}</Text>
                </View>

                {/* Medicine Specifications */}
                {details && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeader}>Medicine Specifications</Text>

                        <View style={styles.row}>
                            <Text style={styles.label}>Brand Name</Text>
                            <Text style={styles.valueBold}>{details.product?.brandName || 'Paracip-500'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Generic Formula</Text>
                            <Text style={styles.value}>{details.product?.genericName || 'Paracetamol IP'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Dosage Form</Text>
                            <Text style={styles.value}>{details.product?.dosageForm || 'Tablet'} ({details.product?.strength || '500 mg'})</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>GTIN</Text>
                            <Text style={[styles.value, styles.mono]}>{details.product?.gtin || '08901234567890'}</Text>
                        </View>
                    </View>
                )}

                {/* Batch & Traceability Info */}
                {details && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeader}>Batch & Custody Details</Text>

                        <View style={styles.row}>
                            <Text style={styles.label}>Batch Number</Text>
                            <Text style={[styles.valueBold, styles.mono]}>{details.batch?.batchNumber || 'B2026-001'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Expiry Date</Text>
                            <Text style={styles.valueBold}>{details.batch?.expiryDate || '2028-07-31'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Current Custodian</Text>
                            <Text style={[styles.valueBold, { color: '#0284C7' }]}>{details.currentCustodian || 'PharmacyMSP'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Ledger State</Text>
                            <Text style={[styles.valueBold, { color: '#059669' }]}>{details.status || 'STOCKED'}</Text>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.historyBtn} onPress={onViewHistory}>
                        <Text style={styles.historyBtnText}>📜 View On-Chain Journey</Text>
                    </TouchableOpacity>

                    {verificationStatus !== 'AUTHENTIC' && (
                        <TouchableOpacity style={styles.reportBtn} onPress={onReportSuspicious}>
                            <Text style={styles.reportBtnText}>🚨 Report Fake / Duplicate Pack</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.scanAgainBtn} onPress={onScanAgain}>
                        <Text style={styles.scanAgainBtnText}>Scan Another Medicine</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    serialText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0F172A',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 12,
        marginBottom: 6,
    },
    alertText: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 18,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 14,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94A3B8',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    label: {
        fontSize: 13,
        color: '#64748B',
    },
    value: {
        fontSize: 13,
        color: '#1E293B',
    },
    valueBold: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    mono: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    actionsContainer: {
        gap: 10,
        marginTop: 10,
    },
    historyBtn: {
        backgroundColor: '#1B365D',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    historyBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    reportBtn: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#F87171',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    reportBtnText: {
        color: '#B91C1C',
        fontSize: 14,
        fontWeight: 'bold',
    },
    scanAgainBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    scanAgainBtnText: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '600',
    },
});
