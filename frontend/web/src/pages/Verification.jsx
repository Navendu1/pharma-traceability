// ==============================================================================
// PUBLIC CONSUMER VERIFICATION & TIMELINE INSPECTOR
// File: frontend/web/src/pages/Verification.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
    Search, 
    ShieldCheck, 
    ShieldAlert, 
    Clock, 
    AlertTriangle, 
    HelpCircle, 
    History, 
    CheckCircle2, 
    ChevronRight,
    MapPin
} from 'lucide-react';

export const Verification = ({ initialSerial }) => {
    const [serialInput, setSerialInput] = useState(initialSerial || 'MED-IN-7K4P-92XF-8Q2M');
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const testSamples = [
        { label: 'Authentic In-Stock Unit', serial: 'MED-IN-7K4P-92XF-8Q2M' },
        { label: 'Already Sold Unit (Duplicate Check)', serial: 'MED-IN-8L5Q-03YG-9R3N' },
        { label: 'Recalled Batch Unit', serial: 'MED-IN-9M6R-14ZH-0S4P' },
        { label: 'Unregistered / Counterfeit Code', serial: 'FAKE-COUNTERFEIT-999' }
    ];

    const performVerification = async (serialToTest) => {
        const s = serialToTest || serialInput;
        if (!s) return;

        setLoading(true);
        setSearched(true);
        setResult(null);
        setHistory([]);

        try {
            const [verRes, histRes] = await Promise.all([
                api.get(`/verification/verify/${encodeURIComponent(s.trim())}`),
                api.get(`/verification/history/${encodeURIComponent(s.trim())}`)
            ]);

            setResult(verRes.data);
            setHistory(histRes.data || []);
        } catch (e) {
            setResult({
                serialNumber: s,
                verificationStatus: 'UNKNOWN_SERIAL',
                alertMessage: 'This serial number could not be found in the blockchain registry.',
                blockchainVerified: false
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialSerial) {
            setSerialInput(initialSerial);
            performVerification(initialSerial);
        }
    }, [initialSerial]);

    const getStatusTheme = (status) => {
        switch (status) {
            case 'AUTHENTIC':
                return {
                    bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
                    badge: 'bg-emerald-600 text-white',
                    icon: ShieldCheck,
                    title: 'GENUINE MEDICINE VERIFIED'
                };
            case 'RECALLED':
                return {
                    bg: 'bg-red-50 border-red-300 text-red-900',
                    badge: 'bg-red-600 text-white',
                    icon: ShieldAlert,
                    title: 'CRITICAL WARNING: BATCH RECALLED'
                };
            case 'ALREADY_SOLD':
                return {
                    bg: 'bg-amber-50 border-amber-300 text-amber-900',
                    badge: 'bg-amber-600 text-white',
                    icon: AlertTriangle,
                    title: 'SUSPICIOUS: ALREADY RECORDED AS SOLD'
                };
            case 'EXPIRED':
                return {
                    bg: 'bg-orange-50 border-orange-300 text-orange-900',
                    badge: 'bg-orange-600 text-white',
                    icon: Clock,
                    title: 'EXPIRED PRODUCT'
                };
            default:
                return {
                    bg: 'bg-slate-100 border-slate-300 text-slate-800',
                    badge: 'bg-slate-700 text-white',
                    icon: HelpCircle,
                    title: 'UNKNOWN SERIAL NUMBER'
                };
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <span className="text-xs uppercase font-bold text-brand-ocean bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
                    Public Consumer Verification Portal
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verify Pharmaceutical Authenticity</h1>
                <p className="text-sm text-slate-500 max-w-xl mx-auto">
                    Inspect unit serialization, tamper-evident batch status, and real-time Hyperledger Fabric custody history.
                </p>
            </div>

            {/* Search Input Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        performVerification();
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                            type="text"
                            placeholder="Scan QR or enter serial code (e.g. MED-IN-7K4P-92XF-8Q2M)"
                            value={serialInput}
                            onChange={(e) => setSerialInput(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="py-3 px-6 bg-brand-navy text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition shadow flex items-center justify-center space-x-2 disabled:opacity-70"
                    >
                        <span>{loading ? 'Verifying on Ledger...' : 'Verify Product'}</span>
                    </button>
                </form>

                {/* Sample Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400">Test Scenarios:</span>
                    {testSamples.map(sample => (
                        <button
                            key={sample.serial}
                            type="button"
                            onClick={() => {
                                setSerialInput(sample.serial);
                                performVerification(sample.serial);
                            }}
                            className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                        >
                            {sample.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Verification Result Card */}
            {result && (() => {
                const theme = getStatusTheme(result.verificationStatus);
                const Icon = theme.icon;

                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Status Alert Banner */}
                        <div className={`p-6 rounded-2xl border-2 ${theme.bg} shadow-sm space-y-3`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.badge}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold tracking-tight">{theme.title}</h2>
                                        <span className="text-xs font-mono font-bold opacity-80">
                                            Serial: {result.serialNumber}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${theme.badge}`}>
                                    {result.verificationStatus}
                                </span>
                            </div>

                            <p className="text-sm font-medium">{result.alertMessage}</p>
                        </div>

                        {/* Verified Metadata Specs */}
                        {result.details && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <h3 className="text-xs font-bold uppercase text-slate-400">Medicine Specifications</h3>
                                    <div className="space-y-2 text-xs text-slate-700">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Brand Name:</span>
                                            <span className="font-bold">{result.details.product?.brandName || 'Paracip-500'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Generic Formula:</span>
                                            <span className="font-semibold">{result.details.product?.genericName || 'Paracetamol IP'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Dosage Form:</span>
                                            <span>{result.details.product?.dosageForm || 'Tablet'} ({result.details.product?.strength || '500 mg'})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">GTIN:</span>
                                            <span className="font-mono">{result.details.product?.gtin || '08901234567890'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <h3 className="text-xs font-bold uppercase text-slate-400">Batch & Custody Information</h3>
                                    <div className="space-y-2 text-xs text-slate-700">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Batch Number:</span>
                                            <span className="font-mono font-bold">{result.details.batch?.batchNumber || 'B2026-001'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Expiry Date:</span>
                                            <span className="font-semibold">{result.details.batch?.expiryDate || '2028-07-31'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Current Custodian:</span>
                                            <span className="font-bold text-brand-ocean">{result.details.currentCustodian || 'PharmacyMSP'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">On-Chain State:</span>
                                            <span className="font-semibold text-emerald-700">{result.details.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Timeline */}
                        {history.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center space-x-2">
                                    <History className="w-5 h-5 text-brand-navy" />
                                    <h3 className="text-base font-bold text-slate-800">Immutable Blockchain History</h3>
                                </div>

                                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                    {history.map((h, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-brand-navy border-4 border-white shadow-sm" />
                                            <div className="text-xs font-semibold text-slate-400">
                                                {h.timestamp} • TxID: <span className="font-mono">{h.txId?.slice(0, 16)}...</span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-800 mt-0.5">
                                                Status: {h.value?.status || 'STATE_TRANSITION'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Custodian: <span className="font-mono text-slate-700 font-semibold">{h.value?.currentCustodian || 'ManufacturerMSP'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};
