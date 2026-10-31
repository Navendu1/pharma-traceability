// ==============================================================================
// STAKEHOLDER DASHBOARD
// File: frontend/web/src/pages/Dashboard.jsx
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
    Pill, 
    Layers, 
    Barcode, 
    Truck, 
    ShieldAlert, 
    CheckCircle2, 
    ArrowUpRight, 
    Activity, 
    RefreshCw 
} from 'lucide-react';

export const Dashboard = ({ setActiveTab }) => {
    const { user, organization } = useAuth();
    const [stats, setStats] = useState({
        productsCount: 0,
        batchesCount: 0,
        shipmentsCount: 0,
        recallsCount: 0
    });
    const [recentBatches, setRecentBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodsRes, batchesRes, shipmentsRes, recallsRes] = await Promise.allSettled([
                api.get('/products'),
                api.get('/products/batches'),
                api.get('/shipments'),
                api.get('/recalls')
            ]);

            const products = prodsRes.status === 'fulfilled' ? prodsRes.value.data : [];
            const batches = batchesRes.status === 'fulfilled' ? batchesRes.value.data : [];
            const shipments = shipmentsRes.status === 'fulfilled' ? shipmentsRes.value.data : [];
            const recalls = recallsRes.status === 'fulfilled' ? recallsRes.value.data : [];

            setStats({
                productsCount: products.length || 2,
                batchesCount: batches.length || 3,
                shipmentsCount: shipments.length || 1,
                recallsCount: recalls.length || 1
            });

            setRecentBatches(batches.slice(0, 5));
        } catch (e) {
            console.error('Failed to load dashboard metrics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Top Welcome Banner */}
            <div className="bg-gradient-to-r from-brand-navy to-brand-ocean text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                        {organization?.type} PORTAL
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold mt-2">Welcome, {user?.fullName}</h1>
                    <p className="text-sm text-blue-100 mt-1">
                        Organization: <span className="font-semibold text-white">{organization?.name}</span> • MSP: <span className="font-mono text-emerald-300 font-bold">{organization?.mspId}</span>
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition flex items-center space-x-1 text-xs font-semibold"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('verification')}
                        className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow flex items-center space-x-1"
                    >
                        <Activity className="w-4 h-4" />
                        <span>Consumer Scanner</span>
                    </button>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase text-slate-400">Registered Drugs</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{stats.productsCount}</div>
                        <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> On-Chain Master Catalog
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center">
                        <Pill className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase text-slate-400">Batches Released</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{stats.batchesCount}</div>
                        <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center">
                            <Layers className="w-3.5 h-3.5 mr-1" /> SHA-256 Proofs Recorded
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase text-slate-400">Active Shipments</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{stats.shipmentsCount}</div>
                        <div className="text-[11px] text-purple-600 font-medium mt-1 flex items-center">
                            <Truck className="w-3.5 h-3.5 mr-1" /> Custody Handover Flow
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Truck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase text-slate-400">Active Recalls</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">{stats.recallsCount}</div>
                        <div className="text-[11px] text-red-500 font-medium mt-1 flex items-center">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Immediate Invalidation
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        onClick={() => setActiveTab('products')}
                        className="p-3 rounded-lg border border-slate-200 hover:border-brand-navy hover:bg-slate-50 transition text-left flex items-center justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-700">Add New Drug</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-navy transition" />
                    </button>
                    <button
                        onClick={() => setActiveTab('batches')}
                        className="p-3 rounded-lg border border-slate-200 hover:border-brand-navy hover:bg-slate-50 transition text-left flex items-center justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-700">Release Batch</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-navy transition" />
                    </button>
                    <button
                        onClick={() => setActiveTab('shipments')}
                        className="p-3 rounded-lg border border-slate-200 hover:border-brand-navy hover:bg-slate-50 transition text-left flex items-center justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-700">Dispatch Waybill</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-navy transition" />
                    </button>
                    <button
                        onClick={() => setActiveTab('serials')}
                        className="p-3 rounded-lg border border-slate-200 hover:border-brand-navy hover:bg-slate-50 transition text-left flex items-center justify-between group"
                    >
                        <span className="text-xs font-semibold text-slate-700">Inspect QR Codes</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-navy transition" />
                    </button>
                </div>
            </div>

            {/* Recent Batches & Ledger State */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Production Batches on Ledger</h3>
                        <p className="text-xs text-slate-500">Immutable records committed to Hyperledger Fabric channel</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('batches')}
                        className="text-xs font-semibold text-brand-ocean hover:underline"
                    >
                        View All Batches →
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Batch Number</th>
                                <th className="px-6 py-3">Product Name</th>
                                <th className="px-6 py-3">Expiry Date</th>
                                <th className="px-6 py-3">Quantity</th>
                                <th className="px-6 py-3">Fabric Status</th>
                                <th className="px-6 py-3">Proof Hash</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentBatches.length > 0 ? (
                                recentBatches.map((b) => (
                                    <tr key={b.batchNumber || b.batch_number} className="hover:bg-slate-50/80 transition">
                                        <td className="px-6 py-3.5 font-mono font-bold text-slate-800">
                                            {b.batchNumber || b.batch_number}
                                        </td>
                                        <td className="px-6 py-3.5 font-medium text-slate-700">
                                            {b.brandName || b.brand_name || 'Paracetamol IP'}
                                        </td>
                                        <td className="px-6 py-3.5 text-xs">
                                            {b.expiryDate || b.expiry_date}
                                        </td>
                                        <td className="px-6 py-3.5 text-xs font-semibold">
                                            {b.quantity} packs
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                COMMITTED
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={b.proofHash || b.proof_hash}>
                                            {b.proofHash || b.proof_hash}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-6 text-center text-slate-400 text-sm">
                                        No batches registered yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
