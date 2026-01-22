import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, CheckCircle, Clock, Search, Filter, X, Grid, List, Table, ChevronLeft, ChevronRight, Eye, EyeOff, ArrowLeft, User, Upload, ChevronDown, ListFilter } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoriesApi, Category } from '../api/categories';
import { getReviewPeriodLabel, reviewPeriodOptions } from '../utils/reviewPeriods';
import toast from 'react-hot-toast';

type ViewMode = 'card' | 'list' | 'table';

export const CategoriesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const groupFilter = searchParams.get('group') || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // Input value from the user
  const [searchQuery, setSearchQuery] = useState(''); // Debounced search query for API
  const [reviewPeriodFilter, setReviewPeriodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: number; username: string; email: string; first_name: string; last_name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load view preference from localStorage
    const savedView = localStorage.getItem('categoriesViewMode') as ViewMode;
    if (savedView && ['card', 'list', 'table'].includes(savedView)) {
      setViewMode(savedView);
    }
    const savedPageSize = localStorage.getItem('categoriesPageSize');
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10));
    }
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersData = await categoriesApi.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  // Debounce search input - update searchQuery after user stops typing for 500ms
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout to update searchQuery
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchQuery, reviewPeriodFilter, statusFilter, assigneeFilter, showHidden, pageSize, groupFilter]);

  useEffect(() => {
    // Refetch categories when filters or pagination change
    fetchCategories();
  }, [searchQuery, reviewPeriodFilter, statusFilter, assigneeFilter, currentPage, pageSize, showHidden, groupFilter, showAllCategories]);

  useEffect(() => {
    // Save view preference to localStorage
    localStorage.setItem('categoriesViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    // Save page size preference
    localStorage.setItem('categoriesPageSize', pageSize.toString());
  }, [pageSize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
    };

    if (assigneeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assigneeDropdownOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getAll(
        !showHidden,
        searchQuery,
        reviewPeriodFilter,
        statusFilter,
        currentPage,
        pageSize,
        showHidden,
        groupFilter,
        assigneeFilter,
        showAllCategories
      );
      setCategories(response.results);
      setFilteredCategories(response.results);
      setTotalCount(response.count);
      // Calculate total pages
      const total = Math.ceil(response.count / pageSize);
      setTotalPages(total || 1);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to load categories';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    setFilteredCategories(categories);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setReviewPeriodFilter('');
    setStatusFilter('');
    setAssigneeFilter('');
    setShowAllCategories(false);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getStatusBadge = (submission: Category['current_submission']) => {
    if (!submission) {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
          No Active Submission
        </span>
      );
    }

    if (submission.is_overdue) {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }

    if (submission.status === 'APPROVED') {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle size={14} /> Approved
        </span>
      );
    }

    if (submission.status === 'SUBMITTED' || submission.status === 'UNDER_REVIEW') {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 flex items-center gap-1">
          <Clock size={14} /> Pending Approval
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <Clock size={14} /> Pending ({submission.days_until_due} days left)
      </span>
    );
  };

  const getLastUploadedDate = (category: Category): string | null => {
    if (!category.current_submission) {
      return null;
    }
    
    // Get the most recent file upload date
    if (category.current_submission.files && category.current_submission.files.length > 0) {
      const sortedFiles = [...category.current_submission.files].sort((a, b) => 
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
      return sortedFiles[0].uploaded_at;
    }
    
    // Fallback to submission date
    if (category.current_submission.submitted_at) {
      return category.current_submission.submitted_at;
    }
    
    return null;
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCategories.map((category) => {
        return (
          <Link
            key={category.id}
            to={`/categories/${category.id}`}
            className="block hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 flex-1 pr-2">
                  {category.name}
                </h2>
              </div>

              {/* Details */}
              <div className="space-y-2.5 flex-grow">
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock size={14} />
                    Review Period:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {getReviewPeriodLabel(category.review_period)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <User size={14} />
                    Assignee:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {category.assignee ? (category.assignee.first_name && category.assignee.last_name 
                      ? `${category.assignee.first_name} ${category.assignee.last_name}`.trim()
                      : category.assignee.first_name || category.assignee.last_name || category.assignee.username) : 'Not assigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Upload size={14} />
                    Last Uploaded:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {getLastUploadedDate(category) 
                      ? new Date(getLastUploadedDate(category)!).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="pt-3 mt-auto">
                  {getStatusBadge(category.current_submission)}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredCategories.map((category) => {
        return (
          <Link
            key={category.id}
            to={`/categories/${category.id}`}
            className="block hover:shadow-lg transition-all duration-200"
          >
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">
                      {category.name}
                    </h2>
                    {getStatusBadge(category.current_submission)}
                  </div>

                  <div className="flex items-center gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-500">Review:</span>
                      <span className="font-semibold text-gray-900">
                        {getReviewPeriodLabel(category.review_period)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-500">Assignee:</span>
                      <span className="font-semibold text-gray-900">
                        {category.assignee ? (category.assignee.first_name && category.assignee.last_name 
                          ? `${category.assignee.first_name} ${category.assignee.last_name}`.trim()
                          : category.assignee.first_name || category.assignee.last_name || category.assignee.username) : 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-gray-500">Last Uploaded:</span>
                      <span className="font-semibold text-gray-900">
                        {getLastUploadedDate(category) 
                          ? new Date(getLastUploadedDate(category)!).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ChevronRight className="text-gray-400" size={20} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Control Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Review Period
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Assignee
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
              Last Uploaded
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredCategories.map((category) => {
        return (
          <tr
            key={category.id}
            className="hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={() => window.location.href = `/categories/${category.id}`}
          >
            <td className="px-6 py-4">
              <div className="text-sm font-semibold text-gray-900">
                {category.name}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {getReviewPeriodLabel(category.review_period)}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {getStatusBadge(category.current_submission)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {category.assignee ? (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {category.assignee.first_name && category.assignee.last_name 
                      ? `${category.assignee.first_name} ${category.assignee.last_name}`.trim()
                      : category.assignee.first_name || category.assignee.last_name || category.assignee.username}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Not assigned</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Upload size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {getLastUploadedDate(category) 
                    ? new Date(getLastUploadedDate(category)!).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </td>
          </tr>
        );
      })}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const hasActiveFilters = searchInput || reviewPeriodFilter || statusFilter || assigneeFilter || showAllCategories;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Get group label for display
  const getGroupLabel = (code: string): string => {
    const groupLabels: Record<string, string> = {
      'ACCESS_CONTROLS': 'Access Controls',
      'NETWORK_SECURITY': 'Network Security',
      'PHYSICAL_SECURITY': 'Physical Security',
      'DATA_PROTECTION': 'Data Protection',
      'ENDPOINT_SECURITY': 'Endpoint Security',
      'MONITORING_INCIDENT': 'Monitoring & Incident Response',
      'INFRASTRUCTURE_CAPACITY': 'Infrastructure & Capacity',
      'BACKUP_RECOVERY': 'Backup & Recovery',
      'BUSINESS_CONTINUITY': 'Business Continuity',
      'CONFIDENTIALITY': 'Confidentiality',
      'CONTROL_ENVIRONMENT': 'Control Environment (CC1)',
      'COMMUNICATION_INFO': 'Communication & Information (CC2)',
      'RISK_ASSESSMENT': 'Risk Assessment (CC3)',
      'MONITORING': 'Monitoring (CC4)',
      'HR_TRAINING': 'Control Activities - HR & Training (CC5)',
      'CHANGE_MANAGEMENT': 'Control Activities - Change Management (CC5)',
      'VENDOR_MANAGEMENT': 'Control Activities - Vendor Management (CC5)',
    };
    return groupLabels[code] || code;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {groupFilter && (
            <Link
              to="/groups"
              className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-100 rounded"
            >
              <ArrowLeft size={24} />
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {groupFilter ? getGroupLabel(groupFilter) : 'Controls'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} {totalCount === 1 ? 'control' : 'controls'} found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* View All Button */}
          <button
            onClick={() => {
              setShowAllCategories(!showAllCategories);
              setAssigneeFilter('');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium ${
              showAllCategories
                ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <ListFilter size={18} />
            <span className="text-sm">{showAllCategories ? 'View My Categories' : 'View All Categories'}</span>
          </button>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'card'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Card View"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Table View"
            >
              <Table size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search controls by name, description, or requirements..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Show Hidden Toggle */}
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all font-medium ${
              showHidden
                ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700'
                : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title={showHidden ? 'Show Active Categories' : 'Show Hidden Categories'}
          >
            {showHidden ? <EyeOff size={18} /> : <Eye size={18} />}
            <span className="text-sm">{showHidden ? 'Show Active' : 'Show Hidden'}</span>
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all font-medium"
          >
            <Filter size={18} />
            <span className="text-sm">Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {[searchInput, reviewPeriodFilter, statusFilter, assigneeFilter, showAllCategories].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X size={20} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-5 pt-5 pb-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Review Period Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Period
              </label>
              <select
                value={reviewPeriodFilter}
                onChange={(e) => setReviewPeriodFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">All Periods</option>
                {reviewPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="SUBMITTED">Pending Approval</option>
                <option value="UNDER_REVIEW">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="no-submission">No Active Submission</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assignee
              </label>
              <div className="relative" ref={assigneeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-left flex items-center justify-between hover:border-gray-400"
                >
                  <span className="text-gray-900">
                    {assigneeFilter
                      ? (() => {
                          const selectedUser = users.find(u => u.id.toString() === assigneeFilter);
                          if (selectedUser) {
                            return selectedUser.first_name && selectedUser.last_name
                              ? `${selectedUser.first_name} ${selectedUser.last_name}`.trim()
                              : selectedUser.first_name || selectedUser.last_name || selectedUser.username;
                          }
                          return 'All Assignees';
                        })()
                      : 'All Assignees'}
                  </span>
                  <ChevronDown 
                    size={18} 
                    className={`text-gray-500 transition-transform ${assigneeDropdownOpen ? 'transform rotate-180' : ''}`}
                  />
                </button>
                {assigneeDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeFilter('');
                        setAssigneeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                        assigneeFilter === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                      }`}
                    >
                      All Assignees
                    </button>
                    {users.map((user) => {
                      const displayName = user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`.trim()
                        : user.first_name || user.last_name || user.username;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setAssigneeFilter(user.id.toString());
                            setAssigneeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                            assigneeFilter === user.id.toString() ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                          }`}
                        >
                          {displayName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count and Page Size Selector */}
      <div className="flex justify-between items-center mb-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-700">
          Showing <span className="font-bold text-gray-900">{startItem}</span> to <span className="font-bold text-gray-900">{endItem}</span> of <span className="font-bold text-gray-900">{totalCount}</span> {totalCount === 1 ? 'control' : 'controls'}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Items per page:</label>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium bg-white"
          >
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={100}>100</option>
            <option value={10000}>All</option>
          </select>
        </div>
      </div>

      {/* Categories View */}
      {viewMode === 'card' && renderCardView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'table' && renderTableView()}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {hasActiveFilters ? (
            <div>
              <p className="mb-2">No categories match your filters.</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:underline"
              >
                Clear filters to see all categories
              </button>
            </div>
          ) : (
            <p>No categories found. Create your first category to get started.</p>
          )}
        </div>
      )}
    </div>
  );
};
