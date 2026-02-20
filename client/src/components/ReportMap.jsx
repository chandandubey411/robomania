import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LocationSearchInput from "./LocationSearchInput"; // Import autocomplete component
import { io } from "socket.io-client"; // 🔌 Import Socket.IO
import { toast } from "react-toastify"; // Optional: Notification

// ── Helpers ────────────────────────────────────────────────────────────────────
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distToPolyline(point, polyline) {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = Math.min(
      haversine(point, polyline[i]),
      haversine(point, polyline[i + 1]),
      haversine(point, [
        (polyline[i][0] + polyline[i + 1][0]) / 2,
        (polyline[i][1] + polyline[i + 1][1]) / 2,
      ])
    );
    if (d < minDist) minDist = d;
  }
  return minDist;
}

async function geocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: "${query}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route not found between these locations");
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Resolved: "#22c55e",
  "In Progress": "#f59e0b",
  Pending: "#ef4444",
};

const makeDiv = (gradient, emoji, size = 34) =>
  `<div style="width:${size}px;height:${size}px;background:${gradient};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.18);font-size:${Math.round(size * 0.45)}px">${emoji}</div>`;

const problemIcon = L.divIcon({ className: "", html: makeDiv("#ef4444", "⚠️", 32), iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });
const startIcon   = L.divIcon({ className: "", html: makeDiv("linear-gradient(135deg,#3b82f6,#22c55e)", "🚀", 38), iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -19] });
const endIcon     = L.divIcon({ className: "", html: makeDiv("linear-gradient(135deg,#22c55e,#3b82f6)", "🏁", 38), iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -19] });
const defaultIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30],
});

function FlyTo({ bounds }) {
  const map = useMap();
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [60, 60] }); }, [bounds, map]);
  return null;
}

const THRESHOLD_KM = 0.5;

function getSeverity(n) {
  if (n === 0) return { label: "Clear Route", sub: "No issues found along this route", icon: "✅", cls: "bg-green-50 border-green-200 text-green-800", badge: "bg-green-100 text-green-700" };
  if (n <= 2)  return { label: `${n} Minor Issue${n > 1 ? "s" : ""}`, sub: "Proceed with caution", icon: "⚠️", cls: "bg-yellow-50 border-yellow-200 text-yellow-800", badge: "bg-yellow-100 text-yellow-700" };
  return         { label: `${n} Issues Found`, sub: "Drive carefully!", icon: "🚨", cls: "bg-red-50 border-red-200 text-red-800", badge: "bg-red-100 text-red-700" };
}

<<<<<<< HEAD
// ── Component ──────────────────────────────────────────────────────────────────
export default function ReportMap() {
  const [issues, setIssues]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [source, setSource]               = useState("");
  const [destination, setDestination]     = useState("");
  const [routeCoords, setRouteCoords]     = useState(null);
  const [fromCoord, setFromCoord]         = useState(null);
  const [toCoord, setToCoord]             = useState(null);
=======
  // Route state
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  // Store precise coordinates from autocomplete
  const [sourceCoordsObj, setSourceCoordsObj] = useState(null);
  const [destCoordsObj, setDestCoordsObj] = useState(null);

  const [routeCoords, setRouteCoords] = useState(null);
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
>>>>>>> c8bcb0d14097d50658debfb9fa3ddad784945b00
  const [flaggedIssues, setFlaggedIssues] = useState([]);
  const [routeLoading, setRouteLoading]   = useState(false);
  const [routeError, setRouteError]       = useState("");
  const [routeBounds, setRouteBounds]     = useState(null);
  const [routeMode, setRouteMode]         = useState(false);

  const user = localStorage.getItem("loggedInUser") || "User";

  useEffect(() => {
    fetch("http://localhost:8080/api/issues")
      .then((r) => r.json())
      .then((d) => { setIssues(d); setLoading(false); })
      .catch(() => setLoading(false));

    // 📡 Socket.IO Real-time Listener
    const socket = io("http://localhost:8080");

    socket.on("connect", () => {
      console.log("🔌 ReportMap connected to WebSocket");
    });

    socket.on("new-iot-issue", (newIssue) => {
      console.log("⚡ Realtime IoT Issue in Map:", newIssue);
      setIssues((prev) => [newIssue, ...prev]);
      // Optional: If we want to notify via toast here, we can, but Dashboard already does it.
      // toast.info(`📡 New IoT Alert: ${newIssue.title}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRouteSearch = async (e) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) return;
    setRouteError(""); setRouteLoading(true);
    setRouteCoords(null); setFlaggedIssues([]); setRouteMode(false);
    try {
      // Use selected coordinates if available, otherwise fallback to geocoding the text string
      const from = sourceCoordsObj
        ? [sourceCoordsObj.lat, sourceCoordsObj.lon]
        : await geocode(source);

      const to = destCoordsObj
        ? [destCoordsObj.lat, destCoordsObj.lon]
        : await geocode(destination);

      const coords = await getRoute(from, to);
      setFromCoord(from); setToCoord(to); setRouteCoords(coords); setRouteMode(true);

      const flagged = issues
        .filter((i) => i.location?.latitude && i.location?.longitude)
        .filter((i) =>
          distToPolyline([Number(i.location.latitude), Number(i.location.longitude)], coords) <= THRESHOLD_KM
        );
      setFlaggedIssues(flagged);

      const lats = coords.map((c) => c[0]), lngs = coords.map((c) => c[1]);
      setRouteBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]);
    } catch (err) {
      setRouteError(err.message || "Failed to find route");
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
<<<<<<< HEAD
    setRouteCoords(null); setFromCoord(null); setToCoord(null);
    setFlaggedIssues([]); setRouteBounds(null); setRouteMode(false);
    setRouteError(""); setSource(""); setDestination("");
=======
    setRouteCoords(null);
    setFromCoord(null);
    setToCoord(null);
    setFlaggedIssues([]);
    setRouteBounds(null);
    setRouteMode(false);
    setRouteError("");
    setSource("");
    setDestination("");
    setSourceCoordsObj(null);
    setDestCoordsObj(null);
    setRouteLoading(false);
>>>>>>> c8bcb0d14097d50658debfb9fa3ddad784945b00
  };

  const sev = routeMode ? getSeverity(flaggedIssues.length) : null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Section Heading ────────────────────────────────────────────────── */}
        <div className="text-center">
          <span className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-transparent bg-clip-text text-sm font-bold uppercase tracking-widest mb-2">
            Live Map
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            🗺️ City Issue Map
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Hi <span className="font-semibold text-blue-600">{user}</span> — browse reported civic issues or check your route before you travel.
          </p>
          {/* Blue-green gradient underline */}
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
        </div>

<<<<<<< HEAD
        {/* ── Route Finder Card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-lg shadow-md">
              🛣️
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-base">Route Issue Finder</h3>
              <p className="text-gray-400 text-xs">Highlights issues within 500m of your route</p>
            </div>
=======
        <form onSubmit={handleRouteSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 z-20">
            <span className="absolute left-3 top-3.5 z-10 text-base">🚀</span>
            <LocationSearchInput
              placeholder="Source (e.g. Connaught Place)"
              value={source}
              onChange={setSource}
              onSelect={(data) => {
                setSource(data.name);
                setSourceCoordsObj(data);
              }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
            />
          </div>
          <div className="relative flex-1 z-10">
            <span className="absolute left-3 top-3.5 z-10 text-base">🏁</span>
            <LocationSearchInput
              placeholder="Destination (e.g. India Gate)"
              value={destination}
              onChange={setDestination}
              onSelect={(data) => {
                setDestination(data.name);
                setDestCoordsObj(data);
              }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
            />
          </div>
          <button
            type="submit"
            disabled={routeLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 whitespace-nowrap shadow-sm h-fit"
          >
            {routeLoading ? "Searching…" : "Find Issues"}
          </button>
          {routeMode && (
            <button
              type="button"
              onClick={clearRoute}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all h-fit"
            >
              ✕ Clear
            </button>
          )}
        </form>

        {routeError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 font-medium">
            ⚠️ {routeError}
          </div>
        )}

        {routeMode && !routeLoading && (
          <>
            {/* Severity banner */}
            <div className={`mt-3 text-sm font-bold border rounded-xl px-4 py-2 ${severityInfo().color}`}>
              {severityInfo().text}
              <span className="font-normal ml-2 text-xs opacity-70">(within 500m of route)</span>
            </div>

            {/* Issue list box — shown only when there are flagged issues */}
            {flaggedIssues.length > 0 && (
              <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    🚨 Issues on this route
                  </span>
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {flaggedIssues.length} found
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                  {flaggedIssues.map((issue) => (
                    <div key={issue._id} className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                      {/* Status dot */}
                      <span
                        className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[issue.status] || "#ef4444" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{issue.title}</p>
                        <p className="text-xs text-gray-400 truncate">{issue.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: (STATUS_COLORS[issue.status] || "#ef4444") + "20",
                            color: STATUS_COLORS[issue.status] || "#ef4444",
                          }}
                        >
                          {issue.status}
                        </span>
                        <span className="text-xs text-gray-400">{issue.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl shadow-lg overflow-hidden border border-gray-200 bg-white max-w-5xl mx-auto relative z-0">
        {loading ? (
          <div className="flex items-center justify-center h-[520px]">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-500 border-t-transparent" />
>>>>>>> c8bcb0d14097d50658debfb9fa3ddad784945b00
          </div>

          {/* Search inputs */}
          <form onSubmit={handleRouteSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🚀</span>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source (e.g. Chandni Chowk, Delhi)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">🏁</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination (e.g. India Gate, Delhi)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 font-medium bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={routeLoading}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 shadow-md shadow-blue-200 whitespace-nowrap"
            >
              {routeLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                  </svg>
                  Searching…
                </span>
              ) : "Find Issues"}
            </button>
            {routeMode && (
              <button
                type="button"
                onClick={clearRoute}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
              >
                ✕ Clear
              </button>
            )}
          </form>

          {/* Error */}
          {routeError && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl px-4 py-2.5">
              ⚠️ {routeError}
            </div>
          )}

          {/* Severity banner */}
          {routeMode && !routeLoading && sev && (
            <div className={`mt-3 flex items-center gap-3 border rounded-xl px-4 py-3 ${sev.cls}`}>
              <span className="text-2xl">{sev.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{sev.label}</p>
                <p className="text-xs opacity-70">{sev.sub}</p>
              </div>
              {flaggedIssues.length > 0 && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sev.badge}`}>
                  {flaggedIssues.length} found
                </span>
              )}
            </div>
          )}

          {/* Issues list */}
          {routeMode && flaggedIssues.length > 0 && (
            <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Issues on route</span>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {flaggedIssues.length} found
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                {flaggedIssues.map((issue) => (
                  <div key={issue._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: STATUS_COLORS[issue.status] || "#ef4444" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{issue.title}</p>
                      <p className="text-xs text-gray-400 truncate">{issue.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: (STATUS_COLORS[issue.status] || "#ef4444") + "20",
                          color: STATUS_COLORS[issue.status] || "#ef4444",
                        }}
                      >
                        {issue.status}
                      </span>
                      <span className="text-xs text-gray-400">{issue.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Map ──────────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200" style={{ height: 520 }}>
          {loading ? (
            <div className="h-full bg-gray-100 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Loading map data…</p>
            </div>
          ) : (
            <MapContainer center={[28.6448, 77.216721]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {routeBounds && <FlyTo bounds={routeBounds} />}

              {/* Route polyline — blue-to-green gradient feel via dual segments */}
              {routeCoords && (
                <Polyline positions={routeCoords} pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.9 }} />
              )}

              {/* Start / End markers */}
              {fromCoord && <Marker position={fromCoord} icon={startIcon}><Popup><strong>🚀 Source</strong><br />{source}</Popup></Marker>}
              {toCoord   && <Marker position={toCoord}   icon={endIcon  }><Popup><strong>🏁 Destination</strong><br />{destination}</Popup></Marker>}

              {/* Route mode — only flagged issues */}
              {routeMode ? (
                flaggedIssues.map((issue) => (
                  <Marker
                    key={issue._id}
                    position={[Number(issue.location.latitude), Number(issue.location.longitude)]}
                    icon={problemIcon}
                  >
                    <Popup>
<<<<<<< HEAD
                      <div style={{ minWidth: 180 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>⚠️ {issue.title}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{issue.description}</p>
                        <div style={{ fontSize: 11 }}>
                          <b>Category:</b> {issue.category}<br />
                          <b>Status:</b>{" "}
                          <span style={{ color: STATUS_COLORS[issue.status] || "#ef4444", fontWeight: 700 }}>
                            {issue.status}
                          </span>
                        </div>
=======
                      <div className="space-y-1 min-w-[180px]">
                        <h3 className="font-bold text-sm text-gray-900">
                          {issue.source === "IoT Auto Detection" && "📡 "}
                          {issue.title}
                        </h3>
                        {issue.source === "IoT Auto Detection" && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold mb-1">
                            IoT Detected {issue.confidenceScore && `(${issue.confidenceScore}%)`}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-3">{issue.description}</p>
                        <div className="text-xs mt-1">
                          <span className="font-semibold">Category:</span> {issue.category}
                          <br />
                          <span className="font-semibold">Status:</span>{" "}
                          <span
                            style={{ color: STATUS_COLORS[issue.status] || "#ef4444" }}
                            className="font-bold"
                          >
                            {issue.status}
                          </span>
                        </div>
                        {issue.imageURL && (
                          <img
                            src={
                              issue.imageURL.startsWith("http")
                                ? issue.imageURL
                                : `https://cgc-hacathon-backend.onrender.com/${issue.imageURL.replace("\\", "/")}`
                            }
                            alt={issue.title}
                            className="h-20 w-full object-cover rounded mt-1 border border-gray-200"
                          />
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            ) : (
              /* ── Normal mode: all issues with colored dots ── */
              issues
                .filter((i) => i.location?.latitude && i.location?.longitude)
                .map((issue) => (
                  <Marker
                    key={issue._id}
                    position={[
                      Number(issue.location.latitude),
                      Number(issue.location.longitude),
                    ]}
                    icon={issue.source === "IoT Auto Detection" ? defaultIcon : defaultIcon} // Could use a specific IoT icon if desired
                  >
                    <Popup>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base text-gray-900">
                          {issue.source === "IoT Auto Detection" && "📡 "}
                          {issue.title}
                        </h3>
                        {issue.source === "IoT Auto Detection" && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold mb-1">
                            IoT Confidence: {issue.confidenceScore}%
                          </span>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-3">{issue.description}</p>
                        <div className="text-xs mt-2">
                          <span className="font-semibold">Category:</span>{" "}
                          <span className="text-gray-800">{issue.category}</span>
                          <br />
                          <span className="font-semibold">Status:</span>{" "}
                          <span
                            className={`font-bold ${issue.status === "Resolved"
                              ? "text-green-600"
                              : issue.status === "In Progress"
                                ? "text-yellow-600"
                                : "text-red-600"
                              }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                        {issue.imageURL && (
                          <img
                            src={
                              issue.imageURL.startsWith("http")
                                ? issue.imageURL
                                : `https://cgc-hacathon-backend.onrender.com/${issue.imageURL.replace("\\", "/")}`
                            }
                            alt={issue.title}
                            className="h-24 w-full object-cover rounded-md mt-2 border border-gray-200"
                          />
                        )}
>>>>>>> c8bcb0d14097d50658debfb9fa3ddad784945b00
                      </div>
                    </Popup>
                  </Marker>
                ))
              ) : (
                /* Normal mode — all issues */
                issues
                  .filter((i) => i.location?.latitude && i.location?.longitude)
                  .map((issue) => (
                    <Marker
                      key={issue._id}
                      position={[Number(issue.location.latitude), Number(issue.location.longitude)]}
                      icon={defaultIcon}
                    >
                      <Popup>
                        <div style={{ minWidth: 180 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{issue.title}</p>
                          <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{issue.description}</p>
                          <div style={{ fontSize: 11 }}>
                            <b>Category:</b> {issue.category}<br />
                            <b>Status:</b>{" "}
                            <span style={{ color: STATUS_COLORS[issue.status] || "#ef4444", fontWeight: 700 }}>
                              {issue.status}
                            </span>
                          </div>
                          {issue.imageURL && (
                            <img
                              src={issue.imageURL.startsWith("http") ? issue.imageURL : `https://cgc-hacathon-backend.onrender.com/${issue.imageURL.replace("\\", "/")}`}
                              alt={issue.title}
                              style={{ marginTop: 6, width: "100%", height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }}
                            />
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))
              )}
            </MapContainer>
          )}
        </div>

<<<<<<< HEAD
        {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
        {!routeMode && !loading && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Issues",  value: issues.length,                                      color: "text-sky-500",   bg: "bg-sky-50   border-sky-100"   },
              { label: "Pending",       value: issues.filter(i => i.status === "Pending").length,  color: "text-red-500",   bg: "bg-red-50   border-red-100"   },
              { label: "Resolved",      value: issues.filter(i => i.status === "Resolved").length, color: "text-green-500", bg: "bg-green-50 border-green-100" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} border rounded-2xl px-4 py-5 text-center shadow-sm`}>
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
=======
      {/* ── Flagged issue cards ── */}
      {routeMode && flaggedIssues.length > 0 && (
        <div className="max-w-5xl mx-auto mt-6">
          <h2 className="text-lg font-extrabold text-gray-800 mb-3">
            ⚠️ Issues Along Your Route ({flaggedIssues.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flaggedIssues.map((issue) => (
              <div
                key={issue._id}
                onClick={() => handleIssueClick(issue)}
                className={`bg-white rounded-xl shadow border p-4 hover:shadow-md transition-all cursor-pointer hover:ring-2 hover:ring-indigo-100 ${issue.source === "IoT Auto Detection" ? "border-blue-200 bg-blue-50/30" : "border-red-100"
                  }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight flex flex-col">
                      {issue.title}
                      {issue.source === "IoT Auto Detection" && (
                        <span className="text-[10px] text-blue-600 font-normal">
                          📡 IoT {issue.confidenceScore}%
                        </span>
                      )}
                    </h3>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: (STATUS_COLORS[issue.status] || "#ef4444") + "20",
                      color: STATUS_COLORS[issue.status] || "#ef4444",
                    }}
                  >
                    {issue.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs line-clamp-2 mb-2">{issue.description}</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {issue.category}
                </span>
>>>>>>> c8bcb0d14097d50658debfb9fa3ddad784945b00
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
