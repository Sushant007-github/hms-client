import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Modal, Badge, EmptyState, SearchInput, Alert } from '../../components/ui';

const ROLES = ['Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Admin', 'Security', 'Cleaner'];
const DEPARTMENTS = ['Cardiology', 'Orthopedics', 'Pediatrics', 'Emergency', 'ICU', 'General Medicine', 'Surgery', 'Gynecology', 'Neurology', 'Pathology', 'Radiology', 'Pharmacy', 'Front Desk', 'Administration', 'Security'];

const roleColors = {
  Doctor: 'blue', Nurse: 'teal', Receptionist: 'green', Pharmacist: 'purple',
  'Lab Technician': 'orange', Admin: 'red', Security: 'gray', Cleaner: 'yellow',
};

const defaultForm = { name: '', email: '', phone: '', role: 'Doctor', department: '', qualification: '', experience: '', salary: '', address: '' };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => { fetchStaff(); }, [search, roleFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/staff?${params}`);
      setStaff(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/staff/${editId}`, form);
        setAlert({ type: 'success', message: 'Staff updated!' });
      } else {
        await api.post('/staff', form);
        setAlert({ type: 'success', message: 'Staff added successfully!' });
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
      fetchStaff();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save staff' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (s) => { setForm(s); setEditId(s._id); setShowForm(true); };
  const openAdd = () => { setForm(defaultForm); setEditId(null); setShowForm(true); };

  const roleStats = ROLES.reduce((acc, role) => {
    acc[role] = staff.filter(s => s.role === role).length;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">{staff.length} active staff members</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {['Doctor', 'Nurse', 'Receptionist', 'Pharmacist'].map(role => (
          <div key={role} className="card py-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-${roleColors[role]}-50`}>
              {role === 'Doctor' ? '👨‍⚕️' : role === 'Nurse' ? '👩‍⚕️' : role === 'Receptionist' ? '💁' : '💊'}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{roleStats[role] || 0}</p>
              <p className="text-xs text-gray-500">{role}s</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={v => setSearch(v)} placeholder="Search by name or email..." />
          <select className="form-select w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          {(search || roleFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter(''); }} className="btn-secondary text-sm py-2">Clear</button>
          )}
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="card">
          <EmptyState icon="👥" title="No staff found" description="Add staff members to get started" action={<button onClick={openAdd} className="btn-primary">Add Staff</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s._id} className="card hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {s.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate">{s.name}</h3>
                      <Badge variant={roleColors[s.role] || 'gray'} size="sm">{s.role}</Badge>
                    </div>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {s.department}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {s.phone}
                </div>
                <div className="flex items-center gap-2 text-gray-600 truncate">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="truncate">{s.email}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {s.experience}y exp • {s.qualification || 'N/A'}
                </div>
                {s.salary > 0 && (
                  <div className="text-sm font-bold text-green-600">
                    ₹{(s.salary / 1000).toFixed(0)}K/mo
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'Edit Staff Member' : 'Add New Staff'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="work@hospital.com" required />
          </div>
          <div>
            <label className="form-label">Phone *</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" required />
          </div>
          <div>
            <label className="form-label">Role *</label>
            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Department *</label>
            <select className="form-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Qualification</label>
            <input className="form-input" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="MBBS, MD, etc." />
          </div>
          <div>
            <label className="form-label">Experience (years)</label>
            <input type="number" className="form-input" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="0" min="0" />
          </div>
          <div>
            <label className="form-label">Monthly Salary (₹)</label>
            <input type="number" className="form-input" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="0" min="0" />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Residential address" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editId ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
