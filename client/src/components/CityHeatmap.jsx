import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { useEffect } from "react";

function HeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatPoints = points.map(p => [p.lat, p.lng, p.weight || 1]);

    const layer = L.heatLayer(heatPoints, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [points, map]);

  return null;
}

const CityHeatmap = ({ points }) => {
  return (
    <div className="h-96 rounded-lg overflow-hidden shadow">
      <MapContainer
        center={[28.61, 77.20]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <HeatLayer points={points} />
      </MapContainer>
    </div>
  );
};

export default CityHeatmap;
