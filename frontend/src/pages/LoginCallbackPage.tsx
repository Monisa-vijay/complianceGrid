import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export const LoginCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false); // Prevent duplicate calls

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      // Mark as processing to prevent duplicate calls
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google authentication failed');
        navigate('/groups');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/groups');
        return;
      }

      try {
        // Exchange code for token via backend
        // Note: The callback endpoint is CSRF-exempt
        const response = await apiClient.post('/auth/google/callback/', { code });

        const data = response.data;
        
        // Update user in localStorage if provided
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Mark Google Drive as authenticated
        localStorage.setItem('google_drive_authenticated', 'true');
        
        // Note: access_token is stored in session on backend, not needed in localStorage
        toast.success(data.message || 'Google Drive authentication successful!');
        
        // Small delay to ensure cookies are set before redirecting
        setTimeout(() => {
          const redirect = sessionStorage.getItem('oauth_redirect') || '/groups';
          sessionStorage.removeItem('oauth_redirect');
          navigate(redirect);
        }, 100);
      } catch (error: any) {
        console.error('Callback error:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to complete authentication';
        toast.error(errorMessage);
        navigate('/groups');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-gray-500">Completing authentication...</div>
    </div>
  );
};



