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
public class ProviderServiceItem {
    private String serviceId;
    private String serviceName;
    private Long startingPrice; // stored in paise (100 paise = 1 INR)
}
