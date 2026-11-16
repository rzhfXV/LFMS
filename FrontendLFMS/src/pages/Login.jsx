import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Shield } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRateLimited(false);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setRateLimited(true);
        setError('Terlalu banyak percobaan login gagal. Demi keamanan, akun dibatasi selama 15 menit.');
      } else if (err.response?.status === 401) {
        setError('Email atau password salah.');
      } else if (err.response?.status === 403) {
        setError('Akun Anda ditangguhkan (suspended). Silakan hubungi admin.');
      } else {
        setError(err.response?.data?.message || 'Gagal login. Silakan periksa kembali data Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Masuk ke LFMS</h1>
          <p className="text-xs text-gray-500">
            Akses dashboard pelaporan dan klaim barang kampus
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-xl text-xs flex gap-2 ${
            rateLimited ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {rateLimited ? <Shield className="w-5 h-5 flex-shrink-0 text-amber-600" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Kampus *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nim@uniku.ac.id"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || rateLimited}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};
