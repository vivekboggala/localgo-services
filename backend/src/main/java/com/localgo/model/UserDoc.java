package com.localgo.model;

import com.google.cloud.firestore.annotation.IgnoreExtraProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IgnoreExtraProperties
public class UserDoc {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private Date createdAt;
}
