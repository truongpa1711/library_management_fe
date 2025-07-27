import { Navigate } from 'react-router-dom';
import { auth } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = auth.isAuthenticated();

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;