import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const BACKEND = "http://localhost:8080";
let socket;

export default function CommunityChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("loggedInUser") ||
    "Anonymous";

  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const isCreator = (comm) =>
    comm &&
    (typeof comm.createdBy === "object" ? comm.createdBy._id : comm.createdBy)
      ?.toString() === userId;

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchCommunity = async () => {
    const res = await axios.get(`${BACKEND}/api/community/${id}`);
    setCommunity(res.data);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const init = async () => {
      try {
        setLoading(true);
        const [commRes, msgRes] = await Promise.all([
          axios.get(`${BACKEND}/api/community/${id}`),
          axios.get(`${BACKEND}/api/community/${id}/messages`),
        ]);
        setCommunity(commRes.data);
        setMessages(msgRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    init();
  }, [id, token, navigate]);

  // ─── Socket.IO ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    socket = io(BACKEND, { transports: ["websocket", "polling"] });
    socket.emit("join-room", id);

    socket.on("receive-message", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id?.toString() === msg._id?.toString())) return prev;
        return [...prev, msg];
      });
    });

    socket.on("join-request-update", () => fetchCommunity());
    socket.on("member-approved", () => fetchCommunity());

    // If this user was kicked, redirect them out
    socket.on("user-kicked", ({ userId: kickedId }) => {
      if (kickedId?.toString() === userId?.toString()) {
        alert("You have been removed from this community by the creator.");
        navigate("/community");
      }
    });

    return () => {
      socket.emit("leave-room", id);
      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ─── Send ────────────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socket || sending) return;
    setSending(true);
    socket.emit("send-message", {
      communityId: id,
      sender: { _id: userId, name: userName },
      text: trimmed,
    });
    setText("");
    setSending(false);
    inputRef.current?.focus();
  };

  // ─── Leave ───────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!window.confirm("Leave this community?")) return;
    setLeaving(true);
    try {
      await axios.post(`${BACKEND}/api/community/${id}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/community");
    } catch (err) { console.error(err); setLeaving(false); }
  };

  // ─── Approve / Reject ────────────────────────────────────────────────────
  const handleApprove = async (reqUserId) => {
    setActionLoading(reqUserId);
    try {
      await axios.post(`${BACKEND}/api/community/${id}/approve/${reqUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCommunity();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (reqUserId) => {
    setActionLoading(reqUserId + "_reject");
    try {
      await axios.post(`${BACKEND}/api/community/${id}/reject/${reqUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCommunity();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  // ─── Kick ────────────────────────────────────────────────────────────────
  const handleKick = async (memberUserId, memberName) => {
    if (!window.confirm(`Kick "${memberName}" from the community?`)) return;
    setActionLoading(memberUserId + "_kick");
    try {
      await axios.post(`${BACKEND}/api/community/${id}/kick/${memberUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCommunity();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to kick member");
    }
    finally { setActionLoading(null); }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");
  const AVATAR_COLORS = ["bg-indigo-500","bg-purple-500","bg-pink-500","bg-blue-500","bg-teal-500","bg-green-500","bg-orange-500","bg-red-500"];
  const getAvatarColor = (name = "") => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
  if (!community) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-6xl mb-4">🔍</div>
      <p className="text-2xl font-bold text-gray-700">Community not found</p>
      <button onClick={() => navigate("/community")} className="mt-4 text-indigo-600 hover:underline text-lg">← Back</button>
    </div>
  );

  const pendingRequests = community.joinRequests || [];
  const amCreator = isCreator(community);
  const creatorId = (typeof community.createdBy === "object" ? community.createdBy._id : community.createdBy)?.toString();

  return (
    <div className="flex h-screen pt-16 bg-gray-50 overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside className={`${showMembers ? "flex" : "hidden"} md:flex flex-col w-72 bg-white border-r border-gray-200 shadow-sm flex-shrink-0`}>
        {/* Info */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="text-5xl mb-3">{community.avatar}</div>
          <h2 className="font-extrabold text-gray-800 text-xl leading-tight">{community.name}</h2>
          <span className="inline-block mt-2 text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{community.category}</span>
          {community.description && <p className="text-gray-500 text-sm mt-3 leading-relaxed">{community.description}</p>}
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-100 space-y-1">
          <button onClick={() => navigate("/community")} className="w-full text-left text-base text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50 transition-all">
            ← All Communities
          </button>
          {!amCreator && (
            <button onClick={handleLeave} disabled={leaving} className="w-full text-left text-base text-red-500 hover:text-red-700 font-semibold flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 transition-all">
              🚪 {leaving ? "Leaving..." : "Leave Community"}
            </button>
          )}
        </div>

        {/* ── Join Requests (creator only) ─── */}
        {amCreator && pendingRequests.length > 0 && (
          <div className="border-b border-gray-100">
            <button onClick={() => setShowRequests(!showRequests)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-yellow-50 transition-all">
              <span className="text-sm font-bold text-yellow-700">🔔 Join Requests ({pendingRequests.length})</span>
              <span className="text-yellow-500 text-lg">{showRequests ? "▲" : "▼"}</span>
            </button>
            {showRequests && (
              <div className="px-4 pb-4 space-y-3">
                {pendingRequests.map((req) => {
                  const reqId = typeof req === "object" ? req._id : req;
                  const reqName = typeof req === "object" ? (req.name || "User") : "User";
                  return (
                    <div key={reqId} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(reqName)}`}>
                          {getInitial(reqName)}
                        </div>
                        <p className="text-sm font-bold text-gray-700 truncate">{reqName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(reqId)} disabled={actionLoading === reqId} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded-lg transition-all disabled:opacity-60">
                          {actionLoading === reqId ? "..." : "✓ Approve"}
                        </button>
                        <button onClick={() => handleReject(reqId)} disabled={actionLoading === reqId + "_reject"} className="flex-1 bg-red-400 hover:bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg transition-all disabled:opacity-60">
                          {actionLoading === reqId + "_reject" ? "..." : "✗ Reject"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Members ({community.members?.length || 0})
          </h3>
          <div className="space-y-3">
            {community.members?.map((m, idx) => {
              const name = typeof m === "object" ? m.name : "User";
              const mid = typeof m === "object" ? m._id : m;
              const midStr = mid?.toString();
              const isMe = midStr === userId;
              const isOwner = midStr === creatorId;

              return (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 ${getAvatarColor(name)}`}>
                    {getInitial(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-700 truncate">{name}</p>
                    <div className="flex gap-1">
                      {isMe && <span className="text-xs text-indigo-400 font-medium">You</span>}
                      {isOwner && <span className="text-xs text-purple-500 font-bold">👑 Creator</span>}
                    </div>
                  </div>
                  {/* Kick button — only creator sees, not for themselves */}
                  {amCreator && !isOwner && (
                    <button
                      onClick={() => handleKick(midStr, name)}
                      disabled={actionLoading === midStr + "_kick"}
                      title={`Kick ${name}`}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 text-xs font-bold"
                    >
                      {actionLoading === midStr + "_kick" ? "..." : "✕"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ─── Chat Area ─── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <button className="md:hidden text-gray-500 hover:text-gray-800 text-xl" onClick={() => setShowMembers(!showMembers)}>
            {amCreator && pendingRequests.length > 0 ? (
              <span className="relative inline-block">
                👥
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              </span>
            ) : "👥"}
          </button>
          <div className="text-4xl">{community.avatar}</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-gray-800 text-xl truncate">
              {community.name}
              {amCreator && <span className="ml-2 text-sm font-bold text-purple-500">👑</span>}
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-0.5">
              {community.members?.length || 0} members
              {amCreator && pendingRequests.length > 0 && (
                <span className="ml-2 text-yellow-600 font-bold">· 🔔 {pendingRequests.length} pending</span>
              )}
            </p>
          </div>
          <button onClick={() => navigate("/community")} className="hidden md:block text-base text-gray-500 hover:text-indigo-600 font-semibold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all">
            ← Back
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-7xl mb-5">💬</div>
              <p className="text-2xl font-bold text-gray-600">No messages yet</p>
              <p className="text-base mt-2">Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              if (msg.type === "system") {
                return (
                  <div key={msg._id || idx} className="flex justify-center">
                    <span className="text-sm text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full font-medium">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isMe = msg.sender?._id?.toString() === userId?.toString();
              const senderName = msg.sender?.name || "Unknown";
              const prevMsg = messages[idx - 1];
              const sameUser = prevMsg?.type !== "system" && prevMsg?.sender?._id?.toString() === msg.sender?._id?.toString();
              return (
                <div key={msg._id || idx} className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!sameUser ? (
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-base font-bold ${getAvatarColor(senderName)}`}>
                      {getInitial(senderName)}
                    </div>
                  ) : <div className="w-10 flex-shrink-0" />}
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!sameUser && !isMe && <span className="text-sm font-bold text-gray-500 mb-1 ml-1">{senderName}</span>}
                    <div className={`px-5 py-3 rounded-2xl text-base leading-relaxed shadow-sm font-medium ${isMe ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"}`}>
                      {msg.text}
                    </div>
                    <span className="text-xs text-gray-300 mt-1 mx-1 font-medium">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-base font-bold ${getAvatarColor(userName)}`}>
              {getInitial(userName)}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message ${community.name}...`}
              className="flex-1 bg-gray-100 rounded-full px-6 py-3.5 text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            />
            <button type="submit" disabled={!text.trim() || sending} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0">
              <svg className="w-5 h-5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
