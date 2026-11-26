package com.localgo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Provider weekly schedule stored under providers/{id}/schedule.
 * Each day maps to a list of time range strings, e.g. ["09:00-12:00", "14:00-18:00"].
 * timezone is fixed to Asia/Kolkata for all providers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderSchedule {
    private String providerId;
    private Map<String, List<String>> weeklyHours; // key = day-of-week (MON, TUE, ...)
    private List<String> exceptions; // ISO dates (yyyy-MM-dd) when provider is unavailable
    private String timezone = "Asia/Kolkata";
}
