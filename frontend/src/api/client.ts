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
    // Remove Content-Type header for GET requests (especially for blob responses)
    if (config.method?.toLowerCase() === 'get' && config.responseType === 'blob') {
      delete config.headers['Content-Type'];
    }
    
    // Only add CSRF token for state-changing methods (except login and csrf endpoints)
    const isStateChanging = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '');
    const isLogin = config.url?.includes('/auth/login/');
    const isCsrfEndpoint = config.url?.includes('/auth/csrf/');
    
    if (isStateChanging && !isLogin && !isCsrfEndpoint) {
      // Always try to get token from cookie first
      let csrfToken = getCsrfToken();
      
      // If no token, fetch one
      if (!csrfToken && !csrfTokenFetching) {
        csrfToken = await fetchCsrfToken();
      }
      
      // Set the token in the header (Axios will handle the header name case)
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        console.warn('⚠️ No CSRF token available for request:', config.url);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('🌐 Request interceptor - Error:', error);
    return Promise.reject(error);
  }
);

// Track retry attempts to prevent infinite loops
// Use a Map with string keys since WeakMap might not work reliably with request configs
const retryAttempts = new Map<string, number>();

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
      
      if (!originalRequest) {
        return Promise.reject(error);
      }
      
      // Check if this request has already been retried using a string key
      const requestKey = `${originalRequest.method}_${originalRequest.url}`;
      const retryCount = retryAttempts.get(requestKey) || 0;
      
      // Only retry once to prevent infinite loops
      // Only retry if it's actually a CSRF error (not just any 403)
      if (retryCount < 1 && !originalRequest.url?.includes('/auth/login/')) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || '';
        const errorText = errorMessage.toLowerCase();
        
        // Only retry if it's definitely a CSRF error
        // Django CSRF errors typically mention "CSRF" or "origin checking failed"
        const isDefinitelyCsrfError = errorText.includes('csrf') || 
                                      errorText.includes('origin checking failed') ||
                                      errorText.includes('csrf token missing') ||
                                      errorText.includes('csrf verification failed');
        
        if (isDefinitelyCsrfError) {
          console.warn('CSRF error detected, fetching new token and retrying once...');
          try {
            // Mark this request as retried BEFORE making the retry
            retryAttempts.set(requestKey, retryCount + 1);
            
            // Fetch new CSRF token
            const csrfToken = await fetchCsrfToken();
            if (csrfToken) {
              originalRequest.headers['X-CSRFToken'] = csrfToken;
              return apiClient(originalRequest);
            } else {
              // Remove the retry mark if we couldn't get a token
              retryAttempts.delete(requestKey);
            }
          } catch (csrfError) {
            console.error('Failed to refresh CSRF token:', csrfError);
            // Remove the retry mark on error
            retryAttempts.delete(requestKey);
          }
        } else {
          // Not a CSRF error - don't retry, just reject
          console.warn('403 error but not a CSRF error, not retrying. Error:', errorMessage);
        }
      } else {
        // Already retried or not eligible for retry
        if (retryCount >= 1) {
          console.warn('Request already retried once, not retrying again');
          // Clean up the retry tracking after a delay
          setTimeout(() => retryAttempts.delete(requestKey), 5000);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

