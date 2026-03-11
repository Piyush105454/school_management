import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Step2Form from '../components/Step2Form';
import { useSearchParams } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view');
    const [profile, setProfile] = useState<any>(null);

    const showForm = view === 'step2';

    const setShowForm = (show: boolean) => {
        if (show) {
            setSearchParams({ view: 'step2' });
        } else {
            setSearchParams({});
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('admissions/profiles/my_profile/');
                setProfile(response.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    const steps = [
        { name: 'Inquiry', status: 'completed' },
        { name: 'Shortlisted', status: 'completed' },
        { name: 'Admission Form', status: profile?.admission_step >= 2 ? 'completed' : 'current' },
        { name: 'Document Verification', status: profile?.admission_step === 2 ? 'current' : profile?.admission_step > 2 ? 'completed' : 'pending' },
        { name: 'Fee Payment', status: profile?.admission_step === 4 ? 'current' : profile?.admission_step > 4 ? 'completed' : 'pending' },
    ];

    if (showForm) {
        return <Step2Form onSuccess={() => { setShowForm(false); window.location.reload(); }} />;
    }

    return (
        <div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2>Welcome, {user?.username}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Follow the steps below to complete your admission.</p>
            </div>

            <div className="card">
                <h3>Application Progress</h3>
                <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {steps.map((step, index) => (
                        <div key={index} style={{ 
                            flex: '1 1 150px', 
                            padding: '1.5rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border)',
                            backgroundColor: step.status === 'completed' ? '#f0fdf4' : step.status === 'current' ? '#f5f3ff' : 'white',
                            borderColor: step.status === 'completed' ? '#bbf7d0' : step.status === 'current' ? '#ddd6fe' : '#e2e8f0',
                            textAlign: 'center'
                        }}>
                            <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                backgroundColor: step.status === 'completed' ? 'var(--success)' : step.status === 'current' ? 'var(--primary)' : '#e2e8f0',
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                margin: '0 auto 1rem',
                                fontWeight: 'bold'
                            }}>
                                {step.status === 'completed' ? '✓' : index + 1}
                            </div>
                            <div style={{ fontWeight: 600 }}>{step.name}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{step.status}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>{profile?.admission_step >= 2 ? 'Form Submitted' : 'Complete Admission Form'}</h3>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                    {profile?.admission_step >= 2 
                        ? 'Your admission form has been submitted and is under review.' 
                        : 'Please fill in the remaining details to proceed to document verification.'}
                </p>
                {profile?.admission_step < 2 && (
                    <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setShowForm(true)}>
                        Start Form (Step 2)
                    </button>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
