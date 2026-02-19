import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../Utils";
import { useNavigate } from "react-router-dom";

const DEPARTMENTS = [
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

const CreateWorker = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // 🔍 Validation
  const validate = () => {
    const errs = {};
    if (!formData.name) errs.name = "Name is required";
    if (!formData.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Email is invalid";

    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6)
      errs.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    if (!formData.department)
      errs.department = "Department is required";

    return errs;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length !== 0) return;

    // 🔥 Payload (role fixed as worker)
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: "worker",
      department: formData.department,
    };

    try {
      const res = await fetch(
        "http://localhost:8080/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        handleError(result.message || "Worker creation failed");
        return;
      }

      handleSuccess(result.message || "Worker created successfully");

      setTimeout(() => {
        navigate("/admin/dashboard"); // ya jahan wapas jana ho
      }, 1000);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        department: "",
      });

    } catch (err) {
      handleError("Something went wrong");
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Create Authority (Worker)
      </h2>

      <form onSubmit={handleSubmit} noValidate>

        {/* Name */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Name</label>
          <input
            type="text"
            name="name"
            className="w-full p-2 border rounded"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Email</label>
          <input
            type="email"
            name="email"
            className="w-full p-2 border rounded"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {/* Department */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          {errors.department && (
            <p className="text-red-500 text-sm">{errors.department}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            name="password"
            className="w-full p-2 border rounded"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block mb-1 font-semibold">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="w-full p-2 border rounded"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 text-white p-3 rounded font-semibold hover:bg-red-700 transition"
        >
          Create Worker
        </button>

      </form>

      <ToastContainer />
    </div>
  );
};

export default CreateWorker;
