import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const [userIssues, setUserIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const name = localStorage.getItem("loggedInUser");
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    async function fetchUserIssues() {
      try {
        const res = await fetch("http://localhost:8080/api/issues/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUserIssues(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch issues:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserIssues();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userEmail");
    navigate("/login");
    window.location.reload();
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-black">
        Loading your data...
      </div>
    );

  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-md text-black px-4 py-10">
      <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold mb-1">Welcome, {name || "-"}</h1>
            <p className="text-gray-700 text-base">Email: {email || "-"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 px-5 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Issues Section */}
        <h2 className="text-2xl font-semibold mb-5 text-center sm:text-left">
          Your Reported Issues
        </h2>

        <ul className="space-y-5">
          {userIssues.length === 0 && (
            <li className="border border-gray-300 rounded-xl p-6 text-gray-600 text-center">
              No issues reported yet.
            </li>
          )}

          {userIssues.map((issue) => (
            <li
              key={issue._id}
              className="border border-gray-200 rounded-xl p-5 shadow-md bg-white/70 hover:bg-white/90 transition"
            >
              <div className="font-semibold text-lg">{issue.title}</div>
              <div className="text-sm text-gray-700 mt-1">
                {issue.description}
              </div>

              <div className="mt-2 text-sm">
                <span className="font-semibold">Category:</span> {issue.category}{" "}
                |{" "}
                <span className="font-semibold">Status:</span>{" "}
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
              </div>

              {issue.imageURL && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Reported Issue</p>
                    <img
                      src={
                        issue.imageURL.startsWith("http")
                          ? issue.imageURL
                          : `http://localhost:8080/${issue.imageURL.replace(
                            /\\/g,
                            "/"
                          )}`
                      }
                      alt={issue.title}
                      className="h-40 w-full object-cover rounded-lg border"
                    />
                  </div>
                  {issue.proofImage && (
                    <div>
                      <p className="text-xs font-bold text-green-600 uppercase mb-1">Resolution Proof</p>
                      <img
                        src={issue.proofImage}
                        alt="Resolution Proof"
                        className="h-40 w-full object-cover rounded-lg border border-green-200"
                      />
                    </div>
                  )}
                </div>
              )}

              {issue.resolutionNotes && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <span className="font-bold text-green-700">
                    Admin Resolution:
                  </span>
                  <span className="ml-2">{issue.resolutionNotes}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserDashboard;
