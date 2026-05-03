/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — api.js
   Centralized API Client
═══════════════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://localhost:8000/api/v1';

const API = {
  getToken: () => localStorage.getItem('ibit_tas_token'),
  setToken: (token) => localStorage.setItem('ibit_tas_token', token),
  clearToken: () => localStorage.removeItem('ibit_tas_token'),

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
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
      const response = await fetch(url, config);

      let data;
      try {
        data = await response.json();
      } catch (err) {
        data = null;
      }

      if (!response.ok) {
        /* FastAPI HTTPException puts error info in 'detail' */
        let errorMsg = `HTTP error ${response.status}`;
        if (data) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (data.detail && typeof data.detail === 'object' && data.detail.message) {
            errorMsg = data.detail.message;
          } else if (data.message) {
            errorMsg = data.message;
          }
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error(`API unreachable: ${url}`);
        throw new Error('Cannot reach the server. Make sure the backend is running on http://localhost:8000');
      }
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  },

  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body, ...options });
  },

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PUT', body, ...options });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  },

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PATCH', body, ...options });
  }
};

window.API = API;
