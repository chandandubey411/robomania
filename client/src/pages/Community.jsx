import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND = "http://localhost:8080";

const CATEGORY_EMOJIS = {
  "Road & Traffic": "🚗",
  "Water & Sanitation": "💧",
  Electricity: "⚡",
  "Public Safety": "🛡️",
  Environment: "🌿",
  "Public Health": "🏥",
  "Parks & Recreation": "🌳",
  General: "🏘️",
};

const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

const CATEGORY_COLORS = {
  "Road & Traffic": "from-orange-400 to-orange-600",
  "Water & Sanitation": "from-blue-400 to-blue-600",
  Electricity: "from-yellow-400 to-yellow-600",
  "Public Safety": "from-red-400 to-red-600",
  Environment: "from-green-400 to-green-600",
  "Public Health": "from-pink-400 to-pink-600",
  "Parks & Recreation": "from-teal-400 to-teal-600",
  General: "from-indigo-400 to-indigo-600",
};

export default function Community() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "General", avatar: "🏘️" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => { fetchCommunities(); }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/community`);
      setCommunities(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isMember = (c) =>
    c.members?.some((m) => (typeof m === "object" ? m._id : m)?.toString() === userId);

  const isCreator = (c) =>
    (typeof c.createdBy === "object" ? c.createdBy._id : c.createdBy)?.toString() === userId;

  const hasPendingRequest = (c) =>
    c.joinRequests?.some((r) => (typeof r === "object" ? r._id : r)?.toString() === userId);

  const handleEnter = async (c) => {
    if (!token) return navigate("/login");
    // Creator or member → go straight to chat
    if (isMember(c) || isCreator(c)) return navigate(`/community/${c._id}`);

    // Already requested
    if (hasPendingRequest(c)) return;

    // Send join request
    try {
      setActionLoading(c._id);
      await axios.post(`${BACKEND}/api/community/${c._id}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCommunities();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");
    setError(""); setCreating(true);
    try {
      const res = await axios.post(`${BACKEND}/api/community`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setForm({ name: "", description: "", category: "General", avatar: "🏘️" });
      navigate(`/community/${res.data.community._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create community");
    } finally {
      setCreating(false);
    }
  };

  const filtered = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getButtonState = (c) => {
    if (isCreator(c)) return { label: "My Community →", style: "bg-purple-600 text-white hover:bg-purple-700", action: true };
    if (isMember(c)) return { label: "Open Chat →", style: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200", action: true };
    if (hasPendingRequest(c)) return { label: "⏳ Pending Approval", style: "bg-yellow-100 text-yellow-700 cursor-not-allowed", action: false };
    return { label: "Request to Join", style: "bg-indigo-600 text-white hover:bg-indigo-700", action: true };
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 py-16 px-6 mb-10 shadow-2xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <div className="absolute top-4 left-10 text-8xl">🏙️</div>
          <div className="absolute top-8 right-20 text-6xl">💬</div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-lg">Community Hub</h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-8 font-medium">
            Connect, discuss, and drive civic change together.
          </p>
          <div className="flex gap-3 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-full text-base text-gray-800 bg-white/95 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
            />
            <button
              onClick={() => token ? setShowModal(true) : navigate("/login")}
              className="bg-white text-indigo-700 font-bold px-6 py-3.5 rounded-full shadow-lg hover:bg-indigo-50 transition-all text-base whitespace-nowrap"
            >
              + Create
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4">
        {!loading && (
          <p className="text-gray-400 text-base font-medium mb-6">
            {filtered.length} {filtered.length === 1 ? "community" : "communities"}
            {search && <span className="text-indigo-500"> for "{search}"</span>}
          </p>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-7xl mb-4">🔍</div>
            <p className="text-2xl font-bold text-gray-600">No communities found</p>
            <p className="mt-2 text-lg">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => {
              const btn = getButtonState(c);
              const colorClass = CATEGORY_COLORS[c.category] || "from-indigo-400 to-indigo-600";
              const pendingCount = c.joinRequests?.length || 0;

              return (
                <div
                  key={c._id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100"
                >
                  <div className={`bg-gradient-to-br ${colorClass} p-6 relative`}>
                    <div className="text-5xl mb-2 drop-shadow">{c.avatar}</div>
                    <span className="absolute top-4 right-4 text-sm font-semibold text-white/90 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      {c.category}
                    </span>
                    {isCreator(c) && (
                      <span className="absolute bottom-3 left-3 text-xs font-bold text-white bg-purple-600/80 px-2 py-0.5 rounded-full">
                        👑 Your Community
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
                      {c.name}
                    </h3>
                    <p className="text-gray-500 text-base mb-5 line-clamp-2 min-h-[3rem] leading-relaxed">
                      {c.description || "A community for civic discussions"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-400 flex flex-col gap-0.5">
                        <span>👥 {c.members?.length || 0} members</span>
                        {isCreator(c) && pendingCount > 0 && (
                          <span className="text-yellow-600 text-xs font-bold">
                            🔔 {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <button
                        disabled={!btn.action || actionLoading === c._id}
                        onClick={() => btn.action && handleEnter(c)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 shadow-sm ${btn.style}`}
                      >
                        {actionLoading === c._id ? "Sending..." : btn.label}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-3xl font-light">×</button>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Create Community</h2>
            {error && <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-base font-medium">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Community Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Road Warriors" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-400 text-gray-800 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this community about?" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-400 text-gray-800 resize-none font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => { const cat = e.target.value; setForm({ ...form, category: cat, avatar: CATEGORY_EMOJIS[cat] || "🏘️" }); }} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-400 text-gray-800 bg-white font-medium">
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_EMOJIS[cat]} {cat}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all text-base">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 text-base">{creating ? "Creating..." : "Create & Enter"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
