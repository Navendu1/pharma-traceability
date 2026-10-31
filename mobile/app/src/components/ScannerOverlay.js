// ==============================================================================
// CAMERA TARGETING VIEWFINDER OVERLAY
// File: mobile/app/src/components/ScannerOverlay.js
// ==============================================================================

import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');
const BOX_SIZE = width * 0.72;

export const ScannerOverlay = () => {
    return (
        <View style={styles.overlay}>
            <View style={styles.topMask} />
            <View style={styles.middleRow}>
                <View style={styles.sideMask} />
                <View style={styles.box}>
                    {/* Corner Reticles */}
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.sideMask} />
            </View>
            <View style={styles.bottomMask}>
                <Text style={styles.instructionText}>
                    Point camera at 2D DataMatrix or QR code on medicine box
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    topMask: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    middleRow: {
        flexDirection: 'row',
        height: BOX_SIZE,
    },
    sideMask: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    box: {
        width: BOX_SIZE,
        height: BOX_SIZE,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderColor: '#00E676', // High-visibility Emerald green
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 8,
    },
    bottomMask: {
        flex: 1.2,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        paddingTop: 30,
        paddingHorizontal: 30,
    },
    instructionText: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 20,
    },
});

