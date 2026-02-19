import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import SnailLoader from "../components/Loader";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ✅ Optional custom marker icon (for better visuals)
const customIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/684/684908.png", // location pin icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

function ReportMap() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = localStorage.getItem("loggedInUser");

  useEffect(() => {
    fetch("http://localhost:8080/api/issues")
      .then((res) => res.json())
      .then((data) => {
        setIssues(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <SnailLoader />;

  return (
    <div className="p-8 bg-gray-50 ">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Map View of Reported Issues
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Welcome <span className="text-indigo-600 font-semibold">{user}</span> —
          view reported issues across your city.
        </p>
      </div>

      {/* Map Section */}
      <div className="rounded-2xl shadow-lg overflow-hidden border border-gray-200 bg-white max-w-6xl mx-auto">
        <MapContainer
          center={[28.6448, 77.216721]}
          zoom={12}
          className="rounded-2xl"
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {issues.map((issue) =>
            issue.location?.latitude && issue.location?.longitude ? (
              <Marker
                key={issue._id}
                position={[
                  Number(issue.location.latitude),
                  Number(issue.location.longitude),
                ]}
                icon={customIcon}
              >
                <Popup>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base text-gray-900">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {issue.description}
                    </p>

                    <div className="text-xs mt-2">
                      <span className="font-semibold">Category:</span>{" "}
                      <span className="text-gray-800">{issue.category}</span>
                      <br />
                      <span className="font-semibold">Status:</span>{" "}
                      <span
                        className={`font-bold ${
                          issue.status === "Resolved"
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
                            : `https://cgc-hacathon-backend.onrender.com/${issue.imageURL.replace(
                                "\\",
                                "/"
                              )}`
                        }
                        alt={issue.title}
                        className="h-24 w-full object-cover rounded-md mt-2 border border-gray-200"
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default ReportMap;
