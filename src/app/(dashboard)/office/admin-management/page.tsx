"use client";

import React, { useEffect, useState } from "react";
import { MoreVertical, X, Plus, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface Admin {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminManagementPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualPassword, setManualPassword] = useState<string>("");
  const [showManualPasswordModal, setShowManualPasswordModal] = useState<string | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>("");
  const [newAdminPassword, setNewAdminPassword] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/list");
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPasswordChange = async (adminId: string) => {
    if (!manualPassword.trim()) {
      setSuccessMessage("Please enter a password");
      return;
    }

    try {
      setResettingId(adminId);
      const response = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password: manualPassword }),
      });

      if (!response.ok) throw new Error("Failed to set password");
      const data = await response.json();
      setSuccessMessage(`Password changed successfully for ${data.email}`);
      setShowManualPasswordModal(null);
      setManualPassword("");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error setting password:", error);
      setSuccessMessage("Error setting password");
    } finally {
      setResettingId(null);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) {
      setSuccessMessage("Please enter email and password");
      return;
    }

    try {
      setResettingId("adding");
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }),
      });

      if (!response.ok) throw new Error("Failed to create admin");
      const data = await response.json();
      setSuccessMessage(`Admin created successfully: ${data.email}`);
      setShowAddAdminModal(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      fetchAdmins();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error creating admin:", error);
      setSuccessMessage("Error creating admin");
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      setDeletingId(adminId);
      const response = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          adminId,
          currentUserEmail: session?.user?.email 
        }),
      });

      if (!response.ok) throw new Error("Failed to delete admin");
      const data = await response.json();
      setSuccessMessage("Admin deleted successfully");
      setOpenMenuId(null);
      
      // If the deleted admin is the current user, logout
      if (data.shouldLogout) {
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 1500);
      } else {
        fetchAdmins();
      }
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error deleting admin:", error);
      setSuccessMessage("Error deleting admin");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Management</h1>
        <p className="text-slate-600">Manage office staff accounts and reset passwords</p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowAddAdminModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Add New Admin
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {admins.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No admin users found in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{admin.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === admin.id ? null : admin.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} className="text-slate-600" />
                        </button>
                        
                        {openMenuId === admin.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                setShowManualPasswordModal(admin.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium border-b border-slate-100 flex items-center gap-2"
                            >
                              Edit Password
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              disabled={deletingId === admin.id}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              Delete Admin
                            </button>
                          </div>
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

      {/* Add New Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add New Admin</h2>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminEmail("");
                  setNewAdminPassword("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="text"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminEmail("");
                  setNewAdminPassword("");
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={resettingId === "adding"}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {resettingId === "adding" ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Password Modal */}
      {showManualPasswordModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Set Custom Password</h2>
              <button
                onClick={() => {
                  setShowManualPasswordModal(null);
                  setManualPassword("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <input
                type="text"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowManualPasswordModal(null);
                  setManualPassword("");
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleManualPasswordChange(showManualPasswordModal)}
                disabled={resettingId === showManualPasswordModal}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {resettingId === showManualPasswordModal ? "Setting..." : "Set Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
