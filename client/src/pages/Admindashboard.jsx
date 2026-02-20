import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

import CityHeatmap from "../components/CityHeatmap";
import CreateWorker from "../components/CreateWorker";
import IoTControlPanel from "../components/IoTControlPanel";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];
const CATEGORIES = [
  "Garbage",
  "Water Leak",
  "Road Safety",
  "Pothole",
  "Streetlight",
  "Other",
  "IoT Auto Detection", // Added for filter compatibility
];
const SORT_OPTIONS = [
  { label: "Latest first", value: "latest" },
  { label: "Oldest first", value: "oldest" },
];

const STAFF_OPTIONS = [
  "Public Works Department (PWD)",
  "Municipal Sanitation Team",
  "Water Supply Department",
  "Road Maintenance Division",
  "Streetlight Maintenance Unit",
  "Drainage & Sewage Department",
  "Waste Management Authority",
  "Parks & Horticulture Department",
  "Traffic & Road Safety Cell",
  "Building & Construction Division",
];

const StatCard = ({ label, value, color = "indigo" }) => (
  <div className={`p-6 rounded-2xl shadow-lg bg-${color}-50 text-center`}>
    <p className="text-3xl font-extrabold">{value}</p>
    <p className="mt-1 text-slate-700">{label}</p>
  </div>
);

const TrendCard = ({ title, value, color = "indigo" }) => (
  <div className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition">
    <p className="text-slate-600">{title}</p>
    <p className={`text-xl font-bold text-${color}-600 mt-1`}>{value}</p>
  </div>
);

const FilterSelect = ({ options, value, onChange, placeholder }) => (
  <select
    className="border px-5 py-3 rounded-xl focus:ring-2 focus:ring-indigo-400 transition"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o}>{o}</option>
    ))}
  </select>
);

const CityIssueMap = ({ issues }) => {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">City Issue Density</h2>

      <MapContainer
        center={[28.6448, 77.216721]}
        zoom={11}
        style={{ height: "420px", width: "100%" }}
        className="rounded-xl shadow"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {issues.map((issue) =>
          issue.location ? (
            <CircleMarker
              key={issue._id}
              center={[issue.location.latitude, issue.location.longitude]}
              radius={8}
              pathOptions={{
                color: issue.source === "IoT Auto Detection" ? "#2563eb" : // Blue for IoT
                  issue.status === "Resolved"
                    ? "green"
                    : issue.status === "In Progress"
                      ? "orange"
                      : "red",
                fillOpacity: 0.6
              }}
            >
              <Popup>
                <b>{issue.title}</b>
                <br />
                {issue.category}
                <br />
                Status: {issue.status}
                {issue.source === "IoT Auto Detection" && (
                  <div className="text-blue-600 font-bold text-xs mt-1">📡 IoT Detected ({issue.confidenceScore}%)</div>
                )}
              </Popup>
            </CircleMarker>
          ) : null,
        )}
      </MapContainer>
    </div>
  );
};

const AdminDashboard = () => {
  const [aiTrends, setAiTrends] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [aiIssues, setAiIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
    sort: "latest",
  });
  const [showCreateWorker, setShowCreateWorker] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("loggedInUser");
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchData();
    fetchAIPriorityIssues();
    fetchHeatmap();

    // 🔗 Socket Connection for Realtime IoT Updates
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("🔌 Connected to WebSocket for IoT updates");
    });

    socket.on("new-iot-issue", (newIssue) => {
      console.log("⚡ Realtime IoT Issue Received:", newIssue);

      // Update state
      setAllIssues((prev) => [newIssue, ...prev]);

      // Also update filtered state if it matches current filters
      // (Simplified: just triggering re-render of pure list, sorting effects handle the rest essentially)

      toast.info(`📡 New IoT Alert: ${newIssue.title}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchAITrends = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/ai/trends", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("🧠 AI Trends:", data);
        setAiTrends(data);
      } catch (err) {
        console.error("AI Trend fetch failed:", err);
      }
    };

    fetchAITrends();
  }, [token]);

  const fetchData = async () => {
    const res = await fetch("http://localhost:8080/api/issues", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAllIssues(data);
    setIssues(data);
    setLoading(false);
  };

  const fetchHeatmap = async () => {
    const res = await fetch("http://localhost:8080/api/admin/issues/heatmap", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setHeatmapPoints(data);
  };

  const fetchAIPriorityIssues = async () => {
    const res = await fetch(
      "http://localhost:8080/api/admin/issues/ai-priority",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    setAiIssues(data.slice(0, 6));
  };

  useEffect(() => {
    let filtered = [...allIssues];

    if (filters.status)
      filtered = filtered.filter((i) => i.status === filters.status);
    if (filters.category)
      filtered = filtered.filter((i) => i.category === filters.category);
    if (filters.search)
      filtered = filtered.filter((i) =>
        i.title.toLowerCase().includes(filters.search.toLowerCase()),
      );

    filtered.sort((a, b) =>
      filters.sort === "latest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt),
    );

    setIssues(filtered);
  }, [filters, allIssues]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const startEdit = (issue) => {
    setEditing(issue._id);
    setResolutionNotes(issue.resolutionNotes || "");
    setStatus(issue.status);
    setAssignedTo(issue.assignedTo || "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setResolutionNotes("");
    setStatus("");
    setAssignedTo("");
  };

  const saveChanges = async (id) => {
    const res = await fetch(`http://localhost:8080/api/admin/issues/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, resolutionNotes, assignedTo }),
    });

    const updatedIssue = await res.json();

    setAllIssues((prev) => prev.map((i) => (i._id === id ? updatedIssue : i)));
    cancelEdit();
  };

  const deleteIssue = async (id) => {
    if (!window.confirm("Delete this issue?")) return;

    await fetch(`http://localhost:8080/api/admin/issues/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setAllIssues((prev) => prev.filter((i) => i._id !== id));
  };

  if (loading) return <p className="text-center mt-20">Loading dashboard...</p>;

  return (
    <div className="max-w-7xl mx-auto mt-6 sm:mt-10 p-4 sm:p-8 bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl sm:rounded-3xl shadow-inner">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-10 gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 break-all">
            {name} ({email})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateWorker(true)}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 transition text-white px-5 sm:px-6 py-2 rounded-xl shadow-md"
        >
          Create Authority
        </button>

        {/* Modal */}
        {showCreateWorker && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl relative animate-fadeIn">
              {/* Close button */}
              <button
                onClick={() => setShowCreateWorker(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>

              {/* Modal content */}
              <CreateWorker />
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 transition text-white px-5 sm:px-6 py-2 rounded-xl shadow-md"
        >
          Logout
        </button>
      </div>

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
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Before</p>
                    <div className="rounded-xl overflow-hidden shadow-md border">
                      <img
                        src={selectedIssue.imageURL}
                        alt="Issue Evidence"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  </div>
                  {selectedIssue.proofImage && (
                    <div>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">After (Resolution)</p>
                      <div className="rounded-xl overflow-hidden shadow-md border border-green-200">
                        <img
                          src={selectedIssue.proofImage}
                          alt="Resolution Proof"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    </div>
                  )}
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

      {/* AI Critical */}
      <div className="mb-8 sm:mb-10 p-5 sm:p-7 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-2xl sm:rounded-3xl shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-4 sm:mb-5">
          🚨 AI Critical Issues
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {aiIssues.map((issue) => (
            <div
              key={issue._id}
              className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl shadow hover:shadow-xl transition"
            >
              <p className="font-semibold text-base sm:text-lg">
                {issue.title}
              </p>
              <p className="text-xs sm:text-sm text-slate-600">
                Category: {issue.category}
              </p>
              <p className="text-xs sm:text-sm font-bold text-red-600 mt-1">
                Priority: {issue.priority}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12">
        <StatCard label="Total Issues" value={allIssues.length} />
        <StatCard
          label="Open Issues"
          value={allIssues.filter((i) => i.status !== "Resolved").length}
          color="yellow"
        />
        <StatCard
          label="Resolved"
          value={allIssues.filter((i) => i.status === "Resolved").length}
          color="green"
        />
        <StatCard
          label="High Priority"
          value={aiIssues.filter((i) => i.priority === "High").length}
          color="red"
        />
      </div>

      {/* AI Trends */}
      {aiTrends && (
        <div className="bg-gradient-to-r from-indigo-200 via-purple-100 to-pink-100 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-800 mb-4 sm:mb-6">
            🧠 AI Trend Insights
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <TrendCard
              title="Most Reported Category"
              value={aiTrends.mostReportedCategory}
            />
            <TrendCard
              title="Open Issues"
              value={aiTrends.openIssues}
              color="red"
            />
            <TrendCard
              title="Resolved Issues"
              value={aiTrends.resolvedIssues}
              color="green"
            />
          </div>
        </div>
      )}

      {/* 🤖 IoT Control Panel */}
      <div className="mb-8 sm:mb-12">
        <IoTControlPanel />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 mb-8 sm:mb-12 bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl shadow">
        <FilterSelect
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          placeholder="All Status"
        />
        <FilterSelect
          options={CATEGORIES}
          value={filters.category}
          onChange={(v) => setFilters({ ...filters, category: v })}
          placeholder="All Categories"
        />
        <input
          className="w-full border px-4 sm:px-5 py-3 rounded-xl focus:ring-2 focus:ring-indigo-400 transition"
          placeholder="Search by title..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Map */}
      <div className="mb-10 sm:mb-14 bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xl">
        <CityIssueMap issues={issues} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-x-auto">
        <table className="min-w-full text-sm sm:text-base">
          <thead className="bg-slate-200 text-slate-800">
            <tr>
              {[
                "Title",
                "Category",
                "Status",
                "Resolution",
                "Assigned",
                "Actions",
              ].map((h) => (
                <th key={h} className="p-3 sm:p-4 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue._id}
                className="border-t hover:bg-slate-50 transition"
              >
                <td className="p-4">{issue.title}</td>

                <td className="p-4">{issue.category}</td>

                <td className="p-4">
                  {editing === issue._id ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="border px-3 py-1 rounded-lg"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={
                        issue.status === "Resolved"
                          ? "text-green-600 font-semibold"
                          : issue.status === "In Progress"
                            ? "text-yellow-600 font-semibold"
                            : "text-red-600 font-semibold"
                      }
                    >
                      {issue.status}
                    </span>
                  )}
                </td>

                <td className="p-4">
                  {editing === issue._id ? (
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="border rounded-lg w-full px-2 py-1"
                    />
                  ) : (
                    issue.resolutionNotes || "-"
                  )}
                </td>

                <td className="p-4">
                  {editing === issue._id ? (
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="border px-3 py-1 rounded-lg"
                    >
                      <option value="">Select staff...</option>
                      {STAFF_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    issue.assignedTo || "Unassigned"
                  )}
                </td>

                <td className="p-4 space-x-2 flex items-center">
                  {editing === issue._id ? (
                    <>
                      <button
                        onClick={() => saveChanges(issue._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg shadow"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg shadow"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow transition"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => startEdit(issue)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteIssue(issue._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 📱 Mobile Issue Cards */}

        <div className="md:hidden space-y-4">
          {issues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white p-4 rounded-2xl shadow border"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{issue.title}</h3>

                {editing === issue._id ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border px-2 py-1 rounded"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`text-sm font-semibold ${issue.status === "Resolved"
                      ? "text-green-600"
                      : issue.status === "In Progress"
                        ? "text-yellow-600"
                        : "text-red-600"
                      }`}
                  >
                    {issue.status}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 mt-1">
                Category: {issue.category}
              </p>

              {/* Resolution */}
              <div className="mt-2">
                <p className="text-sm font-medium">Resolution</p>
                {editing === issue._id ? (
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="text-sm">{issue.resolutionNotes || "-"}</p>
                )}
              </div>

              {/* Assigned */}
              <div className="mt-2">
                <p className="text-sm font-medium">Assigned</p>
                {editing === issue._id ? (
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full"
                  >
                    <option value="">Select staff...</option>
                    {STAFF_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm">{issue.assignedTo || "Unassigned"}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                {editing === issue._id ? (
                  <>
                    <button
                      onClick={() => saveChanges(issue._id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg shadow"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg shadow"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow flex items-center justify-center"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => startEdit(issue)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg shadow"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteIssue(issue._id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg shadow"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
