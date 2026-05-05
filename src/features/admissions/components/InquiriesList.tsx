"use client";

import React, { useState } from "react";
import { shortlistInquiry, resetStudentPassword, deleteInquiry, updateInquiry } from "../actions/inquiryActions";
import { 
  UserCheck, 
  Trash2, 
  MoreVertical,
  Search,
  Filter,
  Loader2,
  Key,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Pencil
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InquiriesListProps {
  initialInquiries: any[];
  role?: string;
}

export function InquiriesList({ initialInquiries, role }: InquiriesListProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  // Sync state with props when server data changes (via router.refresh)
  React.useEffect(() => {
    setInquiries(initialInquiries);
  }, [initialInquiries]);

  const filteredInquiries = inquiries.filter(inq => 
    inq.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShortlist = async (id: string) => {
    setLoadingId(id);
    const result = await shortlistInquiry(id) as any;
    setLoadingId(null);

    if (result.success) {
      alert(`STUDENT ACCOUNT CREATED!\n\nEmail: ${result.credentials?.email}\nPassword: ${result.credentials?.password}\n\nPlease share these credentials with the student.`);
      router.refresh();
      setInquiries(inquiries.map(inq => 
        inq.id === id ? { ...inq, status: "SHORTLISTED" } : inq
      ));
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedInquiry) return;
    setResetting(true);
    const result = await resetStudentPassword(selectedInquiry.email) as any;
    setResetting(false);
    if (result.success) {
      setNewCredentials(result.credentials);
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    const result = await deleteInquiry(id) as any;
    if (result.success) {
      alert("Inquiry deleted successfully");
      setInquiries(inquiries.filter(inq => inq.id !== id));
    } else {
      alert("Error deleting inquiry: " + result.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 font-outfit">All Inquiries</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search inquiries..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Parent</th>
                <th className="px-6 py-4">Aadhaar</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                      {inq.entryNumber || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">{inq.studentName}</p>
                      <p className="text-[10px] text-slate-500">{inq.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{inq.parentName}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-mono">{inq.aadhaarNumber || '---'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{inq.phone}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {inq.appliedClass?.toLowerCase().startsWith('class') 
                        ? inq.appliedClass 
                        : `Class ${inq.appliedClass || '---'}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                      inq.status === 'SHORTLISTED' 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                    }`}>
                      {inq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                    {new Date(inq.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inq.status === 'SHORTLISTED' && (
                        <button 
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setNewCredentials(null);
                            setShowAccountModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Login Details"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                      {inq.status !== 'SHORTLISTED' && (
                        <button 
                          onClick={() => handleShortlist(inq.id)}
                          disabled={loadingId === inq.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Shortlist & Create Account"
                        >
                          {loadingId === inq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingInquiry(inq);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                        title="Edit Inquiry"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {role !== "TEACHER" && (
                        <button 
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete Inquiry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        title="Student Login Details"
      >
        {selectedInquiry && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Student Name</p>
                  <p className="text-lg font-black text-slate-900">{selectedInquiry.studentName}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Aadhaar Number</p>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <code className="text-slate-600 font-bold">{selectedInquiry.aadhaarNumber || 'Not provided'}</code>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Login Email</p>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <code className="text-blue-600 font-bold">{selectedInquiry.email}</code>
                  <button onClick={() => copyToClipboard(selectedInquiry.email)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all">
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Password</p>
                {newCredentials || selectedInquiry.passwordPlain ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100">
                    <code className="text-green-700 font-bold">
                      {newCredentials ? newCredentials.password : selectedInquiry.passwordPlain}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(newCredentials ? newCredentials.password : selectedInquiry.passwordPlain)} 
                      className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-all"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 italic">••••••••••••</span>
                      <button 
                        onClick={handleResetPassword}
                        disabled={resetting}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {resetting ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                        Reset & Show
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      ⚠️ Password was created before tracking. You must reset it to view a new one.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowAccountModal(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
              <Link 
                href="/" 
                target="_blank"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                Go to Login <ExternalLink size={18} />
              </Link>
            </div>
          </div>
        )}
      </Modal>
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Inquiry Details"
      >
        {editingInquiry && (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              
              setUpdating(true);
              const result = await updateInquiry(editingInquiry.id, data) as any;
              setUpdating(false);
              
              if (result.success) {
                alert("Updated successfully!");
                setShowEditModal(false);
                router.refresh();
              } else {
                alert("Error: " + result.error);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                <input name="firstName" defaultValue={editingInquiry.firstName} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                <input name="lastName" defaultValue={editingInquiry.lastName} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Parent Name</label>
              <input name="parentName" defaultValue={editingInquiry.parentName} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input name="email" type="email" defaultValue={editingInquiry.email} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                <input name="phone" defaultValue={editingInquiry.phone} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Aadhaar</label>
                <input name="aadhaarNumber" defaultValue={editingInquiry.aadhaarNumber} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Applied Class</label>
                <select name="appliedClass" defaultValue={editingInquiry.appliedClass} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select Class</option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                  <option value="Senior 1st Year">Senior 1st Year</option>
                  <option value="Senior 2nd Year">Senior 2nd Year</option>
                  <option value="Senior 3rd Year">Senior 3rd Year</option>
                  <option value="Senior 4th Year">Senior 4th Year</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">School / Institute</label>
              <select name="school" defaultValue={editingInquiry.school} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                 <option value="Dhanpuri Public School">Dhanpuri Public School</option>
                 <option value="WES Academy">WES Academy</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={updating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
