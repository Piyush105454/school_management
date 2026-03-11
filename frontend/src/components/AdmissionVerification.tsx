import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Admission {
    id: number;
    inquiry: {
        student_name: string;
        applied_class: string;
    };
    entry_number: string;
    academic_year: string;
    admission_step: number;
    student_bio?: any;
    address?: any;
    parents_guardians?: any[];
}

const AdmissionVerification: React.FC = () => {
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAdmissions = async () => {
        try {
            const response = await api.get('admissions/admission/');
            setAdmissions(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const handleVerify = async (id: number) => {
        try {
            // In a real app, this would update DocumentChecklist and advance step
            // For now, we manually advance step 3 to 4
            await api.patch(`admissions/profiles/${id}/`, { admission_step: 4 }); 
            alert('Verified successfully!');
            fetchAdmissions();
            setSelectedAdmission(null);
        } catch (err) {
            alert('Verification failed');
        }
    };

    if (loading) return <div>Loading admissions...</div>;

    return (
        <div className="card">
            <h3>Admission Submissions (Step 3 Pending)</h3>
            <div style={{ marginTop: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '1rem' }}>Entry No</th>
                            <th style={{ padding: '1rem' }}>Student Name</th>
                            <th style={{ padding: '1rem' }}>Class</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admissions.map(adm => (
                            <tr key={adm.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{adm.entry_number}</td>
                                <td style={{ padding: '1rem' }}>{adm.inquiry?.student_name}</td>
                                <td style={{ padding: '1rem' }}>{adm.inquiry?.applied_class}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button className="btn" onClick={() => setSelectedAdmission(adm)}>Review Details</button>
                                </td>
                            </tr>
                        ))}
                        {admissions.length === 0 && (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No pending submissions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedAdmission && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>Review: {selectedAdmission.inquiry?.student_name}</h2>
                            <button className="btn" onClick={() => setSelectedAdmission(null)}>Close</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                                    Student Bio
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <p><strong>DOB:</strong> <span style={{ color: selectedAdmission.student_bio?.dob ? 'inherit' : '#94a3b8' }}>{selectedAdmission.student_bio?.dob || 'Pending'}</span></p>
                                    <p><strong>Gender:</strong> <span style={{ color: selectedAdmission.student_bio?.gender ? 'inherit' : '#94a3b8' }}>{selectedAdmission.student_bio?.gender || 'Pending'}</span></p>
                                    <p><strong>Aadhaar:</strong> <span style={{ color: selectedAdmission.student_bio?.aadhaar_number ? 'inherit' : '#94a3b8' }}>{selectedAdmission.student_bio?.aadhaar_number || 'Pending'}</span></p>
                                    <p><strong>Category:</strong> <span style={{ color: selectedAdmission.student_bio?.category ? 'inherit' : '#94a3b8' }}>{selectedAdmission.student_bio?.category || 'Pending'}</span> ({selectedAdmission.student_bio?.caste || 'Pending'})</p>
                                </div>
                                
                                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                                    Address & Bank
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <p><strong>Home Address:</strong> <span style={{ color: selectedAdmission.address ? 'inherit' : '#94a3b8' }}>{selectedAdmission.address ? `${selectedAdmission.address.house_no}, ${selectedAdmission.address.street}, ${selectedAdmission.address.village_town}, ${selectedAdmission.address.district}` : 'Pending'}</span></p>
                                    <p><strong>Bank Name:</strong> {selectedAdmission.student_bio?.bank_details?.bank_name || <span style={{ color: '#94a3b8' }}>Pending</span>}</p>
                                    <p><strong>IFSC Code:</strong> {selectedAdmission.student_bio?.bank_details?.ifsc_code || <span style={{ color: '#94a3b8' }}>Pending</span>}</p>
                                    <p><strong>Account No:</strong> {selectedAdmission.student_bio?.bank_details?.account_number || <span style={{ color: '#94a3b8' }}>Pending</span>}</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                                    Academic & Siblings
                                </h4>
                                {selectedAdmission.student_bio?.previous_academic ? (
                                    <p><strong>Prev School:</strong> {selectedAdmission.student_bio.previous_academic.school_name} (Class: {selectedAdmission.student_bio.previous_academic.last_class})</p>
                                ) : <p style={{ color: '#94a3b8' }}><strong>Prev School:</strong> Pending/None</p>}
                                
                                <p style={{ marginTop: '1rem' }}><strong>Siblings in School:</strong> {selectedAdmission.student_bio?.siblings?.length || 0}</p>
                                {selectedAdmission.student_bio?.siblings && selectedAdmission.student_bio.siblings.length > 0 ? (
                                    selectedAdmission.student_bio.siblings.map((s: any, i: number) => (
                                        <div key={i} style={{ fontSize: '0.85rem', marginLeft: '1rem', padding: '0.5rem', borderLeft: '2px solid var(--primary)', backgroundColor: '#eff6ff', marginTop: '0.5rem' }}>
                                            <strong>{s.name}</strong> - Class {s.class_section}
                                        </div>
                                    ))
                                ) : <p style={{ fontSize: '0.85rem', marginLeft: '1rem', color: '#94a3b8' }}>No siblings mentioned</p>}

                                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>4</span>
                                    Parents/Guardians
                                </h4>
                                {selectedAdmission.parents_guardians && selectedAdmission.parents_guardians.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {selectedAdmission.parents_guardians.map((p: any, i: number) => (
                                            <div key={i} style={{ fontSize: '0.9rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                                <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{p.person_type}</p>
                                                <p><strong>Name:</strong> {p.name || <span style={{ color: '#94a3b8' }}>Pending</span>}</p>
                                                <p><strong>Occ:</strong> {p.occupation || 'N/A'}, <strong>Mob:</strong> {p.phone || 'N/A'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p style={{ color: '#94a3b8' }}>Pending/None</p>}

                                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>5</span>
                                    Declaration
                                </h4>
                                <div style={{ padding: '1rem', backgroundColor: selectedAdmission.student_bio?.declaration?.is_confirmed ? '#ecfdf5' : '#fef2f2', borderRadius: '8px', border: '1px solid ' + (selectedAdmission.student_bio?.declaration?.is_confirmed ? '#10b981' : '#ef4444') }}>
                                    <p><strong>Status:</strong> {selectedAdmission.student_bio?.declaration?.is_confirmed ? <span style={{ color: '#10b981', fontWeight: 700 }}>Confirmed ✅</span> : <span style={{ color: '#ef4444', fontWeight: 700 }}>Pending ⏳</span>}</p>
                                    {selectedAdmission.student_bio?.declaration?.declaration_date && (
                                        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Signed on: {selectedAdmission.student_bio.declaration.declaration_date}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => handleVerify(selectedAdmission.id)}>
                                Mark Verified (Move to Step 4)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdmissionVerification;
