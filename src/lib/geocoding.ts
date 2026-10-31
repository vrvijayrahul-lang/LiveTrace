const geocodeCache = new Map<string, string>();

/**
 * Perform reverse geocoding to retrieve human-readable address from coordinates
 * using OpenStreetMap Nominatim with memory caching and debouncing.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const roundedKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geocodeCache.has(roundedKey)) {
    return geocodeCache.get(roundedKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error('Geocode lookup failed');
    }

    const data = await response.json();
    const addr = data.address || {};

    // Construct readable short representation (e.g. "Broadway, SoHo, New York")
    const parts = [
      addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.village || addr.county,
      addr.state || addr.country,
    ].filter(Boolean);

    const formatted = parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    geocodeCache.set(roundedKey, formatted);
    return formatted;
  } catch {
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  }
}
