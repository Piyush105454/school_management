"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Loader2, 
  MessageSquare, 
  Send, 
  X, 
  Trash2, 
  User, 
  Tag 
} from "lucide-react";
import Link from "next/link";

export default function TaskDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    underReview: 0,
    completed: 0,
    overdue: 0
  });

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchTasks = () => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        const fetchedTasks = data.tasks || [];
        setTasks(fetchedTasks);
        setStats(prev => ({
          ...prev,
          total: fetchedTasks.length,
          completed: fetchedTasks.filter((t: any) => t.status === "COMPLETED").length,
          inProgress: fetchedTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
          todo: fetchedTasks.filter((t: any) => t.status === "TODO").length,
          underReview: fetchedTasks.filter((t: any) => t.status === "UNDER_REVIEW").length,
        }));

        // Keep active task updated if modal is open
        if (activeTask) {
          const updated = fetchedTasks.find((t: any) => t.id === activeTask.id);
          if (updated) {
            setActiveTask(updated);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePriority = async (taskId: string, newPriority: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !replyMessage.trim()) return;
    setSendingMsg(true);

    try {
      const res = await fetch(`/api/tasks/${activeTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage })
      });
      if (res.ok) {
        setReplyMessage("");
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (activeTask?.id === taskId) {
          setActiveTask(null);
        }
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getChatCount = (commentsStr: string | null) => {
    if (!commentsStr) return 0;
    try {
      const parsed = JSON.parse(commentsStr);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (e) {
      return 1;
    }
  };

  const getChatMessages = (commentsStr: string | null) => {
    if (!commentsStr) return [];
    try {
      const parsed = JSON.parse(commentsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [{ senderName: "System", message: commentsStr, timestamp: new Date().toISOString(), senderRole: "SYSTEM" }];
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Task Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of tasks and progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks/create"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            Create Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats.total} icon={LayoutDashboard} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="To Do" value={stats.todo} icon={Calendar} color="text-slate-600" bg="bg-slate-50" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Under Review" value={stats.underReview} icon={AlertCircle} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            You don't have any tasks assigned yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-center">Chat</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map(task => {
                  const chatCount = getChatCount(task.comments);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{task.title}</p>
                        {task.project && <p className="text-xs text-slate-500 font-semibold">{task.project.name}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                          className={`px-3 py-1 rounded-full border text-xs font-bold bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            task.status === "COMPLETED" ? "text-emerald-700 border-emerald-200 bg-emerald-50/20" :
                            task.status === "IN_PROGRESS" ? "text-amber-700 border-amber-200 bg-amber-50/20" :
                            task.status === "UNDER_REVIEW" ? "text-purple-700 border-purple-200 bg-purple-50/20" :
                            "text-slate-700 border-slate-200 bg-slate-50/20"
                          }`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={task.priority}
                          onChange={(e) => handleUpdatePriority(task.id, e.target.value)}
                          className={`px-3 py-1 rounded-full border text-xs font-bold bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            task.priority === "URGENT" || task.priority === "HIGH" ? "text-red-700 border-red-200 bg-red-50/20" :
                            task.priority === "MEDIUM" ? "text-amber-700 border-amber-200 bg-amber-50/20" :
                            "text-emerald-700 border-emerald-200 bg-emerald-50/20"
                          }`}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setActiveTask(task)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-extrabold transition-all active:scale-95 shadow-sm shadow-blue-500/5"
                        >
                          <MessageSquare size={13} />
                          <span>View & Chat</span>
                          <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-[10px] ml-1">
                            {chatCount}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(session?.user?.role === "ADMIN" || session?.user?.role === "OFFICE") && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            title="Delete Task"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chat Thread Modal */}
      {activeTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Task Detail Thread
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">{activeTask.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-2 font-medium">
                  {activeTask.assignedTo && (
                    <span className="flex items-center gap-1">
                      <User size={13} /> Assigned To: <strong>{activeTask.assignedTo.email.split("@")[0]} ({activeTask.assignedTo.role})</strong>
                    </span>
                  )}
                  {activeTask.project && (
                    <span className="flex items-center gap-1">
                      <Tag size={13} /> Project: <strong>{activeTask.project.name}</strong>
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setActiveTask(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick selectors row inside modal */}
            <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                <select 
                  value={activeTask.priority}
                  onChange={(e) => handleUpdatePriority(activeTask.id, e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Change Status</label>
                <select 
                  value={activeTask.status}
                  onChange={(e) => handleUpdateStatus(activeTask.id, e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4 min-h-[250px]">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">
                Conversation Thread
              </span>

              {/* Task description as the initial message */}
              {activeTask.description && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 max-w-[85%] shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Initial Brief
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{activeTask.description}</p>
                  </div>
                </div>
              )}

              {/* List of chat comments */}
              {getChatMessages(activeTask.comments).map((msg: any, idx: number) => {
                const isMe = msg.senderId === session?.user?.id;
                return (
                  <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-2xl p-4 max-w-[85%] shadow-sm leading-relaxed ${
                      isMe 
                        ? "bg-blue-600 text-white" 
                        : "bg-white border border-slate-100 text-slate-700"
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isMe ? "text-blue-100" : "text-slate-400"}`}>
                          {msg.senderName}
                        </span>
                        {msg.senderRole && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            isMe ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-500"
                          }`}>
                            {msg.senderRole}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold whitespace-pre-wrap">{msg.message}</p>
                      <span className={`block text-[9px] mt-2 text-right ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Reply Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-3 bg-white">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply... (Enter to send)"
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
              <button
                type="submit"
                disabled={sendingMsg || !replyMessage.trim()}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-all flex items-center justify-center active:scale-95 shadow-sm shadow-blue-500/20"
              >
                {sendingMsg ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
