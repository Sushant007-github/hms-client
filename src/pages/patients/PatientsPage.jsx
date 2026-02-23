import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Modal, Badge, LoadingPage, EmptyState, SearchInput, Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const WARDS = ['OPD Floor', 'ICU Floor', 'General Ward', 'Private Ward', 'Emergency'];
const GENDERS = ['Male', 'Female', 'Other'];

const defaultForm = {
  name: '', age: '', gender: 'Male', contact: '', email: '', address: '',
  bloodGroup: '', type: 'OPD', ward: 'OPD Floor', diagnosis: '', status: 'Active',
};

const statusColors = { Active: 'green', Discharged: 'gray', Critical: 'red' };
const typeColors = { OPD: 'blue', IPD: 'purple' };

export default function PatientsPage() {
  const { hasRole } = useAuth();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (wardFilter) params.set('ward', wardFilter);
      if (typeFilter) params.set('type', typeFilter);
      const { data } = await api.get(`/patients?${params}`);
      setPatients(data.patients);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, wardFilter, typeFilter]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/patients/${editId}`, form);
        setAlert({ type: 'success', message: 'Patient updated successfully!' });
      } else {
        await api.post('/patients', form);
        setAlert({ type: 'success', message: 'Patient registered successfully!' });
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
      fetchPatients();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save patient' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (patient) => {
    setForm({ ...patient });
    setEditId(patient._id);
    setShowForm(true);
  };

  const openAdd = () => {
    setForm(defaultForm);
    setEditId(null);
    setShowForm(true);
  };

  const canManage = hasRole('Admin', 'Receptionist');

  return (
    <div>
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Patient Management</h1>
          <p className="page-subtitle">{total} total patients registered</p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Patient
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or phone..." />
          <select className="form-select w-auto" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="OPD">OPD</option>
            <option value="IPD">IPD</option>
          </select>
          <select className="form-select w-auto" value={wardFilter} onChange={e => { setWardFilter(e.target.value); setPage(1); }}>
            <option value="">All Wards</option>
            {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          {(search || typeFilter || wardFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); setWardFilter(''); setPage(1); }} className="btn-secondary text-sm py-2">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <EmptyState icon="👤" title="No patients found" description="Register a new patient to get started" action={canManage && <button onClick={openAdd} className="btn-primary">Register Patient</button>} />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Patient', 'Age/Gender', 'Contact', 'Type', 'Ward', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map(p => (
                  <tr key={p._id} className="table-row-hover">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {p.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.diagnosis || 'No diagnosis'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-gray-600">{p.age}y • {p.gender}</td>
                    <td className="py-3.5 pr-4 text-sm text-gray-600">{p.contact}</td>
                    <td className="py-3.5 pr-4"><Badge variant={typeColors[p.type]}>{p.type}</Badge></td>
                    <td className="py-3.5 pr-4 text-sm text-gray-600 whitespace-nowrap">{p.ward}</td>
                    <td className="py-3.5 pr-4"><Badge variant={statusColors[p.status]}>{p.status}</Badge></td>
                    <td className="py-3.5 pr-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {canManage && (
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total > 15 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-4 disabled:opacity-40">← Prev</button>
                  <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-4 disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Patient' : 'Register New Patient'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Patient full name" required />
          </div>
          <div>
            <label className="form-label">Age *</label>
            <input type="number" className="form-input" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Age in years" min="0" max="150" required />
          </div>
          <div>
            <label className="form-label">Gender *</label>
            <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Contact Number *</label>
            <input className="form-input" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="10-digit mobile" required />
          </div>
          <div>
            <label className="form-label">Blood Group</label>
            <select className="form-select" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
              <option value="">Select Blood Group</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Patient Type *</label>
            <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, ward: e.target.value === 'OPD' ? 'OPD Floor' : 'General Ward' })}>
              <option value="OPD">OPD (Outpatient)</option>
              <option value="IPD">IPD (Inpatient)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Ward *</label>
            <select className="form-select" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })}>
              {WARDS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Diagnosis</label>
            <input className="form-input" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Primary diagnosis or chief complaint" />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Patient address" />
          </div>
          {editId && (
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Active', 'Discharged', 'Critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editId ? 'Update Patient' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Patient Details" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {showDetail.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{showDetail.name}</h3>
                <p className="text-gray-500">{showDetail.age} years • {showDetail.gender}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={typeColors[showDetail.type]}>{showDetail.type}</Badge>
                  <Badge variant={statusColors[showDetail.status]}>{showDetail.status}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Contact', value: showDetail.contact },
                { label: 'Blood Group', value: showDetail.bloodGroup || 'N/A' },
                { label: 'Ward', value: showDetail.ward },
                { label: 'Diagnosis', value: showDetail.diagnosis || 'N/A' },
                { label: 'Admission Date', value: new Date(showDetail.admissionDate).toLocaleDateString() },
                { label: 'Address', value: showDetail.address || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDetail(null)} className="btn-secondary">Close</button>
              {canManage && <button onClick={() => { openEdit(showDetail); setShowDetail(null); }} className="btn-primary">Edit Patient</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
