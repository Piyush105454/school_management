import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log('Attempting login...');
            // Backend expects 'email' as the key because USERNAME_FIELD = 'email'
            const response = await api.post('auth/token/', { email: email, password });
            console.log('Login successful, decoding token...');
            login(response.data.access);
        } catch (err: any) {
            console.error('Login error details:', err);
            if (err.response) {
                // The server responded with a status code that falls out of the range of 2xx
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
                setError(`Login failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            } else if (err.request) {
                // The request was made but no response was received
                console.error('No response received:', err.request);
                setError('No response from server. Please check your internet or if the backend is down.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Request setup error:', err.message);
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Portal Login</h2>
                {error && <p style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. admin@example.com"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Office staff: Use your admin email.<br/>
                    Parents: Use the email registered during inquiry.
                </p>
            </div>
        </div>
    );
};

export default Login;
