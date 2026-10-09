import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldAlert, Radio, Navigation, Maximize, Minimize } from 'lucide-react';

// Fix default Leaflet icon URLs for React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Emergency SOS Red Pulsing Marker
const emergencyIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom Live User Violet Marker
const liveUserIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Imperatively controls the Leaflet map marker + view.
 * Uses native Leaflet API (L.marker, setLatLng) via refs to guarantee
 * the marker moves when lat/lng props change — fixes issues where
 * react-leaflet declarative Marker doesn't re-render on socket state updates.
 */
const ImperativeMarkerController = ({ lat, lng, accuracy, isEmergency, userName, speed }) => {
  const map = useMap();
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const lastCenter = useRef([null, null]);

  useEffect(() => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    const pos = [parseFloat(lat), parseFloat(lng)];
    const icon = isEmergency ? emergencyIcon : liveUserIcon;

    // Build popup HTML
    const popupHtml = `
      <div style="font-size:11px;min-width:150px;line-height:1.6">
        <b>${userName || 'User'}</b><br/>
        <span style="font-family:monospace;font-size:10px">Lat: ${parseFloat(lat).toFixed(5)}, Lng: ${parseFloat(lng).toFixed(5)}</span><br/>
        <span>GPS: &plusmn;${accuracy || 15}m</span>
        ${isEmergency ? '<br/><b style="color:#E62E5C">&#x1F6A8; EMERGENCY SOS</b>' : ''}
      </div>
    `;

    // Create marker if it doesn't exist yet
    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { icon }).addTo(map);
      markerRef.current.bindPopup(popupHtml);
    } else {
      // Move existing marker to new position (this is the key fix!)
      markerRef.current.setLatLng(pos);
      markerRef.current.setPopupContent(popupHtml);
    }

    // Create or update accuracy circle
    if (!circleRef.current) {
      circleRef.current = L.circle(pos, {
        radius: accuracy || 15,
        color: isEmergency ? '#E62E5C' : '#4f46e5',
        fillColor: isEmergency ? '#E62E5C' : '#818cf8',
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(pos);
      circleRef.current.setRadius(accuracy || 15);
    }

    // Smooth flyTo if location changed significantly (>~11m)
    const [prevLat, prevLng] = lastCenter.current;
    const hasMoved =
      prevLat === null ||
      prevLng === null ||
      Math.abs(pos[0] - prevLat) > 0.0001 ||
      Math.abs(pos[1] - prevLng) > 0.0001;

    if (hasMoved) {
      lastCenter.current = [pos[0], pos[1]];
      map.flyTo(pos, map.getZoom() || 16, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [lat, lng, accuracy, map, isEmergency, userName, speed]);

  // Cleanup markers on component unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export const LiveLocationMap = ({
  lat,
  lng,
  accuracy = 15,
  userName = 'User Location',
  isEmergency = false,
  speed = null,
  locationHistory = [],
}) => {
  const [trail, setTrail] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Initialize trail with history on mount or when history prop updates significantly
  useEffect(() => {
    if (locationHistory && locationHistory.length > 0) {
      const historicalPoints = locationHistory
        .filter((loc) => loc.latitude && loc.longitude)
        .map((loc) => [parseFloat(loc.latitude), parseFloat(loc.longitude)]);
      setTrail(historicalPoints);
    }
  }, [locationHistory]);

  // Store trajectory path trail as coordinates update in real-time
  useEffect(() => {
    if (lat && lng) {
      setTrail((prev) => {
        const last = prev[prev.length - 1];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lng);
        if (!last || last[0] !== newLat || last[1] !== newLng) {
          return [...prev, [newLat, newLng]];
        }
        return prev;
      });
    }
  }, [lat, lng]);

  const isValidLocation = lat !== undefined && lat !== null && lng !== undefined && lng !== null && !isNaN(lat) && !isNaN(lng);

  if (!isValidLocation) {
    return (
      <div className="w-full h-full relative rounded-card overflow-hidden shadow-plum-subtle bg-slate-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-bold text-slate-500">Waiting for GPS location...</p>
      </div>
    );
  }

  const currentPosition = [parseFloat(lat), parseFloat(lng)];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : 'w-full h-full relative rounded-card overflow-hidden shadow-plum-subtle group'}`}>
      <MapContainer
        center={currentPosition}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ zIndex: 0 }}
      >
        {/* Imperative marker controller — guarantees marker movement on every lat/lng change */}
        <ImperativeMarkerController
          lat={lat}
          lng={lng}
          accuracy={accuracy}
          isEmergency={isEmergency}
          userName={userName}
          speed={speed}
        />

        {/* OpenStreetMap Tile Layer (Free & Reliable) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Live Breadcrumb Trajectory Trail */}
        {trail.length > 1 && (
          <Polyline
            positions={trail}
            pathOptions={{
              color: isEmergency ? '#E62E5C' : '#6366f1',
              weight: 4,
              opacity: 0.85,
              dashArray: isEmergency ? '6, 6' : undefined,
            }}
          />
        )}
      </MapContainer>

      {/* Leaflet Live Overlay Badge */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-gray-200 shadow-md px-3 py-1.5 rounded-full flex items-center space-x-2">
        <span
          className={`w-2 h-2 rounded-full ${isEmergency ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}
        />
        <span className="text-[11px] font-black text-gray-800 tracking-wide uppercase">
          Live GPS Tracking
        </span>
      </div>

      {/* Fullscreen Toggle Button */}
      <div className="absolute top-3 right-3 z-[400]">
        <button
          onClick={toggleFullscreen}
          className="bg-white/95 hover:bg-white text-gray-700 p-2 rounded-md shadow-md border border-gray-200 transition-all flex items-center justify-center focus:outline-none"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
};
