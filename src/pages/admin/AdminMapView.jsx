import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { subscribeComplaints } from '../../services/firebase.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import UrgencyBadge from '../../components/UrgencyBadge.jsx';
import AdminComplaintDetailModal from './AdminComplaintDetailModal.jsx';
import { PageHeader, Alert } from '../../components/ui.jsx';
import {
  MapPin,
  RefreshCw,
  Flame,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Eye,
} from 'lucide-react';

// Custom Leaflet pins based on urgency using standalone SVG
const createMarkerIcon = (urgency) => {
  const configs = {
    Critical: { fill: '#e11d48', stroke: '#9f1239' },
    High: { fill: '#ea580c', stroke: '#9a3412' },
    Medium: { fill: '#f59e0b', stroke: '#b45309' },
    Low: { fill: '#10b981', stroke: '#047857' },
  };

  const conf = configs[urgency] || configs.Medium;

  return L.divIcon({
    className: 'urgency-map-pin',
    html: `
      <div style="position: relative; width: 34px; height: 44px;">
        <div style="
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 6px;
          background: rgba(0,0,0,0.35);
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 42px;
          filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));
        ">
          <svg viewBox="0 0 36 48" width="32" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.05887 0 0 8.05887 0 18C0 30.5 16 46 18 48C20 46 36 30.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="${conf.fill}"/>
            <path d="M18 2C9.16344 2 2 9.16344 2 18C2 28.5 16 43.5 18 45.5C20 43.5 34 28.5 34 18C34 9.16344 26.8366 2 18 2Z" fill="${conf.stroke}"/>
            <circle cx="18" cy="18" r="7" fill="#ffffff"/>
            <circle cx="18" cy="18" r="4" fill="${conf.fill}"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -44],
  });
};

export default function AdminMapView() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeComplaints(
      null,
      (allComplaints) => {
        setComplaints(allComplaints);
        setLoading(false);
      },
      setLoadError
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const filtered = complaints.filter((c) => {
    if (selectedUrgency !== 'all' && c.urgency !== selectedUrgency) return false;
    return Boolean(c.location?.lat && c.location?.lng);
  });

  return (
    <div>
      <PageHeader
        eyebrow="Geospatial view"
        title="Complaint map"
        subtitle="Every reported issue plotted by location and colour-coded by urgency."
        actions={
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {['all', 'Critical', 'High', 'Medium', 'Low'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedUrgency(lvl)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedUrgency === lvl
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {lvl === 'all' ? 'All' : lvl}
              </button>
            ))}
          </div>
        }
      />
      {loadError && <Alert tone="error" className="mb-4">{loadError}</Alert>}

      {/* Map Container */}
      <div className="relative h-[60vh] lg:h-[68vh] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-card">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-2" />
            <p className="text-xs font-bold text-slate-500">Rendering Kerala geospatial pins...</p>
          </div>
        ) : (
          <MapContainer
            center={[9.9816, 76.2999]} // Kochi central coordinates
            zoom={12}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filtered.map((item) => {
              const icon = createMarkerIcon(item.urgency);
              return (
                <Marker
                  key={item.complaintId}
                  position={[item.location.lat, item.location.lng]}
                  icon={icon}
                >
                  <Popup className="janmithra-popup">
                    <div className="p-1 max-w-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          #{item.complaintId}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="Evidence"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}

                      <div className="font-bold text-slate-900 text-sm line-clamp-2">
                        {item.description}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-teal-700">{item.category}</span>
                        <UrgencyBadge urgency={item.urgency} size="sm" />
                      </div>

                      <div className="text-[11px] text-slate-500 truncate">
                        📍 {item.location?.ward || 'Kerala Ward'}
                      </div>

                      <div className="pt-2 border-t flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveComplaint(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Manage Issue
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Urgency Legend Overlay */}
        <div className="absolute bottom-3 left-3 sm:left-auto sm:right-4 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 text-xs space-y-1.5 pointer-events-auto">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
            Urgency
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-700 font-medium">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-700 font-medium">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-slate-700 font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-700 font-medium">Low</span>
          </div>
        </div>
      </div>

      {/* Modal if pin popup clicked */}
      {activeComplaint && (
        <AdminComplaintDetailModal
          complaint={activeComplaint}
          onClose={() => setActiveComplaint(null)}
        />
      )}
    </div>
  );
}
