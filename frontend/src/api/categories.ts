import apiClient from './client';

export interface Category {
  id: number;
  name: string;
  description: string;
  evidence_requirements: string;
  review_period: string;
  category_group: string;
  google_drive_folder_id: string;
  assigned_reviewers: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  primary_assignee?: {
    id: number;
    username: string;
    email: string;
  };
  assignee?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  approver?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  created_by: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  current_submission?: Submission;
  compliance_score?: number;
}

export interface CategoryGroup {
  code: string;
  label: string;
  count: number;
  compliance_score?: number;
  pending_evidence_count?: number;
}

export interface Submission {
  id: number;
  category: number;
  category_name: string;
  period_start_date: string;
  period_end_date: string;
  due_date: string;
  status: string;
  submitted_by?: {
    id: number;
    username: string;
  };
  submitted_at?: string;
  reviewed_by?: {
    id: number;
    username: string;
  };
  reviewed_at?: string;
  submission_notes: string;
  review_notes: string;
  files: Array<{
    id: number;
    filename: string;
    file_url?: string;
    google_drive_file_id?: string;
    google_drive_file_url?: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }>;
  comments: Array<{
    id: number;
    user: {
      id: number;
      username: string;
    };
    comment: string;
    created_at: string;
  }>;
  is_overdue: boolean;
  days_until_due: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryDetail extends Category {
  past_submissions: Submission[];
}

export const categoriesApi = {
  getAll: async (
    activeOnly: boolean = false,
    search: string = '',
    reviewPeriod: string = '',
    status: string = '',
    page: number = 1,
    pageSize: number = 20,
    showHidden: boolean = false,
    categoryGroup: string = ''
  ): Promise<{ results: Category[]; count: number; next: string | null; previous: string | null }> => {
    const params: any = {};
    if (showHidden) {
      params.show_hidden = 'true';
    } else {
      params.active_only = activeOnly;
    }
    if (search) params.search = search;
    if (reviewPeriod) params.review_period = reviewPeriod;
    if (status) params.status = status;
    if (categoryGroup) params.category_group = categoryGroup;
    params.page = page;
    params.page_size = pageSize === 10000 ? 10000 : pageSize; // "All" = 10000
    
    const response = await apiClient.get('/categories/', { params });
    
    // Handle paginated response
    if (response.data.results) {
      return {
        results: response.data.results,
        count: response.data.count || response.data.results.length,
        next: response.data.next,
        previous: response.data.previous,
      };
    }
    // Non-paginated response
    return {
      results: Array.isArray(response.data) ? response.data : [],
      count: Array.isArray(response.data) ? response.data.length : 0,
      next: null,
      previous: null,
    };
  },

  getById: async (id: number): Promise<CategoryDetail> => {
    const response = await apiClient.get(`/categories/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/categories/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}/`);
  },

  hide: async (id: number): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}/`, { is_active: false });
    return response.data;
  },

  unhide: async (id: number): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}/`, { is_active: true });
    return response.data;
  },

  getSubmissions: async (id: number): Promise<Submission[]> => {
    const response = await apiClient.get(`/categories/${id}/submissions/`);
    return response.data;
  },

  getGroups: async (showHidden: boolean = false): Promise<CategoryGroup[]> => {
    const response = await apiClient.get('/categories/groups/', {
      params: { show_hidden: showHidden },
    });
    return response.data;
  },

  getUsers: async (): Promise<Array<{ id: number; username: string; email: string; first_name: string; last_name: string }>> => {
    const response = await apiClient.get('/categories/users/');
    return response.data;
  },

  exportGroups: async (format: 'pdf' | 'excel', showHidden: boolean = false): Promise<Blob> => {
    const params: any = {
      format: format,
    };
    if (showHidden) {
      params.show_hidden = 'true';
    }
    
    try {
      const response = await apiClient.get('/categories/export/', {
        params,
        responseType: 'blob',
      });
      
      // Check content type to ensure it's not a JSON error
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        // Parse the blob as text to get error message
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(response.data);
        });
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Failed to export data');
      }
      
      return response.data;
    } catch (error: any) {
      // Handle axios errors
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(error.response.data);
          });
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to export data');
        } catch {
          throw new Error('Failed to export data');
        }
      }
      throw error;
    }
  },
};

