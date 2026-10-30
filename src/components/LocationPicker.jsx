import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
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

// Kochi — only used as the initial map view before a location is chosen
const DEFAULT_VIEW = { lat: 9.9816, lng: 76.2999 };
// Rough bounding box of Kerala, used to sanity-check detected / picked points
const KERALA_BOUNDS = { south: 8.1, north: 12.85, west: 74.8, east: 77.45 };
const isInsideKerala = (lat, lng) =>
  lat >= KERALA_BOUNDS.south && lat <= KERALA_BOUNDS.north && lng >= KERALA_BOUNDS.west && lng <= KERALA_BOUNDS.east;

// GPS tuning
const GOOD_ACCURACY_M = 25; // stop refining once we are this precise
const APPROX_ACCURACY_M = 150; // above this we warn that the pin is only approximate
const GPS_REFINE_MS = 10000; // how long we keep refining the fix

// Standalone SVG vector pin icon (no external CDN dependencies)
const pinIcon = L.divIcon({
  className: 'custom-location-pin',
  html: `
    <div style="position: relative; width: 40px; height: 50px;">
      <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:15px;height:6px;background:rgba(0,0,0,0.4);border-radius:50%;"></div>
      <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:38px;height:48px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
        <svg viewBox="0 0 36 48" width="38" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.05887 0 0 8.05887 0 18C0 30.5 16 46 18 48C20 46 36 30.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#186a42"/>
          <path d="M18 2C9.16344 2 2 9.16344 2 18C2 28.5 16 43.5 18 45.5C20 43.5 34 28.5 34 18C34 9.16344 26.8366 2 18 2Z" fill="#0f4230"/>
          <circle cx="18" cy="18" r="8" fill="#ffffff"/>
          <circle cx="18" cy="18" r="4.5" fill="#186a42"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48],
});

/**
 * Turn a Nominatim address object into a ward-ish label and a landmark line.
 */
function formatPlace(addr = {}, displayName = '') {
  const suburb =
    addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.hamlet || addr.village || addr.city_district || '';
  const city =
    addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.state_district || 'Kerala';
  const road = addr.road || addr.pedestrian || addr.footway || addr.street || '';

  const ward = suburb && suburb !== city ? `${suburb}, ${city}` : city;
  const address = road
    ? `${road}${suburb ? ', near ' + suburb : ''}`
    : displayName
    ? displayName.split(',').slice(0, 3).join(', ').trim()
    : '';

  const tidy = (t) => t.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  return { ward: tidy(ward), address: tidy(address) };
}

async function reverseGeocode(lat, lng, signal) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' }, signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return formatPlace(data.address, data.display_name);
  } catch {
    return null; // network error or aborted
  }
}

// Handles map taps and pin dragging
function MapInteractions({ position, onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  const markerRef = useRef(null);
  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (m) {
          const { lat, lng } = m.getLatLng();
          onPick(lat, lng);
        }
      },
    }),
    [onPick]
  );

  return position ? (
    <Marker draggable eventHandlers={eventHandlers} position={[position.lat, position.lng]} icon={pinIcon} ref={markerRef} />
  ) : null;
}

// Moves the camera whenever `target` changes
function MapFlyer({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom || 16, { animate: true, duration: 1.2 });
  }, [target, map]);
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

export default function LocationPicker({ location, onChange }) {
  const hasLocation = location?.lat != null && location?.lng != null;
  const position = hasLocation ? { lat: location.lat, lng: location.lng } : null;

  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | locating | done
  const [accuracy, setAccuracy] = useState(null); // metres, only for GPS fixes
  const [note, setNote] = useState(null); // { type: 'warning' | 'info', message }
  const [geocoding, setGeocoding] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Always read the freshest location inside async callbacks (avoids stale-closure overwrites)
  const locRef = useRef(location);
  locRef.current = location;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const patch = useCallback((changes) => onChangeRef.current({ ...locRef.current, ...changes }), []);

  // Which text fields the user typed into since the pin last moved (we never overwrite those)
  const edited = useRef({ ward: false, address: false });
  const geoRequest = useRef({ id: 0, controller: null });
  const watchId = useRef(null);
  const watchTimer = useRef(null);

  /**
   * Put the pin somewhere. Coordinates update instantly; ward/address are filled from reverse
   * geocoding, and a slow lookup for an old pin can never overwrite a newer one.
   */
  const setPosition = useCallback(
    async (rawLat, rawLng, { fly = false, zoom, acc = null, resetText = true } = {}) => {
      const lat = Number(rawLat.toFixed(6));
      const lng = Number(rawLng.toFixed(6));

      if (resetText) edited.current = { ward: false, address: false };
      setAccuracy(acc);

      // Clear stale ward/address (belonging to the previous pin) unless the user typed them
      patch({
        lat,
        lng,
        ...(edited.current.ward ? {} : { ward: '' }),
        ...(edited.current.address ? {} : { address: '' }),
      });
      if (fly) setFlyTarget({ lat, lng, zoom, key: Date.now() });

      if (!isInsideKerala(lat, lng)) {
        setNote({
          type: 'warning',
          message: 'This point appears to be outside Kerala. Please check the pin, or search for your place below.',
        });
      } else {
        setNote((n) => (n?.sticky ? n : null));
      }

      // Reverse geocode (cancel any earlier lookup)
      geoRequest.current.controller?.abort();
      const controller = new AbortController();
      const id = geoRequest.current.id + 1;
      geoRequest.current = { id, controller };

      setGeocoding(true);
      const info = await reverseGeocode(lat, lng, controller.signal);
      if (geoRequest.current.id !== id) return; // a newer pin superseded this one
      setGeocoding(false);

      if (info) {
        patch({
          ...(edited.current.ward ? {} : { ward: info.ward }),
          ...(edited.current.address ? {} : { address: info.address }),
        });
      }
    },
    [patch]
  );

  const onPick = useCallback((lat, lng) => {
    stopWatching();
    setGpsStatus('idle');
    setPosition(lat, lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPosition]);

  // ----------------------------- GPS -----------------------------
  function stopWatching() {
    if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
    clearTimeout(watchTimer.current);
  }

  const finishGps = useCallback((best) => {
    stopWatching();
    setGpsStatus('done');
    if (best && best.acc > APPROX_ACCURACY_M) {
      setNote({
        type: 'info',
        sticky: true,
        message: `Your location is approximate (±${Math.round(best.acc)} m). Drag the pin to the exact spot of the problem.`,
      });
    }
    setTimeout(() => setGpsStatus((s) => (s === 'done' ? 'idle' : s)), 3500);
  }, []);

  const describeGpsError = (err) => {
    if (!window.isSecureContext) {
      return 'Browsers only allow GPS on secure (HTTPS) pages. Search your place below or tap the map to place the pin.';
    }
    if (err.code === 1) {
      return 'Location permission is blocked. Allow location for this site in your browser settings (the padlock/tune icon in the address bar), then try again — or search your place below.';
    }
    if (err.code === 2) {
      return 'Your device could not determine its position. Turn on Location/GPS, move near a window, or search your place below.';
    }
    return 'Finding your location took too long. Try again, or search your place below.';
  };

  const detectLocation = useCallback(
    ({ auto = false } = {}) => {
      if (!navigator.geolocation) {
        if (!auto) setNote({ type: 'warning', message: 'This browser does not support location. Search your place or tap the map.' });
        return;
      }
      if (!window.isSecureContext) {
        if (!auto) setNote({ type: 'warning', message: describeGpsError({ code: 0 }) });
        return;
      }

      stopWatching();
      setNote(null);
      setGpsStatus('locating');

      let best = null;
      let gotFix = false;

      const onFix = (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        // Keep only fixes that improve on what we have (first fix always accepted)
        if (best && acc >= best.acc) return;
        best = { lat: latitude, lng: longitude, acc };
        const firstFix = !gotFix;
        gotFix = true;
        setPosition(latitude, longitude, {
          fly: firstFix || acc <= GOOD_ACCURACY_M,
          zoom: acc <= 60 ? 17 : 16,
          acc,
          resetText: true,
        });
        if (acc <= GOOD_ACCURACY_M) finishGps(best);
      };

      const fallbackToNetworkFix = () => {
        // Hardware GPS failed: ask for a coarse (Wi-Fi/cell) position instead
        navigator.geolocation.getCurrentPosition(
          onFix,
          (err) => {
            setGpsStatus('idle');
            if (!auto || err.code === 1) setNote({ type: 'warning', sticky: true, message: describeGpsError(err) });
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
        );
        watchTimer.current = setTimeout(() => finishGps(best), 11000);
      };

      watchId.current = navigator.geolocation.watchPosition(
        onFix,
        (err) => {
          stopWatching();
          if (err.code === 1) {
            setGpsStatus('idle');
            if (!auto) setNote({ type: 'warning', sticky: true, message: describeGpsError(err) });
            return;
          }
          if (gotFix) return finishGps(best);
          fallbackToNetworkFix();
        },
        // maximumAge 0: never accept a stale cached position
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      // Stop refining after a while with whatever best fix we have
      watchTimer.current = setTimeout(() => {
        if (gotFix) finishGps(best);
      }, GPS_REFINE_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setPosition, finishGps]
  );

  // Auto-detect once on first load (unless permission was already refused)
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current || hasLocation) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const status = await navigator.permissions?.query({ name: 'geolocation' });
        if (cancelled || status?.state === 'denied') return;
      } catch {
        /* Permissions API unsupported (Safari) — just try */
      }
      if (cancelled || autoTried.current) return;
      autoTried.current = true; // set only when we actually start (StrictMode runs effects twice)
      detectLocation({ auto: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [hasLocation, detectLocation]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopWatching();
      geoRequest.current.controller?.abort();
    },
    []
  );

  // ----------------------------- Search -----------------------------
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Restrict to Kerala's bounding box so "Palarivattom" never resolves to another state
        const url =
          'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in' +
          `&viewbox=${KERALA_BOUNDS.west},${KERALA_BOUNDS.north},${KERALA_BOUNDS.east},${KERALA_BOUNDS.south}&bounded=1` +
          `&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: controller.signal });
        if (res.ok) {
          setSuggestions(await res.json());
          setShowSuggestions(true);
        }
      } catch (e) {
        if (e.name !== 'AbortError') setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 450); // Nominatim asks for gentle usage

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSelectPlace = (place) => {
    stopWatching();
    setGpsStatus('idle');
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const { ward, address } = formatPlace(place.address, place.display_name);

    edited.current = { ward: false, address: false };
    setAccuracy(null);
    geoRequest.current.controller?.abort(); // the search result already has the address
    geoRequest.current.id += 1;
    setGeocoding(false);
    patch({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), ward, address });
    setFlyTarget({ lat, lng, zoom: 17, key: Date.now() });

    setShowSuggestions(false);
    setSearchQuery(place.display_name.split(',')[0].trim());
    setNote(isInsideKerala(lat, lng) ? null : { type: 'warning', message: 'This place appears to be outside Kerala.' });
  };

  const handleSelectDistrict = (dist) => {
    stopWatching();
    setGpsStatus('idle');
    edited.current = { ward: false, address: false };
    setAccuracy(null);
    geoRequest.current.controller?.abort();
    patch({ lat: dist.lat, lng: dist.lng, ward: dist.ward, address: `${dist.name.split(' / ')[0]}, Kerala` });
    setFlyTarget({ lat: dist.lat, lng: dist.lng, zoom: 14, key: Date.now() });
    setNote({ type: 'info', message: 'District centre selected. Tap the map or drag the pin to the exact spot.' });
  };

  const handleClearLocation = () => {
    stopWatching();
    setGpsStatus('idle');
    edited.current = { ward: false, address: false };
    setAccuracy(null);
    geoRequest.current.controller?.abort();
    setGeocoding(false);
    onChange({ lat: null, lng: null, ward: '', address: '' });
    setSearchQuery('');
    setNote(null);
  };

  const mapCenter = position || DEFAULT_VIEW;

  return (
    <div className="space-y-3">
      {/* Header bar with GPS button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <MapIcon className="w-4 h-4 text-brand-600" />
          <span>Pin location</span>
          {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" aria-label="Finding address" />}
        </label>

        <div className="flex items-center gap-2">
          {hasLocation && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
              title="Remove the pin and clear the address"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => detectLocation()}
            disabled={gpsStatus === 'locating'}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition disabled:opacity-60 cursor-pointer"
          >
            {gpsStatus === 'locating' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating…</span>
              </>
            ) : gpsStatus === 'done' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Location set</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Use my current location</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search with autocomplete */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSuggestions(false);
              if (e.key === 'Enter' && suggestions.length > 0) {
                e.preventDefault();
                handleSelectPlace(suggestions[0]);
              }
            }}
            placeholder="Search a town, ward or landmark in Kerala (e.g. Edappally)"
            aria-label="Search for a place in Kerala"
            className="input pl-10 pr-9 text-xs"
          />
          {searching && <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin absolute right-3" />}
          {searchQuery && !searching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              aria-label="Clear search"
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="p-3 text-xs text-slate-500">No places found in Kerala. Try a nearby town or tap the map.</div>
            ) : (
              suggestions.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectPlace(item)}
                  className="w-full text-left p-3 hover:bg-brand-50/70 transition-colors flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* District quick jump */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
        <span className="text-slate-400 font-semibold flex-shrink-0 flex items-center gap-1 pl-0.5 text-[10px] uppercase tracking-wider">
          <Compass className="w-3 h-3 text-brand-600" /> Jump to:
        </span>
        {KERALA_DISTRICTS.map((dist) => (
          <button
            key={dist.name}
            type="button"
            onClick={() => handleSelectDistrict(dist)}
            className="px-2.5 py-1 rounded-lg bg-brand-50/80 hover:bg-brand-100 text-brand-800 font-medium whitespace-nowrap border border-brand-200/70 transition flex-shrink-0 cursor-pointer active:scale-95"
          >
            {dist.name.split(' / ')[0]}
          </button>
        ))}
      </div>

      {note && (
        <div
          role="status"
          className={`flex items-start gap-2.5 p-3 rounded-xl text-xs ${
            note.type === 'warning'
              ? 'text-amber-950 bg-amber-50 border border-amber-300'
              : 'text-slate-700 bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${note.type === 'warning' ? 'text-amber-600' : 'text-slate-500'}`} />
          <div className="font-medium leading-relaxed">{note.message}</div>
        </div>
      )}

      {/* Map */}
      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner z-0">
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={position ? 16 : 13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyer target={flyTarget} />
          {position && accuracy != null && accuracy > 15 && (
            <Circle
              center={[position.lat, position.lng]}
              radius={accuracy}
              pathOptions={{ color: '#186a42', weight: 1, fillColor: '#2a9d62', fillOpacity: 0.12 }}
              interactive={false}
            />
          )}
          <MapInteractions position={position} onPick={onPick} />
        </MapContainer>

        {gpsStatus === 'locating' && !position && (
          <div className="absolute inset-0 z-[400] bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> Finding your location…
            </div>
          </div>
        )}

        {position ? (
          <div className="absolute bottom-2 left-2 z-[400] bg-white/95 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-800 shadow-md border border-slate-200 pointer-events-none">
            {position.lat}, {position.lng}
            {accuracy != null && <span className="text-slate-500"> · ±{Math.round(accuracy)} m</span>}
            {gpsStatus === 'locating' && <span className="text-brand-700"> · refining…</span>}
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/95 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 shadow-md border border-slate-200 pointer-events-none text-center">
            No location set yet — tap the map, search, or use your current location
          </div>
        )}

        <div className="absolute top-2 right-2 z-[400] bg-white/95 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-brand-800 shadow-md border border-brand-200 pointer-events-none flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-brand-600" /> Tap map or drag pin
        </div>
      </div>

      {/* Ward and address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="label" htmlFor="loc-ward">Ward / local division</label>
          <input
            id="loc-ward"
            type="text"
            value={location?.ward || ''}
            onChange={(e) => {
              edited.current.ward = true;
              patch({ ward: e.target.value });
            }}
            placeholder="Filled automatically — edit if needed"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="loc-address">Nearby landmark / address</label>
          <input
            id="loc-address"
            type="text"
            value={location?.address || ''}
            onChange={(e) => {
              edited.current.address = true;
              patch({ address: e.target.value });
            }}
            placeholder="e.g. Opposite the post office"
            className="input"
          />
        </div>
      </div>
    </div>
  );
}
