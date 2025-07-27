import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserLayout from './UserLayout';
import AdminLayout from './AdminLayout';
import { auth } from '../utils/auth';

const Layout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Check if user is authenticated
  const isAuthenticated = auth.isAuthenticated();
  
  if (!isAuthenticated) {
    // This should be handled by ProtectedRoute, but just in case
    return null;
  }

  return (
    <div className="app-layout">
      {isAdminRoute ? (
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      ) : (
        <UserLayout>
          <Outlet />
        </UserLayout>
      )}
    </div>
  );
};

export default Layout;
