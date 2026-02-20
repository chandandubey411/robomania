import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LocationSearchInput from "./LocationSearchInput"; // Import autocomplete component
import { io } from "socket.io-client"; // 🔌 Import Socket.IO
import { toast } from "react-toastify"; // Optional: Notification

// ── Haversine distance (km) between two [lat,lng] points ─────────────────────
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

// Min distance from point to polyline
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

const STATUS_COLORS = {
  Resolved: "#22c55e",
  "In Progress": "#f59e0b",
  Pending: "#ef4444",
};

const problemIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;background:#ef4444;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.4);font-size:14px;animation:pulse 1.5s infinite;">⚠️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const startIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;background:#6366f1;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.4);font-size:18px;">🚀</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const endIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;background:#10b981;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.4);font-size:18px;">🏁</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const defaultIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function FlyTo({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

const THRESHOLD_KM = 0.5;

function ReportMap() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Route state
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  // Store precise coordinates from autocomplete
  const [sourceCoordsObj, setSourceCoordsObj] = useState(null);
  const [destCoordsObj, setDestCoordsObj] = useState(null);

  const [routeCoords, setRouteCoords] = useState(null);
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [flaggedIssues, setFlaggedIssues] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeBounds, setRouteBounds] = useState(null);
  const [routeMode, setRouteMode] = useState(false);

  const user = localStorage.getItem("loggedInUser");

  useEffect(() => {
    fetch("http://localhost:8080/api/issues")
      .then((res) => res.json())
      .then((data) => {
        setIssues(data);
        setLoading(false);
      })
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
    setRouteError("");
    setRouteLoading(true);
    setRouteCoords(null);
    setFlaggedIssues([]);
    setRouteMode(false);

    try {
      // Use selected coordinates if available, otherwise fallback to geocoding the text string
      const from = sourceCoordsObj
        ? [sourceCoordsObj.lat, sourceCoordsObj.lon]
        : await geocode(source);

      const to = destCoordsObj
        ? [destCoordsObj.lat, destCoordsObj.lon]
        : await geocode(destination);

      const coords = await getRoute(from, to);

      setFromCoord(from);
      setToCoord(to);
      setRouteCoords(coords);
      setRouteMode(true);

      const validIssues = issues.filter(
        (i) => i.location?.latitude && i.location?.longitude
      );
      const flagged = validIssues.filter((issue) => {
        const pt = [
          Number(issue.location.latitude),
          Number(issue.location.longitude),
        ];
        return distToPolyline(pt, coords) <= THRESHOLD_KM;
      });
      setFlaggedIssues(flagged);

      const lats = coords.map((c) => c[0]);
      const lngs = coords.map((c) => c[1]);
      setRouteBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ]);
    } catch (err) {
      setRouteError(err.message || "Failed to find route");
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
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
  };

  const severityInfo = () => {
    const n = flaggedIssues.length;
    if (n === 0) return { text: "✅ Clear Route — No issues found!", color: "bg-green-50 border-green-300 text-green-700" };
    if (n <= 2) return { text: `⚠️ ${n} Minor Issue${n > 1 ? "s" : ""} along this route`, color: "bg-yellow-50 border-yellow-300 text-yellow-700" };
    return { text: `🚨 ${n} Issues along this route — Drive carefully!`, color: "bg-red-50 border-red-300 text-red-700" };
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">
          🗺️ Map View of Reported Issues
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome <span className="text-indigo-600 font-semibold">{user}</span> — view
          and search reported issues across your city.
        </p>
      </div>

      {/* ── Route Finder Panel ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mb-5 bg-white rounded-2xl shadow-md border border-gray-200 p-5">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-xl">🛣️</span> Route Issue Finder
          <span className="text-xs font-normal text-gray-400 ml-1">
            — Enter source & destination to highlight issues along your path
          </span>
        </h2>

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
          </div>
        ) : (
          <MapContainer
            center={[28.6448, 77.216721]}
            zoom={12}
            style={{ height: "520px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {routeBounds && <FlyTo bounds={routeBounds} />}

            {/* Route polyline */}
            {routeCoords && (
              <Polyline
                positions={routeCoords}
                pathOptions={{ color: "#6366f1", weight: 5, opacity: 0.9 }}
              />
            )}

            {/* Start / End markers */}
            {fromCoord && (
              <Marker position={fromCoord} icon={startIcon}>
                <Popup><strong>🚀 Source</strong><br />{source}</Popup>
              </Marker>
            )}
            {toCoord && (
              <Marker position={toCoord} icon={endIcon}>
                <Popup><strong>🏁 Destination</strong><br />{destination}</Popup>
              </Marker>
            )}

            {/* ── Route mode: only flagged issues shown as red markers ── */}
            {routeMode ? (
              <>
                {/* Only flagged issues — highlighted with warning icon */}
                {flaggedIssues.map((issue) => (
                  <Marker
                    key={issue._id}
                    position={[
                      Number(issue.location.latitude),
                      Number(issue.location.longitude),
                    ]}
                    icon={problemIcon}
                  >
                    <Popup>
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
                      </div>
                    </Popup>
                  </Marker>
                ))
            )}
          </MapContainer>
        )}
      </div>

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
              </div>
            ))}
          </div>
        </div>
      )}

      {routeMode && flaggedIssues.length === 0 && !routeLoading && (
        <div className="max-w-5xl mx-auto mt-5 py-8 text-center bg-green-50 rounded-2xl border border-green-200">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-bold text-green-700 text-lg">Great news! No issues on this route.</p>
          <p className="text-green-500 text-sm mt-1">Safe travels! 🚗</p>
        </div>
      )}
    </div>
  );
}

export default ReportMap;
