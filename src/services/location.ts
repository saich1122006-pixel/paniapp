// ============================================================================
// Location Service
// GPS tracking, permission handling, and Supabase location updates
// ============================================================================

import * as Location from 'expo-location';
import { supabase } from './supabase';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request foreground location permissions.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get current device location.
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Update user's location in Supabase profiles table.
 * Uses PostGIS geography POINT format.
 */
export async function updateUserLocation(
  userId: string,
  coords: Coordinates
): Promise<boolean> {
  const point = `POINT(${coords.longitude} ${coords.latitude})`;

  const { error } = await supabase
    .from('profiles')
    .update({ last_location: point })
    .eq('id', userId);

  return !error;
}

/**
 * Start watching location and updating Supabase periodically.
 * Returns a cleanup function to stop watching.
 */
export function watchLocation(
  userId: string,
  onLocationUpdate?: (coords: Coordinates) => void,
  intervalMs: number = 30000 // Update every 30 seconds
): { stop: () => void } {
  let watchSubscription: Location.LocationSubscription | null = null;
  let lastUpdate = 0;

  (async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50, // Update every 50 meters
        timeInterval: intervalMs,
      },
      (location) => {
        const coords: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        onLocationUpdate?.(coords);

        // Throttle Supabase updates
        const now = Date.now();
        if (now - lastUpdate > intervalMs) {
          lastUpdate = now;
          updateUserLocation(userId, coords);
        }
      }
    );
  })();

  return {
    stop: () => {
      watchSubscription?.remove();
    },
  };
}

/**
 * Get nearby online workers within a radius.
 */
export async function getNearbyWorkers(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  const { data, error } = await supabase.rpc('get_nearby_workers', {
    user_lat: latitude,
    user_lng: longitude,
    radius_km: radiusKm,
  });

  if (error) {
    // Fallback without geo filtering
    const { data: fallbackData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .eq('is_online', true)
      .limit(50);

    return { data: fallbackData || [], error: null };
  }

  return { data: data || [], error: null };
}

/**
 * Calculate distance between two coordinates (Haversine formula).
 * Returns distance in kilometers.
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
    Math.cos(toRad(coord2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Reverse geocode to get a human-readable address from coordinates.
 */
export async function reverseGeocodeCoords(latitude: number, longitude: number): Promise<string | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const result = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (result.length > 0) {
      const address = result[0];
      // Format the address nicely, depending on what's available
      const parts = [
        address.name,
        address.street,
        address.city || address.subregion,
        address.region,
      ].filter(Boolean);
      
      // If we have distinct parts, join them, otherwise return raw name or generic string
      return parts.length > 0 ? Array.from(new Set(parts)).join(', ') : 'Unknown Location';
    }
    return null;
  } catch (e) {
    console.error('Reverse geocode error:', e);
    return null;
  }
}

/**
 * Geocode text to get coordinates from an address search using OSM Nominatim, with fallback to Expo Location.
 */
export async function geocodeAddress(query: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PaniApp/1.0', // Required by Nominatim Terms of Use
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    }
    
    // Fallback to expo-location
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      const result = await Location.geocodeAsync(query);
      if (result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }
    }
    
    return null;
  } catch (e) {
    console.error('Geocode error:', e);
    return null;
  }
}

