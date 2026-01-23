import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  Clock, 
  FileCheck, 
  FileX, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye
} from 'lucide-react';
import { submissionsApi } from '../api/submissions';
import toast from 'react-hot-toast';

interface CategoryGroup {
  group_code: string;
  group_label: string;
  total_controls: number;
  compliance_score: number;
  overdue_count: number;
  at_risk_count: number;
  compliant_count: number;
  no_data_count: number;
}

interface PriorityIssue {
  priority: number;
  control_id: number;
  control_name: string;
  status: string;
  days_overdue: number | null;
  assignee_name: string | null;
  assignee_id: number | null;
  issue_type: string;
  compliance_score: number | null;
}

interface UpcomingDeadline {
  control_id: number;
  control_name: string;
  due_date: string;
  days_until_due: number;
  review_period: string;
  assignee_name: string | null;
  status: string;
}

interface AnalyticsData {
  overdue_count: number;
  overdue_aging: {
    '1_7_days': number;
    '8_30_days': number;
    'over_30_days': number;
  };
  my_assignments_count: number;
  pending_approvals_count: number;
  no_evidence_count: number;
  missing_assignees_count: number;
  missing_approvers_count: number;
  overall_compliance_score: number;
  compliance_trend: 'up' | 'down' | 'stable';
  category_groups: CategoryGroup[];
  at_risk_controls_count: number;
  due_next_7_days: number;
  due_next_14_days: number;
  due_next_30_days: number;
  upcoming_deadlines_by_period: Record<string, number>;
  upcoming_deadlines: UpcomingDeadline[];
  average_approval_time_hours: number | null;
  rejection_rate: number;
  submission_trends: Array<{ month: string; count: number }>;
  bottleneck_approvers: Array<{ username: string; name: string; pending_count: number }>;
  priority_issues: PriorityIssue[];
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myAssignmentsOnly, setMyAssignmentsOnly] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [myAssignmentsOnly]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsData = await submissionsApi.getAnalytics({ 
        my_assignments: myAssignmentsOnly 
      });
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getComplianceStatus = (score: number): string => {
    if (score >= 80) return 'COMPLIANT';
    if (score >= 50) return 'AT RISK';
    return 'NON-COMPLIANT';
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_EVIDENCE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NO_ASSIGNEE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header with Filters */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">Action-oriented compliance dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={myAssignmentsOnly}
                  onChange={(e) => setMyAssignmentsOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">My Assignments</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Action Required Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Action Required</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overdue Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">OVERDUE</span>
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{data.overdue_count}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>1-7 days: {data.overdue_aging['1_7_days']}</div>
                <div>8-30 days: {data.overdue_aging['8_30_days']}</div>
                <div>&gt;30 days: {data.overdue_aging['over_30_days']}</div>
              </div>
            </div>

            {/* Due This Week */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">DUE THIS WEEK</span>
                <Clock className="text-yellow-600" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.due_next_7_days}</p>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">PENDING APPROVALS</span>
                <FileCheck className="text-blue-600" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.pending_approvals_count}</p>
            </div>

            {/* No Evidence */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">NO EVIDENCE</span>
                <FileX className="text-orange-600" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.no_evidence_count}</p>
            </div>
          </div>
        </div>

        {/* Compliance Health Snapshot */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Health Snapshot</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'monospace' }}>
                {data.overall_compliance_score.toFixed(0)}%
              </span>
              {data.compliance_trend === 'up' && <TrendingUp className="text-green-600" size={20} />}
              {data.compliance_trend === 'down' && <TrendingDown className="text-red-600" size={20} />}
              {data.compliance_trend === 'stable' && <Minus className="text-gray-600" size={20} />}
            </div>
          </div>

          {/* Category Group Heatmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.category_groups.map((group) => {
              const borderColor = getComplianceColor(group.compliance_score);
              return (
                <Link
                  key={group.group_code}
                  to={`/categories?group=${group.group_code}`}
                  className="bg-white rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  style={{ borderLeftColor: borderColor }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{group.group_label}</h3>
                    <span 
                      className="text-lg font-bold" 
                      style={{ fontFamily: 'monospace', color: borderColor }}
                    >
                      {group.compliance_score.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{group.total_controls} controls</p>
                  <div className="flex items-center gap-2 text-xs">
                    {group.overdue_count > 0 && (
                      <span className="text-red-600">🔴 {group.overdue_count} overdue</span>
                    )}
                    {group.overdue_count === 0 && group.compliance_score >= 80 && (
                      <span className="text-green-600">✓ All current</span>
                    )}
                    {group.overdue_count === 0 && group.compliance_score < 80 && (
                      <span className="text-yellow-600">🟡 {group.at_risk_count} at risk</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">At-risk controls:</span> {data.at_risk_controls_count}
          </div>
        </div>

        {/* What's Due Next */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Due Next</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Next 7 Days</div>
              <div className="text-2xl font-bold text-gray-900">{data.due_next_7_days}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Next 14 Days</div>
              <div className="text-2xl font-bold text-gray-900">{data.due_next_14_days}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Next 30 Days</div>
              <div className="text-2xl font-bold text-gray-900">{data.due_next_30_days}</div>
            </div>
          </div>

          {/* Upcoming Deadlines by Period */}
          {Object.keys(data.upcoming_deadlines_by_period).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">By Review Period</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(data.upcoming_deadlines_by_period).map(([period, count]) => (
                  <div key={period} className="text-sm">
                    <span className="text-gray-600">{period}:</span>
                    <span className="font-semibold text-gray-900 ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk & Gap Analysis - Priority Issues Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Priority Issues</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Control Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.priority_issues.map((issue) => (
                  <tr 
                    key={issue.control_id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/categories/${issue.control_id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">#{issue.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{issue.control_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {issue.days_overdue !== null ? `${issue.days_overdue} days` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {issue.assignee_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{issue.issue_type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/categories/${issue.control_id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.priority_issues.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No priority issues found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

