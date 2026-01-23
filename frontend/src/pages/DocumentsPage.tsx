import React, { useEffect, useState } from 'react';
import { File, Calendar, User, Filter, X, Eye } from 'lucide-react';
import { documentsApi, GroupedDocument } from '../api/documents';
import { categoriesApi, Category } from '../api/categories';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const DocumentsPage: React.FC = () => {
  const [groupedDocuments, setGroupedDocuments] = useState<GroupedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [uploadedByFilter, setUploadedByFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [allUsers, setAllUsers] = useState<Array<{ id: number; username: string; email: string }>>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
    fetchCategories();
  }, [dateFrom, dateTo, uploadedByFilter, categoryFilter]);

  const fetchUsers = async () => {
    try {
      const users = await documentsApi.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(false);
      setAllCategories(response.results || response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getGrouped(
        uploadedByFilter ? parseInt(uploadedByFilter) : undefined,
        dateFrom || undefined,
        dateTo || undefined,
        categoryFilter ? parseInt(categoryFilter) : undefined
      );
      setGroupedDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setUploadedByFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = dateFrom || dateTo || uploadedByFilter || categoryFilter;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Documents</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-white text-blue-500 text-xs rounded-full px-2 py-0.5">
                {[dateFrom, dateTo, uploadedByFilter, categoryFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <X size={20} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Filter Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uploaded By
              </label>
              <select
                value={uploadedByFilter}
                onChange={(e) => setUploadedByFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {groupedDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <File className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg">No documents found</p>
          {hasActiveFilters && (
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters to see more results
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedDocuments.map((group) => (
            <div key={group.date} className="bg-white rounded-lg shadow">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-500" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formatDate(group.date)}
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {group.users.map((userGroup, userIndex) => (
                  <div key={`${group.date}-${userIndex}`} className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="text-gray-500" size={18} />
                      <h3 className="font-medium text-gray-900">
                        {userGroup.user.username}
                        {userGroup.user.email && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({userGroup.user.email})
                          </span>
                        )}
                      </h3>
                      <span className="text-gray-400 text-sm">
                        ({userGroup.files.length} {userGroup.files.length === 1 ? 'file' : 'files'})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userGroup.files.map((file) => (
                        <div
                          key={file.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="text-blue-500 flex-shrink-0" size={20} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                                  {file.filename}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {file.category_name}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              {formatFileSize(file.file_size)} • {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </div>
                            <a
                              href={file.file_url || file.google_drive_file_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Eye size={16} />
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

