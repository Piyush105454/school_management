import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  email: string;
  role: 'OFFICE' | 'STUDENT_PARENT';
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log('Decoded token:', decoded);
        if (decoded.email && decoded.role) {
          setUser({ email: decoded.email, role: decoded.role });
        } else {
          console.error('Token missing required claims');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    try {
      localStorage.setItem('token', token);
      const decoded: any = jwtDecode(token);
      setUser({ email: decoded.email, role: decoded.role });
    } catch (err) {
      console.error('Login decode error:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
