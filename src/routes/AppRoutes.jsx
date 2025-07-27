import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginRegister from "../pages/LoginRegister/LoginRegister";
import ProtectedRoute from './ProtectedRoute';
import AdminProtectedRoute from './AdminProtectedRoute';
import Layout from '../components/Layout';
import Home from '../pages/Home/Home';
import BrowseBooks from '../pages/BrowseBooks/BrowseBooks';
import AllBooks from '../pages/AllBooks/AllBooks';
import BookDetails from '../pages/BookDetails/BookDetails';
import MyLoans from '../pages/MyLoans/MyLoans';
import MyFines from '../pages/MyFines/MyFines';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import FeedbackManagement from '../pages/Admin/FeedbackManagement';
import ReservationManagement from '../pages/Admin/ReservationManagement';
import RoleDemo from '../pages/Demo/RoleDemo';
import Profile from '../pages/Profile/Profile';
import MyReservations from '../pages/MyReservations/MyReservations';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/register" element={<LoginRegister />} />
            
            {/* Protected User routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Home />} />
                <Route path="books" element={<BrowseBooks />} />
                <Route path="all-books" element={<AllBooks />} />
                <Route path="book/:id" element={<BookDetails />} />
                <Route path="my-loans" element={<MyLoans />} />
                <Route path="my-fines" element={<MyFines />} />
                <Route path="my-reservations" element={<MyReservations />} />
                <Route path="history" element={<div>History Page (Coming Soon)</div>} />
                <Route path="profile" element={<Profile />} />
                <Route path="role-demo" element={<RoleDemo />} />
            </Route>

            {/* Protected Admin routes */}
            <Route path="/admin" element={
                <AdminProtectedRoute>
                    <Layout />
                </AdminProtectedRoute>
            }>
                <Route index element={<AdminDashboard />} />
                <Route path="feedbacks" element={<FeedbackManagement />} />
                <Route path="reservations" element={<ReservationManagement />} />
                <Route path="books" element={<div>Admin Books Page (Coming Soon)</div>} />
                <Route path="users" element={<div>Admin Users Page (Coming Soon)</div>} />
                <Route path="borrows" element={<div>Admin Borrows Page (Coming Soon)</div>} />
                <Route path="reports" element={<div>Admin Reports Page (Coming Soon)</div>} />
                <Route path="settings" element={<div>Admin Settings Page (Coming Soon)</div>} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;