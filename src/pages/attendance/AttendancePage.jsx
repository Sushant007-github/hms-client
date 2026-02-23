import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Badge, Alert } from '../../components/ui';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Half Day', 'Leave'];
const statusColors = { Present: 'green', Absent: 'red', Late: 'yellow', 'Half Day': 'orange', Leave: 'blue' };

export default function AttendancePage() {
  const [view, setView] = useState('daily'); // 'daily' | 'monthly'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [localAttendance, setLocalAttendance] = useState({});

  useEffect(() => {
    if (view === 'daily') fetchDaily();
    else fetchSummary();
  }, [view, date, month]);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance?date=${date}`);
      setRecords(data);
      const initial = {};
      data.forEach(r => {
        initial[r.staff._id] = r.attendance?.status || 'Present';
      });
      setLocalAttendance(initial);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/summary?month=${month}`);
      setSummary(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const bulk = Object.entries(localAttendance).map(([staffId, status]) => ({ staffId, date, status }));
      await api.post('/attendance/bulk', { records: bulk });
      setAlert({ type: 'success', message: `Attendance saved for ${date}!` });
      fetchDaily();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to save attendance' });
    } finally { setSaving(false); }
  };

  const presentCount = Object.values(localAttendance).filter(s => s === 'Present').length;
  const absentCount = Object.values(localAttendance).filter(s => s === 'Absent').length;

  return (
    <div>
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Attendance Module</h1>
          <p className="page-subtitle">Track daily and monthly attendance</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['daily', 'monthly'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {v === 'daily' ? '📅 Daily' : '📊 Monthly Report'}
            </button>
          ))}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {view === 'daily' ? (
        <>
          {/* Controls */}
          <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="form-label">Select Date</label>
                <input type="date" className="form-input w-auto" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="text-gray-600 font-medium">{presentCount} Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-400 rounded-full" />
                  <span className="text-gray-600 font-medium">{absentCount} Absent</span>
                </div>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || records.length === 0} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          {/* Attendance Progress */}
          {records.length > 0 && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Attendance Progress</span>
                <span className="text-sm font-bold text-green-600">{records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${records.length > 0 ? (presentCount / records.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{presentCount} / {records.length} staff</span>
                <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          )}

          {/* Daily Table */}
          <div className="card">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No staff records found</div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Staff Member', 'Role', 'Department', 'Status', 'Previous Status'].map(h => (
                        <th key={h} className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map(({ staff: s, attendance }) => (
                      <tr key={s._id} className="table-row-hover">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {s.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                              <p className="text-xs text-gray-400">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-sm text-gray-600">{s.role}</td>
                        <td className="py-3.5 pr-4 text-sm text-gray-600">{s.department}</td>
                        <td className="py-3.5 pr-4">
                          <div className="flex gap-1 flex-wrap">
                            {STATUS_OPTIONS.map(status => (
                              <button
                                key={status}
                                onClick={() => setLocalAttendance(prev => ({ ...prev, [s._id]: status }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  localAttendance[s._id] === status
                                    ? status === 'Present' ? 'bg-green-500 text-white'
                                    : status === 'Absent' ? 'bg-red-500 text-white'
                                    : status === 'Late' ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          {attendance ? (
                            <Badge variant={statusColors[attendance.status]}>{attendance.status}</Badge>
                          ) : (
                            <span className="text-xs text-gray-400">Not marked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Monthly View */}
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="form-label">Select Month</label>
                <input type="month" className="form-input w-auto" value={month} onChange={e => setMonth(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : summary.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No attendance data for this month</div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Staff Member', 'Role', 'Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Attendance %'].map(h => (
                        <th key={h} className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {summary.map(({ staff: s, Present = 0, Absent = 0, Late = 0, 'Half Day': HalfDay = 0, Leave = 0 }) => {
                      const total = Present + Absent + Late + HalfDay + Leave;
                      const pct = total > 0 ? Math.round((Present / total) * 100) : 0;
                      return (
                        <tr key={s._id} className="table-row-hover">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                {s.name?.charAt(0)}
                              </div>
                              <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 text-sm text-gray-600">{s.role}</td>
                          <td className="py-3.5 pr-4"><span className="font-bold text-green-600">{Present}</span></td>
                          <td className="py-3.5 pr-4"><span className="font-bold text-red-600">{Absent}</span></td>
                          <td className="py-3.5 pr-4"><span className="font-bold text-yellow-600">{Late}</span></td>
                          <td className="py-3.5 pr-4"><span className="font-bold text-orange-600">{HalfDay}</span></td>
                          <td className="py-3.5 pr-4"><span className="font-bold text-blue-600">{Leave}</span></td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-12">
                                <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
