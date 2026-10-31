// ==============================================================================
// FRONTEND HTTP API CLIENT
// File: frontend/web/src/services/api.js
// ==============================================================================

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('pharma_access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.error?.message || data.message || 'API request failed');
            error.code = data.error?.code || 'API_ERROR';
            error.status = response.status;
            throw error;
        }

        return data;
    } catch (err) {
        console.error(`[API Error] ${endpoint}:`, err.message);
        throw err;
    }
}

export const api = {
    get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
    post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
    put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
    delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};

