import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { MapPin, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [serviceArea, setServiceArea] = useState('Central City Region');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [primaryServiceId, setPrimaryServiceId] = useState('');
  const [startingPrice, setStartingPrice] = useState(300);
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/services')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setCategories(res.data.data);
          setPrimaryServiceId(res.data.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        toast.success('Business base location detected from GPS');
      },
      (err) => {
        toast.error('Could not detect GPS location: ' + err.message);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const pendingRegistration = {
      role: 'PROVIDER',
      payload: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password,
        description,
        experienceYears: Number(experienceYears),
        address,
        city,
        postalCode,
        latitude: Number(latitude),
        longitude: Number(longitude),
        serviceArea,
        serviceRadiusKm: Number(serviceRadiusKm),
        primaryServiceId: String(primaryServiceId || 'electrician'),
        startingPrice: Number(startingPrice),
      },
    };

    try {
      await api.post('/auth/send-otp', {
        email: cleanEmail,
        purpose: 'EMAIL_VERIFICATION',
      });
      sessionStorage.setItem('localgo_pending_registration', JSON.stringify(pendingRegistration));
      toast.success('Verification code sent to your email!');
      navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`, {
        state: { pendingRegistration },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not send verification OTP. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 bg-grid-pattern flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-card border border-slate-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-md flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
              Local<span className="text-blue-600">Go</span>
            </span>
            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">Partner</span>
          </Link>
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" /> Partner Registration
          </h2>
          <p className="text-xs text-slate-500">Join LocalGo as a verified doorstep service professional</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Full Name / Business Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar - Master Electrician"
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 shadow-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 shadow-xs font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 shadow-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 shadow-xs font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 shadow-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-400 text-[10px] uppercase">Business Specifications</h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Primary Service Category</label>
              <select
                value={primaryServiceId}
                onChange={(e) => setPrimaryServiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 outline-none text-xs bg-white text-slate-900 font-medium shadow-xs"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.category})
                  </option>
                ))}
                {categories.length === 0 && <option value="ac-repair">AC Repair & Service</option>}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Experience Summary</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your expertise..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 outline-none text-xs text-slate-900 shadow-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Experience (Years)</label>
                <input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-900 font-medium shadow-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Starting Charge (₹)</label>
                <input type="number" min="50" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-900 font-medium shadow-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Coverage Area Name</label>
                <input type="text" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-900 font-medium shadow-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Coverage Radius (km)</label>
                <input type="number" min="1" max="50" value={serviceRadiusKm} onChange={(e) => setServiceRadiusKm(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-900 font-medium shadow-xs" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">Base GPS: {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Use Current GPS Location
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center mt-4"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Register as Service Provider'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Already registered?{' '}
          <Link to="/login" className="text-slate-900 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
