// ==============================================================================
// SERIAL UNITS & QR CODE DISPLAY PAGE
// File: frontend/web/src/pages/SerialNumbers.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QRCodeModal } from '../components/qr/QRCodeModal';
import { QrCode, Search, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const SerialNumbers = () => {
    const [serials, setSerials] = useState([
        { serialNumber: 'MED-IN-7K4P-92XF-8Q2M', batchNumber: 'B2026-001', status: 'STOCKED', custodian: 'MedPlus Care Pharmacy' },
        { serialNumber: 'MED-IN-8L5Q-03YG-9R3N', batchNumber: 'B2026-001', status: 'SOLD', custodian: 'MedPlus Care Pharmacy' },
        { serialNumber: 'MED-IN-9M6R-14ZH-0S4P', batchNumber: 'B2026-RC03', status: 'RECALLED', custodian: 'Eastern MedLogistics' }
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSerial, setSelectedSerial] = useState(null);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'CREATED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'IN_TRANSIT':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'STOCKED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'SOLD':
                return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'RECALLED':
                return 'bg-red-100 text-red-800 border-red-200 font-bold';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const filtered = serials.filter(s => 
        s.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Unit Serial Numbers & QR Labels</h1>
                    <p className="text-sm text-slate-500">GS1 DataMatrix compatible cryptographically signed pack serials</p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Search serial / batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
                    />
                </div>
            </div>

            {/* Serial Units Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3.5">Serial Identifier</th>
                            <th className="px-6 py-3.5">Batch Number</th>
                            <th className="px-6 py-3.5">Current Custodian</th>
                            <th className="px-6 py-3.5">Lifecycle State</th>
                            <th className="px-6 py-3.5 text-right">Packaging Label</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((s) => (
                            <tr key={s.serialNumber} className="hover:bg-slate-50/80 transition">
                                <td className="px-6 py-4 font-mono font-bold text-brand-navy">
                                    {s.serialNumber}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                                    {s.batchNumber}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-700">
                                    {s.custodian || s.currentCustodian || 'Apex Biopharma Ltd.'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(s.status)}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedSerial(s.serialNumber)}
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-brand-navy transition shadow-sm"
                                    >
                                        <QrCode className="w-4 h-4 text-brand-navy" />
                                        <span>View QR</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* QR Modal View */}
            <QRCodeModal
                serialNumber={selectedSerial}
                isOpen={!!selectedSerial}
                onClose={() => setSelectedSerial(null)}
            />
        </div>
    );
};
