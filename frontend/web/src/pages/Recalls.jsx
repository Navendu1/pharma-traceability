// ==============================================================================
// RECALL COMMAND CENTER
// File: frontend/web/src/pages/Recalls.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export const Recalls = () => {
    const { organization } = useAuth();
    const canRecall = ['MANUFACTURER', 'REGULATOR'].includes(organization?.type);

    const [recalls, setRecalls] = useState([
        {
            batchNumber: 'B2026-RC03',
            reason: 'Suspected dissolution failure and sub-potency detected in accelerated stability testing (Q3-2026).',
            severity: 'CLASS_II_SERIOUS',
            status: 'ACTIVE',
            initiator: 'Apex Biopharma Ltd.'
        }
    ]);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const [formData, setFormData] = useState({
        batchNumber: '',
        reason: '',
        severity: 'CLASS_I_CRITICAL'
    });

    const loadRecalls = async () => {
        try {
            const res = await api.get('/recalls');
            if (res.data?.length > 0) setRecalls(res.data);
        } catch (e) {}
    };

    useEffect(() => {
        loadRecalls();
    }, []);

    const handleCreateRecall = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ text: '', type: '' });

        try {
            await api.post('/recalls', formData);
            setMsg({ text: `Batch recall broadcasted on Fabric! All serials under ${formData.batchNumber} are invalidated.`, type: 'success' });
            setModalOpen(false);
            loadRecalls();
        } catch (err) {
            setMsg({ text: err.message || 'Recall broadcast failed', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Batch Recall Command Center</h1>
                    <p className="text-sm text-slate-500">Immutable recall broadcasts executed on Hyperledger Fabric ledger</p>
                </div>

                {canRecall && (
                    <button
                        onClick={() => setModalOpen(true)}
                        className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center space-x-2 shadow-sm"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Broadcast Batch Recall</span>
                    </button>
                )}
            </div>

            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center space-x-2 text-sm border ${
                    msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <span>{msg.text}</span>
                </div>
            )}

            {/* Recalls List */}
            <div className="space-y-4">
                {recalls.map((r, idx) => (
                    <div key={idx} className="bg-white rounded-xl border-l-4 border-l-red-500 border border-slate-200 p-5 shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold font-mono uppercase bg-red-100 text-red-800 px-2.5 py-0.5 rounded border border-red-200">
                                    {r.severity}
                                </span>
                                <h3 className="text-base font-bold text-slate-900 mt-1">Batch: {r.batchNumber || r.batch_number}</h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white">
                                {r.status}
                            </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">
                            {r.reason}
                        </p>

                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                            Broadcast by: <span className="font-semibold text-slate-700">{r.initiator || r.initiator_name || 'ManufacturerMSP'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recall Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center space-x-2 text-red-600 mb-2">
                            <ShieldAlert className="w-6 h-6" />
                            <h3 className="text-lg font-bold">Initiate Official Batch Recall</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            Submits an immutable recall notice to the Fabric blockchain. All downstream scans will immediately flag this product.
                        </p>

                        <form onSubmit={handleCreateRecall} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. B2026-001"
                                    value={formData.batchNumber}
                                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Severity Classification</label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="CLASS_I_CRITICAL">Class I: Critical (Life-threatening defect)</option>
                                    <option value="CLASS_II_SERIOUS">Class II: Serious (Temporary health hazard)</option>
                                    <option value="CLASS_III_MINOR">Class III: Minor (Packaging/label error)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Recall Reason & Regulatory Justification</label>
                                <textarea
                                    rows="3"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    placeholder="Detail stability failure, lab analysis, or defect..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-70"
                                >
                                    {submitting ? 'Broadcasting...' : 'Broadcast Recall on Fabric'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
