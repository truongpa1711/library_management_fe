// Authentication utility functions
export const auth = {
  // Store tokens and role
  setTokens: (accessToken, refreshToken, role = null) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (role) {
      localStorage.setItem('userRole', role);
    }
  },

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  // Get user role
  getUserRole: () => {
    return localStorage.getItem('userRole');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Check if user is admin
  isAdmin: () => {
    const role = localStorage.getItem('userRole');
    return role === 'ADMIN';
  },

  // Check if user is regular user
  isUser: () => {
    const role = localStorage.getItem('userRole');
    return role === 'USER';
  },

  // Clear all tokens (logout)
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  },

  // Store user email
  setUserEmail: (email) => {
    localStorage.setItem('userEmail', email);
  },

  // Get user email
  getUserEmail: () => {
    return localStorage.getItem('userEmail');
  }
};

// API utility with automatic token handling
export const apiCall = async (url, options = {}) => {
  const token = auth.getAccessToken();
  
  console.log('API Call - URL:', url);
  console.log('API Call - Token exists:', !!token);
  console.log('API Call - Token value:', token ? token.substring(0, 20) + '...' : 'null');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  console.log('API Call - Authorization header:', config.headers.Authorization ? 'Present' : 'Missing');
  console.log('API Call - Full headers:', config.headers);

  try {
    const response = await fetch(url, config);
    
    console.log('API Call - Response status:', response.status);
    console.log('API Call - Response ok:', response.ok);
    
    // If unauthorized, clear tokens and redirect to login
    if (response.status === 401) {
      auth.clearTokens();
      window.location.href = '/login';
      return null;
    }

    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
