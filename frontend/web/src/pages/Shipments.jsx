// ==============================================================================
// SHIPMENTS & CUSTODY TRANSFER MANAGEMENT
// File: frontend/web/src/pages/Shipments.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Truck, Plus, CheckCircle2, AlertCircle, ArrowRight, PackageCheck } from 'lucide-react';

export const Shipments = () => {
    const { organization } = useAuth();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dispatchModal, setDispatchModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const [dispatchData, setDispatchData] = useState({
        shipmentCode: 'WAYBILL-' + Math.floor(1000 + Math.random() * 8999),
        receiverOrgId: '22222222-2222-2222-2222-222222222222', // Eastern MedLogistics
        receiverMspId: 'DistributorMSP',
        serialNumbers: 'MED-IN-7K4P-92XF-8Q2M',
        notes: 'Priority supply shipment'
    });

    const loadShipments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/shipments');
            setShipments(res.data || []);
        } catch (e) {
            console.error('Error loading shipments', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShipments();
    }, []);

    const handleDispatch = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ text: '', type: '' });

        try {
            const serialsArray = dispatchData.serialNumbers.split(',').map(s => s.trim()).filter(Boolean);
            await api.post('/shipments/dispatch', {
                ...dispatchData,
                serialNumbers: serialsArray
            });
            setMsg({ text: `Waybill ${dispatchData.shipmentCode} dispatched on Fabric ledger!`, type: 'success' });
            setDispatchModal(false);
            loadShipments();
        } catch (err) {
            setMsg({ text: err.message || 'Dispatch failed', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceive = async (shipmentCode) => {
        setSubmitting(true);
        try {
            await api.post('/shipments/receive', { shipmentCode });
            setMsg({ text: `Inward receipt accepted for ${shipmentCode}! Serial custody transferred to your organization on ledger.`, type: 'success' });
            loadShipments();
        } catch (err) {
            setMsg({ text: err.message || 'Inward receipt failed', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Shipment Waybills & Custody Handover</h1>
                    <p className="text-sm text-slate-500">Dual-endorsed logistics handover recorded on Hyperledger Fabric</p>
                </div>

                <button
                    onClick={() => setDispatchModal(true)}
                    className="py-2.5 px-4 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-blue-900 transition flex items-center space-x-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Dispatch New Shipment</span>
                </button>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center space-x-2 text-sm border ${
                    msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span>{msg.text}</span>
                </div>
            )}

            {/* Shipments List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3.5">Waybill Code</th>
                            <th className="px-6 py-3.5">Sender → Receiver</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5">Units Count</th>
                            <th className="px-6 py-3.5 text-right">Custody Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shipments.map((s) => {
                            const isDispatched = s.status === 'DISPATCHED';
                            return (
                                <tr key={s.shipmentCode || s.shipment_code} className="hover:bg-slate-50/80 transition">
                                    <td className="px-6 py-4 font-mono font-bold text-brand-navy">
                                        {s.shipmentCode || s.shipment_code}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                                        {s.senderMspId || 'Org1'} → <span className="font-bold text-brand-ocean">{s.receiverMspId || 'Org2'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            s.status === 'DELIVERED'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                        {s.serialNumbers ? s.serialNumbers.length : 1} packs
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isDispatched ? (
                                            <button
                                                onClick={() => handleReceive(s.shipmentCode || s.shipment_code)}
                                                disabled={submitting}
                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                                            >
                                                <PackageCheck className="w-4 h-4" />
                                                <span>Accept Delivery</span>
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">Delivered & Confirmed</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Dispatch Modal */}
            {dispatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Dispatch Waybill & Transfer In-Transit</h3>
                        <p className="text-xs text-slate-500 mb-4">Transitions contained serials to IN_TRANSIT on Fabric</p>

                        <form onSubmit={handleDispatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Waybill / Tracking Code</label>
                                <input
                                    type="text"
                                    value={dispatchData.shipmentCode}
                                    onChange={(e) => setDispatchData({ ...dispatchData, shipmentCode: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Receiver MSP</label>
                                    <select
                                        value={dispatchData.receiverMspId}
                                        onChange={(e) => setDispatchData({ ...dispatchData, receiverMspId: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    >
                                        <option value="DistributorMSP">DistributorMSP</option>
                                        <option value="PharmacyMSP">PharmacyMSP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                                    <input
                                        type="text"
                                        value={dispatchData.notes}
                                        onChange={(e) => setDispatchData({ ...dispatchData, notes: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Serial Numbers (Comma-separated)</label>
                                <textarea
                                    rows="2"
                                    value={dispatchData.serialNumbers}
                                    onChange={(e) => setDispatchData({ ...dispatchData, serialNumbers: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setDispatchModal(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition disabled:opacity-70"
                                >
                                    {submitting ? 'Dispatching on Fabric...' : 'Dispatch Waybill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

