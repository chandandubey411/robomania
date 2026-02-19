// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportIssue from "./pages/ReportIssue";
import ExploreIssues from "./pages/ExploreIssues";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/Admindashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Community from "./pages/Community";
import CommunityChat from "./pages/CommunityChat";
import RefreshHandler from "./RefreshHandler";
import Footer from "./components/Footer";

import ChatBot from "./components/ChatBot";

function App() {
  const [isAuthenticated, setisAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 🔐 Normal User
  const PrivateRoute = ({ element }) => {
    if (isAuthLoading) return <div>Loading...</div>;
    return isAuthenticated ? element : <Navigate to="/login" replace />;
  };

  // 👑 Admin
  const PrivateRouteAdmin = ({ element }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token) return <Navigate to="/login" replace />;
    if (role !== "admin")
      return (
        <div className="text-center text-red-600 p-10 font-bold text-xl">
          Not Authorized
        </div>
      );
    return element;
  };

  // 🧑‍🔧 Worker
  const PrivateRouteWorker = ({ element }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token) return <Navigate to="/login" replace />;
    if (role !== "worker")
      return (
        <div className="text-center text-red-600 p-10 font-bold text-xl">
          Not Authorized
        </div>
      );
    return element;
  };

  return (
    <Router>
      <RefreshHandler
        setisAuthenticated={setisAuthenticated}
        setIsAuthLoading={setIsAuthLoading}
      />

      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/explore" element={<ExploreIssues />} />

            <Route
              path="/user/dashboard"
              element={<PrivateRoute element={<UserDashboard />} />}
            />

            <Route
              path="/admin/dashboard"
              element={<PrivateRouteAdmin element={<AdminDashboard />} />}
            />

            <Route path="/worker/dashboard" element={<WorkerDashboard />} />

            <Route path="/community" element={<Community />} />
            <Route
              path="/community/:id"
              element={<PrivateRoute element={<CommunityChat />} />}
            />



          </Routes>
          <ChatBot />
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
