package com.localgo.util;

import ch.hsr.geohash.GeoHash;

import java.util.*;

public class GeoUtils {

    public static final double EARTH_RADIUS_KM = 6371.0;

    public static class GeoRange {
        private final String startHash;
        private final String endHash;

        public GeoRange(String startHash, String endHash) {
            this.startHash = startHash;
            this.endHash = endHash;
        }

        public String getStartHash() {
            return startHash;
        }

        public String getEndHash() {
            return endHash;
        }
    }

    /**
     * Compute 12-character base32 geohash for coordinates
     */
    public static String encodeGeohash(double latitude, double longitude) {
        return GeoHash.withCharacterPrecision(latitude, longitude, 12).toBase32();
    }

    /**
     * Exact Haversine distance in kilometers
     */
    public static double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Determine optimal geohash character precision for a search radius in kilometers.
     */
    public static int getPrecisionForRadiusKm(double radiusKm) {
        if (radiusKm <= 0.6) return 6;
        if (radiusKm <= 3.5) return 5;
        if (radiusKm <= 25.0) return 4;
        if (radiusKm <= 120.0) return 3;
        return 2;
    }

    /**
     * Generates geohash bounding-box query ranges covering the search radius around (lat, lon).
     * Follows the GeoFire bounding box pattern with range [prefix, prefix + "~"].
     */
    public static List<GeoRange> getGeoHashQueryRanges(double latitude, double longitude, double radiusKm) {
        int precision = getPrecisionForRadiusKm(radiusKm);

        double latDelta = radiusKm / 111.0;
        double lonDelta = radiusKm / (111.0 * Math.max(0.1, Math.cos(Math.toRadians(latitude))));

        double latMin = Math.max(-90.0, latitude - latDelta);
        double latMax = Math.min(90.0, latitude + latDelta);
        double lonMin = Math.max(-180.0, longitude - lonDelta);
        double lonMax = Math.min(180.0, longitude + lonDelta);

        Set<String> prefixes = new HashSet<>();
        // Center and corner sample points
        prefixes.add(GeoHash.withCharacterPrecision(latitude, longitude, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latMin, lonMin, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latMin, lonMax, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latMax, lonMin, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latMax, lonMax, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latMin, longitude, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latMax, longitude, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latitude, lonMin, precision).toBase32());
        prefixes.add(GeoHash.withCharacterPrecision(latitude, lonMax, precision).toBase32());

        // Also add the 8 adjacent neighbor cells of the center hash
        try {
            GeoHash centerHash = GeoHash.withCharacterPrecision(latitude, longitude, precision);
            for (GeoHash adjacent : centerHash.getAdjacent()) {
                prefixes.add(adjacent.toBase32());
            }
        } catch (Exception ignored) {}

        List<GeoRange> ranges = new ArrayList<>();
        for (String prefix : prefixes) {
            // In Base32, '~' (ASCII 126) is greater than all Base32 characters ('0'-'9', 'b'-'z')
            ranges.add(new GeoRange(prefix, prefix + "~"));
        }
        return ranges;
    }
}
