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

// ── Helpers ──────────────────────────────────────────────────────────────────
// Haversine distance between two [lat,lng] points in km
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

// Minimum distance from a point to a polyline (array of [lat,lng])
function distToPolyline(point, polyline) {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    // distance to segment approximate via midpoint
    const mid = [
      (polyline[i][0] + polyline[i + 1][0]) / 2,
      (polyline[i][1] + polyline[i + 1][1]) / 2,
    ];
    const d1 = haversine(point, polyline[i]);
    const d2 = haversine(point, polyline[i + 1]);
    const dm = haversine(point, mid);
    const d = Math.min(d1, d2, dm);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Geocode a place name → [lat, lng] using Nominatim
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find "${query}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// Get driving route from OSRM (free, no key)
async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route not found");
  // GeoJSON coordinates are [lng, lat] — swap to [lat, lng]
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

const STATUS_COLORS = { Resolved: "#22c55e", "In Progress": "#f59e0b", Pending: "#ef4444" };

const problemIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#ef4444;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:13px;">⚠️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const startIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;background:#6366f1;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:16px;">🚀</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

const endIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;background:#10b981;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:16px;">🏁</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

// Fly map to center of route
function FlyTo({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

const THRESHOLD_KM = 0.5; // issues within 500m of route are flagged

export default function RouteIssueMap() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [routeCoords, setRouteCoords] = useState(null);
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [issues, setIssues] = useState([]);
  const [flaggedIssues, setFlaggedIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [routeBounds, setRouteBounds] = useState(null);

  // Fetch all issues once
  useEffect(() => {
    fetch("http://localhost:8080/api/issues")
      .then((r) => r.json())
      .then((data) => setIssues(data.filter((i) => i.location?.latitude && i.location?.longitude)))
      .catch(console.error);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) return;
    setError(""); setLoading(true); setRouteCoords(null); setFlaggedIssues([]);
    try {
      const [from, to] = await Promise.all([geocode(source), geocode(destination)]);
      const coords = await getRoute(from, to);
      setFromCoord(from);
      setToCoord(to);
      setRouteCoords(coords);

      // Find issues within threshold distance from the route
      const flagged = issues.filter((issue) => {
        const pt = [Number(issue.location.latitude), Number(issue.location.longitude)];
        return distToPolyline(pt, coords) <= THRESHOLD_KM;
      });
      setFlaggedIssues(flagged);
      setSearched(true);

      // Compute bounds for map pan
      const lats = coords.map((c) => c[0]);
      const lngs = coords.map((c) => c[1]);
      setRouteBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]);
    } catch (err) {
      setError(err.message || "Failed to find route");
    } finally {
      setLoading(false);
    }
  };

  const severityLabel = (count) => {
    if (count === 0) return { text: "✅ Clear Route", color: "text-green-600 bg-green-50 border-green-200" };
    if (count <= 2) return { text: "⚠️ Minor Issues", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    return { text: "🚨 Major Issues", color: "text-red-600 bg-red-50 border-red-200" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 py-12 px-6 shadow-xl">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-lg">🗺️ Route Issue Finder</h1>
          <p className="text-lg md:text-xl text-indigo-200 mb-8 font-medium">
            Enter your source &amp; destination to see all reported civic issues along your route
          </p>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🚀</span>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source (e.g. Connaught Place, Delhi)"
                className="w-full pl-10 pr-4 py-3.5 rounded-full text-base text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg bg-white/95"
              />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🏁</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination (e.g. India Gate, Delhi)"
                className="w-full pl-10 pr-4 py-3.5 rounded-full text-base text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg bg-white/95"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-60 whitespace-nowrap text-base"
            >
              {loading ? "Searching..." : "Find Issues"}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-300 text-red-100 px-4 py-2 rounded-full text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Results bar */}
      {searched && !loading && (
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
          {(() => { const s = severityLabel(flaggedIssues.length); return (
            <span className={`text-base font-bold px-5 py-2 rounded-full border ${s.color}`}>{s.text}</span>
          );})()}
          <span className="text-gray-500 text-base font-medium">
            {flaggedIssues.length} issue{flaggedIssues.length !== 1 ? "s" : ""} found within 500m of route
          </span>
        </div>
      )}

      {/* Map */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <MapContainer
            center={[28.6448, 77.2167]}
            zoom={12}
            style={{ height: "540px", width: "100%" }}
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
                pathOptions={{ color: "#6366f1", weight: 5, opacity: 0.85, dashArray: null }}
              />
            )}

            {/* Source & Destination markers */}
            {fromCoord && <Marker position={fromCoord} icon={startIcon}><Popup><strong>📍 Source</strong><br />{source}</Popup></Marker>}
            {toCoord && <Marker position={toCoord} icon={endIcon}><Popup><strong>🏁 Destination</strong><br />{destination}</Popup></Marker>}

            {/* All issues (dimmed) when route shown */}
            {routeCoords && issues
              .filter((i) => !flaggedIssues.some((f) => f._id === i._id))
              .map((issue) => (
                <CircleMarker
                  key={issue._id}
                  center={[Number(issue.location.latitude), Number(issue.location.longitude)]}
                  radius={5}
                  pathOptions={{ color: "#94a3b8", fillColor: "#cbd5e1", fillOpacity: 0.5, weight: 1 }}
                >
                  <Popup>
                    <div className="text-xs text-gray-500">{issue.title}<br /><span className="italic">{issue.status}</span></div>
                  </Popup>
                </CircleMarker>
              ))}

            {/* Flagged issues (highlighted) */}
            {flaggedIssues.map((issue) => (
              <Marker
                key={issue._id}
                position={[Number(issue.location.latitude), Number(issue.location.longitude)]}
                icon={problemIcon}
              >
                <Popup>
                  <div className="space-y-1 min-w-[180px]">
                    <h3 className="font-bold text-sm text-gray-900">⚠️ {issue.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-3">{issue.description}</p>
                    <div className="text-xs mt-1">
                      <span className="font-semibold">Category:</span> {issue.category}<br />
                      <span className="font-semibold">Status:</span>{" "}
                      <span style={{ color: STATUS_COLORS[issue.status] || "#ef4444" }} className="font-bold">
                        {issue.status}
                      </span>
                    </div>
                    {issue.imageURL && (
                      <img
                        src={issue.imageURL.startsWith("http") ? issue.imageURL : `https://cgc-hacathon-backend.onrender.com/${issue.imageURL.replace("\\", "/")}`}
                        alt={issue.title}
                        className="h-20 w-full object-cover rounded mt-1 border border-gray-200"
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* All issues (no route searched yet) */}
            {!routeCoords && issues.map((issue) => (
              <CircleMarker
                key={issue._id}
                center={[Number(issue.location.latitude), Number(issue.location.longitude)]}
                radius={7}
                pathOptions={{
                  color: "#fff",
                  fillColor: STATUS_COLORS[issue.status] || "#ef4444",
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="space-y-1 min-w-[160px]">
                    <h3 className="font-bold text-sm">{issue.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{issue.description}</p>
                    <span style={{ color: STATUS_COLORS[issue.status] || "#ef4444" }} className="text-xs font-bold">{issue.status}</span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Issue list below map */}
        {searched && flaggedIssues.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-extrabold text-gray-800 mb-4">⚠️ Issues Along Your Route</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flaggedIssues.map((issue) => (
                <div key={issue._id} className="bg-white rounded-xl shadow-md border border-red-100 p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-800 text-base leading-tight">{issue.title}</h3>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: STATUS_COLORS[issue.status] + "20", color: STATUS_COLORS[issue.status] || "#ef4444" }}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-2">{issue.description}</p>
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{issue.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && flaggedIssues.length === 0 && !loading && (
          <div className="mt-6 text-center py-10 bg-green-50 rounded-2xl border border-green-200">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-xl font-bold text-green-700">Great News!</p>
            <p className="text-green-600 mt-1">No reported issues found along this route.</p>
          </div>
        )}
      </div>
    </div>
  );
}
