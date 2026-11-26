package com.localgo.vendor;

public interface PaymentGateway {
    /**
     * Create a payment order for the given amount (in paise) and booking reference.
     * Returns a payment provider reference (order id) that can be stored.
     */
    String createOrder(String bookingId, long amountPaise);

    /**
     * Verify a webhook payload. Returns true if the signature is valid and the payload matches.
     * Implementations should also return the payment status (e.g., SUCCESS, FAILED, CANCELLED).
     */
    PaymentResult verifyWebhook(String payload, String signatureHeader);

    /**
     * Initiate a refund for the given payment reference and amount.
     * Returns a refund reference id.
     */
    String refund(String paymentReference, long amountPaise);
}

/** Simple enum representing payment result states returned by the gateway verification. */
enum PaymentResultStatus {
    SUCCESS,
    FAILED,
    CANCELLED
}

class PaymentResult {
    private final PaymentResultStatus status;
    private final String paymentReference;
    private final long amountPaise;
    private final String bookingId;
    private final String eventId; // unique webhook event identifier

    public PaymentResult(PaymentResultStatus status, String paymentReference, long amountPaise, String bookingId, String eventId) {
        this.status = status;
        this.paymentReference = paymentReference;
        this.amountPaise = amountPaise;
        this.bookingId = bookingId;
        this.eventId = eventId;
    }
    public PaymentResultStatus getStatus() { return status; }
    public String getPaymentReference() { return paymentReference; }
    public long getAmountPaise() { return amountPaise; }
    public String getBookingId() { return bookingId; }
    public String getEventId() { return eventId; }
}
