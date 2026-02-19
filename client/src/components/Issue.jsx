import React, { useEffect, useState, useRef } from "react";
import SnailLoader from "../components/Loader";

function Issue() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const scrollTimer = useRef(null);

  const user = localStorage.getItem("loggedInUser");

  useEffect(() => {
    fetch("http://localhost:8080/api/issues")
      .then((res) => res.json())
      .then((data) => {
        setIssues(data);
        setLoading(false);
      });
  }, []);

  // ✅ Auto play (pause when scrolling or expanded)
  useEffect(() => {
    if (issues.length === 0 || isScrolling || expanded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % issues.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [issues, isScrolling, expanded]);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimer.current) clearTimeout(scrollTimer.current);

    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  if (loading) return <SnailLoader />;

  const currentIssue = issues[currentIndex];

  return (
    <div className="p-10 min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Welcome, <span className="text-indigo-600">{user}</span>
        </h1>
        <p className="text-gray-600">
          Here’s a summary of all issues reported in your area.
        </p>
      </div>

      {/* 🌈 GRADIENT BORDER CARD */}
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] rounded-3xl shadow-2xl">
        <div
          className={`bg-white rounded-3xl overflow-hidden flex transition-all duration-300 ${
            expanded ? "h-[500px]" : "h-72"
          }`}
        >
          {/* LEFT IMAGE */}
          {currentIssue.imageURL && (
            <img
              src={currentIssue.imageURL}
              alt={currentIssue.title}
              className="w-1/2 h-full object-cover p-4 rounded-3xl"
            />
          )}

          {/* RIGHT TEXT */}
          <div
            onScroll={handleScroll}
            className="w-1/2 p-6 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="h-full p-4">
              <span className="inline-block mb-3 px-4 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-100 to-pink-100 text-indigo-700 rounded-full">
                {currentIssue.category}
              </span>

              <h2 className="text-2xl font-bold mb-3 text-gray-900">
                {currentIssue.title}
              </h2>

              <p
                className={`text-gray-600 leading-relaxed mb-2 ${
                  expanded ? "" : "line-clamp-3"
                }`}
              >
                {currentIssue.description}
              </p>

              {currentIssue.description?.length > 120 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-indigo-600 font-semibold text-sm hover:underline"
                >
                  {expanded ? "Show Less" : "Read More"}
                </button>
              )}

              <div className="mt-6 flex justify-between items-center">
                <span className="font-semibold">
                  Status:{" "}
                  <span
                    className={`${
                      currentIssue.status === "Resolved"
                        ? "text-green-600"
                        : currentIssue.status === "In Progress"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {currentIssue.status}
                  </span>
                </span>

                <span className="text-sm text-gray-400">
                  {new Date(currentIssue.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌈 THUMBNAILS WITH COLOR BORDER */}
      <div className="flex justify-center mt-10 gap-5 flex-wrap">
        {issues.map((issue, index) => (
          <button
            key={issue._id}
            onClick={() => {
              setCurrentIndex(index);
              setExpanded(false);
            }}
            className={`p-[2px] rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 ${
              currentIndex === index ? "scale-110 shadow-xl" : "opacity-70"
            }`}
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white">
              {issue.imageURL ? (
                <img
                  src={issue.imageURL}
                  alt={issue.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Issue;