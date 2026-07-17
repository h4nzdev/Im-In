// Utility to convert Latitude & Longitude coordinates into human-readable real addresses
// Utilizes BigDataCloud client reverse geocoding API with OpenStreetMap Nominatim fallback + Local cache

export async function getRealAddress(lat, lng) {
  if (!lat || !lng) return 'GPS N/A';

  // Check local cache first to save network calls and avoid rate limits
  const cacheKey = `geo_cache_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    // Primary: BigDataCloud free client-side reverse geocode endpoint (fast & CORS-friendly)
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const parts = [
        data.locality || data.city,
        data.principalSubdivision || data.state,
        data.countryName
      ].filter(Boolean);

      if (parts.length > 0) {
        const addressStr = parts.join(', ');
        localStorage.setItem(cacheKey, addressStr);
        return addressStr;
      }
    }

    // Secondary Fallback: OpenStreetMap Nominatim API
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData.display_name) {
        // Shorten Nominatim display name to first 3 segments
        const addressParts = nomData.display_name.split(', ').slice(0, 3);
        const addressStr = addressParts.join(', ');
        localStorage.setItem(cacheKey, addressStr);
        return addressStr;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }

  // Fallback if APIs are offline
  const fallbackStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  return fallbackStr;
}

// Calculate precise distance between two GPS coordinates in meters (Haversine formula)
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return 999999;
  }
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
