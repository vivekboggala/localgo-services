package com.localgo.repository;

import com.localgo.entity.Booking;
import com.localgo.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);
    Page<Booking> findByCustomerIdAndStatus(Long customerId, BookingStatus status, Pageable pageable);

    Page<Booking> findByProviderId(Long providerId, Pageable pageable);
    Page<Booking> findByProviderIdAndStatus(Long providerId, BookingStatus status, Pageable pageable);

    List<Booking> findByProviderIdAndScheduledDateAndStatusIn(
        Long providerId, LocalDate date, List<BookingStatus> statuses
    );

    long countByStatus(BookingStatus status);

    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.provider.id = :providerId
          AND b.scheduledDate = :date
          AND b.status IN ('ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS')
          AND (
            (:requestedTime >= b.scheduledTime AND :requestedTime < FUNCTION('ADDTIME', b.scheduledTime, FUNCTION('SEC_TO_TIME', b.estimatedDurationMins * 60)))
            OR
            (FUNCTION('ADDTIME', :requestedTime, FUNCTION('SEC_TO_TIME', :durationMins * 60)) > b.scheduledTime AND FUNCTION('ADDTIME', :requestedTime, FUNCTION('SEC_TO_TIME', :durationMins * 60)) <= FUNCTION('ADDTIME', b.scheduledTime, FUNCTION('SEC_TO_TIME', b.estimatedDurationMins * 60)))
            OR
            (b.scheduledTime >= :requestedTime AND b.scheduledTime < FUNCTION('ADDTIME', :requestedTime, FUNCTION('SEC_TO_TIME', :durationMins * 60)))
          )
        """)
    long countConflictingBookings(
        @Param("providerId") Long providerId,
        @Param("date") LocalDate date,
        @Param("requestedTime") LocalTime requestedTime,
        @Param("durationMins") int durationMins
    );

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Booking b WHERE b.status = 'COMPLETED' AND b.paymentStatus = 'PAID'")
    BigDecimal calculateTotalRealizedRevenue();

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Booking b WHERE b.provider.id = :providerId AND b.status = 'COMPLETED' AND b.paymentStatus = 'PAID'")
    BigDecimal calculateProviderRealizedEarnings(@Param("providerId") Long providerId);

    @Query("""
        SELECT b.scheduledDate, COALESCE(SUM(b.amount), 0), COUNT(b)
        FROM Booking b
        WHERE b.provider.id = :providerId
          AND b.status = 'COMPLETED'
          AND b.paymentStatus = 'PAID'
          AND b.scheduledDate >= :startDate
        GROUP BY b.scheduledDate
    """)
    List<Object[]> findProviderDailyEarningsTrend(@Param("providerId") Long providerId, @Param("startDate") LocalDate startDate);

    @Query("""
        SELECT b.scheduledDate, COALESCE(SUM(b.amount), 0), COUNT(b)
        FROM Booking b
        WHERE b.status = 'COMPLETED'
          AND b.paymentStatus = 'PAID'
          AND b.scheduledDate >= :startDate
        GROUP BY b.scheduledDate
    """)
    List<Object[]> findAdminDailyRevenueTrend(@Param("startDate") LocalDate startDate);

    @Query("""
        SELECT b.scheduledDate, COUNT(b)
        FROM Booking b
        WHERE b.scheduledDate >= :startDate
        GROUP BY b.scheduledDate
    """)
    List<Object[]> findAdminDailyBookingCounts(@Param("startDate") LocalDate startDate);
}

