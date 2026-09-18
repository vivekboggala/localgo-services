import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { reviewService } from '../../services/reviewService';
import { RatingStars } from '../../components/common/RatingStars';
import { StatusTimeline } from '../../components/customer/StatusTimeline';
import { CheckCircle2, Phone, Star, X, Calendar, Clock, MapPin, FileText } from 'lucide-react';

export const BookingDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isJustConfirmed = searchParams.get('confirmed') === 'true';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    bookingService.getBookingById(id)
      .then((data) => setBooking(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(id, cancelReason);
      setBooking(updated);
      setShowCancelModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewService.submitReview(booking.id, reviewRating, reviewComment);
      setReviewSubmitted(true);
      setShowReviewModal(false);
      alert('Thank you! Your review has been submitted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Booking Not Found</h2>
      </div>
    );
  }

  const canCallProvider = ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const canCancel = ['REQUESTED', 'ACCEPTED'].includes(booking.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {isJustConfirmed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Booking Confirmed Successfully</h4>
              <p className="text-xs text-emerald-700">Provider has been notified of your request.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-500 block">Booking Details #{booking.id}</span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{booking.serviceName}</h1>
          <p className="text-xs font-medium text-slate-600">Provider: {booking.providerName}</p>
        </div>

        {canCallProvider && (
          <a
            href={`tel:${booking.providerPhone}`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-2"
          >
            <Phone className="w-3.5 h-3.5" /> Call Provider ({booking.providerPhone})
          </a>
        )}
      </div>

      {/* Visual Status Timeline */}
      <StatusTimeline
        status={booking.status}
        cancelledBy={booking.cancelledBy}
        cancellationReason={booking.cancellationReason}
      />

      {/* Completed Booking Review Prompt */}
      {booking.status === 'COMPLETED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-amber-900">How was your service experience?</h4>
              <p className="text-xs text-amber-700">Share your rating and feedback to help others find quality providers.</p>
            </div>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            disabled={reviewSubmitted}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-medium rounded-lg text-xs transition-colors whitespace-nowrap"
          >
            {reviewSubmitted ? 'Review Submitted' : 'Rate & Review'}
          </button>
        </div>
      )}

      {/* Booking Summary Box */}
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Summary</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Scheduled Appointment</span>
            <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {booking.scheduledDate} at {booking.scheduledTime}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Total Amount</span>
            <span className="font-semibold text-slate-900 text-sm block mt-0.5">₹{booking.amount} ({booking.paymentMethod})</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Est. Duration</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{booking.estimatedDurationMins} minutes</span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Payment Status</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{booking.paymentStatus}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 block font-medium mb-1">Doorstep Address</span>
          <p className="text-xs text-slate-800 font-medium">{booking.address}</p>
        </div>

        <div>
          <span className="text-xs text-slate-500 block font-medium mb-1">Problem Description</span>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">"{booking.description}"</p>
        </div>
      </div>

      {canCancel && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition-colors border border-slate-200"
        >
          Cancel Booking Request
        </button>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Rate Your Experience</h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Your feedback for <span className="font-semibold text-slate-900">{booking.providerName}</span> ({booking.serviceName})
            </p>

            <div className="flex flex-col items-center py-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500 mb-2">Select Rating</span>
              <RatingStars
                rating={reviewRating}
                interactive={true}
                onChange={(newRating) => setReviewRating(newRating)}
              />
              <span className="text-xs font-semibold text-slate-900 mt-2">
                {reviewRating} out of 5 stars
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Feedback / Comment</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write a brief comment about the service quality, punctuality, and professionalism..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={submittingReview}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h3 className="font-bold text-slate-900 text-base">Cancel Booking</h3>
            <p className="text-xs text-slate-500">Please tell us why you are cancelling this booking request.</p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-900"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
