// ==============================================================================
// STATUS BADGE COMPONENT
// File: mobile/app/src/components/StatusBadge.js
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const StatusBadge = ({ status }) => {
    const getBadgeStyle = () => {
        switch (status) {
            case 'AUTHENTIC':
                return { bg: '#E8F5E9', border: '#81C784', text: '#2E7D32', label: 'GENUINE & AUTHENTIC' };
            case 'RECALLED':
                return { bg: '#FFEBEE', border: '#E57373', text: '#C62828', label: 'BATCH RECALLED' };
            case 'ALREADY_SOLD':
                return { bg: '#FFF8E1', border: '#FFD54F', text: '#F57F17', label: 'SUSPICIOUS / RESOLD' };
            case 'EXPIRED':
                return { bg: '#FFF3E0', border: '#FFB74D', text: '#E65100', label: 'EXPIRED PRODUCT' };
            default:
                return { bg: '#ECEFF1', border: '#B0BEC5', text: '#455A64', label: 'UNKNOWN SERIAL' };
        }
    };

    const config = getBadgeStyle();

    return (
        <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
            <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
