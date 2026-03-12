import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const officeMenu = [
        { name: 'Dashboard', path: '/office-dashboard' },
        { name: 'Inquiry / Admission Form', path: '/office-dashboard?view=inquiry' },
        { name: 'Student Profiles', path: '#' },
        
    ];

    const studentMenu = [
        { name: 'Dashboard', path: '/student-dashboard' },
        { name: 'Admission Status', path: '/student-dashboard?view=status' },
        { name: 'Step 2: Admission Form', path: '/student-dashboard?view=step2' },
        { name: 'Documents', path: '#' },
    ];

    const menu = user?.role === 'OFFICE' ? officeMenu : studentMenu;

    const isActive = (path: string) => {
        if (path === '#') return false;
        const currentPath = location.pathname + location.search;
        if (path === '/office-dashboard' || path === '/student-dashboard') {
            return location.pathname === path && location.search === '';
        }
        return currentPath === path;
    };

    return (
        <aside className="sidebar">
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 800 }}>Office Management</h2>
            </div>

            <nav style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                    {user?.role === 'OFFICE' ? 'Management' : 'Student Portal'}
                </p>
                {menu.map((item, index) => (
                    <div
                        key={index}
                        className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => item.path !== '#' && navigate(item.path)}
                    >
                        {item.name}
                    </div>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
                    </div>
                </div>
                <button
                    className="btn"
                    style={{ width: '100%', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }}
                    onClick={logout}
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
