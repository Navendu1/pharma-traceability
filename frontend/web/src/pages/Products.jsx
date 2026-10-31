// ==============================================================================
// DRUG CATALOG MANAGEMENT PAGE
// File: frontend/web/src/pages/Products.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Pill, Plus, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export const Products = () => {
    const { organization } = useAuth();
    const isManufacturer = organization?.type === 'MANUFACTURER';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const [formData, setFormData] = useState({
        gtin: '089012345678' + Math.floor(10 + Math.random() * 89),
        brandName: '',
        genericName: '',
        dosageForm: 'Tablet',
        strength: '500 mg',
        storageConditions: 'Store below 25°C in a dry place',
        description: ''
    });

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            setProducts(res.data || []);
        } catch (e) {
            console.error('Error fetching products:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMsg({ text: '', type: '' });

        try {
            await api.post('/products', formData);
            setMsg({ text: 'Product registered on Hyperledger Fabric ledger!', type: 'success' });
            setModalOpen(false);
            loadProducts();
        } catch (err) {
            setMsg({ text: err.message || 'Product registration failed', type: 'error' });
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Drug Product Catalog</h1>
                    <p className="text-sm text-slate-500">Master pharmaceutical definitions registered on blockchain</p>
                </div>

                {isManufacturer && (
                    <button
                        onClick={() => setModalOpen(true)}
                        className="py-2.5 px-4 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-blue-900 transition flex items-center space-x-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Register New Drug</span>
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

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3.5">Brand & Generic Name</th>
                            <th className="px-6 py-3.5">GTIN (GS1 14-Digit)</th>
                            <th className="px-6 py-3.5">Form / Strength</th>
                            <th className="px-6 py-3.5">Storage</th>
                            <th className="px-6 py-3.5">Ledger Proof</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map((p) => (
                            <tr key={p.gtin} className="hover:bg-slate-50/80 transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{p.brandName || p.brand_name}</div>
                                    <div className="text-xs text-slate-500">{p.genericName || p.generic_name}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                                    {p.gtin}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                                    {p.dosageForm || p.dosage_form} • {p.strength}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                    {p.storageConditions || p.storage_conditions || 'Store below 25°C'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                        <span>COMMITTED</span>
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Product Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Register New Pharmaceutical Drug</h3>
                        <p className="text-xs text-slate-500 mb-4">Submits master catalog to Hyperledger Fabric channel</p>

                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GTIN (14 Digits)</label>
                                <input
                                    type="text"
                                    value={formData.gtin}
                                    onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Brand Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Paracip-500"
                                        value={formData.brandName}
                                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Generic Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Paracetamol IP"
                                        value={formData.genericName}
                                        onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dosage Form</label>
                                    <select
                                        value={formData.dosageForm}
                                        onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    >
                                        <option>Tablet</option>
                                        <option>Capsule</option>
                                        <option>Syrup</option>
                                        <option>Injectable</option>
                                        <option>Ointment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Strength</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 500 mg"
                                        value={formData.strength}
                                        onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
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
                                    disabled={formLoading}
                                    className="px-5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition disabled:opacity-70"
                                >
                                    {formLoading ? 'Submitting to Blockchain...' : 'Commit to Fabric'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

