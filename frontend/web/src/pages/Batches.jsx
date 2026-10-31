// ==============================================================================
// BATCH RELEASES & PROOF RECORDING PAGE
// File: frontend/web/src/pages/Batches.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Layers, Plus, CheckCircle2, AlertCircle, Barcode, ShieldAlert } from 'lucide-react';

export const Batches = ({ setActiveTab }) => {
    const { organization } = useAuth();
    const isManufacturer = organization?.type === 'MANUFACTURER';

    const [batches, setBatches] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [serialModal, setSerialModal] = useState(null);
    const [serialCount, setSerialCount] = useState(10);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const [formData, setFormData] = useState({
        gtin: '',
        batchNumber: 'B2026-B' + Math.floor(100 + Math.random() * 899),
        manufacturingDate: '2026-08-01',
        expiryDate: '2028-07-31',
        quantity: 1000
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [bRes, pRes] = await Promise.all([
                api.get('/products/batches'),
                api.get('/products')
            ]);
            setBatches(bRes.data || []);
            setProducts(pRes.data || []);
            if (pRes.data?.length > 0 && !formData.gtin) {
                setFormData(prev => ({ ...prev, gtin: pRes.data[0].gtin }));
            }
        } catch (e) {
            console.error('Error loading batches', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ text: '', type: '' });

        try {
            await api.post('/products/batches', {
                ...formData,
                quantity: parseInt(formData.quantity, 10)
            });
            setMsg({ text: `Batch ${formData.batchNumber} committed to blockchain with canonical SHA-256 proof hash!`, type: 'success' });
            setCreateModal(false);
            loadData();
        } catch (err) {
            setMsg({ text: err.message || 'Batch registration failed', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateSerials = async (batchNumber) => {
        setSubmitting(true);
        try {
            const res = await api.post('/products/serials/generate', {
                batchNumber,
                count: parseInt(serialCount, 10)
            });
            setMsg({ text: `Successfully generated ${res.data.totalGenerated} serials on blockchain!`, type: 'success' });
            setSerialModal(null);
            setActiveTab('serials');
        } catch (err) {
            setMsg({ text: err.message || 'Serial generation failed', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Batch Releases & Ledger Proofs</h1>
                    <p className="text-sm text-slate-500">Cryptographically anchored production lots with tamper-evident proof hashes</p>
                </div>

                {isManufacturer && (
                    <button
                        onClick={() => setCreateModal(true)}
                        className="py-2.5 px-4 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-blue-900 transition flex items-center space-x-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Release New Batch</span>
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

            {/* Batches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {batches.map((b) => {
                    const batchNo = b.batchNumber || b.batch_number;
                    const isRecalled = b.isRecalled || b.is_recalled;
                    const proofHash = b.proofHash || b.proof_hash;
                    return (
                        <div key={batchNo} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs uppercase font-bold text-slate-400">Batch Number</div>
                                    <div className="text-lg font-mono font-bold text-brand-navy">{batchNo}</div>
                                </div>
                                {isRecalled ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center">
                                        <ShieldAlert className="w-3.5 h-3.5 mr-1" /> RECALLED
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        COMMITTED
                                    </span>
                                )}
                            </div>

                            <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div><span className="font-semibold text-slate-700">GTIN:</span> {b.gtin}</div>
                                <div><span className="font-semibold text-slate-700">Mfg Date:</span> {b.manufacturingDate || b.manufacturing_date}</div>
                                <div><span className="font-semibold text-slate-700">Expiry Date:</span> {b.expiryDate || b.expiry_date}</div>
                                <div><span className="font-semibold text-slate-700">Batch Quantity:</span> {b.quantity} packs</div>
                            </div>

                            <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">On-Chain Canonical Proof Hash</div>
                                <div className="text-[11px] font-mono text-slate-600 bg-slate-100 p-2 rounded truncate border border-slate-200 mt-0.5" title={proofHash}>
                                    {proofHash}
                                </div>
                            </div>

                            {isManufacturer && !isRecalled && (
                                <button
                                    onClick={() => setSerialModal(batchNo)}
                                    className="w-full py-2 px-3 border border-brand-navy/30 text-brand-navy hover:bg-brand-navy hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
                                >
                                    <Barcode className="w-4 h-4" />
                                    <span>Generate Serial Units</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create Batch Modal */}
            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Release Production Batch</h3>
                        <p className="text-xs text-slate-500 mb-4">Calculates deterministic SHA-256 proof and submits to Fabric</p>

                        <form onSubmit={handleCreateBatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Drug Product</label>
                                <select
                                    value={formData.gtin}
                                    onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                >
                                    {products.map(p => (
                                        <option key={p.gtin} value={p.gtin}>
                                            {p.brandName || p.brand_name} (GTIN: {p.gtin})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    value={formData.batchNumber}
                                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mfg Date</label>
                                    <input
                                        type="date"
                                        value={formData.manufacturingDate}
                                        onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity (Units)</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    min="1"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCreateModal(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition disabled:opacity-70"
                                >
                                    {submitting ? 'Submitting...' : 'Anchor Batch Proof'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Serial Generation Modal */}
            {serialModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Generate Serial Identifiers</h3>
                        <p className="text-xs text-slate-500 mb-4">Batch: <span className="font-mono font-bold text-brand-navy">{serialModal}</span></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Number of Serials</label>
                                <select
                                    value={serialCount}
                                    onChange={(e) => setSerialCount(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                >
                                    <option value="5">5 Units (Fast Test)</option>
                                    <option value="10">10 Units</option>
                                    <option value="25">25 Units</option>
                                    <option value="50">50 Units</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSerialModal(null)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleGenerateSerials(serialModal)}
                                    disabled={submitting}
                                    className="px-5 py-2 bg-brand-teal text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition disabled:opacity-70"
                                >
                                    {submitting ? 'Serializing...' : 'Generate & Commit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
