import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Login temporarily disabled
// import { LogOut, User } from 'lucide-react';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CategoryGroupsPage } from './pages/CategoryGroupsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LoginPage } from './pages/LoginPage';
import { Notifications } from './components/Notifications';
import { Profile } from './components/Profile';
import { Button } from './components/Button';
import { authApi } from './api/auth';
import { LoginCallbackPage } from './pages/LoginCallbackPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = localStorage.getItem('user');
      if (!user) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      
      // Verify user is still authenticated
      try {
        const currentUser = await authApi.getCurrentUser();
        if (currentUser) {
          setIsAuthenticated(true);
        } else {
          // User not authenticated, clear localStorage and redirect
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          navigate('/login');
        }
      } catch (error) {
        // If error is 401, user is not authenticated
        // Otherwise, might be a network error - keep user logged in if they have localStorage
        const errorStatus = (error as any)?.response?.status;
        if (errorStatus === 401) {
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          navigate('/login');
        } else {
          // Network or other error - assume still authenticated if localStorage exists
          setIsAuthenticated(true);
        }
      }
    };
    checkAuth();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  // Load user from localStorage on mount and when location changes
  useEffect(() => {
    const loadUser = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('🔵 Loading user from localStorage:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('🔵 No user in localStorage');
        setUser(null);
      }
    };
    
    loadUser();
    
    // Also listen for storage changes (when login saves to localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also reload user when pathname changes (e.g., after login navigation)
    // This ensures user state is updated after login
    loadUser();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]); // Reload when pathname changes (e.g., after login navigation)

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local state and navigate, even if API call fails
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const isLoginPage = location.pathname === '/login' || location.pathname === '/login/callback';

  if (isLoginPage) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/callback" element={<LoginCallbackPage />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <img 
                  src="/assets/ComplianceGrid.png" 
                  alt="ComplianceGrid" 
                  className="h-16 object-contain"
                />
              </Link>
              <div className="flex space-x-4">
                  <Link
                    to="/groups"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/' || location.pathname === '/groups'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Category Groups
                  </Link>
                  <Link
                    to="/categories"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname.startsWith('/categories')
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    All Controls
                  </Link>
                  <Link
                    to="/documents"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/documents'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Documents
                  </Link>
                  <Link
                    to="/analytics"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/analytics'
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Analytics
                  </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && user.id && <Notifications userId={user.id} />}
              {user && <Profile user={user} onLogout={handleLogout} onUserUpdate={setUser} />}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CategoryGroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <CategoryGroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories/:id"
            element={
              <ProtectedRoute>
                <CategoryDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

