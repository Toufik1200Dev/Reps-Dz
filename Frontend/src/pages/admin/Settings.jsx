import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Security, Add, Delete, Save, Info } from '@mui/icons-material';
import { adminAPI } from '../../services/api';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ips, setIps] = useState([]);
  const [currentClientIp, setCurrentClientIp] = useState('');
  const [newIp, setNewIp] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getIpWhitelist();
      const data = res.data?.data || res.data;
      setIps(Array.isArray(data?.ips) ? data.ips : []);
      setCurrentClientIp(data?.currentClientIp || '');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load IP whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIp = () => {
    const trimmed = (newIp || '').trim();
    if (!trimmed) return;
    if (ips.includes(trimmed)) {
      setMessage({ type: 'warning', text: 'This IP is already in the whitelist.' });
      return;
    }
    setIps([...ips, trimmed]);
    setNewIp('');
    setMessage(null);
  };

  const handleAddCurrentIp = () => {
    if (!currentClientIp) {
      setMessage({ type: 'warning', text: 'Could not detect your IP.' });
      return;
    }
    if (ips.includes(currentClientIp)) {
      setMessage({ type: 'warning', text: 'Your current IP is already in the whitelist.' });
      return;
    }
    setIps([...ips, currentClientIp]);
    setMessage(null);
  };

  const handleRemoveIp = (ip) => {
    setIps(ips.filter((i) => i !== ip));
    setMessage(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await adminAPI.updateIpWhitelist(ips);
      setMessage({ type: 'success', text: 'IP whitelist saved.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (msg) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    const isWarning = msg.type === 'warning';
    return (
      <div
        className={`p-3 rounded-lg text-sm ${
          isSuccess ? 'bg-green-50 text-green-800' : isWarning ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
        }`}
      >
        {msg.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="text-amber-600" sx={{ fontSize: 32 }} />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* IP Whitelist */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <Security className="text-amber-600" />
          <h2 className="text-lg font-bold text-gray-800">IP Whitelist</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Restrict admin access to specific IP addresses. When the list is empty, all IPs can access the admin panel.
            When you add IPs and save, only those IPs will be able to reach the admin routes.
          </p>

          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Info className="text-amber-600 flex-shrink-0" fontSize="small" />
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> Make sure to add your current IP before saving, or you may lock yourself out.
              Your current IP is shown below.
            </p>
          </div>

          {currentClientIp && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Your current IP:</span>
              <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{currentClientIp}</code>
              <button
                type="button"
                onClick={handleAddCurrentIp}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
              >
                <Add fontSize="small" /> Add my IP
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddIp()}
              placeholder="e.g. 192.168.1.1"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              type="button"
              onClick={handleAddIp}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
            >
              <Add fontSize="small" /> Add IP
            </button>
          </div>

          {ips.length > 0 ? (
            <ul className="space-y-2">
              {ips.map((ip) => (
                <li
                  key={ip}
                  className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <code className="font-mono text-sm">{ip}</code>
                  <button
                    type="button"
                    onClick={() => handleRemoveIp(ip)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                  >
                    <Delete fontSize="small" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No IPs in whitelist. Add some above or leave empty to allow all.</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-60"
          >
            <Save fontSize="small" />
            {saving ? 'Saving...' : 'Save IP Whitelist'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>
      )}
      {message && showMessage(message)}
    </div>
  );
}
