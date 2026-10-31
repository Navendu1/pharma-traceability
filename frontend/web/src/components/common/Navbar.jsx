// ==============================================================================
// TOP NAVIGATION BAR
// File: frontend/web/src/components/common/Navbar.jsx
// ==============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, User, Building, QrCode } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
    const { user, organization, logout } = useAuth();

    const getOrgBadgeColor = (type) => {
        switch (type) {
            case 'MANUFACTURER': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DISTRIBUTOR': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'PHARMACY': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'REGULATOR': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Brand Logo & Academic Badge */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                        <div className="w-10 h-10 rounded-lg bg-brand-navy flex items-center justify-center text-white shadow-md">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-brand-navy tracking-tight">PharmaTrace</span>
                            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                                IIT Kharagpur
                            </span>
                        </div>
                    </div>

                    {/* Verification Search Pill */}
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                            activeTab === 'verification'
                                ? 'bg-brand-navy text-white border-brand-navy'
                                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                    >
                        <QrCode className="w-4 h-4" />
                        <span className="hidden md:inline">Public Verification Scanner</span>
                    </button>

                    {/* User & Org Details */}
                    {user && (
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-sm font-semibold text-slate-800">{user.fullName}</span>
                                <div className="flex items-center justify-end space-x-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getOrgBadgeColor(organization?.type)}`}>
                                        {organization?.name}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={logout}
                                title="Sign Out"
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
