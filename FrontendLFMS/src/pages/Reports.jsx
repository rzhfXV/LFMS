import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Search, Filter, MapPin, Calendar, Tag, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const location = searchParams.get('location') || '';
  const eventDate = searchParams.get('eventDate') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  useEffect(() => {
    apiClient.get('/categories')
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchReports();
  }, [searchParams]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (type) params.append('type', type);
      if (categoryId) params.append('categoryId', categoryId);
      if (location) params.append('location', location);
      if (eventDate) params.append('eventDate', eventDate);
      params.append('page', page);
      params.append('size', 9);

      const res = await apiClient.get(`/reports?${params.toString()}`);
      setReports(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '0'); // Reset page
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Daftar Barang Hilang & Temuan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ditemukan {totalElements} laporan aktif yang terverifikasi
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Cari nama barang..."
              value={q}
              onChange={(e) => updateFilter('q', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type */}
          <select
            value={type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Tipe</option>
            <option value="LOST">Barang Hilang</option>
            <option value="FOUND">Barang Temuan</option>
          </select>

          {/* Category */}
          <select
            value={categoryId}
            onChange={(e) => updateFilter('categoryId', e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Location */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Lokasi (cth: Kantin)..."
              value={location}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date */}
          <input
            type="date"
            value={eventDate}
            onChange={(e) => updateFilter('eventDate', e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {(q || type || categoryId || location || eventDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500">Filter sedang aktif</span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-gray-200 animate-pulse h-64"></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-500 text-lg">Tidak ada laporan yang sesuai dengan kriteria pencarian.</p>
          <button
            onClick={resetFilters}
            className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
          >
            Hapus filter dan coba lagi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-6">
          <button
            onClick={() => updateFilter('page', (page - 1).toString())}
            disabled={page === 0}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700 px-4">
            Halaman {page + 1} dari {totalPages}
          </span>
          <button
            onClick={() => updateFilter('page', (page + 1).toString())}
            disabled={page >= totalPages - 1}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
