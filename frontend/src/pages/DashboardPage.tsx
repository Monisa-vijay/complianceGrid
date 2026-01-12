import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Calendar, FileX, UserX, ShieldAlert, TrendingDown, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { submissionsApi, DashboardStats } from '../api/submissions';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await submissionsApi.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your compliance metrics and gap analysis</p>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Categories</p>
              <p className="text-4xl font-bold text-gray-900">{stats.total_categories}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.pending_submissions}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Overdue</p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.overdue_submissions}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Approved This Month</p>
              <p className="text-4xl font-bold text-gray-900">
                {stats.approved_this_month}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gap Analysis Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gap Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-orange-50 rounded-xl border-l-4 border-orange-500 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-700 mb-2">Controls Without Evidence</p>
              <p className="text-3xl font-bold text-orange-900 mb-1">
                {stats.controls_without_evidence}
              </p>
              <p className="text-xs font-medium text-orange-600">
                {stats.total_categories > 0 
                  ? `${((stats.controls_without_evidence / stats.total_categories) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <FileX className="text-orange-500 flex-shrink-0" size={32} />
          </div>

          <div className="bg-red-50 rounded-xl border-l-4 border-red-500 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 mb-2">Controls Without Assignee</p>
              <p className="text-3xl font-bold text-red-900 mb-1">
                {stats.controls_without_assignee}
              </p>
              <p className="text-xs font-medium text-red-600">
                {stats.total_categories > 0 
                  ? `${((stats.controls_without_assignee / stats.total_categories) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <UserX className="text-red-500 flex-shrink-0" size={32} />
          </div>

          <div className="bg-purple-50 rounded-xl border-l-4 border-purple-500 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-700 mb-2">Controls Without Approver</p>
              <p className="text-3xl font-bold text-purple-900 mb-1">
                {stats.controls_without_approver}
              </p>
              <p className="text-xs font-medium text-purple-600">
                {stats.total_categories > 0 
                  ? `${((stats.controls_without_approver / stats.total_categories) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <ShieldAlert className="text-purple-500 flex-shrink-0" size={32} />
          </div>

          <div className="bg-red-100 rounded-xl border-l-4 border-red-600 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-2">Controls With Overdue</p>
              <p className="text-3xl font-bold text-red-900 mb-1">
                {stats.controls_with_overdue}
              </p>
              <p className="text-xs font-medium text-red-700">
                {stats.total_categories > 0 
                  ? `${((stats.controls_with_overdue / stats.total_categories) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <AlertCircle className="text-red-600 flex-shrink-0" size={32} />
          </div>

          <div className="bg-yellow-50 rounded-xl border-l-4 border-yellow-500 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-700 mb-2">Low Compliance (&lt;50%)</p>
              <p className="text-3xl font-bold text-yellow-900 mb-1">
                {stats.controls_with_low_compliance}
              </p>
              <p className="text-xs font-medium text-yellow-600">
                {stats.total_categories > 0 
                  ? `${((stats.controls_with_low_compliance / stats.total_categories) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <TrendingDown className="text-yellow-500 flex-shrink-0" size={32} />
          </div>

          <div className="bg-blue-50 rounded-xl border-l-4 border-blue-500 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 mb-2">Pending Approval</p>
              <p className="text-3xl font-bold text-blue-900 mb-1">
                {stats.controls_pending_approval}
              </p>
              <p className="text-xs font-medium text-blue-600">
                {stats.total_categories > 0 
                  ? `${((stats.controls_pending_approval / stats.total_categories) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </div>
            <FileCheck className="text-blue-500 flex-shrink-0" size={32} />
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Deadlines</h2>
        {stats.upcoming_deadlines.length > 0 ? (
          <div className="space-y-3">
            {stats.upcoming_deadlines.map((deadline) => (
              <Link
                key={deadline.id}
                to={`/categories/${deadline.category}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 mb-1">
                      {deadline.category_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(deadline.due_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-semibold ${
                        deadline.days_until_due <= 3
                          ? 'bg-red-100 text-red-800'
                          : deadline.days_until_due <= 7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {deadline.days_until_due} {deadline.days_until_due === 1 ? 'day' : 'days'} left
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No upcoming deadlines</p>
            <p className="text-sm text-gray-400 mt-1">All deadlines are up to date</p>
          </div>
        )}
      </div>
    </div>
  );
};

