import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import OfficeDashboard from './pages/OfficeDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Layout from './components/Layout';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode, role: string }> = ({ children, role }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    
    if (user.role !== role) {
        return <Navigate to={user.role === 'OFFICE' ? '/office-dashboard' : '/student-dashboard'} replace />;
    }

    return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return (
        <Routes>
            <Route 
                path="/login" 
                element={
                    !user ? <Login /> : <Navigate to={user.role === 'OFFICE' ? '/office-dashboard' : '/student-dashboard'} replace />
                } 
            />
            <Route 
                path="/office-dashboard" 
                element={
                    <ProtectedRoute role="OFFICE">
                        <OfficeDashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/student-dashboard" 
                element={
                    <ProtectedRoute role="STUDENT_PARENT">
                        <StudentDashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/" 
                element={
                    <Navigate 
                        to={user ? (user.role === 'OFFICE' ? '/office-dashboard' : '/student-dashboard') : '/login'} 
                        replace 
                    />
                } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <AppRoutes />
        </Router>
    </AuthProvider>
  );
}

export default App;
