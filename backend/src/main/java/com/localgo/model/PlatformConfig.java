package com.localgo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tunable platform configuration stored in Firestore collection "config" document "platform".
 * All values are stored as long integers (paise, seconds, basis points, hours, etc.).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformConfig {
    private Long commissionBps;               // e.g., 750 = 7.5%
    private Long offerTimeoutSec;            // seconds before a REQUESTED offer expires
    private Long parallelOffers;             // number of providers to notify simultaneously
    private Long maxDispatchSeconds;         // max seconds allowed for dispatch logic
    private Long cancellationFeeBps;         // cancellation fee in basis points
    private Long completionAutoConfirmHours; // auto‑confirm after provider marks done
    private Long disputeWindowHours;         // window for customer to open a dispute
    // Feature flags for each phase (true = enabled)
    private Boolean enablePhase0;
    private Boolean enablePhase1;
    private Boolean enablePhase2;
    private Boolean enablePhase3;
    private Boolean enablePhase4;
    private Boolean enablePhase5;
    private Boolean enablePhase6;
    private Long statsWindowDays;               // days for rolling provider stats window
    private Long suspensionStrikes;            // strikes threshold for suspension
    private Long suspensionWindowDays;          // days window for counting strikes
    private Long visitFeeBps;                // fee retained when quote is declined
}
