import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Lock, Unlock, Search, Save, Navigation, Loader2, CheckCircle2, Shield, AlertTriangle, Sliders, Building2, Globe } from 'lucide-react';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper component to recenter map cleanly
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Helper component to handle clicks on the map
function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AdminGeofence() {
  const [geofence, setGeofence] = useState(() => db.getGeofence());
  const [geoAddress, setGeoAddress] = useState(() => geofence.addressName || 'Headquarters Terminal #1');
  const [geoLat, setGeoLat] = useState(() => Number(geofence.lat) || 14.5995);
  const [geoLng, setGeoLng] = useState(() => Number(geofence.lng) || 120.9842);
  const [geoRadius, setGeoRadius] = useState(() => Number(geofence.radius) || 300);
  const [geoEnabled, setGeoEnabled] = useState(() => Boolean(geofence.enabled));

  // Active Users Data
  const [users, setUsers] = useState(() => db.getUsers());
  const [logs, setLogs] = useState(() => db.getLogs());

  // Search Address States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingGeo, setSearchingGeo] = useState(false);

  // Loading State for Saving Geofence Parameter
  const [savingGeo, setSavingGeo] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);

  const containerRef = useRef();

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  useEffect(() => {
    const unsub = realtimeBus.subscribe(async (payload) => {
      if (payload && (payload.type === 'CLOCK_IN' || payload.type === 'CLOCK_OUT')) {
        await db.syncLogs();
        setLogs(db.getLogs());
        setUsers(db.getUsers());
      }
    });
    return () => unsub();
  }, []);

  const activeUserMarkers = useMemo(() => {
    const markers = [];
    users.forEach(u => {
      if (u.activeShift || u.isActive) {
        const userLogs = logs.filter(l => l.userId === u.userId && l.type === 'IN').sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (userLogs.length > 0 && userLogs[0].latitude && userLogs[0].longitude) {
          markers.push({
            userId: u.userId,
            name: u.name,
            lat: userLogs[0].latitude,
            lng: userLogs[0].longitude,
            timestamp: userLogs[0].timestamp
          });
        }
      }
    });
    return markers;
  }, [users, logs]);

  const userIcon = useMemo(() => new L.DivIcon({
    html: `<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    className: 'user-marker-icon',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  }), []);

  // Handle address search using Nominatim API
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearchingGeo(true);
    setSearchResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching location:', err);
    } finally {
      setSearchingGeo(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setGeoLat(lat);
      setGeoLng(lon);
      const cleanName = item.display_name.split(', ').slice(0, 2).join(', ');
      setGeoAddress(cleanName);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  // Handle reverse geocoding on map click or marker drag
  const handleMapPickerSelect = async (lat, lng) => {
    setGeoLat(lat);
    setGeoLng(lng);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const cleanName = data.display_name.split(', ').slice(0, 2).join(', ');
        setGeoAddress(cleanName);
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    }
  };

  // Handle Save Geofence Parameter with Loading State
  const handleSaveGeofence = (e) => {
    if (e) e.preventDefault();
    setSavingGeo(true);
    setSaveSuccessMessage(null);

    // Simulate realistic network saving state
    setTimeout(() => {
      const updated = db.updateGeofence({
        addressName: geoAddress,
        lat: Number(geoLat),
        lng: Number(geoLng),
        radius: Number(geoRadius),
        enabled: geoEnabled,
      });
      setGeofence(updated);
      setSavingGeo(false);
      setSaveSuccessMessage('Geofence parameters & perimeter circle saved successfully!');

      // Auto dismiss message after 4 seconds
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }, 800);
  };

  // Quick preset buttons for radius
  const radiusPresets = [
    { label: 'Strict Office (100m)', value: 100 },
    { label: 'Standard Campus (300m)', value: 300 },
    { label: 'Extended Area (500m)', value: 500 },
    { label: 'Wide Complex (1000m)', value: 1000 },
  ];

  return (
    <div ref={containerRef} style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(5, 77, 175,0.1)', color: '#054daf', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> Security & Attendance Boundary
            </span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>GPS Geolocation Engine</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            Terminal Geofence & Map Perimeter
          </h1>
        </div>

        {/* Quick Enforcement Toggle Switch right in header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
          borderRadius: 18, background: geoEnabled ? 'rgba(5, 77, 175,0.08)' : '#f1f5f9',
          border: geoEnabled ? '1.5px solid rgba(5, 77, 175,0.3)' : '1px solid #cbd5e1',
          boxShadow: '0 4px 16px rgba(15,23,42,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Perimeter Enforcement</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: geoEnabled ? '#054daf' : '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              {geoEnabled ? <><Lock size={14} /> Strict Geofence Active</> : <><Unlock size={14} /> Bypass / Disabled</>}
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28, cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={geoEnabled}
              onChange={e => setGeoEnabled(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 28,
              background: geoEnabled ? '#054daf' : '#cbd5e1', transition: 'all 0.25s',
              boxShadow: 'inner 0 2px 4px rgba(0,0,0,0.1)'
            }} />
            <span style={{
              position: 'absolute', top: 3, left: geoEnabled ? 25 : 3, width: 22, height: 22,
              borderRadius: '50%', background: 'white', transition: 'all 0.25s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
            }} />
          </label>
        </div>
      </div>

      {/* Success Banner if Saved */}
      {saveSuccessMessage && (
        <div className="fade-in" style={{
          padding: '14px 20px', borderRadius: 16, background: '#ecfdf5', border: '1px solid #10b981',
          color: '#065f46', fontWeight: 800, fontSize: '0.9rem', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: '0 6px 20px rgba(16,185,129,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#10b981" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Quick Address / Landmark Search Bar */}
      <div className="card glass" style={{ padding: 22, borderRadius: 22, marginBottom: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} color="#054daf" /> Quick Search Geofence Landmark / Address
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px', fontWeight: 500 }}>
          Search any building name, office complex, street, or city worldwide to instantly center your biometric circle.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchLocation()}
            placeholder="e.g. Ayala Tower One Makati, Times Square New York, BGC Taguig..."
            style={{ flex: 1, minWidth: 260, padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 600, outline: 'none' }}
          />
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={searchingGeo}
            style={{ padding: '0 22px', borderRadius: 12, background: '#1e293b', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: searchingGeo ? 'wait' : 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8, height: 46 }}
          >
            {searchingGeo ? <><Loader2 size={18} className="spin" /> Searching...</> : <><Search size={18} /> Search Address</>}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: 12, background: 'white', borderRadius: 14, border: '1px solid #cbd5e1', boxShadow: '0 12px 32px rgba(15,23,42,0.14)', overflow: 'hidden', zIndex: 50, position: 'relative' }}>
            <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Select Suggested Location ({searchResults.length} matches found)</span>
              <button type="button" onClick={() => setSearchResults([])} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>✕ Close</button>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSearchResult(item)}
                  style={{ padding: '12px 16px', borderBottom: idx < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <MapPin size={18} color="#054daf" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{item.display_name.split(', ')[0]}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>{item.display_name.split(', ').slice(1).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Configuration Form, Right Live Map Picker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Parameters Form */}
        <form onSubmit={handleSaveGeofence} className="card glass" style={{ padding: 26, borderRadius: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={20} color="#054daf" /> Geofence Parameters
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              Adjust boundary radius and precise GPS coordinates for clock-ins.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={14} /> Perimeter / Office Landmark Name
            </label>
            <input
              type="text"
              value={geoAddress}
              onChange={e => setGeoAddress(e.target.value)}
              placeholder="e.g. Headquarters Terminal #1"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Center Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={geoLat}
                onChange={e => setGeoLat(parseFloat(e.target.value) || 0)}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Center Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={geoLng}
                onChange={e => setGeoLng(parseFloat(e.target.value) || 0)}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Perimeter Radius: <strong style={{ color: '#054daf', fontSize: '0.92rem' }}>{geoRadius} meters</strong>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>({Math.round(geoRadius * 3.28084)} feet)</span>
            </div>
            <input
              type="range"
              min="50"
              max="3000"
              step="25"
              value={geoRadius}
              onChange={e => setGeoRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#054daf', height: 6, cursor: 'pointer', marginBottom: 12 }}
            />

            {/* Quick Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {radiusPresets.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setGeoRadius(preset.value)}
                  style={{
                    padding: '8px 10px', borderRadius: 10, border: '1px solid',
                    borderColor: geoRadius === preset.value ? '#054daf' : '#e2e8f0',
                    background: geoRadius === preset.value ? '#eff6ff' : '#f8fafc',
                    color: geoRadius === preset.value ? '#043e8a' : '#475569',
                    fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(p => {
                    setGeoLat(p.coords.latitude);
                    setGeoLng(p.coords.longitude);
                  });
                }
              }}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14, background: '#f1f5f9',
                color: '#334155', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.86rem',
                cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <Navigation size={16} color="#054daf" /> Snap to Current Device GPS
            </button>

            {/* Save Button with Loading State */}
            <button
              type="submit"
              disabled={savingGeo}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                background: savingGeo ? '#64748b' : '#054daf', color: 'white', border: 'none',
                fontWeight: 800, fontSize: '0.94rem', cursor: savingGeo ? 'wait' : 'pointer',
                boxShadow: savingGeo ? 'none' : '0 8px 24px rgba(5, 77, 175,0.35)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {savingGeo ? (
                <>
                  <Loader2 size={18} className="spin" /> Saving Geofence Parameter...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Geofence Perimeter
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Side: Leaflet Interactive Map Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: 16, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: '#033373', fontWeight: 700 }}>
            <MapPin size={18} color="#054daf" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Interactive Map Picker:</strong> Click anywhere on the map or drag the center marker pin (`📍`) to relocate your office center. Reverse geocoding will automatically update your address!
            </div>
          </div>

          <div style={{ height: 490, borderRadius: 24, overflow: 'hidden', border: geoEnabled ? '3px solid #054daf' : '2px solid #cbd5e1', position: 'relative', boxShadow: '0 12px 36px rgba(15,23,42,0.1)' }}>
            <MapContainer center={[Number(geoLat) || 14.5995, Number(geoLng) || 120.9842]} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={[Number(geoLat) || 14.5995, Number(geoLng) || 120.9842]} />
              <LocationPicker onSelect={handleMapPickerSelect} />
              <Marker
                position={[Number(geoLat) || 14.5995, Number(geoLng) || 120.9842]}
                draggable={true}
                eventHandlers={{
                  dragend(e) {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleMapPickerSelect(pos.lat, pos.lng);
                  }
                }}
              >
                <Popup>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
                    <MapPin size={16} color="#054daf" /> {geoAddress}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Radius: <strong>{geoRadius} meters</strong> ({Math.round(geoRadius * 3.28084)} ft)<br />
                    Enforcement: <strong style={{ color: geoEnabled ? '#054daf' : '#64748b' }}>{geoEnabled ? 'STRICT LOCK' : 'BYPASS'}</strong>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[Number(geoLat) || 14.5995, Number(geoLng) || 120.9842]}
                radius={Number(geoRadius) || 300}
                pathOptions={{
                  color: geoEnabled ? '#054daf' : '#64748b',
                  fillColor: geoEnabled ? '#054daf' : '#cbd5e1',
                  fillOpacity: 0.25,
                  weight: 3
                }}
              />
              {activeUserMarkers.map(m => (
                <Marker key={m.userId} position={[m.lat, m.lng]} icon={userIcon}>
                  <Popup>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                      <strong>{m.name}</strong><br/>
                      <span style={{ color: '#10b981' }}>● Active</span><br/>
                      <span style={{ color: '#64748b' }}>Clocked in: {new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
