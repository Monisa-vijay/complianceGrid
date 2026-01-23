import apiClient from './client';
import { Submission } from './categories';

export interface DashboardStats {
  total_categories: number;
  pending_submissions: number;
  overdue_submissions: number;
  approved_this_month: number;
  // Gap Analysis
  controls_without_evidence: number;
  controls_without_assignee: number;
  controls_without_approver: number;
  controls_with_overdue: number;
  controls_with_low_compliance: number;
  controls_pending_approval: number;
  upcoming_deadlines: Submission[];
}

export const submissionsApi = {
  getAll: async (params?: {
    category?: number;
    status?: string;
  }): Promise<Submission[]> => {
    const response = await apiClient.get('/submissions/', { params });
    // Handle paginated response
    if (response.data.results) {
      return response.data.results;
    }
    return response.data;
  },

  getById: async (id: number): Promise<Submission> => {
    const response = await apiClient.get(`/submissions/${id}/`);
    return response.data;
  },

  submit: async (
    id: number,
    files: File[],
    notes?: string,
    dueDate?: string
  ): Promise<Submission> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (notes) {
      formData.append('notes', notes);
    }
    if (dueDate) {
      formData.append('due_date', dueDate);
    }

    const response = await apiClient.post(`/submissions/${id}/submit/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  approve: async (id: number, reviewNotes?: string): Promise<Submission & {
    upload_status?: string;
    upload_warning?: string;
    upload_errors?: string[];
  }> => {
    const response = await apiClient.post(`/submissions/${id}/approve/`, {
      review_notes: reviewNotes,
    });
    return response.data;
  },

  reject: async (id: number, reviewNotes: string): Promise<Submission> => {
    const response = await apiClient.post(`/submissions/${id}/reject/`, {
      review_notes: reviewNotes,
    });
    return response.data;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/submissions/dashboard/');
    return response.data;
  },

  getAnalytics: async (params?: { my_assignments?: boolean }): Promise<any> => {
    const response = await apiClient.get('/submissions/analytics/', { params });
    return response.data;
  },

  // File-level approval/rejection
  approveFile: async (fileId: number, reviewNotes?: string): Promise<any & {
    upload_status?: string;
    upload_warning?: string;
    upload_errors?: string[];
  }> => {
    const response = await apiClient.post(`/files/${fileId}/approve/`, {
      review_notes: reviewNotes,
    });
    return response.data;
  },

  rejectFile: async (fileId: number, reviewNotes: string): Promise<any> => {
    const response = await apiClient.post(`/files/${fileId}/reject/`, {
      review_notes: reviewNotes,
    });
    return response.data;
  },
};

