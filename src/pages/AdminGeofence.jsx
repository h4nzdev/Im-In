import { useState, useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Lock, Unlock, Search, Save, Navigation, Loader2, CheckCircle2, Shield, Sliders, Building2, Globe, Plus, Trash2, Edit3, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { db } from '../lib/db';
import { realtimeBus } from '../lib/realtime';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) { onSelect(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

const ZONE_COLORS = ['#054daf', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

const DEFAULT_FORM = { addressName: '', lat: 14.5995, lng: 120.9842, radius: 300 };

export default function AdminGeofence() {
  const [geofences, setGeofences] = useState(() => db.getGeofences());
  const [geofenceEnabled, setGeofenceEnabled] = useState(() => db.getGeofenceEnabled());

  // Form state for adding / editing a single geofence
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null); // null = new, string = editing existing

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingGeo, setSearchingGeo] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Active users
  const [users, setUsers] = useState(() => db.getUsers());
  const [logs, setLogs] = useState(() => db.getLogs());

  const containerRef = useRef();

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
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
        const userLogs = logs.filter(l => l.userId === u.userId && l.type === 'IN').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (userLogs.length > 0 && userLogs[0].latitude && userLogs[0].longitude) {
          markers.push({ userId: u.userId, name: u.name, lat: userLogs[0].latitude, lng: userLogs[0].longitude, timestamp: userLogs[0].timestamp });
        }
      }
    });
    return markers;
  }, [users, logs]);

  const userIcon = useMemo(() => new L.DivIcon({
    html: `<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    className: 'user-marker-icon',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  }), []);

  // ── Address Search ──────────────────────────────────────────────────────────
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearchingGeo(true);
    setSearchResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) { console.error(err); } finally { setSearchingGeo(false); }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      const cleanName = item.display_name.split(', ').slice(0, 2).join(', ');
      setForm(f => ({ ...f, lat, lng: lon, addressName: f.addressName || cleanName }));
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const handleMapPickerSelect = async (lat, lng) => {
    setForm(f => ({ ...f, lat, lng }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data?.display_name) {
        const cleanName = data.display_name.split(', ').slice(0, 2).join(', ');
        setForm(f => ({ ...f, addressName: f.addressName || cleanName }));
      }
    } catch (err) { console.error(err); }
  };

  // ── Start editing an existing zone ─────────────────────────────────────────
  const startEdit = (gf) => {
    setEditingId(gf.id);
    setForm({ addressName: gf.addressName, lat: gf.lat, lng: gf.lng, radius: gf.radius });
    setSearchResults([]);
    setSearchQuery('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  // ── Save (add or update) a zone ────────────────────────────────────────────
  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!form.addressName.trim()) return;
    setSaving(true);
    setSaveMsg(null);

    setTimeout(() => {
      let updated;
      if (editingId) {
        updated = geofences.map(gf => gf.id === editingId ? { ...gf, ...form, lat: Number(form.lat), lng: Number(form.lng), radius: Number(form.radius) } : gf);
      } else {
        const newZone = {
          id: `geo_${Date.now()}`,
          addressName: form.addressName.trim(),
          lat: Number(form.lat),
          lng: Number(form.lng),
          radius: Number(form.radius),
          enabled: geofenceEnabled,
        };
        updated = [...geofences, newZone];
      }
      db.saveGeofences(updated);
      setGeofences(updated);
      setSaving(false);
      setSaveMsg(editingId ? 'Zone updated successfully!' : 'New geofence zone added!');
      setTimeout(() => setSaveMsg(null), 4000);
      setEditingId(null);
      setForm(DEFAULT_FORM);
    }, 700);
  };

  // ── Delete a zone ──────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    const updated = db.deleteGeofence(id);
    setGeofences(updated);
  };

  // ── Toggle global geofence enforcement ────────────────────────────────────
  const handleToggleEnabled = (val) => {
    db.setGeofenceEnabled(val);
    setGeofenceEnabled(val);
    const updated = db.getGeofences();
    setGeofences(updated);
  };

  const radiusPresets = [
    { label: 'Strict Office (100m)', value: 100 },
    { label: 'Standard Campus (300m)', value: 300 },
    { label: 'Extended Area (500m)', value: 500 },
    { label: 'Wide Complex (1000m)', value: 1000 },
  ];

  const mapCenter = [Number(form.lat) || 14.5995, Number(form.lng) || 120.9842];

  return (
    <div ref={containerRef} style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(5,77,175,0.1)', color: '#054daf', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> Security &amp; Attendance Boundary
            </span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Multi-Zone GPS Engine</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Terminal Geofence &amp; Map Perimeter
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
            Define multiple restricted zones. Employees must be inside <strong>any one</strong> active zone to clock in.
          </p>
        </div>

        {/* Global enforcement toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderRadius: 18, background: geofenceEnabled ? 'rgba(5,77,175,0.08)' : '#f1f5f9', border: geofenceEnabled ? '1.5px solid rgba(5,77,175,0.3)' : '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Perimeter Enforcement</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: geofenceEnabled ? '#054daf' : '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              {geofenceEnabled ? <><Lock size={14} /> Strict Geofence Active</> : <><Unlock size={14} /> Bypass / Disabled</>}
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28, cursor: 'pointer', flexShrink: 0 }}>
            <input type="checkbox" checked={geofenceEnabled} onChange={e => handleToggleEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: 28, background: geofenceEnabled ? '#054daf' : '#cbd5e1', transition: 'all 0.25s' }} />
            <span style={{ position: 'absolute', top: 3, left: geofenceEnabled ? 25 : 3, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'all 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
          </label>
        </div>
      </div>

      {/* ── Save success banner ── */}
      {saveMsg && (
        <div className="fade-in" style={{ padding: '14px 20px', borderRadius: 16, background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', fontWeight: 800, fontSize: '0.9rem', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 6px 20px rgba(16,185,129,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#10b981" />
            <span>{saveMsg}</span>
          </div>
          <button onClick={() => setSaveMsg(null)} style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* ── Active Zones List ── */}
      <div className="card glass" style={{ padding: 24, borderRadius: 24, marginBottom: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#054daf" /> Active Geofence Zones
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(5,77,175,0.1)', color: '#054daf', fontSize: '0.75rem', fontWeight: 800 }}>{geofences.length} zones</span>
          </h2>
          <button
            type="button"
            onClick={() => { setEditingId(null); setForm(DEFAULT_FORM); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: '#054daf', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,77,175,0.3)' }}
          >
            <Plus size={16} /> Add New Zone
          </button>
        </div>

        {geofences.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
            No geofence zones configured yet. Use the form below to add one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {geofences.map((gf, i) => {
              const color = ZONE_COLORS[i % ZONE_COLORS.length];
              const isEditing = editingId === gf.id;
              return (
                <div key={gf.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, border: `1.5px solid ${isEditing ? color : 'rgba(15,23,42,0.08)'}`, background: isEditing ? `rgba(${color === '#054daf' ? '5,77,175' : '124,58,237'},0.04)` : 'white', transition: 'all 0.2s' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gf.addressName}</div>
                    <div style={{ fontSize: '0.77rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                      {gf.lat.toFixed(5)}, {gf.lng.toFixed(5)} · Radius: <strong>{gf.radius}m</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => isEditing ? cancelEdit() : startEdit(gf)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: `1px solid ${isEditing ? '#d97706' : '#e2e8f0'}`, background: isEditing ? '#fef3c7' : '#f8fafc', color: isEditing ? '#d97706' : '#475569', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {isEditing ? <><X size={13} /> Cancel</> : <><Edit3 size={13} /> Edit</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(gf.id)}
                      disabled={geofences.length <= 1}
                      title={geofences.length <= 1 ? 'Cannot delete the only zone' : 'Delete zone'}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 800, fontSize: '0.78rem', cursor: geofences.length <= 1 ? 'not-allowed' : 'pointer', opacity: geofences.length <= 1 ? 0.5 : 1 }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Address Search Bar ── */}
      <div className="card glass" style={{ padding: 22, borderRadius: 22, marginBottom: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} color="#054daf" /> Quick Search Landmark / Address
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px', fontWeight: 500 }}>
          Search any building, street or city to pre-fill the coordinates below.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchLocation()}
            placeholder="e.g. Ayala Tower One Makati, BGC Taguig..."
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

        {searchResults.length > 0 && (
          <div style={{ marginTop: 12, background: 'white', borderRadius: 14, border: '1px solid #cbd5e1', boxShadow: '0 12px 32px rgba(15,23,42,0.14)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Select Location ({searchResults.length} results)</span>
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

      {/* ── Form + Map Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24, alignItems: 'start' }}>

        {/* Left: Parameters form */}
        <form onSubmit={handleSave} className="card glass" style={{ padding: 26, borderRadius: 24, background: 'white', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={20} color="#054daf" /> {editingId ? 'Edit Zone' : 'Add New Zone'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              {editingId ? 'Update the boundary parameters for this zone.' : 'Configure a new geofenced area. Click the map to set coordinates.'}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>
              <Building2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Zone Name / Landmark
            </label>
            <input
              type="text"
              value={form.addressName}
              onChange={e => setForm(f => ({ ...f, addressName: e.target.value }))}
              placeholder="e.g. Headquarters Terminal #1"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Center Latitude</label>
              <input
                type="number" step="0.000001"
                value={form.lat}
                onChange={e => setForm(f => ({ ...f, lat: parseFloat(e.target.value) || 0 }))}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>Center Longitude</label>
              <input
                type="number" step="0.000001"
                value={form.lng}
                onChange={e => setForm(f => ({ ...f, lng: parseFloat(e.target.value) || 0 }))}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Radius: <strong style={{ color: '#054daf', fontSize: '0.92rem' }}>{form.radius}m</strong>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>({Math.round(form.radius * 3.28084)} ft)</span>
            </div>
            <input
              type="range" min="50" max="3000" step="25"
              value={form.radius}
              onChange={e => setForm(f => ({ ...f, radius: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#054daf', height: 6, cursor: 'pointer', marginBottom: 12 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {radiusPresets.map(preset => (
                <button
                  key={preset.value} type="button"
                  onClick={() => setForm(f => ({ ...f, radius: preset.value }))}
                  style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid', borderColor: form.radius === preset.value ? '#054daf' : '#e2e8f0', background: form.radius === preset.value ? '#eff6ff' : '#f8fafc', color: form.radius === preset.value ? '#043e8a' : '#475569', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => setForm(f => ({ ...f, lat: p.coords.latitude, lng: p.coords.longitude }))); }}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 14, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Navigation size={16} color="#054daf" /> Snap to Current Device GPS
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{ flex: 1, padding: '13px 16px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <X size={16} /> Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{ flex: 1, padding: '14px 18px', borderRadius: 14, background: saving ? '#64748b' : (editingId ? '#7c3aed' : '#054daf'), color: 'white', border: 'none', fontWeight: 800, fontSize: '0.94rem', cursor: saving ? 'wait' : 'pointer', boxShadow: saving ? 'none' : '0 8px 24px rgba(5,77,175,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {saving ? <><Loader2 size={18} className="spin" /> Saving...</> : editingId ? <><Save size={18} /> Update Zone</> : <><Plus size={18} /> Add Zone</>}
              </button>
            </div>
          </div>
        </form>

        {/* Right: Interactive Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: 16, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: '#033373', fontWeight: 700 }}>
            <MapPin size={18} color="#054daf" style={{ flexShrink: 0, marginTop: 1 }} />
            <div><strong>Interactive Map:</strong> Click anywhere on the map or drag the marker to set the zone center. All configured zones are shown.</div>
          </div>

          <div style={{ height: 520, borderRadius: 24, overflow: 'hidden', border: geofenceEnabled ? '3px solid #054daf' : '2px solid #cbd5e1', position: 'relative', boxShadow: '0 12px 36px rgba(15,23,42,0.1)' }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater center={mapCenter} />
              <LocationPicker onSelect={handleMapPickerSelect} />

              {/* Render all saved zones */}
              {geofences.map((gf, i) => {
                const color = ZONE_COLORS[i % ZONE_COLORS.length];
                const isActive = editingId === gf.id;
                return (
                  <Circle
                    key={gf.id}
                    center={[gf.lat, gf.lng]}
                    radius={gf.radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: isActive ? 0.35 : 0.18, weight: isActive ? 3 : 2, dashArray: isActive ? null : '6 4' }}
                  >
                    <Popup>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>{gf.addressName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>Radius: <strong>{gf.radius}m</strong></div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* Current form preview circle */}
              {form.lat && form.lng && (
                <Circle
                  center={[Number(form.lat), Number(form.lng)]}
                  radius={Number(form.radius) || 300}
                  pathOptions={{ color: '#054daf', fillColor: '#054daf', fillOpacity: 0.2, weight: 3 }}
                />
              )}

              {/* Draggable form marker */}
              <Marker
                position={mapCenter}
                draggable={true}
                eventHandlers={{ dragend(e) { const p = e.target.getLatLng(); handleMapPickerSelect(p.lat, p.lng); } }}
              >
                <Popup>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{form.addressName || 'New Zone'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>Radius: <strong>{form.radius}m</strong></div>
                </Popup>
              </Marker>

              {/* Active user markers */}
              {activeUserMarkers.map(m => (
                <Marker key={m.userId} position={[m.lat, m.lng]} icon={userIcon}>
                  <Popup>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                      <strong>{m.name}</strong><br />
                      <span style={{ color: '#10b981' }}>● Active</span><br />
                      <span style={{ color: '#64748b' }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
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
