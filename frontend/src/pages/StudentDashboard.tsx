import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MultiStepAdmissionForm from '../components/MultiStepAdmissionForm';
import { useSearchParams } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const showForm = view === 'step2';

    const setShowForm = (show: boolean) => {
        if (show) {
            setSearchParams({ view: 'step2' });
        } else {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('view');
            setSearchParams(newParams);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await api.get('admissions/profiles/my_profile/');
            setProfile(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const steps = [
        { name: 'Inquiry', status: 'completed' },
        { name: 'Shortlisted', status: 'completed' },
        { name: 'Admission Form', status: profile?.admission_step >= 3 ? 'completed' : 'current' },
        { name: 'Document Verification', status: profile?.admission_step === 3 ? 'current' : profile?.admission_step > 3 ? 'completed' : 'pending' },
        { name: 'Fee Payment', status: profile?.admission_step === 4 ? 'current' : profile?.admission_step > 4 ? 'completed' : 'pending' },
    ];

    if (loading) return <div className="p-8">Loading profile...</div>;

    if (showForm) {
        if (profile?.admission_meta) {
            return (
                <MultiStepAdmissionForm 
                    admissionId={profile.admission_meta.id}
                    initialData={profile.admission_meta}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchProfile();
                    }}
                    onCancel={() => setShowForm(false)}
                />
            );
        } else {
            return (
                <div className="card">
                    <h3>Error: Admission Meta Not Found</h3>
                    <p>Your admission process has not been properly initialized by the office. Please contact the administrator.</p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={fetchProfile}>Refresh Profile</button>
                        <button className="btn" onClick={() => setShowForm(false)}>Back to Dashboard</button>
                    </div>
                </div>
            );
        }
    }

    return (
        <div>
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Welcome, {user?.email}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Follow the steps below to complete your admission.</p>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Application Progress</h3>
                
                <div className="stepper-container">
                    {steps.map((step, index) => (
                        <div key={index} className={`stepper-item ${step.status === 'completed' ? 'completed' : step.status === 'current' ? 'active' : ''}`}>
                            <div className="stepper-line" style={{ 
                                backgroundColor: step.status === 'completed' || (steps[index+1]?.status === 'completed' || steps[index+1]?.status === 'current') ? 'var(--success)' : '#e2e8f0' 
                            }}></div>
                            <div className="stepper-circle">
                                {step.status === 'completed' ? '✓' : index + 1}
                            </div>
                            <div className="stepper-label">{step.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginTop: '1rem', padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '1rem' }}>{profile?.admission_step >= 3 ? 'Admission Form Submitted' : 'Next Step: Admission Form'}</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {profile?.admission_step >= 3 
                        ? 'Your form has been submitted and is under review.' 
                        : 'Please provide required details to proceed.'}
                </p>
                {profile?.admission_step < 3 && (
                    <button className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', fontSize: '0.875rem' }} onClick={() => setShowForm(true)}>
                        {profile?.admission_step === 2 ? 'Start Now' : 'Continue'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
