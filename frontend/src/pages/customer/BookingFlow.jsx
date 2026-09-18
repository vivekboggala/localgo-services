import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation as useReactLocation, useSearchParams } from 'react-router-dom';
import { providerService } from '../../services/providerService';
import { bookingService } from '../../services/bookingService';
import { useLocation } from '../../hooks/useLocation';
import { DollarSign, Smartphone, Calendar, MapPin, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const BookingFlow = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const routerLocation = useReactLocation();
  const [searchParams] = useSearchParams();
  const { location } = useLocation();

  const prefillState = routerLocation.state || {};
  const queryServiceId = searchParams.get('serviceId');

  const [provider, setProvider] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(queryServiceId || '');
  const [description, setDescription] = useState(prefillState.prefillDescription || '');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [address, setAddress] = useState(prefillState.prefillAddress || 'Door 4/12, CTM Road, Madanapalle Town');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    providerService.getProviderById(providerId)
      .then((data) => {
        setProvider(data);
        if (!selectedServiceId && data.services?.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      })
      .catch(() => setError('Failed to load provider details'))
      .finally(() => setLoading(false));
  }, [providerId, selectedServiceId]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const selectedService = provider.services.find((s) => s.id === Number(selectedServiceId));
      const result = await bookingService.createBooking({
        providerId: Number(providerId),
        serviceId: Number(selectedServiceId),
        description,
        latitude: location.lat,
        longitude: location.lng,
        address,
        scheduledDate,
        scheduledTime: scheduledTime.length === 5 ? `${scheduledTime}:00` : scheduledTime,
        estimatedDurationMins: selectedService?.defaultDurationMins || 60,
        paymentMethod,
      });

      toast.success('Booking created successfully! 🎉');
      navigate(`/bookings/${result.id}?confirmed=true`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking creation failed. Please choose another time slot or check details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Service Appointment</span>
          <h1 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">Book {provider?.name}</h1>
          <p className="text-xs text-slate-500">Fill in details for your doorstep service appointment</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded-r-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitBooking} className="space-y-5">
          {/* Step 1: Select Service */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">1. Select Service Category</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white font-medium text-slate-900"
            >
              {provider?.services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Est. {s.defaultDurationMins} mins)
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Describe Problem */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">2. Describe the Problem / Instructions</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. My AC is not cooling properly and making a strange noise..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm text-slate-900"
            />
          </div>

          {/* Step 3: Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">3. Preferred Date</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Preferred Time Slot</label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Step 4: Doorstep Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">4. Doorstep Service Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Door No, Street Name, Landmark..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm text-slate-900"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">5. Payment Method</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'CASH' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <DollarSign className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-medium text-slate-900">Cash After Service</span>
              </label>

              <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'UPI' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <Smartphone className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-medium text-slate-900">UPI Transfer</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
