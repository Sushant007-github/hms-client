import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { LoadingPage, StatCard } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [billStats, setBillStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pStats, bStats, patients] = await Promise.all([
          api.get('/patients/stats'),
          api.get('/bills/stats'),
          api.get('/patients?limit=6'),
        ]);
        setStats(pStats.data);
        setBillStats(bStats.data);
        setRecentPatients(patients.data.patients || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingPage />;

  const statusColor = (s) => {
    const map = { Active: 'bg-green-100 text-green-700', Discharged: 'bg-gray-100 text-gray-600', Critical: 'bg-red-100 text-red-700' };
    return map[s] || 'bg-gray-100 text-gray-700';
  };
  const typeColor = (t) => t === 'OPD' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-green-700">System Live</span>
          </div>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
            <p className="text-blue-200 text-sm">Here's what's happening at the hospital today.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-blue-200 text-xs">Today's Date</p>
              <p className="text-white font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="w-px h-10 bg-blue-500" />
            <div className="text-right">
              <p className="text-blue-200 text-xs">Active Patients</p>
              <p className="text-white font-bold">{stats?.totalActive || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🏥" label="Patients Today" value={stats?.totalToday || 0} color="blue" change="↑ Updated now" />
        <StatCard icon="🩺" label="OPD Today" value={stats?.opdToday || 0} color="teal" />
        <StatCard icon="🛏️" label="IPD Today" value={stats?.ipdToday || 0} color="purple" />
        <StatCard icon="💰" label="Revenue Today" value={`₹${((billStats?.revenueToday || 0) / 1000).toFixed(1)}K`} color="green" change="Paid bills only" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* OPD vs IPD Bar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base">OPD vs IPD (7 Days)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily patient admissions</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded" /> OPD</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-purple-500 rounded" /> IPD</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.weeklyData || []} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="OPD" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="IPD" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Line Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Revenue Trend (7 Days)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Collected revenue in ₹</p>
            </div>
            <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700">
              ₹{((billStats?.revenueToday || 0) / 1000).toFixed(1)}K Today
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={billStats?.weeklyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Recent Admissions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest registered patients</p>
          </div>
          <a href="/patients" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-4">Patient</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-4">Ward</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-4">Type</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-4">Status</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentPatients.map((p) => (
                <tr key={p._id} className="table-row-hover">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {p.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.age}y • {p.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-gray-600">{p.ward}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`badge ${typeColor(p.type)}`}>{p.type}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="py-3.5 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {recentPatients.length === 0 && (
                <tr><td colSpan="5" className="py-8 text-center text-gray-400 text-sm">No patients yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
