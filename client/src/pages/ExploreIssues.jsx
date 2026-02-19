import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Heart,
    MessageCircle,
    MapPin,
    Clock,
    Filter,
    ChevronDown,
    MoreHorizontal,
    Share2,
    X,
    Send
} from "lucide-react";

const ExploreIssues = () => {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ category: "All", status: "All", sort: "Latest" });
    const [selectedIssue, setSelectedIssue] = useState(null);

    // Interaction States
    const [commentText, setCommentText] = useState("");
    const [userMap, setUserMap] = useState({}); // To store user names for comments if needed

    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId"); // Assuming you store userId
    // Decode token if userId not in localstorage, for now assume token presence implies interaction rights

    useEffect(() => {
        fetchIssues();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [issues, filters]);

    const fetchIssues = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/issues");
            const data = await res.json();
            setIssues(data);
        } catch (err) {
            console.error("Failed to fetch issues", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...issues];

        if (filters.category !== "All") {
            result = result.filter(i => i.category === filters.category);
        }
        if (filters.status !== "All") {
            result = result.filter(i => i.status === filters.status);
        }

        if (filters.sort === "Latest") {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (filters.sort === "Popular") {
            result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (filters.sort === "Trending") {
            // Weighted Score: Likes * 1 + Comments * 2 + Shares * 3
            result.sort((a, b) => {
                const scoreA = (a.likes?.length || 0) * 1 + (a.comments?.length || 0) * 2 + (a.shares || 0) * 3;
                const scoreB = (b.likes?.length || 0) * 1 + (b.comments?.length || 0) * 2 + (b.shares || 0) * 3;
                return scoreB - scoreA;
            });
        }

        setFilteredIssues(result);
    };

    const handleLike = async (issueId) => {
        if (!token) return alert("Please login to like issues.");

        // Optimistic Update
        const updatedIssues = issues.map(issue => {
            if (issue._id === issueId) {
                const isLiked = issue.likes.includes(currentUserId); // This logic needs real userId from token/storage
                // For now, let's just push/filter based on a dummy check or simply assume success
                // Real implementation needs reliable userId
                return {
                    ...issue,
                    likes: issue.likes.includes(currentUserId)
                        ? issue.likes.filter(id => id !== currentUserId)
                        : [...issue.likes, currentUserId]
                };
            }
            return issue;
        });
        // setIssues(updatedIssues); // Uncomment for optimistic, but need reliable ID

        try {
            const res = await fetch(`http://localhost:8080/api/issues/${issueId}/like`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            const updatedIssue = await res.json();
            setIssues(prev => prev.map(i => i._id === issueId ? updatedIssue : i));
        } catch (err) {
            console.error("Like failed", err);
        }
    };

    const handleComment = async (issueId) => {
        if (!token) return alert("Please login to comment.");
        if (!commentText.trim()) return;

        try {
            const res = await fetch(`http://localhost:8080/api/issues/${issueId}/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text: commentText })
            });
            const updatedIssue = await res.json();

            setIssues(prev => prev.map(i => i._id === issueId ? updatedIssue : i));
            if (selectedIssue && selectedIssue._id === issueId) {
                setSelectedIssue(updatedIssue);
            }
            setCommentText("");
        } catch (err) {
            console.error("Comment failed", err);
        }
    };

    // Helper to get relative time
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    const handleShare = async (issue) => {
        const shareData = {
            title: "CivicTrack Issue",
            text: `Check out this issue on CivicTrack: ${issue.title}\n\n${issue.description}`,
            url: window.location.href
        };

        // 🚀 Call API to increment share count
        try {
            await fetch(`http://localhost:8080/api/issues/${issue._id}/share`, { method: "PUT" });
            // Optimistically update local state if needed, though strictly not visible immediately unless we add a share count badge
        } catch (err) {
            console.error("Share count update failed", err);
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert("Link copied to clipboard!");
            } catch (err) {
                alert("Failed to copy link.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-10 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                        Explore Issues in Your Area
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Discover, track, and engage with real infrastructure problems reported by the community.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-24 z-30">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {["All", "Pothole", "Garbage", "Water Leak", "Streetlight", "Road Safety", "Other"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilters({ ...filters, category: cat })}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filters.category === cat
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Latest">Latest</option>
                            <option value="Popular">Most Likes</option>
                            <option value="Trending">Trending (Recommended)</option>
                        </select>
                    </div>
                </div>

                {/* Feed Grid */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading community issues...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredIssues.map(issue => (
                            <div
                                key={issue._id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                                onClick={() => setSelectedIssue(issue)}
                            >
                                {/* Image */}
                                <div className="relative h-56 overflow-hidden bg-slate-100">
                                    <img
                                        src={issue.imageURL}
                                        alt={issue.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${issue.status === "Resolved" ? "bg-green-500/90 text-white" :
                                            issue.status === "In Progress" ? "bg-yellow-500/90 text-white" :
                                                "bg-red-500/90 text-white"
                                            }`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            {issue.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            {issue.title}
                                        </h3>
                                    </div>

                                    <p className="text-slate-600 text-sm line-clamp-2 mb-4 h-10">
                                        {issue.description}
                                    </p>

                                    <div className="flex items-center text-xs text-slate-500 mb-4 gap-4">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            <span className="truncate max-w-[120px]">{issue.location?.city || "Unknown Location"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>{timeAgo(issue.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLike(issue._id); }}
                                                className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors group/like"
                                            >
                                                <Heart
                                                    size={18}
                                                    className={`transition-all ${issue.likes?.includes(currentUserId) ? "fill-red-500 text-red-500" : "group-hover/like:scale-110"}`}
                                                />
                                                <span className="text-sm font-semibold">{issue.likes?.length || 0}</span>
                                            </button>
                                            <button className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors">
                                                <MessageCircle size={18} />
                                                <span className="text-sm font-semibold">{issue.comments?.length || 0}</span>
                                            </button>
                                        </div>
                                        <button className="text-indigo-600 text-sm font-semibold hover:underline">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Detail Modal */}
            {selectedIssue && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-hidden">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-fadeIn">

                        <button
                            onClick={() => setSelectedIssue(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition shadow-md"
                        >
                            <X size={20} />
                        </button>

                        {/* Left: Images & Info (Scrollable) */}
                        <div className="w-full md:w-3/5 h-full overflow-y-auto p-6 md:p-8 bg-slate-50">
                            <div className="mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedIssue.status === "Resolved" ? "bg-green-100 text-green-700" :
                                    selectedIssue.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                    }`}>
                                    {selectedIssue.status}
                                </span>
                                <span className="ml-3 text-slate-500 text-sm font-medium">{selectedIssue.category}</span>
                            </div>

                            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{selectedIssue.title}</h2>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                                <MapPin size={16} />
                                <span>{selectedIssue.location?.address}</span>
                                <span className="mx-2">•</span>
                                <Clock size={16} />
                                <span>Reported {timeAgo(selectedIssue.createdAt)}</span>
                            </div>

                            {/* Images Container */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">📸 Reported Issue</h3>
                                    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                                        <img src={selectedIssue.imageURL} className="w-full object-cover max-h-[400px]" alt="Issue" />
                                    </div>
                                </div>

                                {selectedIssue.proofImage && (
                                    <div className="animate-fadeIn">
                                        <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            ✅ Resolution Proof
                                        </h3>
                                        <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-green-400 relative">
                                            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                                WORKER VERIFIED
                                            </div>
                                            <img src={selectedIssue.proofImage} className="w-full object-cover max-h-[400px]" alt="Proof" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Description</h3>
                                <p className="text-slate-600 leading-relaxed text-lg">{selectedIssue.description}</p>
                            </div>

                            {selectedIssue.resolutionNotes && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl">
                                    <h4 className="font-bold text-green-800 mb-1">Resolution Notes</h4>
                                    <p className="text-green-700">{selectedIssue.resolutionNotes}</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Social & Comments (Fixed) */}
                        <div className="w-full md:w-2/5 h-full bg-white flex flex-col border-l border-slate-200">

                            {/* Interaction Header */}
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                                <div className="flex gap-6">
                                    <button
                                        onClick={() => handleLike(selectedIssue._id)}
                                        className="flex flex-col items-center gap-1 text-slate-600 hover:text-red-500 transition group"
                                    >
                                        <div className={`p-2 rounded-full ${selectedIssue.likes?.includes(currentUserId) ? "bg-red-50 text-red-500" : "bg-slate-100 group-hover:bg-red-50"}`}>
                                            <Heart size={24} className={selectedIssue.likes?.includes(currentUserId) ? "fill-current" : ""} />
                                        </div>
                                        <span className="text-xs font-bold">{selectedIssue.likes?.length || 0} Likes</span>
                                    </button>

                                    <button className="flex flex-col items-center gap-1 text-slate-600 hover:text-indigo-600 transition group">
                                        <div className="p-2 rounded-full bg-slate-100 group-hover:bg-indigo-50">
                                            <MessageCircle size={24} />
                                        </div>
                                        <span className="text-xs font-bold">{selectedIssue.comments?.length || 0} Comments</span>
                                    </button>

                                    <button
                                        onClick={() => handleShare(selectedIssue)}
                                        className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition group"
                                    >
                                        <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-50">
                                            <Share2 size={24} />
                                        </div>
                                        <span className="text-xs font-bold">Share</span>
                                    </button>
                                </div>
                            </div>

                            {/* Comments Generator */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <h3 className="font-bold text-slate-800 text-lg">Community Discussion</h3>

                                {selectedIssue.comments?.length > 0 ? (
                                    selectedIssue.comments.map((comment, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                                {comment.userName?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-tl-none">
                                                    <p className="text-xs font-bold text-slate-700 mb-0.5">{comment.userName || "User"}</p>
                                                    <p className="text-sm text-slate-800">{comment.text}</p>
                                                </div>
                                                <span className="text-xs text-slate-400 ml-2 mt-1 block">{timeAgo(comment.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-400 italic">
                                        <MessageCircle size={40} className="mx-auto mb-2 opacity-20" />
                                        No comments yet. Be the first to say something!
                                    </div>
                                )}
                            </div>

                            {/* Comment Input */}
                            <div className="p-4 border-t bg-white">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Add to the discussion..."
                                        className="w-full pl-4 pr-12 py-3 bg-slate-100 rounded-full border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleComment(selectedIssue._id)}
                                    />
                                    <button
                                        onClick={() => handleComment(selectedIssue._id)}
                                        className={`absolute right-2 top-1.5 p-1.5 rounded-full transition-colors ${commentText.trim() ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}
                                        disabled={!commentText.trim()}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ExploreIssues;
