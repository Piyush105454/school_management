import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const StudentSidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menu = [
        { name: 'Dashboard', path: '/student-dashboard', icon: '🏠' },
        { name: 'Admission Status', path: '/student-dashboard?view=status', icon: '📋' },
        { name: 'Step 2: Admission Form', path: '/student-dashboard?view=step2', icon: '📝' },
    ];

    const isActive = (path: string) => {
        if (path === '#') return false;
        const currentPath = location.pathname + location.search;
        if (path === '/student-dashboard') {
            return location.pathname === path && location.search === '';
        }
        return currentPath === path;
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                {!isCollapsed && <h2 style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800 }}>Student Portal</h2>}
                <button 
                    onClick={onToggle}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem' }}
                >
                    {isCollapsed ? '→' : '←'}
                </button>
            </div>

            <nav style={{ flex: 1 }}>
                {!isCollapsed && (
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                        Portal Navigation
                    </p>
                )}
                {menu.map((item, index) => (
                    <div
                        key={index}
                        className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => {
                            if (item.path !== '#') navigate(item.path);
                            if (onClose) onClose();
                        }}
                        title={isCollapsed ? item.name : ''}
                    >
                        <span style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}>{item.icon}</span>
                        {!isCollapsed && <span>{item.name}</span>}
                    </div>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                {!isCollapsed && (
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</p>
                        </div>
                    </div>
                )}
                <button
                    className="btn"
                    style={{ width: '100%', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem', fontSize: '0.875rem' }}
                    onClick={logout}
                    title="Sign Out"
                >
                    {isCollapsed ? '🚪' : 'Sign Out'}
                </button>
            </div>
        </aside>
    );
};

export default StudentSidebar;
