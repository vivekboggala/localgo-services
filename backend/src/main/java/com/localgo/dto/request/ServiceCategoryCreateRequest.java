package com.localgo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServiceCategoryCreateRequest {
    @NotBlank(message = "Service category name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Icon name is required")
    private String icon;

    @NotBlank(message = "Category group is required")
    private String category;

    @NotNull(message = "Default duration in minutes is required")
    private Integer defaultDurationMins;
}
