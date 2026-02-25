import React, { useState, useEffect, useCallback } from 'react';
import {
  Email,
  Delete,
  Visibility,
  Search,
  Clear,
  MarkEmailRead,
  Person,
  CalendarToday,
  Close,
  Refresh,
} from '@mui/icons-material';
import { contactAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const CONTACTS_FETCH_LIMIT = 500;

const statusColors = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  read: 'bg-gray-100 text-gray-700 border-gray-200',
  replied: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ContactMessages() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: CONTACTS_FETCH_LIMIT, page: 1 };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await contactAPI.getAll(params);
      const data = response.data?.data ?? response.data;
      setContacts(Array.isArray(data) ? data : (data?.contacts || []));
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message || 'Failed to fetch contact messages');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await contactAPI.getStats();
      const data = response.data?.data ?? response.data;
      setStats(data);
    } catch (err) {
      console.error('Error fetching contact stats:', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchContacts();
    fetchStats();
  }, [fetchContacts, fetchStats]);

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [fetchContacts, fetchStats]);

  useEffect(() => {
    const onFocus = () => refreshAll();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshAll]);

  useEffect(() => {
    const t = setTimeout(() => fetchContacts(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await contactAPI.markAsRead(id);
      setContacts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: 'read' } : c))
      );
      setSelectedContact((prev) => (prev && prev._id === id ? { ...prev, status: 'read' } : prev));
      setSnackbar({ open: true, message: 'Marked as read', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to mark as read', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await contactAPI.delete(id);
      setContacts((prev) => prev.filter((c) => c._id !== id));
      if (selectedContact?._id === id) {
        setViewDialogOpen(false);
        setSelectedContact(null);
      }
      setSnackbar({ open: true, message: 'Message deleted', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete', severity: 'error' });
    }
  };

  const openView = (contact) => {
    setSelectedContact(contact);
    setViewDialogOpen(true);
    if (contact.status === 'new') handleMarkAsRead(contact._id);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const filteredContacts = contacts;

  if (loading && contacts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-black mb-2">Contact Messages</h1>
          <p className="text-gray-500 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && contacts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-black mb-2">Contact Messages</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black mb-2">Contact Messages</h1>
          <p className="text-gray-500 text-sm sm:text-base">View and manage messages from the contact form</p>
        </div>
        <button
          type="button"
          onClick={() => refreshAll()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-60 transition-colors self-start sm:self-auto"
        >
          <Refresh sx={{ fontSize: 20 }} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Stats - responsive */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-3xl font-black font-display mb-1">{stats.totalContacts ?? contacts.length}</h3>
                <p className="text-gray-500 text-xs sm:text-base">Total</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg md:rounded-xl bg-gray-100 text-gray-600">
                <Email className="text-lg sm:text-2xl" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-3xl font-black font-display mb-1 text-blue-600">{stats.newContacts ?? contacts.filter((c) => c.status === 'new').length}</h3>
                <p className="text-gray-500 text-xs sm:text-base">New</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-3xl font-black font-display mb-1 text-green-600">{stats.repliedContacts ?? contacts.filter((c) => c.status === 'replied').length}</h3>
                <p className="text-gray-500 text-xs sm:text-base">Replied</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-3xl font-black font-display mb-1 text-amber-600">{stats.spamContacts ?? 0}</h3>
                <p className="text-gray-500 text-xs sm:text-base">Spam</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters - responsive */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg sm:text-xl" />
          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-sm sm:text-base"
          />
        </div>
        <div className="w-full sm:w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary appearance-none bg-white text-sm sm:text-base"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button
          onClick={clearFilters}
          className="px-3 sm:px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Clear fontSize="small" /> Clear
        </button>
      </div>

      {/* List: cards on mobile, table on md+ */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 sm:p-4 font-bold text-gray-600 text-xs sm:text-sm">From</th>
                <th className="p-3 sm:p-4 font-bold text-gray-600 text-xs sm:text-sm">Subject</th>
                <th className="p-3 sm:p-4 font-bold text-gray-600 text-xs sm:text-sm">Status</th>
                <th className="p-3 sm:p-4 font-bold text-gray-600 text-xs sm:text-sm">Date</th>
                <th className="p-3 sm:p-4 font-bold text-gray-600 text-xs sm:text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContacts.map((contact) => (
                <tr key={contact._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 sm:p-4">
                    <div className="font-bold text-sm sm:text-base">{contact.name}</div>
                    <div className="text-xs text-gray-500 break-all">{contact.email}</div>
                  </td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base max-w-[200px] truncate">{contact.subject}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold border ${statusColors[contact.status] || 'bg-gray-100 text-gray-600'}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button onClick={() => openView(contact)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors" title="View">
                        <Visibility fontSize="small" />
                      </button>
                      <button onClick={() => handleDelete(contact._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                        <Delete fontSize="small" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
                    No contact messages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredContacts.map((contact) => (
            <div key={contact._id} className="p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 truncate">{contact.name}</div>
                  <div className="text-xs text-gray-500 truncate">{contact.email}</div>
                  <div className="text-sm text-gray-700 mt-1 line-clamp-1">{contact.subject}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[contact.status] || 'bg-gray-100 text-gray-600'}`}>
                      {contact.status}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openView(contact)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" aria-label="View">
                    <Visibility fontSize="small" />
                  </button>
                  <button onClick={() => handleDelete(contact._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500" aria-label="Delete">
                    <Delete fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">No contact messages found</div>
          )}
        </div>
      </div>

      {/* View dialog - responsive */}
      <AnimatePresence>
        {viewDialogOpen && selectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewDialogOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-xl md:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col z-10"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Message</h2>
                <button onClick={() => setViewDialogOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" aria-label="Close">
                  <Close />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                    <Person />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{selectedContact.name}</div>
                    <a href={`mailto:${selectedContact.email}`} className="text-sm text-blue-600 hover:underline break-all">{selectedContact.email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarToday fontSize="small" />
                  {new Date(selectedContact.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Subject</span>
                  <p className="font-medium text-gray-900 mt-1">{selectedContact.subject}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Message</span>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{selectedContact.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[selectedContact.status] || 'bg-gray-100 text-gray-600'}`}>
                    {selectedContact.status}
                  </span>
                  {selectedContact.isSpam && <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200">Spam</span>}
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
                {selectedContact.status === 'new' && (
                  <button
                    onClick={() => handleMarkAsRead(selectedContact._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors text-sm sm:text-base"
                  >
                    <MarkEmailRead /> Mark as read
                  </button>
                )}
                <a
                  href={`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject)}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-black text-secondary hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  <Email /> Reply
                </a>
                <button
                  onClick={() => handleDelete(selectedContact._id)}
                  className="px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors text-sm sm:text-base"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm py-3 px-4 rounded-xl shadow-lg z-50 ${
              snackbar.severity === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {snackbar.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
