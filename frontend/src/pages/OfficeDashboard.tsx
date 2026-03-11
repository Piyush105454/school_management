import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSearchParams } from 'react-router-dom';

interface Inquiry {
    id: number;
    student_name: string;
    parent_name: string;
    email: string;
    status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
    entry_number: string | null;
}

const OfficeDashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view');
    
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [newInquiry, setNewInquiry] = useState({
        student_name: '',
        parent_name: '',
        email: '',
        phone: '',
        applied_class: '',
        academic_year: '2025'
    });

    const showForm = view === 'inquiry';

    const setShowForm = (show: boolean) => {
        if (show) {
            setSearchParams({ view: 'inquiry' });
        } else {
            setSearchParams({});
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const response = await api.get('admissions/inquiries/');
            setInquiries(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('admissions/inquiries/', newInquiry);
            setShowForm(false);
            fetchInquiries();
            setNewInquiry({ student_name: '', parent_name: '', email: '', phone: '', applied_class: '', academic_year: '2025' });
        } catch (err) {
            alert('Error creating inquiry');
        }
    };

    const handleShortlist = async (id: number) => {
        try {
            const response = await api.post(`admissions/inquiries/${id}/shortlist/`);
            alert(`Credentials Generated!\nUser: ${response.data.entry_number}\nPass: ${response.data.password}`);
            fetchInquiries();
        } catch (err) {
            alert('Error shortlisting student');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Overview</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'View Inquiries' : '+ New Inquiry'}
                </button>
            </div>

            {showForm ? (
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h3>Register New Inquiry</h3>
                    <form onSubmit={handleCreateInquiry} style={{ marginTop: '1.5rem' }}>
                        <input className="input" placeholder="Student Name" value={newInquiry.student_name} onChange={e => setNewInquiry({...newInquiry, student_name: e.target.value})} required />
                        <input className="input" placeholder="Parent Name" value={newInquiry.parent_name} onChange={e => setNewInquiry({...newInquiry, parent_name: e.target.value})} required />
                        <input className="input" type="email" placeholder="Email" value={newInquiry.email} onChange={e => setNewInquiry({...newInquiry, email: e.target.value})} required />
                        <input className="input" placeholder="Phone" value={newInquiry.phone} onChange={e => setNewInquiry({...newInquiry, phone: e.target.value})} required />
                        <input className="input" placeholder="Applying For Class" value={newInquiry.applied_class} onChange={e => setNewInquiry({...newInquiry, applied_class: e.target.value})} required />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Inquiry</button>
                    </form>
                </div>
            ) : (
                <div className="card">
                    <h3>Recent Inquiries</h3>
                    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem' }}>Student</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map(inq => (
                                    <tr key={inq.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>{inq.student_name}</td>
                                        <td style={{ padding: '1rem' }}>{inq.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                padding: '0.25rem 0.75rem', 
                                                borderRadius: '20px', 
                                                fontSize: '0.875rem',
                                                backgroundColor: inq.status === 'SHORTLISTED' ? 'var(--success)' : '#e2e8f0',
                                                color: inq.status === 'SHORTLISTED' ? 'white' : 'var(--text-main)'
                                            }}>
                                                {inq.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {inq.status === 'PENDING' && (
                                                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => handleShortlist(inq.id)}>
                                                    Shortlist
                                                </button>
                                            )}
                                            {inq.status === 'SHORTLISTED' && <span style={{ color: 'var(--text-muted)' }}>{inq.entry_number}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficeDashboard;
