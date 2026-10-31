// ==============================================================================
// QR CODE & PACKAGING MODAL
// File: frontend/web/src/components/qr/QRCodeModal.jsx
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export const QRCodeModal = ({ serialNumber, isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !serialNumber) return;
        setLoading(true);

        api.get(`/products/serials/${encodeURIComponent(serialNumber)}/qr`)
            .then(res => {
                setQrData(res.data);
            })
            .catch(() => {
                // Fallback direct URL construction
                setQrData({
                    serialNumber,
                    verificationUrl: `http://localhost:5173/verify/${encodeURIComponent(serialNumber)}`
                });
            })
            .finally(() => setLoading(false));
    }, [isOpen, serialNumber]);

    if (!isOpen || !serialNumber) return null;

    const handleCopy = () => {
        if (!qrData?.verificationUrl) return;
        navigator.clipboard.writeText(qrData.verificationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-brand-navy">Pharmaceutical Pack Label</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center py-6">
                    <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-inner mb-4">
                        {loading ? (
                            <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-sm">
                                Generating QR...
                            </div>
                        ) : qrData?.qrDataUrl ? (
                            <img src={qrData.qrDataUrl} alt="QR Code" className="w-52 h-52" />
                        ) : (
                            <QRCodeSVG
                                value={qrData?.verificationUrl || serialNumber}
                                size={208}
                                level="H"
                                fgColor="#1B365D"
                                includeMargin
                            />
                        )}
                    </div>

                    <div className="font-mono text-sm font-bold text-slate-800 tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 mb-1">
                        {serialNumber}
                    </div>
                    <span className="text-xs text-slate-500">GS1-Compatible Cryptographic Unit Serial</span>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 truncate">
                        <span className="font-semibold text-slate-700">URL:</span>
                        <span className="truncate flex-1 font-mono">{qrData?.verificationUrl}</span>
                        <button onClick={handleCopy} className="p-1 text-slate-500 hover:text-brand-navy">
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center space-x-2 py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Label</span>
                        </button>
                        <a
                            href={qrData?.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 py-2 px-4 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition shadow"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Test Scan</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

