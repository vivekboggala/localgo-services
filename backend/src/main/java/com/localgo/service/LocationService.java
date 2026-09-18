package com.localgo.service;

import com.localgo.exception.BadRequestException;
import org.springframework.stereotype.Service;

@Service
public class LocationService {

    public void validateCoordinates(double lat, double lng, double radius) {
        if (lat < -90.0 || lat > 90.0) {
            throw new BadRequestException("Latitude must be between -90 and 90 degrees");
        }
        if (lng < -180.0 || lng > 180.0) {
            throw new BadRequestException("Longitude must be between -180 and 180 degrees");
        }
        if (radius <= 0 || radius > 100) {
            throw new BadRequestException("Search radius must be between 1 and 100 km");
        }
    }

    public double calculateHaversineDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        final int EARTH_RADIUS_KM = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((EARTH_RADIUS_KM * c) * 10.0) / 10.0;
    }
}
