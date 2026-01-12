import apiClient from './client';

export const googleDriveApi = {
  initiateAuth: async (): Promise<{ authorization_url: string }> => {
    const response = await apiClient.get('/upload/auth/');
    return response.data;
  },

  handleCallback: async (): Promise<{ status: string; message: string }> => {
    const response = await apiClient.get('/upload/auth/callback/');
    return response.data;
  },
};



