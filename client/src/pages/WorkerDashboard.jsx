
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Upload, X } from "lucide-react";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

const WorkerDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [aiTrends, setAiTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", search: "" });
  const [selectedIssue, setSelectedIssue] = useState(null);

  // 🛡️ Proof of Work State
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofIssueId, setProofIssueId] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("loggedInUser");
  const department = localStorage.getItem("userDepartment");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchIssues();
    fetchStats();
    fetchAITrends();
  }, []);

  useEffect(() => {
    let result = [...issues];

    if (filters.status && filters.status !== "All") {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters.priority && filters.priority !== "All") {
      result = result.filter((i) => i.priority === filters.priority);
    }
    if (filters.search) {
      result = result.filter((i) =>
        i.title.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredIssues(result);
  }, [issues, filters]);

  const fetchIssues = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/worker/issues", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      });

      const data = await res.json();
      setIssues(data);
      setFilteredIssues(data);
    } catch (err) {
      console.error("Error fetching issues", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/worker/stats", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  };

  const fetchAITrends = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/ai/trends", {
        headers: { Authorization: `Bearer ${token} ` },
      });
      const data = await res.json();
      setAiTrends(data);
    } catch (err) {
      console.error("AI Trend fetch failed:", err);
    }
  };

  // 🟢 Intercept Status Change
  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "Resolved") {
      setProofIssueId(id);
      setProofModalOpen(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  // 📸 Handle Proof Image Selection
  const handleProofImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  // 📤 Submit Proof & Resolve
  const submitProof = async () => {
    if (!proofImage) return alert("Please upload a proof image.");

    setUploadingProof(true);
    try {
      // 1. Upload Image
      const fd = new FormData();
      fd.append("image", proofImage);

      const uploadRes = await fetch("http://localhost:8080/api/vision/analyze", {
        method: "POST",
        headers: { Authorization: `Bearer ${token} ` },
        body: fd,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("Image upload failed");

      const proofUrl = uploadData.imageUrl;

      // 2. Update Status with Proof URL
      await updateStatus(proofIssueId, "Resolved", proofUrl);

      // Cleanup
      setProofModalOpen(false);
      setProofImage(null);
      setProofPreview(null);
      setProofIssueId(null);

    } catch (err) {
      console.error("Proof submission failed", err);
      alert("Failed to submit proof. Try again.");
    } finally {
      setUploadingProof(false);
    }
  };

  const updateStatus = async (id, status, proofImage = null) => {
    try {
      const body = { status };
      if (proofImage) body.proofImage = proofImage;

      const res = await fetch(`http://localhost:8080/api/worker/issues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Update failed");
        return;
      }

      fetchIssues(); // Refresh list to update UI and maybe remove from list if filtered? (Optional, currently keeps)
      fetchStats();
      fetchAITrends();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  if (loading)
    return <p className="text-center mt-20">Loading dashboard...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{department || "Worker Dashboard"}</h1>
          <p className="text-gray-600">Welcome back, {name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition"
        >
          Logout
        </button>
      </div>

      {/* 🛡️ Proof Upload Modal */}
      {proofModalOpen && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-fadeIn">
            <button
              onClick={() => {
                setProofModalOpen(false);
                setProofImage(null);
                setProofPreview(null);
              }}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">📸 Upload Proof of Resolution</h2>
            <p className="text-sm text-gray-500 text-center mb-6">You must upload a photo to mark this issue as Resolved.</p>

            <div className="space-y-4">
              <label className="block w-full border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer hover:bg-indigo-50 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofImageChange}
                  className="hidden"
                />
                <Upload className="mx-auto text-indigo-500 mb-2" size={32} />
                <p className="font-semibold text-indigo-600">Click to Upload Photo</p>
              </label>

              {proofPreview && (
                <div className="relative rounded-xl overflow-hidden shadow-md border">
                  <img src={proofPreview} alt="Proof Preview" className="w-full h-48 object-cover" />
                </div>
              )}

              <button
                onClick={submitProof}
                disabled={uploadingProof || !proofImage}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold shadow transition"
              >
                {uploadingProof ? "Uploading & Resolving..." : "✅ Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh] animate-fadeIn z-[100000]">
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
            >
              ✕
            </button>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-800 border-b pb-2">{selectedIssue.title}</h2>

              {selectedIssue.imageURL && (
                <div className="mb-6 rounded-xl overflow-hidden shadow-md border">
                  <img
                    src={selectedIssue.imageURL}
                    alt="Issue Evidence"
                    className="w-full h-64 sm:h-80 object-cover"
                  />
                </div>
              )}

              {selectedIssue.proofImage && (
                <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">✅ Resolution Proof</p>
                  <img
                    src={selectedIssue.proofImage}
                    alt="Resolution Proof"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</p>
                  <p className="text-lg font-medium text-slate-800">{selectedIssue.category}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</p>
                  <p className={`text-lg font-bold ${selectedIssue.priority === 'High' ? 'text-red-600' : 'text-slate-700'}`}>
                    {selectedIssue.priority || "Medium"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${selectedIssue.status === "Resolved" ? "bg-green-100 text-green-700" :
                    selectedIssue.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                    {selectedIssue.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</p>
                  <p className="text-sm font-medium text-slate-700 mt-1">{selectedIssue.location?.address || "No address provided"}</p>
                  {selectedIssue.location?.city && <p className="text-xs text-slate-500">{selectedIssue.location.city}, {selectedIssue.location.state}</p>}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-slate-700 leading-relaxed">{selectedIssue.description}</p>
              </div>

              {selectedIssue.resolutionNotes && (
                <div className="mt-6 bg-green-50 p-5 rounded-xl border border-green-100">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Resolution Notes</p>
                  <p className="text-slate-700">{selectedIssue.resolutionNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 text-center">
          <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-gray-600 font-medium">Total Assigned</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 text-center">
          <p className="text-4xl font-bold text-yellow-600">{stats.open}</p>
          <p className="text-gray-600 font-medium">Open Issues</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 text-center">
          <p className="text-4xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-gray-600 font-medium">Resolved</p>
        </div>
      </div>

      {/* 🧠 AI Trend Insights */}
      {aiTrends && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl shadow-lg mb-8 border border-indigo-100">
          <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
            🧠 AI Trend Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl shadow border border-indigo-50">
              <p className="text-xs font-bold text-gray-500 uppercase">Most Reported Category</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">{aiTrends.mostReportedCategory}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-red-50">
              <p className="text-xs font-bold text-gray-500 uppercase">Open Issues</p>
              <p className="text-xl font-bold text-red-600 mt-1">{aiTrends.openIssues}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-green-50">
              <p className="text-xs font-bold text-gray-500 uppercase">Resolved Issues</p>
              <p className="text-xl font-bold text-green-600 mt-1">{aiTrends.resolvedIssues}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Filters */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search by title..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border rounded-lg px-4 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-indigo-300 outline-none"
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border rounded-lg px-4 py-2 w-full md:w-1/4 focus:ring-2 focus:ring-indigo-300 outline-none"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="border rounded-lg px-4 py-2 w-full md:w-1/4 focus:ring-2 focus:ring-indigo-300 outline-none"
        >
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-600">Title</th>
                <th className="p-4 text-left font-semibold text-gray-600">Category</th>
                <th className="p-4 text-left font-semibold text-gray-600">Priority</th>
                <th className="p-4 text-left font-semibold text-gray-600">Status</th>
                <th className="p-4 text-left font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <tr key={issue._id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{issue.title}</td>
                    <td className="p-4 text-gray-600">{issue.category}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${issue.priority === "High" ? "bg-red-100 text-red-700" :
                        issue.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700" // Low or default
                        }`}>
                        {issue.priority || "Medium"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${issue.status === "Resolved" ? "text-green-600" :
                        issue.status === "In Progress" ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow transition flex items-center justify-center pointer-events-auto cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                        className="border rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-300 outline-none text-sm"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No issues found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default WorkerDashboard;
