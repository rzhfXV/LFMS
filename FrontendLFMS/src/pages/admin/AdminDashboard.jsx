import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Shield, FileCheck, CheckCircle2, XCircle, Download, FileText, AlertCircle, RefreshCw, PackageCheck } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);

  // Review Report Modal
  const [reviewReportModal, setReviewReportModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Review Claim Modal
  const [reviewClaimModal, setReviewClaimModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  // Serah Terima Barang
  const [completeClaimModal, setCompleteClaimModal] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, repRes, claimRes, approvedClaimRes, logRes] = await Promise.all([
        apiClient.get('/admin/dashboard'),
        apiClient.get('/admin/reports?status=PENDING_REVIEW&size=20'),
        apiClient.get('/admin/claims?status=PENDING&size=20'),
        apiClient.get('/admin/claims?status=APPROVED&size=20'),
        apiClient.get('/admin/audit-logs?size=15'),
      ]);
      setStats(dashRes.data);
      setPendingReports(repRes.data?.content || []);
      setPendingClaims(claimRes.data?.content || []);
      setApprovedClaims(approvedClaimRes.data?.content || []);
      setAuditLogs(logRes.data?.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (status) => {
    if (!reviewReportModal) return;
    try {
      await apiClient.patch(`/admin/reports/${reviewReportModal.id}/review`, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      });
      setReviewReportModal(null);
      setRejectionReason('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses laporan.');
    }
  };

  const handleReviewClaim = async (status) => {
    if (!reviewClaimModal) return;
    try {
      await apiClient.patch(`/admin/claims/${reviewClaimModal.id}/review`, {
        status,
        adminNote: adminNote.trim() || null,
      });
      setReviewClaimModal(null);
      setAdminNote('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses klaim.');
    }
  };

  const handleCompleteClaim = async (claimId) => {
    if (!completeClaimModal) return;
    try {
      await apiClient.patch(`/admin/claims/${claimId}/complete`);
      setCompleteClaimModal(null);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyelesaikan serah terima.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/admin/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lfms-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mengekspor data CSV.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Administrator Panel</h1>
            <p className="text-xs text-gray-500">
              Verifikasi laporan, pemrosesan klaim, ekspor data & audit logging
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor Rekap CSV
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Laporan Hilang</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats?.totalLostReports || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Laporan Temuan</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.totalFoundReports || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Antrian Verifikasi</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.pendingReports || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Klaim Menunggu</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.pendingClaims || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-gray-400 uppercase">Barang Selesai</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats?.resolvedItems || 0}</p>
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
            Verifikasi Laporan Baru ({pendingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'claims'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pemeriksaan Klaim ({pendingClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('handover')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'handover'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Serah Terima Barang ({approvedClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-4 border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Audit Log Aktivitas ({auditLogs.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: PENDING REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {pendingReports.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tidak ada laporan yang menunggu verifikasi.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingReports.map((r) => (
                    <div key={r.id} className="py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            r.type === 'LOST' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {r.type === 'LOST' ? 'Kehilangan' : 'Temuan'}
                          </span>
                          <span className="text-xs text-gray-400 font-semibold">{r.categoryName}</span>
                          <span className="text-xs text-gray-400">&bull; Oleh: {r.userName} &bull; {r.eventDate}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">{r.title}</h4>
                        <p className="text-xs text-gray-600 max-w-2xl">{r.description}</p>
                        {r.verificationDetails && (
                          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 font-medium mt-1">
                            <strong>Detail Rahasia Pelapor:</strong> {r.verificationDetails}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setReviewReportModal(r)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                      >
                        Tinjau & Verifikasi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING CLAIMS */}
          {activeTab === 'claims' && (
            <div className="space-y-4">
              {pendingClaims.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tidak ada klaim kepemilikan yang menunggu pemeriksaan.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingClaims.map((c) => (
                    <div key={c.id} className="py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="text-xs text-gray-400">
                          Barang Temuan: <span className="font-bold text-gray-800">{c.foundReportTitle}</span>
                        </div>
                        <p className="text-xs text-gray-700">
                          <strong>Pengklaim:</strong> {c.claimantName} ({c.claimantEmail})
                        </p>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mt-1">
                          <strong>Bukti Pengklaim:</strong> {c.evidence}
                        </div>
                        {c.foundReportVerificationDetails && (
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 mt-1">
                            <strong>Detail Asli Barang Temuan (Untuk Verifikasi Silang):</strong> {c.foundReportVerificationDetails}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setReviewClaimModal(c)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                      >
                        Proses Klaim
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: APPROVED CLAIMS — HANDOVER */}
          {activeTab === 'handover' && (
            <div className="space-y-4">
              {approvedClaims.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">Tidak ada klaim yang menunggu serah terima.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {approvedClaims.map((c) => (
                    <div key={c.id} className="py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-700">
                            Klaim Disetujui
                          </span>
                          <span className="text-xs text-gray-400">Klaim #{c.id}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Barang Temuan: <span className="font-bold text-gray-800">{c.foundReportTitle}</span>
                        </div>
                        <p className="text-xs text-gray-700">
                          <strong>Pengklaim:</strong> {c.claimantName} ({c.claimantEmail})
                        </p>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mt-1">
                          <strong>Bukti yang Diajukan:</strong> {c.evidence}
                        </div>
                        {c.adminNote && (
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 mt-1">
                            <strong>Catatan Admin:</strong> {c.adminNote}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setCompleteClaimModal(c)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                      >
                        Konfirmasi Serah Terima
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Aksi</th>
                    <th className="p-3">Entitas</th>
                    <th className="p-3">Deskripsi</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                      <td className="p-3 font-semibold text-gray-900">{log.userName || 'System'}</td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">{log.action}</td>
                      <td className="p-3">{log.entityType} #{log.entityId}</td>
                      <td className="p-3 max-w-xs truncate">{log.description}</td>
                      <td className="p-3 font-mono text-gray-400">{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Report Modal */}
      {reviewReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Verifikasi Laporan</h3>
              <p className="text-xs text-gray-500 mt-1">Laporan: {reviewReportModal.title}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alasan Penolakan (Wajib jika ditolak)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Berikan alasan mengapa laporan ini tidak memenuhi syarat publikasi..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewReportModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReviewReport('REJECTED')}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md disabled:opacity-40"
              >
                Tolak Laporan
              </button>
              <button
                type="button"
                onClick={() => handleReviewReport('PUBLISHED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md"
              >
                Setujui & Publikasikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Claim Modal */}
      {reviewClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Proses Verifikasi Klaim</h3>
              <p className="text-xs text-gray-500 mt-1">
                Pengklaim: {reviewClaimModal.claimantName} &bull; Barang: {reviewClaimModal.foundReportTitle}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catatan Admin untuk Pengklaim
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="cth: Bukti valid. Silakan bawa KTM Anda ke Ruang Admin Gedung A untuk serah terima..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewClaimModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReviewClaim('REJECTED')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md"
              >
                Tolak Klaim
              </button>
              <button
                type="button"
                onClick={() => handleReviewClaim('APPROVED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md"
              >
                Setujui Klaim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Claim (Handover) Modal */}
      {completeClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Konfirmasi Serah Terima Barang</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Pastikan identitas pengklaim dan fisik barang telah diverifikasi sebelum menyelesaikan proses ini.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">ID Klaim:</span>
                <span className="font-mono font-bold text-gray-900">#{completeClaimModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Barang Temuan:</span>
                <span className="font-bold text-gray-900 text-right">{completeClaimModal.foundReportTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Penerima / Pengklaim:</span>
                <span className="font-semibold text-gray-900 text-right">
                  {completeClaimModal.claimantName} ({completeClaimModal.claimantEmail})
                </span>
              </div>
              {completeClaimModal.adminNote && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-1">Catatan Persetujuan:</span>
                  <p className="text-indigo-800 bg-indigo-50 p-2 rounded-lg">{completeClaimModal.adminNote}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Tindakan ini akan menandai klaim sebagai <strong>SELESAI</strong> dan memperbarui status barang menjadi telah dikembalikan. Tindakan tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompleteClaimModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCompleteClaim}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Selesaikan Serah Terima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
