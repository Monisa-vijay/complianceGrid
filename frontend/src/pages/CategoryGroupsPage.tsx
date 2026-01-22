import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, ChevronRight, Target, TrendingUp, Upload, AlertCircle, ChevronDown, ChevronUp, Download, FileText, FileSpreadsheet, Cloud, CheckCircle, ListFilter } from 'lucide-react';
import { categoriesApi, CategoryGroup } from '../api/categories';
import { authApi } from '../api/auth';
import apiClient from '../api/client';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';

export const CategoryGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    security: true,
    availability: true,
    confidentiality: true,
    commonCriteria: true,
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [creatingFolders, setCreatingFolders] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);

  // Check Google Drive authentication status from backend
  const checkGoogleDriveAuth = async () => {
    try {
      const response = await apiClient.get('/auth/me/');
      const userData = response.data;
      if (userData && userData.google_drive_authenticated) {
        setIsGoogleAuthenticated(true);
        localStorage.setItem('google_drive_authenticated', 'true');
      } else {
        setIsGoogleAuthenticated(false);
        localStorage.removeItem('google_drive_authenticated');
      }
    } catch (error) {
      // If error, assume not authenticated
      setIsGoogleAuthenticated(false);
      localStorage.removeItem('google_drive_authenticated');
    }
  };

  useEffect(() => {
    fetchGroups();
    checkGoogleDriveAuth();
  }, [showAllGroups]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getGroups(false, showAllGroups);
      // Filter out uncategorized and groups with 0 count
      const filtered = data.filter(g => g.code !== 'UNCATEGORIZED' && g.count > 0);
      setGroups(filtered);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load category groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupCode: string) => {
    navigate(`/categories?group=${groupCode}`);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAuthenticateGoogle = async () => {
    try {
      const { authorization_url } = await authApi.getGoogleAuthUrl();
      // Store redirect location to return after auth
      sessionStorage.setItem('oauth_redirect', window.location.pathname);
      // Redirect to Google OAuth
      window.location.href = authorization_url;
    } catch (error: any) {
      console.error('Error initiating Google auth:', error);
      toast.error('Failed to initiate Google authentication');
    }
  };


  const handleCreateGoogleDriveFolders = async () => {
    // Prevent multiple simultaneous requests
    if (creatingFolders) {
      return;
    }

    setCreatingFolders(true);
    try {
      toast.loading('Syncing Google Drive folder structure and files...', { id: 'create-folders' });
      const result = await categoriesApi.createGoogleDriveFolders();
      
      // Show success message with details
      const messageParts = [result.message || 'Sync completed successfully!'];
      if (result.files_uploaded && result.files_uploaded > 0) {
        messageParts.push(`${result.files_uploaded} file(s) uploaded`);
      }
      if (result.categories_created && result.categories_created > 0) {
        messageParts.push(`${result.categories_created} folder(s) created`);
      }
      
      toast.success(messageParts.join('. '), { id: 'create-folders', duration: 5000 });
      
      // Show warnings/errors if any files failed
      if (result.files_failed && result.files_failed > 0) {
        toast.error(`${result.files_failed} file(s) failed to upload. Check console for details.`, { 
          id: 'sync-errors', 
          duration: 7000 
        });
        
        // Log detailed errors to console
        if (result.upload_errors && Array.isArray(result.upload_errors)) {
          console.error('File upload errors:', result.upload_errors);
          result.upload_errors.forEach((error: string) => {
            toast.error(error, { duration: 5000 });
          });
        }
      }
      
      // Refresh authentication status after successful sync
      await checkGoogleDriveAuth();
    } catch (error: any) {
      console.error('Error syncing:', error);
      
      // Handle specific error cases
      let errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || 'Failed to sync';
      
      // If CSRF error, suggest refreshing the page
      if (errorMessage.toLowerCase().includes('csrf')) {
        errorMessage = 'CSRF token error. Please refresh the page (F5) and try again.';
      }
      // If Google auth required, provide helpful message
      else if (errorMessage.toLowerCase().includes('google') || errorMessage.toLowerCase().includes('authentication')) {
        errorMessage = 'Google Drive authentication required. Please click "Authenticate" first.';
      }
      
      toast.error(errorMessage, { id: 'create-folders', duration: 5000 });
    } finally {
      setCreatingFolders(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      toast.loading(`Exporting as ${format.toUpperCase()}...`, { id: 'export' });
      const blob = await categoriesApi.exportGroups(format, false);
      
      // Check if the response is actually an error (JSON error response)
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        toast.error(errorData.error || 'Failed to export data', { id: 'export' });
        return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `category_groups_export.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported successfully as ${format.toUpperCase()}`, { id: 'export' });
    } catch (error: any) {
      console.error('Error exporting:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to export data';
      toast.error(errorMessage, { id: 'export' });
    }
  };

  const renderGroupRow = (group: CategoryGroup, index: number, total: number, folderColor: string, hoverBg: string) => (
    <button
      key={group.code}
      onClick={() => handleGroupClick(group.code)}
      className={`w-full text-left p-4 ${hoverBg} transition-colors ${
        index !== total - 1 ? 'border-b border-gray-200' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Folder className={`flex-shrink-0 ${folderColor}`} size={22} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{group.label}</h3>
            <span className="text-sm text-gray-500">
              {group.count} {group.count === 1 ? 'control' : 'controls'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Compliance Score */}
          {group.compliance_score !== undefined && (
            <div className="h-[60px] flex items-center">
              <div className="flex items-center gap-2">
                <Target className={
                  (group.compliance_score || 0) >= 100 ? 'text-green-600' :
                  (group.compliance_score || 0) >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                } size={14} />
                <span className={`text-base font-bold ${
                  (group.compliance_score || 0) >= 100 ? 'text-green-600' :
                  (group.compliance_score || 0) >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {group.compliance_score.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
          {/* Divider */}
          {group.compliance_score !== undefined && (
            <div className="h-8 w-px bg-gray-300"></div>
          )}
          {/* Pending Evidence */}
          <div className="h-[60px] flex items-center">
            <div className="flex items-center gap-2">
              <Upload className={
                (group.pending_evidence_count || 0) > 0 ? 'text-orange-600' : 'text-gray-400'
              } size={14} />
              <span className={`text-base font-bold ${
                (group.pending_evidence_count || 0) > 0 ? 'text-orange-600' : 'text-gray-500'
              }`}>
                {group.pending_evidence_count || 0} / {group.count}
              </span>
            </div>
          </div>
          <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Organize groups by main category
  const securityGroups = groups.filter(g => 
    ['ACCESS_CONTROLS', 'NETWORK_SECURITY', 'PHYSICAL_SECURITY', 'DATA_PROTECTION', 
     'ENDPOINT_SECURITY', 'MONITORING_INCIDENT'].includes(g.code)
  );
  const availabilityGroups = groups.filter(g => 
    ['INFRASTRUCTURE_CAPACITY', 'BACKUP_RECOVERY', 'BUSINESS_CONTINUITY'].includes(g.code)
  );
  const confidentialityGroups = groups.filter(g => 
    g.code === 'CONFIDENTIALITY'
  );
  const commonCriteriaGroups = groups.filter(g => 
    ['CONTROL_ENVIRONMENT', 'COMMUNICATION_INFO', 'RISK_ASSESSMENT', 'MONITORING',
     'HR_TRAINING', 'CHANGE_MANAGEMENT', 'VENDOR_MANAGEMENT'].includes(g.code)
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Groups</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse controls organized by category groups
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View All Categories Button */}
          <button
            onClick={() => {
              setShowAllGroups(!showAllGroups);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium  ${showAllGroups ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"}`}
          >
            <ListFilter size={18} />
            <span className="text-sm">{showAllGroups ? 'Show Assigned Groups' : 'View All Groups'}</span>
          </button>
          {!isGoogleAuthenticated && (
            <Button
              variant="secondary"
              onClick={handleAuthenticateGoogle}
            >
              <Cloud size={18} className="mr-2" />
              Authenticate
            </Button>
          )}
          {isGoogleAuthenticated && (
            <div className="flex items-center text-green-600" title="Google Drive authenticated">
              <CheckCircle size={20} />
            </div>
          )}
          <Button
            variant="primary"
            onClick={handleCreateGoogleDriveFolders}
            disabled={creatingFolders}
          >
            <Cloud size={18} className="mr-2" />
            {creatingFolders ? 'Syncing...' : 'Sync'}
          </Button>
          <div className="relative">
            <Button
              variant="primary"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={18} className="mr-2" />
              Export
            </Button>
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <button
                    onClick={() => {
                      handleExport('excel');
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg transition-colors"
                  >
                    <FileSpreadsheet className="text-green-600" size={20} />
                    <span className="text-sm font-medium">Export as Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExport('pdf');
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg transition-colors"
                  >
                    <FileText className="text-red-600" size={20} />
                    <span className="text-sm font-medium">Export as PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security (CC6) */}
      {securityGroups.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('security')}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mb-2"
          >
            <h2 className="text-xl font-bold text-gray-900">Security (CC6)</h2>
            {expandedSections.security ? (
              <ChevronUp className="text-gray-600" size={20} />
            ) : (
              <ChevronDown className="text-gray-600" size={20} />
            )}
          </button>
          {expandedSections.security && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              {securityGroups.map((group, index) => renderGroupRow(group, index, securityGroups.length, 'text-blue-500', 'hover:bg-blue-50'))}
            </div>
          )}
        </div>
      )}

      {/* Availability (CC7) */}
      {availabilityGroups.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('availability')}
            className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors mb-2"
          >
            <h2 className="text-xl font-bold text-gray-900">Availability (CC7)</h2>
            {expandedSections.availability ? (
              <ChevronUp className="text-gray-600" size={20} />
            ) : (
              <ChevronDown className="text-gray-600" size={20} />
            )}
          </button>
          {expandedSections.availability && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              {availabilityGroups.map((group, index) => renderGroupRow(group, index, availabilityGroups.length, 'text-green-500', 'hover:bg-green-50'))}
            </div>
          )}
        </div>
      )}

      {/* Confidentiality (CC8) */}
      {confidentialityGroups.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('confidentiality')}
            className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors mb-2"
          >
            <h2 className="text-xl font-bold text-gray-900">Confidentiality (CC8)</h2>
            {expandedSections.confidentiality ? (
              <ChevronUp className="text-gray-600" size={20} />
            ) : (
              <ChevronDown className="text-gray-600" size={20} />
            )}
          </button>
          {expandedSections.confidentiality && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              {confidentialityGroups.map((group, index) => renderGroupRow(group, index, confidentialityGroups.length, 'text-purple-500', 'hover:bg-purple-50'))}
            </div>
          )}
        </div>
      )}

      {/* Common Criteria (CC1-CC5) */}
      {commonCriteriaGroups.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('commonCriteria')}
            className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors mb-2"
          >
            <h2 className="text-xl font-bold text-gray-900">Common Criteria (CC1-CC5)</h2>
            {expandedSections.commonCriteria ? (
              <ChevronUp className="text-gray-600" size={20} />
            ) : (
              <ChevronDown className="text-gray-600" size={20} />
            )}
          </button>
          {expandedSections.commonCriteria && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              {commonCriteriaGroups.map((group, index) => renderGroupRow(group, index, commonCriteriaGroups.length, 'text-orange-500', 'hover:bg-orange-50'))}
            </div>
          )}
        </div>
      )}

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No category groups found.</p>
        </div>
      )}
    </div>
  );
};

