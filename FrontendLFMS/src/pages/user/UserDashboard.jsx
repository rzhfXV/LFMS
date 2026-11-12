import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FileText, Award, Bell, PlusCircle, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, repRes, claimRes, notifRes] = await Promise.all([
        apiClient.get('/user/dashboard'),
        apiClient.get('/user/reports?size=10'),
        apiClient.get('/user/claims?size=10'),
        apiClient.get('/user/notifications?size=10'),
      ]);
      setDashboard(dashRes.data);
      setReports(repRes.data?.content || []);
      setClaims(claimRes.data?.content || []);
      setNotifications(notifRes.data?.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClaim = async (claimId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pengajuan klaim ini?')) return;
    try {
      await apiClient.delete(`/user/claims/${claimId}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan klaim.');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    try {
      await apiClient.delete(`/user/reports/${reportId}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus laporan.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Halo, {user?.name}!</h1>
          <p className="text-xs text-gray-500 mt-1">
            Kelola laporan barang dan pengajuan klaim kepemilikan Anda
          </p>
        </div>
        <Link
          to="/create-report"
          className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Buat Laporan Baru
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Laporan Saya</p>
            <p className="text-2xl font-black text-gray-900">{dashboard?.myTotalReports || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Klaim Saya</p>
            <p className="text-2xl font-black text-gray-900">{dashboard?.myActiveClaims || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Notifikasi</p>
            <p className="text-2xl font-black text-gray-900">{notifications.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 px-6 pt-4 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Laporan Saya ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'claims'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Klaim Saya ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notifikasi ({notifications.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Anda belum membuat laporan.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reports.map((r) => (
                    <div key={r.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            r.type === 'LOST' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {r.type === 'LOST' ? 'Kehilangan' : 'Temuan'}
                          </span>
                          <span className="text-xs text-gray-400">{r.categoryName}</span>
                          <span className="text-xs text-gray-400">&bull; {r.eventDate}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base mt-1">{r.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{r.location} - {r.description}</p>
                        {r.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1 font-medium bg-red-50 p-2 rounded-lg">
                            Alasan Penolakan: {r.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          r.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          r.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {r.status}
                        </span>

                        {r.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Laporan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLAIMS */}
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {claims.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Anda belum mengajukan klaim barang.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {claims.map((c) => (
                    <div key={c.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="text-xs text-gray-400">
                          Klaim untuk: <Link to={`/reports/${c.foundReportId}`} className="font-bold text-indigo-600 hover:underline">{c.foundReportTitle}</Link>
                        </div>
                        <p className="text-xs text-gray-700 mt-1 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                          "Bukti Anda: {c.evidence}"
                        </p>
                        {c.adminNote && (
                          <p className="text-xs text-indigo-700 font-medium bg-indigo-50 p-2 rounded-lg mt-1">
                            Catatan Admin: {c.adminNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          c.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {c.status}
                        </span>

                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelClaim(c.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada notifikasi.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-3">
                      <p className="text-xs font-bold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
