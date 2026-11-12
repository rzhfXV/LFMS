import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { Upload, AlertCircle, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';

export const CreateReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [type, setType] = useState(searchParams.get('type') || 'LOST');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [verificationDetails, setVerificationDetails] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiClient.get('/categories')
      .then((res) => {
        setCategories(res.data || []);
        if (res.data && res.data.length > 0) {
          setCategoryId(res.data[0].id.toString());
        }
      })
      .catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('categoryId', categoryId);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('location', location.trim());
    formData.append('eventDate', eventDate);

    if (type === 'FOUND' && verificationDetails.trim()) {
      formData.append('verificationDetails', verificationDetails.trim());
    }

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await apiClient.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Laporan berhasil dibuat! Laporan Anda sedang dalam status Menunggu Verifikasi Admin.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat laporan. Periksa kembali form input Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </button>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Buat Laporan Baru</h1>
          <p className="text-xs text-gray-500 mt-1">
            Data laporan akan ditinjau oleh administrator kampus sebelum dipublikasikan.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipe Laporan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Jenis Laporan *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('LOST')}
                className={`py-3 rounded-xl text-sm font-bold border transition ${
                  type === 'LOST'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Saya Kehilangan Barang
              </button>
              <button
                type="button"
                onClick={() => setType('FOUND')}
                className={`py-3 rounded-xl text-sm font-bold border transition ${
                  type === 'FOUND'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Saya Menemukan Barang
              </button>
            </div>
          </div>

          {/* Kategori & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Barang *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Kejadian *</label>
              <input
                type="date"
                required
                value={eventDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Nama & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Barang *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: Dompet Kulit Hitam, Kunci Honda..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lokasi Kejadian *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="cth: Meja Kantin Gedung B, Lab Komputer..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Deskripsi Publik */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Publik *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan informasi umum barang yang aman dilihat oleh publik..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          {/* Detail Khusus / Rahasia untuk Barang Temuan (BR-07) */}
          {type === 'FOUND' && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
              <div className="flex items-center text-xs font-bold text-indigo-900">
                <ShieldAlert className="w-4 h-4 mr-1 text-indigo-600" />
                Ciri Rahasia Barang (Tidak Ditampilkan ke Publik - BR-07)
              </div>
              <p className="text-xs text-indigo-700">
                Masukkan ciri spesifik yang hanya diketahui oleh pemilik asli (misal: isi kartu di dalam dompet, wallpaper hp, nomor seri, gantungan kunci tersembunyi). Bagian ini hanya bisa dilihat oleh Admin untuk memverifikasi klaim.
              </p>
              <textarea
                rows={3}
                value={verificationDetails}
                onChange={(e) => setVerificationDetails(e.target.value)}
                placeholder="cth: Di dalam dompet ada kartu Alfamart atas nama X dan uang Rp 50.000..."
                className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>
          )}

          {/* Foto Barang */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Foto Barang (Opsional, maks 5MB)</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                <Upload className="w-4 h-4 mr-2 text-gray-500" />
                Pilih Berkas Gambar
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <span className="text-xs text-gray-600 truncate max-w-xs">{imageFile.name}</span>
              )}
            </div>
            {imagePreview && (
              <div className="mt-3 w-32 h-32 rounded-xl border border-gray-200 overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Menyimpan Laporan...' : 'Kirim Laporan untuk Diverifikasi'}
          </button>
        </form>
      </div>
    </div>
  );
};
