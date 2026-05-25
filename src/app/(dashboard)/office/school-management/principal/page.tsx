"use client";

import React, { useEffect, useState } from "react";
import { MoreVertical, X, Plus, Trash2, Shield, Calendar, Key, AlertTriangle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface Principal {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function PrincipalManagementPage() {
  const { data: session } = useSession();
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Custom password states
  const [manualPassword, setManualPassword] = useState<string>("");
  const [showManualPasswordModal, setShowManualPasswordModal] = useState<string | null>(null);
  
  // Add principal states
  const [showAddPrincipalModal, setShowAddPrincipalModal] = useState(false);
  const [newPrincipalEmail, setNewPrincipalEmail] = useState<string>("");
  const [newPrincipalPassword, setNewPrincipalPassword] = useState<string>("");
  
  // Dropdown states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrincipals();
  }, []);

  const fetchPrincipals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/principal/list");
      if (!response.ok) throw new Error("Failed to fetch principals");
      const data = await response.json();
      setPrincipals(data);
    } catch (error) {
      console.error("Error fetching principals:", error);
      setErrorMessage("Failed to fetch principal accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualPasswordChange = async (principalId: string) => {
    if (!manualPassword.trim()) {
      setErrorMessage("Please enter a password");
      return;
    }
    if (manualPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    try {
      setActionLoading(principalId);
      setErrorMessage(null);
      const response = await fetch("/api/principal/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principalId, password: manualPassword }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to set password");

      setSuccessMessage(`Password updated successfully for ${resData.email}`);
      setShowManualPasswordModal(null);
      setManualPassword("");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error("Error setting password:", error);
      setErrorMessage(error.message || "Error updating password");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddPrincipal = async () => {
    if (!newPrincipalEmail.trim() || !newPrincipalPassword.trim()) {
      setErrorMessage("Please enter both email and password");
      return;
    }
    if (newPrincipalPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    try {
      setActionLoading("adding");
      setErrorMessage(null);
      const response = await fetch("/api/principal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newPrincipalEmail, password: newPrincipalPassword }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to create principal");

      setSuccessMessage(`Principal account created successfully: ${resData.email}`);
      setShowAddPrincipalModal(false);
      setNewPrincipalEmail("");
      setNewPrincipalPassword("");
      fetchPrincipals();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error("Error creating principal:", error);
      setErrorMessage(error.message || "Error creating principal account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePrincipal = async (principalId: string) => {
    if (!confirm("Are you sure you want to delete this Principal account?")) return;

    try {
      setActionLoading(principalId);
      setErrorMessage(null);
      const response = await fetch("/api/principal/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          principalId,
          currentUserEmail: session?.user?.email 
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to delete principal");

      setSuccessMessage("Principal account deleted successfully");
      setOpenMenuId(null);
      
      if (resData.shouldLogout) {
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 1500);
      } else {
        fetchPrincipals();
      }
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error("Error deleting principal:", error);
      setErrorMessage(error.message || "Error deleting principal account");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 tracking-wide">Loading Principal accounts...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">Principal Management</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Manage and configure administrative principal accounts and security credentials.</p>
        </div>
        
        <button
          onClick={() => setShowAddPrincipalModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-slate-900/10 active:scale-95 shrink-0"
        >
          <Plus size={18} strokeWidth={2.5} />
          Setup Principal Account
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {principals.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <span className="text-2xl">👔</span>
            </div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">No Principal Accounts Configured</h3>
            <p className="text-xs text-slate-400 font-medium max-w-sm">There are no administrative principal logins created yet. Click the button above to setup the primary administrative account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Principal Account Email</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Role / Access</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Account Created</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {principals.map((principal) => (
                  <tr key={principal.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold shadow-sm">
                        <Shield size={16} />
                      </div>
                      {principal.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
                        {principal.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium flex items-center gap-2 mt-2 border-none">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(principal.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === principal.id ? null : principal.id)}
                          className="p-2 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
                        >
                          <MoreVertical size={18} className="text-slate-500" />
                        </button>
                        
                        {openMenuId === principal.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                              <button
                                onClick={() => {
                                  setShowManualPasswordModal(principal.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 transition-colors"
                              >
                                <Key size={14} className="text-slate-500" />
                                Edit Password
                              </button>
                              <button
                                onClick={() => handleDeletePrincipal(principal.id)}
                                disabled={actionLoading === principal.id}
                                className="w-full text-left px-4 py-3 hover:bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                                Delete Account
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Principal Modal */}
      {showAddPrincipalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <h2 className="text-lg font-black text-slate-900 font-outfit uppercase tracking-tight">Setup Principal Account</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddPrincipalModal(false);
                  setNewPrincipalEmail("");
                  setNewPrincipalPassword("");
                  setErrorMessage(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newPrincipalEmail}
                  onChange={(e) => setNewPrincipalEmail(e.target.value)}
                  placeholder="principal@school.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm font-bold placeholder:text-slate-300 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Access Password
                </label>
                <input
                  type="text"
                  value={newPrincipalPassword}
                  onChange={(e) => setNewPrincipalPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm font-bold placeholder:text-slate-300 transition-all bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddPrincipalModal(false);
                  setNewPrincipalEmail("");
                  setNewPrincipalPassword("");
                  setErrorMessage(null);
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrincipal}
                disabled={actionLoading === "adding"}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-colors font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {actionLoading === "adding" ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Password Modal */}
      {showManualPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Key size={16} />
                </div>
                <h2 className="text-lg font-black text-slate-900 font-outfit uppercase tracking-tight">Update Password</h2>
              </div>
              <button
                onClick={() => {
                  setShowManualPasswordModal(null);
                  setManualPassword("");
                  setErrorMessage(null);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  New Password
                </label>
                <input
                  type="text"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm font-bold placeholder:text-slate-300 transition-all bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowManualPasswordModal(null);
                  setManualPassword("");
                  setErrorMessage(null);
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManualPasswordChange(showManualPasswordModal)}
                disabled={actionLoading === showManualPasswordModal}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-colors font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {actionLoading === showManualPasswordModal ? "Setting..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
