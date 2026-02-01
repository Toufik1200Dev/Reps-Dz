import React, { useState, useEffect } from 'react';
import {
  FitnessCenter,
  Download,
  Visibility,
  Close,
  CheckCircle
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { downloadProgramPdf } from '../../utils/programPdf';

export default function SavedPrograms() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewRow, setViewRow] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGeneratorStats({ range: 'all' });
      const payload = response.data?.data;
      if (response.data?.success && payload) {
        setSubmissions(payload.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching saved programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (row) => {
    const program = row.program;
    if (!program || !Array.isArray(program) || program.length === 0) return;
    downloadProgramPdf({
      program,
      level: row.level,
      userName: row.userName,
      createdAt: row.createdAt
    });
  };

  const getWeekDays = (row) => {
    const program = row?.program;
    if (!Array.isArray(program) || program.length === 0) return [];
    const week = program[0];
    return week?.days || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Saved Weekly Programs</h1>
        <p className="text-gray-600">View and download all weekly calisthenics programs saved by users.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 font-bold text-gray-600">Name</th>
                <th className="p-3 font-bold text-gray-600">Level</th>
                <th className="p-3 font-bold text-gray-600">Max reps</th>
                <th className="p-3 font-bold text-gray-600">Saved date</th>
                <th className="p-3 font-bold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No saved weekly programs yet.
                  </td>
                </tr>
              )}
              {submissions.map((row) => {
                const mr = row.maxReps || {};
                const repsStr = [mr.pullUps, mr.dips, mr.pushUps, mr.squats, mr.legRaises]
                  .map((n) => n ?? '–')
                  .join(' / ');
                return (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{row.userName || 'None'}</td>
                    <td className="p-3 text-gray-600 capitalize">{row.level}</td>
                    <td className="p-3 text-gray-600">{repsStr}</td>
                    <td className="p-3 text-gray-500 text-xs">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '–'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewRow(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
                        >
                          <Visibility sx={{ fontSize: 18 }} />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-medium text-sm transition-colors"
                        >
                          <Download sx={{ fontSize: 18 }} />
                          Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View modal */}
      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Weekly program – {viewRow.userName || 'User'} ({viewRow.level})
              </h2>
              <button
                onClick={() => setViewRow(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <Close />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {getWeekDays(viewRow).length === 0 ? (
                <p className="text-gray-500">No days in this program.</p>
              ) : (
                <div className="space-y-6">
                  {getWeekDays(viewRow).map((day) => (
                    <div key={day.day} className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        Day {day.day}: {day.focus || 'Workout'}
                      </h3>
                      <div className="space-y-3">
                        {(day.exercises || []).map((ex, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle sx={{ color: '#F59E0B', fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                              <div>
                                <p className="font-bold text-gray-900">{ex.name}</p>
                                {ex.sets && (
                                  <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">{ex.sets}</p>
                                )}
                                {ex.rest && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    <span className="font-semibold">Rest between sets:</span> {ex.rest}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => handleDownload(viewRow)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
              >
                <Download /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
