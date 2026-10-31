// ==============================================================================
// SUSPICIOUS PRODUCT REPORTING SCREEN
// File: mobile/app/src/screens/ReportSuspiciousScreen.js
// ==============================================================================

import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    Alert 
} from 'react-native';

export const ReportSuspiciousScreen = ({ serialNumber, onBack, onSubmitSuccess }) => {
    const [pharmacyName, setPharmacyName] = useState('');
    const [city, setCity] = useState('');
    const [incidentNotes, setIncidentNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!pharmacyName || !city) {
            Alert.alert('Required Fields', 'Please specify the retail pharmacy name and city.');
            return;
        }

        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            Alert.alert(
                'Report Submitted',
                'Your duplicate scan report has been forwarded to the Central Drugs Standard Control Organisation (CDSCO) and the manufacturer.',
                [{ text: 'OK', onPress: onSubmitSuccess }]
            );
        }, 800);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Report Suspicious Product</Text>
                <Text style={styles.subtitle}>Flag Counterfeit or Cloned Packaging</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ Anti-Counterfeiting Investigation</Text>
                    <Text style={styles.warningDesc}>
                        Submitting this report initiates an anomaly review. The serial number, scan timestamp, and pharmacy location will be logged for regulatory audit.
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Serial Number Flagged</Text>
                    <Text style={styles.serialBox}>{serialNumber}</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Retail Pharmacy / Store Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. City Medico Store, Station Road"
                        value={pharmacyName}
                        onChangeText={setPharmacyName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>City / Location *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Kharagpur, West Bengal"
                        value={city}
                        onChangeText={setCity}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Incident Observations</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe packaging irregularities, missing hologram, broken seal, or resold alert..."
                        multiline
                        numberOfLines={4}
                        value={incidentNotes}
                        onChangeText={setIncidentNotes}
                    />
                </View>

                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <Text style={styles.submitBtnText}>
                        {submitting ? 'Submitting Report...' : 'Submit Incident Report to CDSCO'}
                    </Text>
                </TouchableOpacity>
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
        backgroundColor: '#B91C1C',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    backBtn: {
        marginBottom: 8,
    },
    backText: {
        color: '#FECACA',
        fontSize: 14,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 12,
        color: '#FEE2E2',
        marginTop: 2,
    },
    content: {
        padding: 20,
    },
    warningBox: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    warningTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#991B1B',
        marginBottom: 4,
    },
    warningDesc: {
        fontSize: 12,
        color: '#B91C1C',
        lineHeight: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#64748B',
        marginBottom: 6,
    },
    serialBox: {
        backgroundColor: '#F1F5F9',
        padding: 12,
        borderRadius: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: '#B91C1C',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#B91C1C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
