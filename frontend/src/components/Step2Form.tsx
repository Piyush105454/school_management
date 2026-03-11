import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface ProfileData {
    id: number;
    dob: string;
    gender: string;
    blood_group: string;
    address: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    previous_school: string;
}

const Step2Form: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        dob: '',
        gender: '',
        blood_group: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        previous_school: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('admissions/profiles/my_profile/');
            setProfile(response.data);
            setFormData({
                dob: response.data.dob || '',
                gender: response.data.gender || '',
                blood_group: response.data.blood_group || '',
                address: response.data.address || '',
                emergency_contact_name: response.data.emergency_contact_name || '',
                emergency_contact_phone: response.data.emergency_contact_phone || '',
                previous_school: response.data.previous_school || ''
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        try {
            await api.post(`admissions/profiles/${profile.id}/submit_form/`, formData);
            alert('Form submitted successfully! Your documents will now be verified.');
            onSuccess();
        } catch (err) {
            alert('Error submitting form');
        }
    };

    if (loading) return <div>Loading Form...</div>;

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Step 2: Detailed Admission Form</h2>
            <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label">Date of Birth</label>
                    <input type="date" className="input" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label">Gender</label>
                    <select className="input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label">Blood Group</label>
                    <input className="input" placeholder="e.g. O+" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label">Previous School</label>
                    <input className="input" value={formData.previous_school} onChange={e => setFormData({...formData, previous_school: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label className="label">Full Residential Address</label>
                    <textarea className="input" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label">Emergency Contact Name</label>
                    <input className="input" value={formData.emergency_contact_name} onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label className="label">Emergency Contact Phone</label>
                    <input className="input" value={formData.emergency_contact_phone} onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Admission Form</button>
                </div>
            </form>
        </div>
    );
};

export default Step2Form;
