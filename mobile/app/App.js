// ==============================================================================
// ROOT REACT NATIVE EXPO ENTRYPOINT
// File: mobile/app/App.js
// ==============================================================================

import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ActivityIndicator, 
    Modal 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from './src/screens/HomeScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ProductResultScreen } from './src/screens/ProductResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ReportSuspiciousScreen } from './src/screens/ReportSuspiciousScreen';
import { verifySerial } from './src/services/api';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('HOME'); // HOME, SCANNER, RESULT, HISTORY, REPORT
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Verification Trigger
    const handleVerifyCode = async (rawCode) => {
        setLoading(true);
        try {
            const data = await verifySerial(rawCode);
            setVerificationResult(data);
            setCurrentScreen('RESULT');
        } catch (error) {
            setVerificationResult({
                serialNumber: rawCode,
                verificationStatus: 'UNKNOWN_SERIAL',
                alertMessage: error.message || 'Unable to verify code on blockchain.',
                blockchainVerified: false
            });
            setCurrentScreen('RESULT');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Main Screen Switcher */}
            {currentScreen === 'HOME' && (
                <HomeScreen
                    onStartScan={() => setCurrentScreen('SCANNER')}
                    onVerifySerial={handleVerifyCode}
                />
            )}

            {currentScreen === 'SCANNER' && (
                <ScannerScreen
                    onScanSuccess={(scannedData) => {
                        handleVerifyCode(scannedData);
                    }}
                    onCancel={() => setCurrentScreen('HOME')}
                />
            )}

            {currentScreen === 'RESULT' && (
                <ProductResultScreen
                    result={verificationResult}
                    onViewHistory={() => setCurrentScreen('HISTORY')}
                    onReportSuspicious={() => setCurrentScreen('REPORT')}
                    onScanAgain={() => setCurrentScreen('HOME')}
                />
            )}

            {currentScreen === 'HISTORY' && (
                <HistoryScreen
                    serialNumber={verificationResult?.serialNumber}
                    onBack={() => setCurrentScreen('RESULT')}
                />
            )}

            {currentScreen === 'REPORT' && (
                <ReportSuspiciousScreen
                    serialNumber={verificationResult?.serialNumber}
                    onBack={() => setCurrentScreen('RESULT')}
                    onSubmitSuccess={() => setCurrentScreen('HOME')}
                />
            )}

            {/* Global Verification Loading Modal */}
            {loading && (
                <Modal transparent animationType="fade" visible={loading}>
                    <View style={styles.loadingBackdrop}>
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color="#1B365D" />
                            <Text style={styles.loadingTitle}>Querying Blockchain</Text>
                            <Text style={styles.loadingSubtitle}>Evaluating Hyperledger Fabric Ledger...</Text>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    loadingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 14,
    },
    loadingSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        textAlign: 'center',
    },
});
