// ==============================================================================
// ON-CHAIN AUDIT TRAIL / TIMELINE SCREEN
// File: mobile/app/src/screens/HistoryScreen.js
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView,
    ActivityIndicator 
} from 'react-native';
import { getProductHistory } from '../services/api';

export const HistoryScreen = ({ serialNumber, onBack }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await getProductHistory(serialNumber);
                setHistory(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [serialNumber]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>On-Chain Journey</Text>
                <Text style={styles.serialText}>{serialNumber}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1B365D" />
                    <Text style={styles.loadingText}>Querying Hyperledger Fabric...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Immutable State Transitions</Text>

                    <View style={styles.timeline}>
                        {history.map((item, idx) => (
                            <View key={idx} style={styles.timelineItem}>
                                <View style={styles.indicatorContainer}>
                                    <View style={styles.dot} />
                                    {idx !== history.length - 1 && <View style={styles.line} />}
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.timestamp}>
                                        {new Date(item.timestamp).toLocaleString()}
                                    </Text>
                                    <Text style={styles.status}>
                                        State: <Text style={styles.statusVal}>{item.value?.status || 'RECORDED'}</Text>
                                    </Text>
                                    <Text style={styles.custodian}>
                                        Custodian: <Text style={styles.custodianVal}>{item.value?.currentCustodian || 'Consortium'}</Text>
                                    </Text>
                                    <Text style={styles.txId}>
                                        TxID: {item.txId}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
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
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    backBtn: {
        marginBottom: 8,
    },
    backText: {
        color: '#93C5FD',
        fontSize: 14,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    serialText: {
        fontSize: 12,
        color: '#E2E8F0',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 2,
    },
    content: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
        color: '#64748B',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#94A3B8',
        marginBottom: 16,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    indicatorContainer: {
        alignItems: 'center',
        marginRight: 14,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#1B365D',
        borderWidth: 2,
        borderColor: '#93C5FD',
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#CBD5E1',
        marginTop: 4,
    },
    itemContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timestamp: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    status: {
        fontSize: 13,
        color: '#334155',
        marginTop: 4,
    },
    statusVal: {
        fontWeight: 'bold',
        color: '#0F172A',
    },
    custodian: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    custodianVal: {
        fontWeight: 'bold',
        color: '#0284C7',
    },
    txId: {
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 6,
    },
});
