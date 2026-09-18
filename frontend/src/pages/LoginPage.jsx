import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MapPin, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'CUSTOMER') {
        navigate('/dashboard');
      } else if (user.role === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 bg-grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-card border border-slate-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-md flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
              Local<span className="text-blue-600">Go</span>
            </span>
          </Link>
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-500">Access customer bookings or provider management</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md font-medium space-y-2">
            <p>{error}</p>
            {error.includes('EMAIL_NOT_VERIFIED') && (
              <button
                type="button"
                onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
                className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold transition-colors"
              >
                Verify Email Code Now
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 font-medium shadow-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 rounded-md border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none text-xs text-slate-900 font-medium shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center mt-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/signup" className="text-slate-900 font-bold hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};
