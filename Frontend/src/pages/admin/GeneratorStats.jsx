import React, { useState, useEffect, useCallback } from 'react';
import {
  FitnessCenter,
  TrendingUp,
  BarChart,
  People,
  CalendarToday,
  AccessTime,
  CalendarViewMonth,
  Refresh
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

export default function GeneratorStats() {
  const [stats, setStats] = useState({
    totalGenerations: 0,
    totalUsers: 0,
    beginnerCount: 0,
    intermediateCount: 0,
    advancedCount: 0,
    averagePerDay: 0,
    peakHour: 'N/A',
    mostPopularExercise: 'N/A',
    sixWeekTotal: 0,
  });
  const [submissions, setSubmissions] = useState([]);
  const [sixWeekRequests, setSixWeekRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGeneratorStats({ range: timeRange });
      const payload = response.data?.data;
      if (response.data && response.data.success && payload) {
        setStats(payload.stats || { totalGenerations: 0, totalUsers: 0, beginnerCount: 0, intermediateCount: 0, advancedCount: 0, averagePerDay: 0, peakHour: 'N/A', mostPopularExercise: 'N/A', sixWeekTotal: 0 });
        setSubmissions(payload.submissions || []);
        setSixWeekRequests(payload.stats?.sixWeekRequests || []);
      }
    } catch (error) {
      console.error('Error fetching generator stats:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const onFocus = () => fetchStats();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchStats]);

  const statCards = [
    {
      title: '1-Week (Free)',
      value: stats.totalGenerations.toLocaleString(),
      icon: <FitnessCenter className="text-blue-600" />,
      colorClass: 'bg-blue-50',
      change: ''
    },
    {
      title: '6-Week (Paid)',
      value: (stats.sixWeekTotal ?? 0).toLocaleString(),
      icon: <CalendarViewMonth className="text-rose-600" />,
      colorClass: 'bg-rose-50',
      change: ''
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: <People className="text-purple-600" />,
      colorClass: 'bg-purple-50',
      change: ''
    },
    {
      title: 'Average Per Day',
      value: stats.averagePerDay.toLocaleString(),
      icon: <TrendingUp className="text-green-600" />,
      colorClass: 'bg-green-50',
      change: ''
    },
    {
      title: 'Peak Hour',
      value: stats.peakHour,
      icon: <AccessTime className="text-orange-600" />,
      colorClass: 'bg-orange-50',
      change: ''
    }
  ];

  const totalGen = stats.totalGenerations || 1;
  const levelDistribution = [
    { level: 'Beginner', count: stats.beginnerCount, percentage: ((stats.beginnerCount / totalGen) * 100).toFixed(1), color: 'bg-blue-500' },
    { level: 'Intermediate', count: stats.intermediateCount, percentage: ((stats.intermediateCount / totalGen) * 100).toFixed(1), color: 'bg-green-500' },
    { level: 'Advanced', count: stats.advancedCount, percentage: ((stats.advancedCount / totalGen) * 100).toFixed(1), color: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Program Generator Stats</h1>
          <p className="text-gray-600">Track usage and performance of the exercise program generator</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '7d' 
                ? 'bg-black text-secondary' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '30d' 
                ? 'bg-black text-secondary' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'all' 
                ? 'bg-black text-secondary' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => fetchStats()}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-60 transition-colors inline-flex items-center gap-2"
          >
            <Refresh sx={{ fontSize: 18 }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.colorClass}`}>
                {stat.icon}
              </div>
              {stat.change && (
                <span className="text-sm font-bold text-green-600">{stat.change}</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Level Distribution</h2>
          <div className="space-y-6">
            {levelDistribution.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-gray-700">{item.level}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Exercises & Peak Times */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart className="text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Most Popular Exercise</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-gray-900">{stats.mostPopularExercise}</span>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FitnessCenter className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarToday className="text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Peak Usage Time</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-gray-900">{stats.peakHour}</span>
              <div className="p-3 bg-blue-100 rounded-full">
                <AccessTime className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Week Plan Requests (paid - sent via email) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CalendarViewMonth className="text-rose-600" />
          6-Week Plan Requests ({sixWeekRequests.length})
        </h2>
        <p className="text-sm text-gray-500 mb-4">Paid 6-week programs sent to user email</p>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 font-bold text-gray-600">Email</th>
                <th className="p-3 font-bold text-gray-600">Name</th>
                <th className="p-3 font-bold text-gray-600">Level</th>
                <th className="p-3 font-bold text-gray-600">Max Reps</th>
                <th className="p-3 font-bold text-gray-600">H/W</th>
                <th className="p-3 font-bold text-gray-600">Payment</th>
                <th className="p-3 font-bold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sixWeekRequests.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">No 6-week plan requests yet</td>
                </tr>
              )}
              {sixWeekRequests.map((row) => {
                const mr = row.maxReps || {};
                const repsStr = [mr.pullUps, mr.dips, mr.pushUps].map((n) => n ?? '–').join('/');
                const hw = [row.heightCm && `${row.heightCm}cm`, row.weightKg && `${row.weightKg}kg`].filter(Boolean).join(' ') || '–';
                const amt = row.amountPaid != null ? `$${(row.amountPaid / 100).toFixed(2)}` : '—';
                return (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.email || '—'}</td>
                    <td className="p-3">{row.userName || '—'}</td>
                    <td className="p-3 capitalize">{row.level || '—'}</td>
                    <td className="p-3 text-xs">{repsStr}</td>
                    <td className="p-3 text-xs">{hw}</td>
                    <td className="p-3 text-green-600 font-medium">{amt}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* All program generations – 1-week free (user name and data) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-6">1-Week Program Generations (Free)</h2>
        <p className="text-sm text-gray-500 mb-4">Client name and data from the program generator form.</p>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Client</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Level</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Pull / Dips / Push / Squats / Legs</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Muscle-ups</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Height / Weight</th>
                <th className="p-3 font-bold text-gray-600 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">No program saves yet</td>
                </tr>
              )}
              {submissions.map((row) => {
                const mr = row.maxReps || {};
                const repsStr = [mr.pullUps, mr.dips, mr.pushUps, mr.squats, mr.legRaises, mr.burpees].map((n) => n ?? '–').join(' / ');
                const displayName = row.userName && String(row.userName).trim() && row.userName !== 'None' ? row.userName : '—';
                const hw = [row.heightCm && `${row.heightCm} cm`, row.weightKg && `${row.weightKg} kg`].filter(Boolean).join(' • ') || '–';
                return (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{displayName}</td>
                    <td className="p-3 text-gray-600 capitalize">{row.level}</td>
                    <td className="p-3 text-gray-600 text-xs sm:text-sm">{repsStr}</td>
                    <td className="p-3 text-gray-600">{mr.muscleUp != null ? mr.muscleUp : '–'}</td>
                    <td className="p-3 text-gray-600 text-xs sm:text-sm">{hw}</td>
                    <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
