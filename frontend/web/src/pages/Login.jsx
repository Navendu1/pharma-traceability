// ==============================================================================
// AUTHENTICATION LOGIN PAGE (WITH 1-CLICK DEMO ROLE SWITCHER)
// File: frontend/web/src/pages/Login.jsx
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Factory, Truck, Store, Landmark, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = ({ onLoginSuccess, onExplorePublicScanner }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('mfg_admin@apexbiopharma.com');
    const [password, setPassword] = useState('Password@123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const demoAccounts = [
        {
            role: 'Manufacturer',
            org: 'Apex Biopharma Ltd.',
            email: 'mfg_admin@apexbiopharma.com',
            msp: 'ManufacturerMSP',
            icon: Factory,
            badge: 'bg-blue-100 text-blue-800'
        },
        {
            role: 'Distributor',
            org: 'Eastern MedLogistics',
            email: 'dist_admin@easternmed.com',
            msp: 'DistributorMSP',
            icon: Truck,
            badge: 'bg-purple-100 text-purple-800'
        },
        {
            role: 'Pharmacy',
            org: 'MedPlus Care Pharmacy',
            email: 'pharm_admin@medpluscare.com',
            msp: 'PharmacyMSP',
            icon: Store,
            badge: 'bg-emerald-100 text-emerald-800'
        },
        {
            role: 'Regulator (CDSCO)',
            org: 'Govt Drug Inspector',
            email: 'regulator@cdsco.gov.in',
            msp: 'RegulatorMSP',
            icon: Landmark,
            badge: 'bg-amber-100 text-amber-800'
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            onLoginSuccess?.();
        } catch (err) {
            setError(err.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDemo = (accEmail) => {
        setEmail(accEmail);
        setPassword('Password@123');
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Left Form */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-navy tracking-tight">PharmaTrace</h1>
                            <p className="text-xs text-slate-500">IIT Kharagpur Research Prototype</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-1">Stakeholder Portal Sign In</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Sign in to access your supply-chain organization dashboard.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center space-x-2 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Corporate Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition"
                                    placeholder="user@organization.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 px-4 bg-brand-navy text-white rounded-xl font-semibold text-sm hover:bg-blue-900 active:scale-[0.99] transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-70"
                        >
                            <span>{loading ? 'Authenticating with Argon2id...' : 'Sign In to Portal'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={onExplorePublicScanner}
                            className="text-xs font-semibold text-brand-ocean hover:text-brand-navy hover:underline"
                        >
                            Or open Public Consumer Verification Scanner →
                        </button>
                    </div>
                </div>

                {/* Right Side Demo Presets */}
                <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-8 flex flex-col justify-center">
                    <div className="mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-teal bg-emerald-100/60 px-2.5 py-1 rounded-full border border-emerald-200">
                            1-Click Academic Demo Presets
                        </span>
                        <h3 className="text-base font-bold text-slate-800 mt-2">Select a Stakeholder Role</h3>
                        <p className="text-xs text-slate-500">
                            Click any role below to test role-based access control and smart contract permissions:
                        </p>
                    </div>

                    <div className="space-y-2.5">
                        {demoAccounts.map((acc) => {
                            const Icon = acc.icon;
                            const isSelected = email === acc.email;
                            return (
                                <button
                                    key={acc.email}
                                    type="button"
                                    onClick={() => handleSelectDemo(acc.email)}
                                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-white border-brand-navy ring-2 ring-brand-navy/10 shadow-sm'
                                            : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${acc.badge}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{acc.role}</div>
                                            <div className="text-xs text-slate-500">{acc.org}</div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                        {acc.msp}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 text-xs text-slate-400 bg-white p-3 rounded-xl border border-slate-200">
                        Default Demo Password: <span className="font-mono font-bold text-slate-700">Password@123</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
