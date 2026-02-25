import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculate,
  TrendingUp,
  BarChart,
  People,
  AccessTime,
  Restaurant,
  Refresh
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

export default function CalorieStats() {
  const [stats, setStats] = useState({
    totalCalculations: 0,
    totalUsers: 0,
    averageCalories: 0,
    averagePerDay: 0,
    peakHour: 'N/A',
    mostCommonGoal: 'Weight Loss',
    averageBMR: 0
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCalorieStats({ range: timeRange });
      const payload = response.data?.data;
      if (response.data && response.data.success && payload) {
        setStats(payload.stats || { totalCalculations: 0, totalUsers: 0, averageCalories: 0, averagePerDay: 0, peakHour: 'N/A', mostCommonGoal: 'N/A', averageBMR: 0 });
        setSubmissions(payload.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching calorie stats:', error);
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
      title: 'Total Calculations',
      value: stats.totalCalculations.toLocaleString(),
      icon: <Calculate className="text-blue-600" />,
      colorClass: 'bg-blue-50',
      change: '+18%'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: <People className="text-purple-600" />,
      colorClass: 'bg-purple-50',
      change: '+14%'
    },
    {
      title: 'Average Calories',
      value: `${stats.averageCalories.toLocaleString()} kcal`,
      icon: <Restaurant className="text-green-600" />,
      colorClass: 'bg-green-50',
      change: ''
    },
    {
      title: 'Average Per Day',
      value: stats.averagePerDay.toLocaleString(),
      icon: <TrendingUp className="text-orange-600" />,
      colorClass: 'bg-orange-50',
      change: '+22%'
    }
  ];

  const goalDistribution = [
    { goal: 'Weight Loss', count: 1456, percentage: 42.5, color: 'bg-red-500' },
    { goal: 'Weight Maintenance', count: 1024, percentage: 30.0, color: 'bg-blue-500' },
    { goal: 'Weight Gain', count: 941, percentage: 27.5, color: 'bg-green-500' }
  ];

  const activityLevelDistribution = [
    { level: 'Sedentary', count: 856, percentage: 25.0, color: 'bg-gray-400' },
    { level: 'Lightly Active', count: 1024, percentage: 30.0, color: 'bg-blue-400' },
    { level: 'Moderately Active', count: 1024, percentage: 30.0, color: 'bg-green-400' },
    { level: 'Very Active', count: 342, percentage: 10.0, color: 'bg-orange-400' },
    { level: 'Extra Active', count: 175, percentage: 5.0, color: 'bg-red-400' }
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Calorie Calculator Stats</h1>
          <p className="text-gray-600">Track usage and insights from the calorie calculator</p>
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
        {/* Goal Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Goal Distribution</h2>
          <div className="space-y-6">
            {goalDistribution.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-gray-700">{item.goal}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()}</span>
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

        {/* Activity Level Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Activity Level Distribution</h2>
          <div className="space-y-4">
            {activityLevelDistribution.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-gray-700">{item.level}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Goal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Most Common Goal</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-gray-900">{stats.mostCommonGoal}</span>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingUp className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Peak Usage Time */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AccessTime className="text-gray-600" />
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

      {/* All user data – inputs and results */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-gray-900 mb-6">All User Data (inputs & results)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 font-bold text-gray-600">Name</th>
                <th className="p-3 font-bold text-gray-600">Gender</th>
                <th className="p-3 font-bold text-gray-600">Height</th>
                <th className="p-3 font-bold text-gray-600">Weight</th>
                <th className="p-3 font-bold text-gray-600">Age</th>
                <th className="p-3 font-bold text-gray-600">Activity</th>
                <th className="p-3 font-bold text-gray-600">BMR</th>
                <th className="p-3 font-bold text-gray-600">Calories</th>
                <th className="p-3 font-bold text-gray-600">P / C / F</th>
                <th className="p-3 font-bold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-gray-500">No submissions yet</td>
                </tr>
              )}
              {submissions.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{row.userName || 'None'}</td>
                  <td className="p-3 text-gray-600">{row.gender}</td>
                  <td className="p-3 text-gray-600">{row.height} cm</td>
                  <td className="p-3 text-gray-600">{row.weight} kg</td>
                  <td className="p-3 text-gray-600">{row.age ?? '–'}</td>
                  <td className="p-3 text-gray-600">{row.activityLevel || '–'}</td>
                  <td className="p-3 text-gray-600">{row.bmr}</td>
                  <td className="p-3 text-gray-600">{row.calories}</td>
                  <td className="p-3 text-gray-600">{row.protein}/{row.carbs}/{row.fat}</td>
                  <td className="p-3 text-gray-500 text-xs">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
