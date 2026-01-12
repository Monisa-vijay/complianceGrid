import apiClient from './client';

export interface Document {
  id: number;
  filename: string;
  file_url?: string;
  google_drive_file_id?: string;
  google_drive_file_url?: string;
  file_size: number;
  mime_type: string;
  uploaded_by: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  uploaded_at: string;
  category_name: string;
  submission_id: number;
}

export interface GroupedDocument {
  date: string;
  users: Array<{
    user: {
      id: number | null;
      username: string;
      email: string | null;
    };
    files: Document[];
  }>;
}

export const documentsApi = {
  getAll: async (
    uploadedBy?: number,
    dateFrom?: string,
    dateTo?: string,
    category?: number
  ): Promise<Document[]> => {
    const params: any = {};
    if (uploadedBy) params.uploaded_by = uploadedBy;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (category) params.category = category;
    
    const response = await apiClient.get('/files/', { params });
    return response.data.results || response.data;
  },

  getGrouped: async (
    uploadedBy?: number,
    dateFrom?: string,
    dateTo?: string,
    category?: number
  ): Promise<GroupedDocument[]> => {
    const params: any = {};
    if (uploadedBy) params.uploaded_by = uploadedBy;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (category) params.category = category;
    
    const response = await apiClient.get('/files/grouped/', { params });
    return response.data;
  },

  getAllUsers: async (): Promise<Array<{ id: number; username: string; email: string }>> => {
    const response = await apiClient.get('/files/');
    const files: Document[] = response.data.results || response.data;
    const userMap = new Map();
    files.forEach(file => {
      if (file.uploaded_by) {
        userMap.set(file.uploaded_by.id, file.uploaded_by);
      }
    });
    return Array.from(userMap.values());
  },
};

