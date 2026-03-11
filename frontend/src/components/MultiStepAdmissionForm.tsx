import React, { useState } from 'react';
import api from '../services/api';

interface Props {
    admissionId: number;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const MultiStepAdmissionForm: React.FC<Props> = ({ admissionId, initialData, onSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        student_bio: initialData?.student_bio || {
            first_name: '', middle_name: '', last_name: '', gender: 'M', dob: '', age: 0,
            religion: '', caste: 'GEN', family_id: '', blood_group: '', height_cm: '',
            weight_kg: '', aadhaar_number: '', samagra_id: '', cwsn: false, cwsn_problem_desc: ''
        },
        address: initialData?.address || {
            house_no: '', ward_no: '', street: '', village_town: '', tehsil: '', district: '', state: '', pin_code: ''
        },
        bank_details: initialData?.bank_details || {
            bank_name: '', account_holder_name: '', account_number: '', ifsc_code: '', note: ''
        },
        previous_academic: initial_academic(initialData),
        siblings: initialData?.siblings || [],
        parents_guardians: initial_parents(initialData),
        declaration: initialData?.declaration || { declaration_accepted: false, guardian_name: '' }
    });

    function initial_academic(data: any) {
        return data?.previous_academic || {
            school_name: '', school_type: 'PRIVATE', apaar_id: '', pen_number: '',
            class_last_attended: '', session_year: '', marks_obtained: '', total_marks: '', percentage: '', pass_fail: 'PASS'
        };
    }

    function initial_parents(data: any) {
        if (data?.parents_guardians?.length > 0) return data.parents_guardians;
        return [
            { person_type: 'FATHER', name: '', mobile_number: '', occupation: '', educational_qualification: '', aadhaar_number: '', samagra_number: '' },
            { person_type: 'MOTHER', name: '', mobile_number: '', occupation: '', educational_qualification: '', aadhaar_number: '', samagra_number: '' }
        ];
    }

    const handleChange = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev] as any,
                [field]: value
            }
        }));
    };

    const handleSiblingChange = (index: number, field: string, value: any) => {
        const newSiblings = [...formData.siblings];
        newSiblings[index] = { ...newSiblings[index], [field]: value };
        setFormData(prev => ({ ...prev, siblings: newSiblings }));
    };

    const addSibling = () => {
        if (formData.siblings.length < 3) {
            setFormData(prev => ({
                ...prev,
                siblings: [...prev.siblings, { sibling_number: prev.siblings.length + 1, name: '', age: '', gender: 'M', class_current: '', school_name: '' }]
            }));
        }
    };

    const handleParentChange = (index: number, field: string, value: any) => {
        const newParents = [...formData.parents_guardians];
        newParents[index] = { ...newParents[index], [field]: value };
        setFormData(prev => ({ ...prev, parents_guardians: newParents }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post(`admissions/admission/${admissionId}/submit_full_form/`, formData);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit form');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="form-section">
                        <h3 className="section-title"><span>👤</span> Step 1: Student Bio-Data</h3>
                        <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Please provide the legal name and basic identification details of the student.</p>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name*</label>
                                <input type="text" placeholder="e.g. John" value={formData.student_bio.first_name} onChange={(e) => handleChange('student_bio', 'first_name', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Middle Name</label>
                                <input type="text" placeholder="Optional" value={formData.student_bio.middle_name} onChange={(e) => handleChange('student_bio', 'middle_name', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Last Name*</label>
                                <input type="text" placeholder="e.g. Doe" value={formData.student_bio.last_name} onChange={(e) => handleChange('student_bio', 'last_name', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Gender*</label>
                                <select value={formData.student_bio.gender} onChange={(e) => handleChange('student_bio', 'gender', e.target.value)}>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date of Birth*</label>
                                <input type="date" value={formData.student_bio.dob} onChange={(e) => handleChange('student_bio', 'dob', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Age*</label>
                                <input type="number" placeholder="Years" value={formData.student_bio.age} onChange={(e) => handleChange('student_bio', 'age', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Caste Category*</label>
                                <select value={formData.student_bio.caste} onChange={(e) => handleChange('student_bio', 'caste', e.target.value)}>
                                    <option value="GEN">General (Unreserved)</option>
                                    <option value="OBC">Other Backward Class</option>
                                    <option value="ST">Scheduled Tribe</option>
                                    <option value="SC">Scheduled Caste</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Aadhaar Number (12-digit)</label>
                                <input type="text" placeholder="0000 0000 0000" value={formData.student_bio.aadhaar_number} onChange={(e) => handleChange('student_bio', 'aadhaar_number', e.target.value)} maxLength={12} />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="form-section">
                        <h3 className="section-title">Step 2: Address & Bank</h3>
                        
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Permanent Address</h4>
                            <div className="form-grid" style={{ marginBottom: 0 }}>
                                <div className="form-group">
                                    <label>House/Flat No*</label>
                                    <input type="text" value={formData.address.house_no} onChange={(e) => handleChange('address', 'house_no', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Street/Colony*</label>
                                    <input type="text" value={formData.address.street} onChange={(e) => handleChange('address', 'street', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Village/Town*</label>
                                    <input type="text" value={formData.address.village_town} onChange={(e) => handleChange('address', 'village_town', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Tehsil/Block*</label>
                                    <input type="text" value={formData.address.tehsil} onChange={(e) => handleChange('address', 'tehsil', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>District*</label>
                                    <input type="text" value={formData.address.district} onChange={(e) => handleChange('address', 'district', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>State*</label>
                                    <input type="text" value={formData.address.state} onChange={(e) => handleChange('address', 'state', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Pin Code*</label>
                                    <input type="text" placeholder="000000" value={formData.address.pin_code} onChange={(e) => handleChange('address', 'pin_code', e.target.value)} maxLength={6} required />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Bank Details</h4>
                            <div className="form-grid" style={{ marginBottom: 0 }}>
                                <div className="form-group">
                                    <label>Bank Name</label>
                                    <input type="text" placeholder="e.g. State Bank" value={formData.bank_details.bank_name} onChange={(e) => handleChange('bank_details', 'bank_name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Account Holder Name</label>
                                    <input type="text" placeholder="Same as Bio-data?" value={formData.bank_details.account_holder_name} onChange={(e) => handleChange('bank_details', 'account_holder_name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input type="text" placeholder="Account No." value={formData.bank_details.account_number} onChange={(e) => handleChange('bank_details', 'account_number', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>IFSC Code</label>
                                    <input type="text" placeholder="SBIN0000..." value={formData.bank_details.ifsc_code} onChange={(e) => handleChange('bank_details', 'ifsc_code', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="form-section">
                        <h3 className="section-title">Step 3: Academic & Siblings</h3>
                        
                        <div style={{ marginBottom: '1.25rem' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Previous Schooling</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Last School Name</label>
                                    <input type="text" placeholder="Institution name" value={formData.previous_academic.school_name} onChange={(e) => handleChange('previous_academic', 'school_name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Class Attended</label>
                                    <input type="text" placeholder="e.g. Class 5" value={formData.previous_academic.class_last_attended} onChange={(e) => handleChange('previous_academic', 'class_last_attended', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Percentage (%)</label>
                                    <input type="number" placeholder="%" value={formData.previous_academic.percentage} onChange={(e) => handleChange('previous_academic', 'percentage', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Marks Obtained</label>
                                    <input type="number" value={formData.previous_academic.marks_obtained} onChange={(e) => handleChange('previous_academic', 'marks_obtained', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Total Marks</label>
                                    <input type="number" value={formData.previous_academic.total_marks} onChange={(e) => handleChange('previous_academic', 'total_marks', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700 }}>Siblings in this School</h4>
                                {formData.siblings.length < 3 && (
                                    <button type="button" className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem', width: '100%' }} onClick={addSibling}>+ Add Sibling</button>
                                )}
                            </div>
                            
                            {formData.siblings.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No siblings here.</p>
                            )}

                            {formData.siblings.map((sib: any, index: number) => (
                                <div key={index} className="form-grid" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div className="form-group">
                                        <label>Sibling Name</label>
                                        <input type="text" value={sib.name} onChange={(e) => handleSiblingChange(index, 'name', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Age</label>
                                        <input type="number" value={sib.age} onChange={(e) => handleSiblingChange(index, 'age', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Current School</label>
                                        <input type="text" value={sib.school_name} onChange={(e) => handleSiblingChange(index, 'school_name', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Class</label>
                                        <input type="text" value={sib.class_current} onChange={(e) => handleSiblingChange(index, 'class_current', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select value={sib.gender} onChange={(e) => handleSiblingChange(index, 'gender', e.target.value)}>
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="O">Other</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="form-section">
                        <h3 className="section-title">Step 4: Parent & Guardian Details</h3>
                        <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Provide contact and background information for parents or legal guardians.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formData.parents_guardians.map((p: any, index: number) => (
                                <div key={index} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', backgroundColor: '#fff' }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>{p.person_type} Information</h4>
                                    <div className="form-grid" style={{ marginBottom: 0 }}>
                                        <div className="form-group">
                                            <label>Full Name*</label>
                                            <input type="text" value={p.name} onChange={(e) => handleParentChange(index, 'name', e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Mobile*</label>
                                            <input type="text" placeholder="10 digit" value={p.mobile_number} onChange={(e) => handleParentChange(index, 'mobile_number', e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Occupation</label>
                                            <input type="text" placeholder="e.g. Business" value={p.occupation} onChange={(e) => handleParentChange(index, 'occupation', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Qualification</label>
                                            <input type="text" value={p.educational_qualification} onChange={(e) => handleParentChange(index, 'educational_qualification', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="form-section" style={{ textAlign: 'center' }}>
                        <h3 className="section-title" style={{ justifyContent: 'center' }}>Step 5: Final Declaration</h3>
                        
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ border: '1px solid var(--border)', textAlign: 'left', padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'white' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '0.9rem' }}>Self-Declaration Statement</h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)', fontStyle: 'italic' }}>
                                    "I hereby solemnly declare that all information furnished in this application is true, complete and correct to the best of my knowledge and belief. 
                                    I am aware that if any information is found false or incorrect at any stage, the candidacy/admission will be liable for cancellation."
                                </p>
                                
                                <div style={{ 
                                    marginTop: '1.5rem', 
                                    padding: '1rem', 
                                    backgroundColor: '#f8fafc', 
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input 
                                            type="checkbox" 
                                            style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                                            checked={formData.declaration.declaration_accepted} 
                                            onChange={(e) => handleChange('declaration', 'declaration_accepted', e.target.checked)}
                                            id="decl"
                                        />
                                        <label htmlFor="decl" style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                                            I confirm and accept the declaration
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Electronic Signature (Parent/Guardian Full Name)*</label>
                                    <input 
                                        type="text" 
                                        style={{ fontSize: '1.1rem', fontFamily: 'monospace', textAlign: 'center', padding: '0.75rem', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, borderBottomWidth: '1px', backgroundColor: 'transparent' }}
                                        value={formData.declaration.guardian_name} 
                                        onChange={(e) => handleChange('declaration', 'guardian_name', e.target.value)}
                                        placeholder="Type full name here"
                                        required
                                    />
                                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>By typing your name, you are signing this application electronically.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>Admission Form</h1>
                    <button className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', backgroundColor: '#f1f5f9', color: '#475569' }} onClick={onCancel}>Close</button>
                </div>

                {/* Progress bar */}
                <div className="progress-container" style={{ marginBottom: '2rem' }}>
                    {[
                        { step: 1, label: 'Bio' },
                        { step: 2, label: 'Address' },
                        { step: 3, label: 'Academic' },
                        { step: 4, label: 'Parents' },
                        { step: 5, label: 'Confirm' }
                    ].map(s => (
                        <div 
                            key={s.step} 
                            className={`progress-step ${s.step <= step ? 'active' : ''}`}
                            data-step={s.step}
                        >
                            <span className="progress-label" style={{ fontSize: '0.65rem' }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {error && (
                    <div style={{ 
                        padding: '1rem', 
                        backgroundColor: '#fef2f2', 
                        color: 'var(--error)', 
                        borderRadius: '0.75rem', 
                        marginBottom: '1.5rem',
                        border: '1px solid #fee2e2',
                        fontSize: '0.875rem',
                        fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>
                    <div style={{ minHeight: '250px' }}>
                        {renderStep()}
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        marginTop: '1.5rem', 
                        paddingTop: '1.25rem', 
                        borderTop: '1px solid var(--border)',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <button 
                            type="button" 
                            className="btn" 
                            style={{ backgroundColor: '#f1f5f9', color: '#475569', flex: '1', minWidth: '100px' }}
                            onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
                        >
                            {step > 1 ? 'Back' : 'Cancel'}
                        </button>

                        {step < 5 ? (
                            <button type="button" className="btn btn-primary" style={{ flex: '2', minWidth: '150px' }} onClick={() => setStep(step + 1)}>
                                Next: {step === 1 ? 'Address' : step === 2 ? 'Academic' : step === 3 ? 'Parents' : 'Declaration'}
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleSubmit}
                                disabled={loading || !formData.declaration.declaration_accepted}
                                style={{ flex: '2', minWidth: '150px' }}
                            >
                                {loading ? 'Submitting...' : 'Final Submit'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MultiStepAdmissionForm;
