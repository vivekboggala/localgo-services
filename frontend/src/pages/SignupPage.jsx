import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { MapPin, User, Briefcase } from 'lucide-react';

export const SignupPage = () => {
  const [role, setRole] = useState('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [serviceArea, setServiceArea] = useState('Madanapalle Town');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [primaryServiceId, setPrimaryServiceId] = useState('');
  const [startingPrice, setStartingPrice] = useState(300);
  const [latitude, setLatitude] = useState(13.5500);
  const [longitude, setLongitude] = useState(78.5000);

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerCustomer, registerProvider } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (role === 'CUSTOMER') {
        await registerCustomer({ name, email, phone, password });
      } else {
        await registerProvider({
          name,
          email,
          phone,
          password,
          description,
          experienceYears: Number(experienceYears),
          latitude: Number(latitude),
          longitude: Number(longitude),
          serviceArea,
          serviceRadiusKm: Number(serviceRadiusKm),
          primaryServiceId: Number(primaryServiceId),
          startingPrice: Number(startingPrice),
        });
      }
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
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
          </Link>
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-500">Register as a customer or service professional</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200/80">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${
              role === 'CUSTOMER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Customer Account
          </button>
          <button
            type="button"
            onClick={() => setRole('PROVIDER')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${
              role === 'PROVIDER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Service Provider
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 uppercase text-[10px]">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
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
                placeholder="rahul@example.com"
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

          {role === 'PROVIDER' && (
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
                  {categories.length === 0 && <option value="1">AC Repair & Service</option>}
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
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center mt-4"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : `Register as ${role === 'CUSTOMER' ? 'Customer' : 'Provider'}`}
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
