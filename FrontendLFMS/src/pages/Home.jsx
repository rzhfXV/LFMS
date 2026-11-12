import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Search, MapPin, Calendar, Tag, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Home = () => {
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [categories, setCategories] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories and recent published reports
    Promise.all([
      apiClient.get('/categories').catch(() => ({ data: [] })),
      apiClient.get('/reports?size=6').catch(() => ({ data: { content: [] } }))
    ]).then(([catRes, repRes]) => {
      setCategories(catRes.data || []);
      setRecentReports(repRes.data?.content || []);
      setLoading(false);
    });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.append('q', keyword);
    if (type) params.append('type', type);
    navigate(`/reports?${params.toString()}`);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white py-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Kehilangan atau Menemukan Barang di Kampus?
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
            Platform terpusat dan terverifikasi untuk pelaporan barang hilang, publikasi barang temuan, dan klaim kepemilikan aman.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center px-3 bg-gray-50 rounded-xl border border-gray-200">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Cari nama barang, misal: KTM, Kunci motor, Tas..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full py-3 bg-transparent text-gray-900 text-sm focus:outline-none"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="LOST">Barang Hilang</option>
              <option value="FOUND">Barang Temuan</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition"
            >
              Cari
            </button>
          </form>

          {/* Quick links */}
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/create-report?type=LOST"
              className="inline-flex items-center text-sm font-medium bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-lg transition"
            >
              Saya Kehilangan Barang &rarr;
            </Link>
            <Link
              to="/create-report?type=FOUND"
              className="inline-flex items-center text-sm font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur px-4 py-2 rounded-lg transition"
            >
              Saya Menemukan Barang &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Laporan Terbaru yang Terverifikasi</h2>
            <p className="text-sm text-gray-500">Barang yang baru saja disetujui oleh admin</p>
          </div>
          <Link
            to="/reports"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-gray-200 animate-pulse h-64"></div>
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Belum ada laporan aktif yang dipublikasikan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {report.imagePath ? (
                    <img
                      src={report.imagePath}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Tidak ada foto</div>
                  )}
                  <span
                    className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      report.type === 'LOST'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {report.type === 'LOST' ? 'Kehilangan' : 'Ditemukan'}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      {report.categoryName}
                    </span>
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition text-lg mt-1 line-clamp-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {report.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span className="truncate max-w-[120px]">{report.location}</span>
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      {report.eventDate}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Security & How It Works Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-indigo-950 mb-6 text-center">
            Bagaimana LFMS Melindungi Data & Kepemilikan Anda?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Verifikasi Terpusat</h3>
              <p className="text-sm text-gray-600">
                Setiap laporan diverifikasi oleh administrator kampus sebelum dipublikasikan untuk mencegah hoax atau spam.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Detail Rahasia (BR-07)</h3>
              <p className="text-sm text-gray-600">
                Ciri rahasia barang temuan disimpan terisolasi dan tidak ditampilkan ke publik untuk verifikasi silang klaim.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Jejak Audit & Anti-Brute Force</h3>
              <p className="text-sm text-gray-600">
                Proteksi autentikasi berbasis JWT, pembatasan rate limit login, dan pencatatan audit log keamanan secara real-time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
