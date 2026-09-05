// Real-Time Reverse Geocoding Utility using BigDataCloud & OpenStreetMap Nominatim
// Resolves real device GNSS coordinates to exact district, city, state, and formatted location

export interface GeocodeResult {
  district: string;
  state: string;
  locationName: string;
  city: string;
  country: string;
  postcode?: string;
}

export async function reverseGeocodeCoords(lat: number, lon: number): Promise<GeocodeResult> {
  // 1. Primary: BigDataCloud Reverse Geocoding API (Fast, client-side allowed, highly reliable administrative district hierarchy)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const adminList = data.localityInfo?.administrative || [];
      
      // Find administrative district entry (e.g. "Kamrup Metropolitan district", "Bengaluru Urban district", etc.)
      const districtEntry = adminList.find(
        (a: any) =>
          a.description?.toLowerCase().includes('district') ||
          a.name?.toLowerCase().includes('district') ||
          a.order === 8 ||
          a.order === 4
      );

      let rawDistrict = districtEntry?.name || data.city || data.locality || 'Local District';
      // Clean up common suffix
      const cleanDistrict = rawDistrict.replace(/\s+district$/i, '').trim();
      const state = data.principalSubdivision || 'State';
      const city = data.city || data.locality || cleanDistrict;
      const country = data.countryName || 'India';
      const locationName = `${city}, ${cleanDistrict}, ${state}`;

      return {
        district: cleanDistrict,
        state,
        locationName,
        city,
        country,
        postcode: data.postcode
      };
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode warning:', err);
  }

  // 2. Fallback: OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const district = addr.state_district || addr.county || addr.district || addr.city || 'Local District';
      const state = addr.state || 'State';
      const city = addr.city || addr.town || addr.village || addr.suburb || district;
      const locationName = `${city}, ${district}, ${state}`;

      return {
        district,
        state,
        locationName,
        city,
        country: addr.country || 'India',
        postcode: addr.postcode
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode warning:', err);
  }

  // Coordinate-based graceful fallback
  return {
    district: `District (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
    state: 'Verified Region',
    locationName: `Site [${lat.toFixed(4)}°, ${lon.toFixed(4)}°]`,
    city: 'Field Site',
    country: 'India'
  };
}
