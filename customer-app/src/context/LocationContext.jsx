import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_LOCATION, PREDEFINED_LOCATIONS } from '../utils/constants';

export const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('localgo_custom_location');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number'
        ? parsed
        : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingGPS, setUsingGPS] = useState(false);
  const requestIdRef = useRef(0);

  const requestGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('UNSUPPORTED');
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (reqId !== requestIdRef.current) return;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const initialCoords = {
          lat,
          lng,
          city: 'Your Location (GPS)',
        };
        setLocation(initialCoords);
        setUsingGPS(true);
        setLoading(false);
        try {
          localStorage.setItem('localgo_custom_location', JSON.stringify(initialCoords));
        } catch {}

        // Reverse-geocode GPS coordinates to show actual locality/town name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (reqId !== requestIdRef.current) return;
            const addr = data?.address;
            if (!addr) return;
            const area = addr.village || addr.suburb || addr.town || addr.city_district || addr.city || addr.county;
            const town = addr.town || addr.city || addr.state_district;
            const label = area && town && area !== town ? `${area}, ${town}` : area || town;
            if (label) {
              const updated = { lat, lng, city: `${label} (GPS)` };
              setLocation(updated);
              try {
                localStorage.setItem('localgo_custom_location', JSON.stringify(updated));
              } catch {}
            }
          })
          .catch(() => {});
      },
      (err) => {
        if (reqId !== requestIdRef.current) return;
        setLoading(false);
        setUsingGPS(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('PERMISSION_DENIED');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('POSITION_UNAVAILABLE');
            break;
          case err.TIMEOUT:
            setError('TIMEOUT');
            break;
          default:
            setError('POSITION_UNAVAILABLE');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const selectManualLocation = useCallback((loc) => {
    requestIdRef.current += 1;
    setLocation(loc);
    setUsingGPS(false);
    setError(null);
    setLoading(false);
    try {
      localStorage.setItem('localgo_custom_location', JSON.stringify(loc));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('localgo_custom_location');
      if (!saved) {
        requestGPSLocation();
      }
    } catch {}
  }, [requestGPSLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        usingGPS,
        requestGPSLocation,
        selectManualLocation,
        predefinedLocations: PREDEFINED_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
export default LocationContext;
