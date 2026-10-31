// ==============================================================================
// ROLE-AWARE SIDEBAR NAVIGATION
// File: frontend/web/src/components/common/Sidebar.jsx
// ==============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    LayoutDashboard, 
    Pill, 
    Layers, 
    Barcode, 
    Truck, 
    ShieldAlert, 
    History, 
    FileText 
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
    const { organization } = useAuth();
    const orgType = organization?.type;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'REGULATOR', 'ADMIN'] },
        { id: 'products', label: 'Drug Catalog', icon: Pill, roles: ['MANUFACTURER', 'REGULATOR', 'ADMIN'] },
        { id: 'batches', label: 'Batch Releases', icon: Layers, roles: ['MANUFACTURER', 'REGULATOR', 'ADMIN'] },
        { id: 'serials', label: 'Unit Serials & QR', icon: Barcode, roles: ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'ADMIN'] },
        { id: 'shipments', label: 'Shipments & Custody', icon: Truck, roles: ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'ADMIN'] },
        { id: 'recalls', label: 'Recall Center', icon: ShieldAlert, roles: ['MANUFACTURER', 'REGULATOR', 'ADMIN'] },
        { id: 'verification', label: 'Verify Serial / Scan', icon: History, roles: ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'REGULATOR', 'ADMIN'] }
    ];

    const filteredItems = navItems.filter(item => !orgType || item.roles.includes(orgType));

    return (
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-400 px-3 mb-2 tracking-wider">
                Supply Chain Portal
            </div>

            <nav className="space-y-1 flex-1">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                isActive
                                    ? 'bg-brand-navy text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                <div className="font-semibold text-slate-700 mb-1">Hyperledger Fabric v2.5</div>
                <div>MSP: <span className="font-mono text-brand-ocean font-bold">{organization?.mspId || 'Public'}</span></div>
                <div>Channel: <span className="font-mono text-slate-700">pharmachannel</span></div>
            </div>
        </aside>
    );
};

