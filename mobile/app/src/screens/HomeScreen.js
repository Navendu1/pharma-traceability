// ==============================================================================
// MOBILE HOME SCREEN
// File: mobile/app/src/screens/HomeScreen.js
// ==============================================================================

import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    SafeAreaView,
    StatusBar
} from 'react-native';

export const HomeScreen = ({ onStartScan, onVerifySerial }) => {
    const [manualCode, setManualCode] = useState('');

    const demoPacks = [
        { label: 'Genuine In-Stock Pack', code: 'MED-IN-7K4P-92XF-8Q2M', color: '#2E7D32' },
        { label: 'Duplicate Resold Pack', code: 'MED-IN-8L5Q-03YG-9R3N', color: '#F57F17' },
        { label: 'Recalled Batch Pack', code: 'MED-IN-9M6R-14ZH-0S4P', color: '#C62828' }
    ];

    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        onVerifySerial(manualCode.trim());
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1B365D" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>IIT KHARAGPUR RESEARCH</Text>
                </View>
                <Text style={styles.title}>PharmaTrace</Text>
                <Text style={styles.subtitle}>Blockchain Pharmaceutical Authentication</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Primary Scan Button */}
                <TouchableOpacity style={styles.scanButton} onPress={onStartScan} activeOpacity={0.85}>
                    <View style={styles.scanIconContainer}>
                        <Text style={styles.scanIconText}>📷</Text>
                    </View>
                    <Text style={styles.scanButtonText}>Scan Medicine QR Code</Text>
                    <Text style={styles.scanButtonSubtext}>Instant camera-based blockchain verification</Text>
                </TouchableOpacity>

                {/* Manual Serial Input */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Manual Code Entry</Text>
                    <Text style={styles.cardDesc}>Enter the 16-character serial identifier printed on the box:</Text>
                    
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. MED-IN-7K4P-92XF-8Q2M"
                            placeholderTextColor="#94A3B8"
                            value={manualCode}
                            onChangeText={setManualCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={styles.verifyBtn} onPress={handleManualSubmit}>
                            <Text style={styles.verifyBtnText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Demo Test Scenarios */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Academic Demo Test Codes</Text>
                    <Text style={styles.cardDesc}>Tap to test authentication, duplicate detection, and recall alerts:</Text>

                    <View style={styles.demoButtonsList}>
                        {demoPacks.map((pack) => (
                            <TouchableOpacity
                                key={pack.code}
                                style={styles.demoBtn}
                                onPress={() => onVerifySerial(pack.code)}
                            >
                                <View style={[styles.demoIndicator, { backgroundColor: pack.color }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.demoBtnLabel}>{pack.label}</Text>
                                    <Text style={styles.demoBtnCode}>{pack.code}</Text>
                                </View>
                                <Text style={styles.demoChevron}>→</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Trust Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Anchored to Hyperledger Fabric v2.5 consortium ledger. Cryptographic verification with Zero-Trust identity enforcement.
                    </Text>
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
    header: {
        backgroundColor: '#1B365D',
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        marginBottom: 8,
    },
    badgeText: {
        color: '#93C5FD',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 13,
        color: '#E2E8F0',
        marginTop: 2,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    scanButton: {
        backgroundColor: '#0E5A44',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#0E5A44',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 20,
    },
    scanIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    scanIconText: {
        fontSize: 26,
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scanButtonSubtext: {
        color: '#A7F3D0',
        fontSize: 12,
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    cardDesc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#0F172A',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    verifyBtn: {
        backgroundColor: '#1B365D',
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    demoButtonsList: {
        gap: 8,
    },
    demoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    demoIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    demoBtnLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    demoBtnCode: {
        fontSize: 11,
        color: '#64748B',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    demoChevron: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 10,
        paddingHorizontal: 10,
    },
    footerText: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 16,
    },
});

