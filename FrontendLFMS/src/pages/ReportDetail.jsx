import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Tag, User, ShieldAlert, ArrowLeft, Send } from 'lucide-react';

export const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim modal
  const [claimOpen, setClaimOpen] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    apiClient.get(`/reports/${id}`)
      .then((res) => setReport(res.data))
      .catch((err) => {
        setError('Laporan tidak ditemukan atau belum disetujui.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');
    setSubmittingClaim(true);

    try {
      await apiClient.post('/claims', {
        foundReportId: report.id,
        evidence: evidence.trim(),
      });
      setClaimSuccess('Pengajuan klaim berhasil dikirim! Admin akan memeriksa bukti Anda.');
      setEvidence('');
      setTimeout(() => {
        setClaimOpen(false);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Gagal mengajukan klaim. Silakan coba lagi.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Tidak Tersedia</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Link
          to="/reports"
          className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Barang
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === report.userId;
  const canClaim = report.type === 'FOUND' && report.status === 'PUBLISHED' && !isOwner;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        to="/reports"
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke daftar barang
      </Link>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Image */}
        {report.imagePath && (
          <div className="w-full max-h-96 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100">
            <img
              src={report.imagePath}
              alt={report.title}
              className="w-full h-full object-contain max-h-96"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                report.type === 'LOST'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {report.type === 'LOST' ? 'Barang Hilang' : 'Barang Temuan'}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              ID Laporan: #{report.id}
            </span>
          </div>

          <div>
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
              {report.categoryName}
            </span>
            <h1 className="text-3xl font-black text-gray-900 mt-1">{report.title}</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm">
            <div className="flex items-center text-gray-700">
              <MapPin className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Lokasi</p>
                <p className="font-semibold">{report.location}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Tanggal Kejadian</p>
                <p className="font-semibold">{report.eventDate}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-700">
              <User className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Pelapor</p>
                <p className="font-semibold">{report.userName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-lg">Deskripsi Publik</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
          </div>

          {/* Action Claim for Found items */}
          {report.type === 'FOUND' && (
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900">Merasa ini barang milik Anda?</h4>
                <p className="text-xs text-gray-500">
                  Ajukan klaim dengan memberikan bukti ciri spesifik untuk diverifikasi administrator.
                </p>
              </div>

              {canClaim ? (
                <button
                  onClick={() => setClaimOpen(true)}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition"
                >
                  Ajukan Klaim Kepemilikan
                </button>
              ) : isOwner ? (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                  Anda adalah pelapor barang ini
                </span>
              ) : !isAuthenticated ? (
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition text-center"
                >
                  Masuk untuk Mengajukan Klaim
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {claimOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Ajukan Klaim Kepemilikan</h3>
              <p className="text-xs text-gray-500 mt-1">
                Klaim untuk barang: <span className="font-semibold text-gray-800">{report.title}</span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <p>
                Sebutkan ciri-ciri khusus barang yang tidak dicantumkan di halaman publik (misal: isi dalam dompet, nomor seri, goresan tertentu, wallpaper hp, dll). Admin akan membandingkannya dengan informasi rahasia pelapor.
              </p>
            </div>

            {claimError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {claimError}
              </div>
            )}

            {claimSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-medium">
                {claimSuccess}
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bukti Pendukung / Ciri Khusus (minimal 20 karakter) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Jelaskan bukti kepemilikan Anda secara rinci..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimOpen(false)}
                  disabled={submittingClaim}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim || evidence.trim().length < 20}
                  className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {submittingClaim ? 'Mengirim...' : 'Kirim Klaim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
