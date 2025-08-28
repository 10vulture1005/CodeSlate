const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication
  async signin(email, password) {
    const data = await this.request('/users/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async signup(email, password) {
    const data = await this.request('/users/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  // Call History
  async getCallHistory(userId) {
    return this.request(`/call-history/${userId}`);
  }

  async createCallRecord(callData) {
    return this.request('/call-history', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async getAllCallHistory(page = 1, limit = 20, callType = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (callType) {
      params.append('callType', callType);
    }
    
    return this.request(`/call-history?${params.toString()}`);
  }

  // Utility
  logout() {
    this.setToken(null);
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiService();
