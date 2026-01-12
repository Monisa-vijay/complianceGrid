import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Enable session-based authentication
});

// Track if CSRF token fetch is in progress to avoid multiple simultaneous requests
let csrfTokenFetching = false;
let csrfTokenPromise: Promise<void> | null = null;

// Get CSRF token from Django cookie
const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken' || name === 'csrf_token') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Fetch CSRF token from server if needed
const fetchCsrfToken = async (): Promise<string | null> => {
  if (csrfTokenFetching && csrfTokenPromise) {
    await csrfTokenPromise;
    return getCsrfToken();
  }
  
  csrfTokenFetching = true;
  csrfTokenPromise = axios.get('/api/auth/csrf/', {
    withCredentials: true,
  }).then(() => {
    csrfTokenFetching = false;
    csrfTokenPromise = null;
  }).catch((error) => {
    csrfTokenFetching = false;
    csrfTokenPromise = null;
    console.error('Failed to fetch CSRF token:', error);
  });
  
  await csrfTokenPromise;
  return getCsrfToken();
};

// Request interceptor for adding CSRF token
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🌐 Request interceptor - URL:', config.url, 'Method:', config.method);
    console.log('🌐 Request interceptor - Full config:', config);
    
    // Only add CSRF token for state-changing methods (except login and csrf endpoints)
    const isStateChanging = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '');
    const isLogin = config.url?.includes('/auth/login/');
    const isCsrfEndpoint = config.url?.includes('/auth/csrf/');
    
    if (isStateChanging && !isLogin && !isCsrfEndpoint) {
      let csrfToken = getCsrfToken();
      
      // Only fetch if we don't have a token (avoid endless requests)
      if (!csrfToken && !csrfTokenFetching) {
        csrfToken = await fetchCsrfToken();
      }
      
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    console.log('🌐 Request interceptor - Returning config, request will be sent');
    return config;
  },
  (error) => {
    console.error('🌐 Request interceptor - Error:', error);
    return Promise.reject(error);
  }
);

// Track retry attempts to prevent infinite loops
const retryAttempts = new WeakMap();

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('🌐 Response interceptor - Success:', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error) => {
    console.error('🌐 Response interceptor - Error:', error.config?.url, 'Status:', error.response?.status);
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    } else if (error.response?.status === 403) {
      // CSRF error - try to get a fresh token and retry (only once)
      const originalRequest = error.config;
      const retryCount = retryAttempts.get(originalRequest) || 0;
      
      // Only retry once to prevent infinite loops
      // Only retry if it's actually a CSRF error (not just any 403)
      if (retryCount < 1 && originalRequest && !originalRequest.url?.includes('/auth/login/')) {
        const csrfError = error.response?.data?.detail || error.response?.data?.error || '';
        const isCsrfError = csrfError.toLowerCase().includes('csrf') || 
                           csrfError.toLowerCase().includes('origin checking failed');
        
        if (isCsrfError) {
          console.warn('CSRF error detected, fetching new token...');
          try {
            // Fetch new CSRF token
            const csrfToken = await fetchCsrfToken();
            if (csrfToken) {
              retryAttempts.set(originalRequest, retryCount + 1);
              originalRequest.headers['X-CSRFToken'] = csrfToken;
              return apiClient(originalRequest);
            }
          } catch (csrfError) {
            console.error('Failed to refresh CSRF token:', csrfError);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

