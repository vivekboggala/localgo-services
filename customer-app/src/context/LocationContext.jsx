import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_LOCATION, PREDEFINED_LOCATIONS } from '../utils/constants';

export const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('localgo_custom_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingGPS, setUsingGPS] = useState(false);

  const requestGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('UNSUPPORTED');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'Your Location (GPS)',
        };
        setLocation(coords);
        setUsingGPS(true);
        setLoading(false);
        try {
          localStorage.setItem('localgo_custom_location', JSON.stringify(coords));
        } catch {}
      },
      (err) => {
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const selectManualLocation = useCallback((loc) => {
    setLocation(loc);
    setUsingGPS(false);
    setError(null);
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
