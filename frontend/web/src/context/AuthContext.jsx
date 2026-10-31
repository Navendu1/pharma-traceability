// ==============================================================================
// AUTHENTICATION CONTEXT & DEMO CREDENTIAL PROVIDER
// File: frontend/web/src/context/AuthContext.jsx
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('pharma_user');
        const storedOrg = localStorage.getItem('pharma_org');
        const token = localStorage.getItem('pharma_access_token');

        if (token && storedUser && storedOrg) {
            setUser(JSON.parse(storedUser));
            setOrganization(JSON.parse(storedOrg));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user: userData, organization: orgData, tokens } = res.data;

        localStorage.setItem('pharma_access_token', tokens.accessToken);
        localStorage.setItem('pharma_user', JSON.stringify(userData));
        localStorage.setItem('pharma_org', JSON.stringify(orgData));

        setUser(userData);
        setOrganization(orgData);
        return { user: userData, organization: orgData };
    };

    const logout = () => {
        localStorage.removeItem('pharma_access_token');
        localStorage.removeItem('pharma_user');
        localStorage.removeItem('pharma_org');
        setUser(null);
        setOrganization(null);
    };

    return (
        <AuthContext.Provider value={{ user, organization, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
