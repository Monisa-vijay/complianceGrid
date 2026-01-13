import apiClient from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    console.log('🔵 authApi.login called - making POST request to /auth/login/');
    try {
      const response = await apiClient.post('/auth/login/', {
        email,
        password
      });
      console.log('✅ authApi.login response received:', response);
      return response.data;
    } catch (error) {
      console.error('❌ authApi.login error:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout/');
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get('/auth/me/');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; email?: string }): Promise<User> => {
    const response = await apiClient.patch('/auth/update-profile/', data);
    return response.data.user;
  },

  getGoogleAuthUrl: async (): Promise<{ authorization_url: string }> => {
    const response = await apiClient.get('/auth/google/initiate/');
    return response.data;
  },
};

