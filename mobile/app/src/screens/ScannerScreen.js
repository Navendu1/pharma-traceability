// ==============================================================================
// CAMERA QR SCANNER SCREEN
// File: mobile/app/src/screens/ScannerScreen.js
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { ScannerOverlay } from '../components/ScannerOverlay';

export const ScannerScreen = ({ onScanSuccess, onCancel }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [torchOn, setTorchOn] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    const handleBarcodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        onScanSuccess(data);
    };

    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.permissionText}>No access to camera granted</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={onCancel}>
                    <Text style={styles.retryBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={torchOn}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'datamatrix', 'code128', 'ean13'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Targeting Reticle Frame */}
            <ScannerOverlay />

            {/* Top Navigation Overlay */}
            <SafeAreaView style={styles.topControls}>
                <TouchableOpacity style={styles.controlBtn} onPress={onCancel}>
                    <Text style={styles.controlBtnText}>✕ Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlBtn, torchOn && styles.controlBtnActive]}
                    onPress={() => setTorchOn(!torchOn)}
                >
                    <Text style={styles.controlBtnText}>{torchOn ? '🔦 Torch On' : '💡 Flash'}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        padding: 20,
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 15,
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: '#1B365D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    topControls: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    controlBtn: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    controlBtnActive: {
        backgroundColor: '#F59E0B',
    },
    controlBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

