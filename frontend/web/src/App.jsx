// ==============================================================================
// ROOT APPLICATION COMPONENT
// File: frontend/web/src/App.jsx
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Batches } from './pages/Batches';
import { SerialNumbers } from './pages/SerialNumbers';
import { Shipments } from './pages/Shipments';
import { Verification } from './pages/Verification';
import { Recalls } from './pages/Recalls';

export default function App() {
    const { isAuthenticated, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [initialScanSerial, setInitialScanSerial] = useState(null);

    // Deep-linking / direct QR code scan URL support: /verify/:serialNumber
    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/verify/')) {
            const serialFromUrl = decodeURIComponent(path.replace('/verify/', ''));
            if (serialFromUrl) {
                setInitialScanSerial(serialFromUrl);
                setActiveTab('verification');
            }
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-semibold">
                Initializing PharmaTrace Portal...
            </div>
        );
    }

    // Public Consumer Scanner View (when unauthenticated and clicked)
    if (!isAuthenticated && activeTab === 'verification') {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-4">
                        <button
                            onClick={() => setActiveTab('login')}
                            className="text-xs font-semibold text-brand-ocean hover:underline"
                        >
                            ← Back to Stakeholder Login
                        </button>
                    </div>
                    <Verification initialSerial={initialScanSerial} />
                </main>
            </div>
        );
    }

    // If not authenticated, show Login screen
    if (!isAuthenticated) {
        return (
            <Login
                onLoginSuccess={() => setActiveTab('dashboard')}
                onExplorePublicScanner={() => setActiveTab('verification')}
            />
        );
    }

    // Authenticated Portal Layout
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 flex max-w-7xl w-full mx-auto">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
                    {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
                    {activeTab === 'products' && <Products />}
                    {activeTab === 'batches' && <Batches setActiveTab={setActiveTab} />}
                    {activeTab === 'serials' && <SerialNumbers />}
                    {activeTab === 'shipments' && <Shipments />}
                    {activeTab === 'recalls' && <Recalls />}
                    {activeTab === 'verification' && <Verification initialSerial={initialScanSerial} />}
                </main>
            </div>
        </div>
    );
}
