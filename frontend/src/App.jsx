import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Locations from './pages/Locations';
import Reports from './pages/Reports';
import RFIDReader from './pages/RFIDReader';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: { 'Content-Type': 'application/json' }
        // credentials: 'include' is handled by proxy or default for same-origin. 
        // If locally developing with valid proxy, it should work. 
        // If strictly cross-origin, include credentials.
        // Since we are likely using a proxy in package.json or Vite, specific relative path usage implies same-origin or proxy.
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
      } else {
        setIsAuthenticated(false);
        setAdmin(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (adminData) => {
    setIsAuthenticated(true);
    setAdmin(adminData);
    // Persist admin data for UI if needed, but rely on cookie for auth
    localStorage.setItem('admin', JSON.stringify(adminData));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error('Logout failed', e);
    }
    
    localStorage.removeItem('admin');
    setIsAuthenticated(false);
    setAdmin(null);
    setCurrentPage('dashboard');
  };

  // Global error handler for API calls
  const handleApiError = (error) => {
    if (error.message === 'Token has expired' || error.message === 'Token is not valid' || error.status === 401) {
      handleLogout();
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'attendance':
        return <Attendance />;
      case 'locations':
        return <Locations />;
      case 'reports':
        return <Reports />;
      case 'rfid':
        return <RFIDReader />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-24 w-24">
             <div className="absolute inset-0 rounded-full border-4 border-slate-800 opacity-25"></div>
             <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
             <div className="absolute inset-4 rounded-full border-4 border-slate-800 opacity-25"></div>
             <div className="absolute inset-4 rounded-full border-4 border-b-violet-500 border-t-transparent border-l-transparent border-r-transparent animate-spin-reverse"></div>
          </div>
          <p className="text-slate-400 font-medium tracking-wide animate-pulse">Initializing Security System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Layout 
          admin={admin} 
          onLogout={handleLogout} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
        >
          {renderPage()}
        </Layout>
      )}
    </div>
  );
};

export default App;