import React, { useState, useEffect, useCallback } from 'react';
import { Refresh, Visibility, ArrowForward, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const PAGE_SIZES = [20, 50, 100];

function typeLabel(type) {
  if (type === 'free_1week') return 'Free 1-week';
  if (type === 'paid_6week') return 'Paid 6/12-week';
  return type || '—';
}

export default function EmailsSent() {
  const navigate = useNavigate();
  const [data, setData] = useState({ totalEmailsSent: 0, free1WeekCount: 0, paidCount: 0, list: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [limitsData, setLimitsData] = useState({ list: [], pagination: null });
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [limitsPage, setLimitsPage] = useState(1);
  const [limitsLimit, setLimitsLimit] = useState(20);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getEmailsSent({ page, limit });
      const payload = res.data?.data;
      if (res.data?.success && payload) {
        setData({
          totalEmailsSent: payload.totalEmailsSent ?? 0,
          free1WeekCount: payload.free1WeekCount ?? 0,
          paidCount: payload.paidCount ?? 0,
          list: payload.list ?? [],
          pagination: payload.pagination ?? null
        });
      }
    } catch (err) {
      console.error('Error fetching emails sent:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const fetchFreeProgramLimits = useCallback(async () => {
    try {
      setLimitsLoading(true);
      const res = await adminAPI.getFreeProgramLimits({ page: limitsPage, limit: limitsLimit });
      const payload = res.data?.data;
      if (res.data?.success && payload) {
        setLimitsData({
          list: payload.list ?? [],
          pagination: payload.pagination ?? null
        });
      }
    } catch (err) {
      console.error('Error fetching free program limits:', err);
    } finally {
      setLimitsLoading(false);
    }
  }, [limitsPage, limitsLimit]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    fetchFreeProgramLimits();
  }, [fetchFreeProgramLimits]);

  useEffect(() => {
    const onFocus = () => {
      fetchEmails();
      fetchFreeProgramLimits();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchEmails, fetchFreeProgramLimits]);

  const pagination = data.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const hasPrev = pagination?.hasPrev ?? false;
  const hasNext = pagination?.hasNext ?? false;

  if (loading && data.list.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Emails sent (program PDFs)</h1>
          <p className="text-gray-600">All program PDFs sent to users by email (free 1-week and paid 6/12-week).</p>
        </div>
        <button
          type="button"
          onClick={() => { fetchEmails(); fetchFreeProgramLimits(); }}
          disabled={loading || limitsLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-60 transition-colors"
        >
          <Refresh sx={{ fontSize: 20 }} />
          {(loading || limitsLoading) ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-black text-gray-900">{data.totalEmailsSent}</p>
          <p className="text-sm text-gray-500">Total emails sent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-black text-blue-600">{data.free1WeekCount}</p>
          <p className="text-sm text-gray-500">Free 1-week (PDF)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-black text-rose-600">{data.paidCount}</p>
          <p className="text-sm text-gray-500">Paid 6/12-week (PDF)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="font-bold text-lg text-gray-900">All emails sent</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">Per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 bg-white"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigate('/admin/saved-programs')}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View saved programs (details)
              <ArrowForward sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Email</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Name</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Type</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Level</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Sent at</th>
                <th className="p-3 font-bold text-gray-600 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.list.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No program emails sent yet.
                  </td>
                </tr>
              )}
              {data.list.map((row, idx) => (
                <tr key={`${row.type}-${row.email}-${row.sentAt}-${idx}`} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{row.email || '—'}</td>
                  <td className="p-3 text-gray-600">{row.userName || '—'}</td>
                  <td className="p-3">
                    <span className={row.type === 'free_1week' ? 'text-blue-600' : 'text-rose-600'}>
                      {typeLabel(row.type)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 capitalize">{row.level || '—'}</td>
                  <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                    {row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}
                  </td>
                  <td className="p-3 text-right">
                    {row.type === 'free_1week' && row.programSaveId && (
                      <button
                        type="button"
                        onClick={() => navigate('/admin/saved-programs')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm"
                      >
                        <Visibility sx={{ fontSize: 18 }} />
                        View program
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.totalEmailsSent)} of {data.totalEmailsSent}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev || loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft /> Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNext || loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Free program limits (freeprogramlimits collection) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Free program limits (users)</h2>
            <p className="text-sm text-gray-500 mt-0.5">All records from freeprogramlimits collection — email, year-month, usage count.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Per page:</span>
            <select
              value={limitsLimit}
              onChange={(e) => { setLimitsLimit(Number(e.target.value)); setLimitsPage(1); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 bg-white"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {limitsLoading && limitsData.list.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Email</th>
                  <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Year–Month</th>
                  <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Count</th>
                  <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Created at</th>
                  <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Updated at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {limitsData.list.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No free program limit records yet.
                    </td>
                  </tr>
                )}
                {limitsData.list.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{row.email || '—'}</td>
                    <td className="p-3 text-gray-600">{row.yearMonth || '—'}</td>
                    <td className="p-3 text-gray-600">{row.count ?? '—'}</td>
                    <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {limitsData.pagination && limitsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {((limitsPage - 1) * limitsLimit) + 1}–{Math.min(limitsPage * limitsLimit, limitsData.pagination.totalItems)} of {limitsData.pagination.totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLimitsPage((p) => Math.max(1, p - 1))}
                disabled={!limitsData.pagination.hasPrev || limitsLoading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft /> Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {limitsPage} of {limitsData.pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setLimitsPage((p) => Math.min(limitsData.pagination.totalPages, p + 1))}
                disabled={!limitsData.pagination.hasNext || limitsLoading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
