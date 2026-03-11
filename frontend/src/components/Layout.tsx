import React from 'react';
import { useAuth } from '../context/AuthContext';
import OfficeSidebar from './OfficeSidebar';
import StudentSidebar from './StudentSidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    // Close mobile menu on navigation (optional, but good practice if using React Router)
    // useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

    return (
        <div className="layout">
            {/* Mobile Hamburger Button */}
            <button className="mobile-toggle" onClick={toggleMobile}>
                {isMobileOpen ? '✕' : '☰'}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && <div className="mobile-overlay" onClick={toggleMobile} />}

            {user?.role === 'OFFICE' ? (
                <OfficeSidebar 
                    isCollapsed={isCollapsed} 
                    onToggle={toggleSidebar} 
                    isOpen={isMobileOpen} 
                    onClose={() => setIsMobileOpen(false)} 
                />
            ) : (
                <StudentSidebar 
                    isCollapsed={isCollapsed} 
                    onToggle={toggleSidebar} 
                    isOpen={isMobileOpen} 
                    onClose={() => setIsMobileOpen(false)} 
                />
            )}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
