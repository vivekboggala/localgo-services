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
public class OtpDoc {
    private String id;
    private String email;
    private String otpHash;
    private String purpose;
    private Date expiresAt;
    private int attempts;
    private boolean used;
    private boolean verified;
    private String verificationToken;
    private Date verifiedAt;
    private Date createdAt;
}
