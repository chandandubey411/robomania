import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ToastContainer, toast } from "react-toastify";
import { handleSuccess } from "../Utils";
import { useNavigate } from "react-router-dom";
import { useOfflineQueue } from "../hooks/useOfflineQueue";



/* 📍 Fixed Center Pin */
const CenterPin = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
    <img
      src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
      alt="pin"
      className="w-8 h-8 -translate-y-4"
    />
  </div>
);

/* 🧭 Update form when map moves */
function MapCenterUpdater({ setForm }) {
  const map = useMapEvents({
    moveend: async () => {
      const center = map.getCenter();
      const lat = center.lat;
      const lng = center.lng;

      const res = await fetch(
        `http://localhost:8080/api/location/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: data.display_name || "",
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "",
        state: data.address?.state || "",
      }));
    },
  });

  return null;
}


/* 🔹 Leaflet marker fix */
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* 🗺️ Map click handler */
function LocationPicker({ setForm }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      const res = await fetch(
        `http://localhost:8080/api/location/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: data.display_name || "",
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "",
        state: data.address?.state || "",
      }));
    },
  });
  return null;
}

const categories = [
  "Garbage",
  "Water Leak",
  "Road Safety",
  "Pothole",
  "Streetlight",
  "Other",
];

export default function ReportIssue() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: categories[0],
    image: null,
    latitude: "",
    longitude: "",
    address: "",
    city: "",
    state: "",
  });

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageAnalyzed, setImageAnalyzed] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  // Offline queue hook
  const { isOnline, pendingCount, saveToQueue, syncNow } = useOfflineQueue();

  // Try to sync whenever the page mounts and we have connectivity
  useEffect(() => {
    if (isOnline && token) syncNow(token);
  }, []);


  /* 📍 Live GPS Location */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const res = await fetch(
        `http://localhost:8080/api/location/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        address: data.display_name || "",
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "",
        state: data.address?.state || "",
      }));
    });
  }, []);

  /* 🧹 Image preview cleanup */
  useEffect(
    () => () => imagePreview && URL.revokeObjectURL(imagePreview),
    [imagePreview]
  );

  /* 🧠 AI Text Analysis */
  useEffect(() => {
    if (imageAnalyzed) return;
    if (form.title.length < 5 && form.description.length < 10) return;

    const timer = setTimeout(() => analyzeText(), 700);
    return () => clearTimeout(timer);
  }, [form.title, form.description, imageAnalyzed]);


  const analyzeText = async () => {
    if (aiLoading || !token) return;
    try {
      setAiLoading(true);
      const res = await fetch(
        "http://localhost:8080/api/ai/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
          }),
        }
      );
      const data = await res.json();
      setAiSuggestion(data);
      setForm((p) => ({ ...p, category: data.category || p.category }));
    } finally {
      setAiLoading(false);
    }
  };

  // const handleImageChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   if (!token) {
  //     alert("Please login again");
  //     return;
  //   }

  //   setImagePreview(URL.createObjectURL(file));
  //   setAiLoading(true);

  //   const fd = new FormData();
  //   fd.append("image", file);

  //   try {
  //     const res = await fetch(
  //       "http://localhost:8080/api/vision/analyze",
  //       {
  //         method: "POST",
  //         headers: { Authorization: `Bearer ${token}` },
  //         body: fd,
  //       }
  //     );

  //     const data = await res.json();

  //     if (!res.ok) throw new Error(data.error || "AI failed");

  //     // 🧠 Fill form with AI result
  //     setForm((p) => ({
  //       ...p,
  //       title: data.title || p.title,
  //       description: data.description || p.description,
  //       category: data.category || p.category,
  //       image: data.imageUrl,  // 👈 yahin URL save ho raha hai
  //     }));

  //     setAiSuggestion(data);
  //     setImageAnalyzed(true);
  //   } catch (err) {
  //     console.error(err);
  //     alert("AI image analysis failed");
  //   } finally {
  //     setAiLoading(false);
  //   }
  // };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch(
        "http://localhost:8080/api/vision/analyze",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: fd
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error("Vision failed");

      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        category: data.category || prev.category,
        image: data.imageUrl // Use the URL returned by backend (Cloudinary)
      }));

      setImageAnalyzed(true);

    } catch (err) {
      console.error(err);
      alert("Image analysis failed. You can still report manually.");
    }
  };


  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || token === "null" || token === "undefined") {
      alert("Session expired. Please login again.");
      return;
    }

    if (!form.title.trim()) return toast.warn("Please enter issue title");
    if (!form.description.trim()) return toast.warn("Please enter issue description");
    if (!form.image) return toast.warn("Please upload issue image");

    // ── OFFLINE: save locally, sync later ────────────────────────
    if (!isOnline) {
      saveToQueue(form, token);
      toast.info(
        `📦 You're offline! Report saved locally. It will auto-upload when you're back online. (${pendingCount + 1} pending)`,
        { autoClose: 5000 }
      );
      return;
    }

    // ── ONLINE: submit immediately ────────────────────────────────
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8080/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      // Also sync any previously queued reports
      await syncNow(token);

      toast.success("✅ Issue reported successfully!");
      setTimeout(() => navigate("/user/dashboard"), 1200);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Saving locally...");
      saveToQueue(form, token);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">

        {/* ── Offline / Pending banners ─────────────────────────────── */}
        {!isOnline && (
          <div className="mb-5 flex items-center gap-3 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3">
            <span className="text-2xl">📡</span>
            <div>
              <p className="font-bold text-orange-700 text-sm">You're offline</p>
              <p className="text-orange-600 text-xs">
                Your report will be saved locally and uploaded automatically when you're back online.
              </p>
            </div>
          </div>
        )}

        {isOnline && pendingCount > 0 && (
          <div className="mb-5 flex items-center justify-between gap-3 bg-blue-50 border border-blue-300 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-bold text-blue-700 text-sm">
                  {pendingCount} pending report{pendingCount > 1 ? "s" : ""} found
                </p>
                <p className="text-blue-600 text-xs">Syncing your saved reports now…</p>
              </div>
            </div>
            <button
              onClick={() => syncNow(token)}
              className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all flex-shrink-0"
            >
              Sync Now
            </button>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-blue-700">
          🚨 Report Civic Issue
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Live AI + GPS enabled reporting system
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="section-title">Issue Title</p>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input"
              placeholder="Eg: Garbage near main road"
              required
            />
          </div>

          <div>
            <p className="section-title">Describe Issue</p>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="input"
              placeholder="Explain problem clearly..."
              required
            />
          </div>

          {/* 🏙️ City / State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="section-title">City</p>
              <input value={form.city} readOnly className="input bg-gray-100" />
            </div>
            <div>
              <p className="section-title">State</p>
              <input value={form.state} readOnly className="input bg-gray-100" />
            </div>
          </div>

          <div>
            <p className="section-title">Detected Location</p>
            <input value={form.address} readOnly className="input bg-gray-100" />
          </div>

          <div>
            <p className="section-title">Upload Photo</p>
            <input
              type="file"
              onChange={handleImageChange}
              required
              className="block w-full text-sm file:bg-blue-600 file:text-white file:px-4 file:py-2 file:rounded file:border-0 file:cursor-pointer"
            />
          </div>

          {imagePreview && (
            <img
              src={imagePreview}
              className="h-40 w-full object-contain rounded-lg border"
              alt="preview"
            />
          )}

          {/* 🗺️ MAP */}
          {/* 🗺️ MAP */}
          <div>
            <p className="section-title">Confirm Location on Map</p>

            <div className="relative h-72 rounded-lg overflow-hidden border">
              {form.latitude && form.longitude && (
                <>
                  <MapContainer
                    center={[Number(form.latitude), Number(form.longitude)]}
                    zoom={16}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapCenterUpdater setForm={setForm} />
                  </MapContainer>

                  {/* 📍 FIXED CENTER PIN */}
                  <CenterPin />
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              !form.title.trim() ||
              !form.description.trim()
            }
            className={`w-full transition text-white py-3 rounded-full font-semibold text-lg disabled:bg-gray-400 ${
              !isOnline
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting
              ? "Submitting..."
              : !isOnline
              ? "📦 Save Offline"
              : "Submit Issue"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}