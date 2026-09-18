import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_LOCATION, PREDEFINED_LOCATIONS } from '../utils/constants';

export const useLocation = () => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('localgo_custom_location');
    return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // null | 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED'
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
        localStorage.setItem('localgo_custom_location', JSON.stringify(coords));
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

  const selectManualLocation = (loc) => {
    setLocation(loc);
    setUsingGPS(false);
    setError(null);
    localStorage.setItem('localgo_custom_location', JSON.stringify(loc));
  };

  useEffect(() => {
    // Attempt GPS on first load if no manual location is saved
    const saved = localStorage.getItem('localgo_custom_location');
    if (!saved) {
      requestGPSLocation();
    }
  }, [requestGPSLocation]);

  return {
    location,
    loading,
    error,
    usingGPS,
    requestGPSLocation,
    selectManualLocation,
    predefinedLocations: PREDEFINED_LOCATIONS,
  };
};
