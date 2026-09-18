package com.localgo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long bookingId;
    private String customerName;
    private String providerName;
    private Integer rating;
    private String comment;
    private Boolean hidden;
    private LocalDateTime createdAt;
}
