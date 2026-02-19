import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];

const WorkerDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("loggedInUser");
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchIssues();
    fetchStats();
  }, []);

  // 🔹 Fetch assigned issues
  const fetchIssues = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/worker/issues", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setIssues(data);
    } catch (err) {
      console.error("Error fetching issues", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch worker stats
  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/worker/stats", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  };

  // 🔹 Update issue status
  const updateStatus = async (id, status) => {
    try {
      await fetch(`http://localhost:8080/api/worker/issues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      fetchIssues();
      fetchStats();
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
          <h1 className="text-3xl font-bold">Worker Dashboard</h1>
          <p className="text-gray-600">{name} ({email})</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p>Total Assigned</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-xl shadow text-center">
          <p className="text-3xl font-bold">{stats.open}</p>
          <p>Open Issues</p>
        </div>
        <div className="bg-green-50 p-5 rounded-xl shadow text-center">
          <p className="text-3xl font-bold">{stats.resolved}</p>
          <p>Resolved</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Update</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue._id} className="border-t">
                <td className="p-3">{issue.title}</td>
                <td className="p-3">{issue.category}</td>
                <td className={`p-3 font-semibold ${
                  issue.status === "Resolved" ? "text-green-600" :
                  issue.status === "In Progress" ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {issue.status}
                </td>
                <td className="p-3">
                  <select
                    value={issue.status}
                    onChange={(e) => updateStatus(issue._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default WorkerDashboard;
