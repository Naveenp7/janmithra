import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  MapPin,
  X,
  Map as MapIcon,
  RotateCcw,
} from 'lucide-react';

// Create a standalone SVG vector pin icon (no external CDN dependencies)
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-location-pin',
    html: `
      <div style="position: relative; width: 40px; height: 50px;">
        <!-- Pulsing Ground Target Ring -->
        <div style="
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%);
          width: 26px;
          height: 11px;
          background: rgba(13, 148, 136, 0.4);
          border: 2px solid #0d9488;
          border-radius: 50%;
          animation: pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
        <!-- Shadow -->
        <div style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 15px;
          height: 6px;
          background: rgba(0,0,0,0.4);
          border-radius: 50%;
        "></div>
        <!-- Vector Pin -->
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 38px;
          height: 48px;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        ">
          <svg viewBox="0 0 36 48" width="38" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.05887 0 0 8.05887 0 18C0 30.5 16 46 18 48C20 46 36 30.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#0d9488"/>
            <path d="M18 2C9.16344 2 2 9.16344 2 18C2 28.5 16 43.5 18 45.5C20 43.5 34 28.5 34 18C34 9.16344 26.8366 2 18 2Z" fill="#0f766e"/>
            <circle cx="18" cy="18" r="8" fill="#ffffff"/>
            <circle cx="18" cy="18" r="4.5" fill="#0d9488"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

const pinIcon = createPinIcon();

// Helper to reverse geocode lat/lng to readable address & ward
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.town || addr.city_district || '';
    const city = addr.city || addr.town || addr.county || 'Kerala';
    const road = addr.road || addr.pedestrian || addr.street || '';

    const wardText = suburb ? `${suburb}, ${city}` : city;
    const landmarkText = road
      ? `${road}${suburb ? ', near ' + suburb : ''}`
      : data.display_name
      ? data.display_name.split(',').slice(0, 3).join(', ')
      : '';

    return { ward: wardText, address: landmarkText };
  } catch (err) {
    return null;
  }
}

// Handles user clicks and dragging on the map
function MapClickHandler({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  const markerRef = useRef(null);

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          onPositionChange({ lat: newLatLng.lat, lng: newLatLng.lng });
        }
      },
    }),
    [onPositionChange]
  );

  return position ? (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      icon={pinIcon}
      ref={markerRef}
    />
  ) : null;
}

// Programmatically controls map camera movements
function MapController({ targetPos, shouldFly, onFlyComplete }) {
  const map = useMap();

  useEffect(() => {
    if (shouldFly && targetPos && targetPos.lat && targetPos.lng) {
      map.flyTo([targetPos.lat, targetPos.lng], 16, {
        animate: true,
        duration: 1.4,
      });
      if (onFlyComplete) onFlyComplete();
    }
  }, [shouldFly, targetPos, map, onFlyComplete]);

  return null;
}

// Popular Kerala districts for 1-tap map jump
const KERALA_DISTRICTS = [
  { name: 'Kochi / Ernakulam', lat: 9.9816, lng: 76.2999, ward: 'Kochi Corporation' },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, ward: 'Trivandrum City' },
  { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, ward: 'Kozhikode Corporation' },
  { name: 'Thrissur', lat: 10.5276, lng: 76.2144, ward: 'Thrissur Town' },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141, ward: 'Kollam LSG' },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704, ward: 'Kannur Corporation' },
  { name: 'Kottayam', lat: 9.5916, lng: 76.5222, ward: 'Kottayam Municipality' },
  { name: 'Palakkad', lat: 10.7867, lng: 76.6548, ward: 'Palakkad Town' },
  { name: 'Alappuzha', lat: 9.4981, lng: 76.3388, ward: 'Alappuzha Municipality' },
  { name: 'Malappuram', lat: 11.0510, lng: 76.0711, ward: 'Malappuram LSG' },
];

export default function LocationPicker({
  location = { lat: 9.9816, lng: 76.2999, ward: '', address: '' },
  onChange,
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsNote, setGpsNote] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [shouldFlyMap, setShouldFlyMap] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Default coordinates (Kochi)
  const currentPos = {
    lat: location.lat || 9.9816,
    lng: location.lng || 76.2999,
  };

  const handlePositionChange = async (newPos) => {
    const lat = Number(newPos.lat.toFixed(6));
    const lng = Number(newPos.lng.toFixed(6));

    // Update coordinates immediately
    onChange({
      ...location,
      lat,
      lng,
    });

    // Auto-fill address & ward
    setGeocoding(true);
    const geoInfo = await reverseGeocode(lat, lng);
    setGeocoding(false);

    if (geoInfo) {
      onChange({
        ...location,
        lat,
        lng,
        ward: location.ward ? location.ward : geoInfo.ward,
        address: geoInfo.address || location.address,
      });
    }
  };

  // Search input debounced query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
          searchQuery + ', Kerala'
        )}&limit=5`;
        const res = await fetch(queryUrl, {
          headers: { 'Accept-Language': 'en' },
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (e) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pick place from search
  const handleSelectPlace = (place) => {
    const lat = Number(parseFloat(place.lat).toFixed(6));
    const lng = Number(parseFloat(place.lon).toFixed(6));

    const parts = place.display_name.split(',');
    const localityName = parts.slice(0, 2).join(',').trim();
    const cityDistrict = parts.slice(2, 4).join(',').trim();

    onChange({
      ...location,
      lat,
      lng,
      ward: cityDistrict || localityName,
      address: place.display_name.split(',').slice(0, 3).join(', '),
    });

    setShowSuggestions(false);
    setSearchQuery(localityName);
    setGpsNote(null);
  };

  // 1-Tap District quick jump
  const handleSelectDistrict = (dist) => {
    onChange({
      ...location,
      lat: dist.lat,
      lng: dist.lng,
      ward: dist.ward,
      address: dist.name + ', Kerala',
    });
    setShouldFlyMap(true);
    setGpsNote(null);
  };

  // Reset / Clear location
  const handleClearLocation = () => {
    onChange({
      lat: 9.9816,
      lng: 76.2999,
      ward: '',
      address: '',
    });
    setSearchQuery('');
    setGpsNote(null);
    setGpsSuccess(false);
  };

  // Geolocation Handler
  const handleGpsClick = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    if (!navigator.geolocation) {
      setGpsNote({
        type: 'warning',
        message: 'Geolocation is not supported by your browser. Please search your place or tap the map.',
      });
      return;
    }

    setGpsLoading(true);
    setGpsNote(null);
    setGpsSuccess(false);

    // Try high-accuracy device GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoordinates(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGpsLoading(false);
        console.warn('[Location] GPS query failed:', err.message, 'Code:', err.code);

        // Mobile browsers block GPS over insecure HTTP LAN origins
        if (!isLocalhost && !isHttps) {
          setGpsNote({
            type: 'warning',
            message:
              'Mobile browsers (Chrome/Safari) block hardware GPS over HTTP local network IP addresses. Please use the Search bar below or tap directly on the map to pinpoint your location.',
          });
        } else {
          setGpsNote({
            type: 'warning',
            message:
              'Location access was denied or timed out. Please allow location permissions in your browser or search your locality below.',
          });
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const applyCoordinates = async (rawLat, rawLng) => {
    const lat = Number(rawLat.toFixed(6));
    const lng = Number(rawLng.toFixed(6));

    setGpsLoading(false);
    setGpsSuccess(true);
    setGpsNote(null);
    setShouldFlyMap(true);

    onChange({
      ...location,
      lat,
      lng,
    });

    setGeocoding(true);
    const geoInfo = await reverseGeocode(lat, lng);
    setGeocoding(false);

    if (geoInfo) {
      onChange({
        ...location,
        lat,
        lng,
        ward: geoInfo.ward || location.ward || 'Kerala LSG Division',
        address: geoInfo.address || location.address || '',
      });
    }

    setTimeout(() => setGpsSuccess(false), 3500);
  };

  return (
    <div className="space-y-3">
      {/* Header bar with GPS Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <MapIcon className="w-4 h-4 text-teal-600" />
          <span>Location & Ward Pin-point</span>
          {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />}
        </label>

        <div className="flex items-center gap-2">
          {(location.address || location.ward) && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Reset location and clear fields"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGpsClick}
            disabled={gpsLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {gpsLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating You...</span>
              </>
            ) : gpsSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>GPS Location Set!</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Use My Current GPS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Place Search Bar with Autocomplete Suggestions */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search your town, ward, or landmark in Kerala (e.g. Edappally, Palarivattom)..."
            className="w-full text-xs pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 font-medium transition-all shadow-2xs"
          />
          {searching && (
            <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-3" />
          )}
          {searchQuery && !searching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPlace(item)}
                className="w-full text-left p-3 hover:bg-teal-50/70 transition-colors flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Kerala District Jump Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
        <span className="text-slate-400 font-semibold flex-shrink-0 flex items-center gap-1 pl-0.5 text-[10px] uppercase tracking-wider">
          <Compass className="w-3 h-3 text-teal-600" /> Jump to:
        </span>
        {KERALA_DISTRICTS.map((dist) => (
          <button
            key={dist.name}
            type="button"
            onClick={() => handleSelectDistrict(dist)}
            className="px-2.5 py-1 rounded-lg bg-teal-50/80 hover:bg-teal-100 text-teal-800 font-medium whitespace-nowrap border border-teal-200/70 transition-all flex-shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          >
            {dist.name.split(' / ')[0]}
          </button>
        ))}
      </div>

      {gpsNote && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl text-xs ${
            gpsNote.type === 'warning'
              ? 'text-amber-950 bg-amber-50 border border-amber-300 shadow-2xs'
              : 'text-slate-700 bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold leading-relaxed">{gpsNote.message}</div>
            <div className="text-[11px] text-amber-800 font-normal leading-relaxed">
              💡 <strong>Tip:</strong> Tap any district button above, search your town in the search bar, or tap directly on the map to position the pin.
            </div>
          </div>
        </div>
      )}

      {/* Interactive Leaflet Map */}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner z-0">
        <MapContainer
          center={[currentPos.lat, currentPos.lng]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController
            targetPos={currentPos}
            shouldFly={shouldFlyMap}
            onFlyComplete={() => setShouldFlyMap(false)}
          />
          <MapClickHandler position={currentPos} onPositionChange={handlePositionChange} />
        </MapContainer>

        {/* Floating coordinates badge */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-800 shadow-md border border-slate-200 pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
          <span>Lat: {currentPos.lat}, Lng: {currentPos.lng}</span>
        </div>

        {/* Tap/drag guide badge */}
        <div className="absolute top-2 right-2 z-[400] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-teal-800 shadow-md border border-teal-200 pointer-events-none flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-teal-600" /> Tap map or drag pin
        </div>
      </div>

      {/* Ward and Address text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Ward / Local LSG Division
          </label>
          <input
            type="text"
            value={location.ward || ''}
            onChange={(e) => onChange({ ...location, ward: e.target.value })}
            placeholder="e.g. Ward 14 - MG Road Central, Kochi"
            className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nearby Landmark / Address
          </label>
          <input
            type="text"
            value={location.address || ''}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            placeholder="e.g. Opposite Metro Pillar 45, Near Post Office"
            className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
