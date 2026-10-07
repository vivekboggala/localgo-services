package com.localgo.model;

import com.google.cloud.firestore.annotation.IgnoreExtraProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IgnoreExtraProperties
public class ServiceDoc {
    private String id;
    private String name;
    private String category;
    private String icon;
    private String description;
    private Integer defaultDurationMins;
}
