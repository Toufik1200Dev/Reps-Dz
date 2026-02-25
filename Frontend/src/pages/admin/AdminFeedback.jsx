import React, { useState, useEffect, useCallback } from 'react';
import { RateReview, Delete, CalendarMonth, ArrowBack, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const FEEDBACK_FETCH_LIMIT = 500;

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getFeedbackList({ limit: FEEDBACK_FETCH_LIMIT });
      const data = res.data?.data;
      setList(data?.feedback || []);
      setTotal(data?.total ?? (data?.feedback || []).length);
    } catch (err) {
      setError(err.message || 'Failed to load feedback');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  useEffect(() => {
    const onFocus = () => fetchFeedback();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchFeedback]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await adminAPI.deleteFeedback(id);
      setList((prev) => prev.filter((f) => f._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  if (loading && list.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-black mb-2">Generator Feedback</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-2"
          >
            <ArrowBack /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-black mb-1">Generator Feedback</h1>
          <p className="text-gray-500 text-sm">Comments from users who used the program generator</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchFeedback()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-60 transition-colors"
          >
            <Refresh sx={{ fontSize: 20 }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <RateReview className="text-amber-600" />
            <span className="font-bold text-gray-800">{total}</span>
            <span className="text-gray-600 text-sm">total</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700">
          {error}
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
          No feedback yet.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900">{item.name}</span>
                    {item.planUsed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        {item.planUsed}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarMonth sx={{ fontSize: 14 }} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Delete />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
