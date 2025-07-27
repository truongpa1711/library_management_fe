import { Navigate } from 'react-router-dom';
import { auth } from '../utils/auth';

const AdminProtectedRoute = ({ children }) => {
    const isAuthenticated = auth.isAuthenticated();
    const isAdmin = auth.isAdmin();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (!isAdmin) {
        // If user is authenticated but not admin, redirect to user dashboard
        return <Navigate to="/" />;
    }

    return children;
};

export default AdminProtectedRoute;
