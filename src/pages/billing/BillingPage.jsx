import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Modal, Badge, EmptyState, SearchInput, Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const SERVICE_TEMPLATES = [
  'Consultation Fee', 'Ward Charges', 'ICU Charges', 'Nursing Care',
  'Blood Test (CBC)', 'Urine Test', 'X-Ray', 'ECG', 'Ultrasound', 'MRI Scan',
  'CT Scan', 'Surgery', 'Anesthesia', 'Medicine', 'IV Fluid', 'Oxygen',
  'Physiotherapy', 'Ambulance', 'Vaccination', 'Dressing',
];

export default function BillingPage() {
  const { hasRole } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(null);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const invoiceRef = useRef();

  const [form, setForm] = useState({
    patientId: '',
    items: [{ serviceName: '', quantity: 1, unitPrice: '', total: 0 }],
    discount: 0, tax: 0, paymentStatus: 'Pending', paymentMethod: 'Cash', notes: '',
  });

  useEffect(() => {
    fetchBills();
    api.get('/patients?limit=100').then(r => setPatients(r.data.patients || []));
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bills');
      setBills(data.bills);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      items[i].total = (Number(items[i].quantity) || 0) * (Number(items[i].unitPrice) || 0);
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { serviceName: '', quantity: 1, unitPrice: '', total: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const subtotal = form.items.reduce((s, it) => s + it.total, 0);
  const discountAmt = Number(form.discount) || 0;
  const taxAmt = (subtotal * (Number(form.tax) || 0)) / 100;
  const grandTotal = subtotal - discountAmt + taxAmt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return setAlert({ type: 'error', message: 'Please select a patient' });
    const filledItems = form.items.filter(i => i.serviceName && i.unitPrice);
    if (filledItems.length === 0) return setAlert({ type: 'error', message: 'Add at least one service' });

    setSubmitting(true);
    try {
      await api.post('/bills', { ...form, items: filledItems });
      setAlert({ type: 'success', message: 'Bill created successfully!' });
      setShowForm(false);
      setForm({ patientId: '', items: [{ serviceName: '', quantity: 1, unitPrice: '', total: 0 }], discount: 0, tax: 0, paymentStatus: 'Pending', paymentMethod: 'Cash', notes: '' });
      fetchBills();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create bill' });
    } finally { setSubmitting(false); }
  };

  const printInvoice = () => {
    window.print();
  };

  const statusColors = { Paid: 'green', Pending: 'yellow', Partial: 'orange' };
  const canCreate = hasRole('Admin', 'Receptionist');

  return (
    <div>
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Billing Module</h1>
          <p className="page-subtitle">{total} total bills generated</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Bill
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState icon="🧾" title="No bills yet" description="Create a bill for a patient" action={canCreate && <button onClick={() => setShowForm(true)} className="btn-primary">Create Bill</button>} />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Bill #', 'Patient', 'Amount', 'Payment Status', 'Method', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bills.map(b => (
                  <tr key={b._id} className="table-row-hover">
                    <td className="py-3.5 pr-4">
                      <span className="font-mono text-sm font-semibold text-blue-600">{b.billNumber}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-gray-900 text-sm">{b.patientId?.name}</p>
                      <p className="text-xs text-gray-400">{b.patientId?.type} • {b.patientId?.ward}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-base font-bold text-gray-900">₹{b.totalAmount?.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={statusColors[b.paymentStatus]}>{b.paymentStatus}</Badge>
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-gray-600">{b.paymentMethod || '—'}</td>
                    <td className="py-3.5 pr-4 text-sm text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5">
                      <button onClick={() => setShowInvoice(b)} className="btn-secondary text-xs py-1.5 px-3">
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create New Bill" size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label">Select Patient *</label>
            <select className="form-select" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required>
              <option value="">Choose patient...</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name} — {p.type} | {p.ward} | {p.contact}</option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">Services & Items *</label>
              <button type="button" onClick={addItem} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Qty</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-32">Unit Price</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 w-32">Total</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">
                        <input
                          list="service-list"
                          className="form-input py-2"
                          value={item.serviceName}
                          onChange={e => updateItem(i, 'serviceName', e.target.value)}
                          placeholder="Service name"
                        />
                        <datalist id="service-list">
                          {SERVICE_TEMPLATES.map(s => <option key={s} value={s} />)}
                        </datalist>
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className="form-input py-2" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className="form-input py-2" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="0" min="0" />
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">₹{item.total.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Discount (₹)</label>
                  <input type="number" className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} min="0" />
                </div>
                <div>
                  <label className="form-label">Tax (%)</label>
                  <input type="number" className="form-input" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} min="0" max="100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Payment Status</label>
                  <select className="form-select" value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option>Pending</option><option>Paid</option><option>Partial</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option>Cash</option><option>Card</option><option>UPI</option><option>Insurance</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 space-y-3 border border-blue-100">
              <p className="font-bold text-gray-900 text-sm mb-1">Bill Summary</p>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-semibold">₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Discount</span><span className="font-semibold text-red-600">−₹{discountAmt.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tax ({form.tax}%)</span><span className="font-semibold">+₹{taxAmt.toFixed(2)}</span></div>
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Generate Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      {showInvoice && (
        <Modal isOpen={!!showInvoice} onClose={() => setShowInvoice(null)} title="Invoice Preview" size="lg">
          <div ref={invoiceRef} className="p-2">
            {/* Invoice Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-blue-600">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">MediCore Hospital</h2>
                    <p className="text-sm text-gray-500">Excellence in Healthcare</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">123 Medical Center, Healthcare District, City - 400001</p>
                <p className="text-xs text-gray-400">Phone: +91 98765 43210 | GST: 27XXXXX1234X1Z5</p>
              </div>
              <div className="text-right">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl inline-block mb-2">
                  <p className="text-xs font-medium">INVOICE</p>
                  <p className="text-lg font-bold">{showInvoice.billNumber}</p>
                </div>
                <p className="text-xs text-gray-500">Date: {new Date(showInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <div className={`mt-1 inline-block px-2 py-1 rounded text-xs font-bold ${showInvoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {showInvoice.paymentStatus}
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium">PATIENT NAME</p>
                <p className="font-bold text-gray-900">{showInvoice.patientId?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">PATIENT TYPE</p>
                <p className="font-semibold text-gray-900">{showInvoice.patientId?.type} — {showInvoice.patientId?.ward}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">CONTACT</p>
                <p className="font-semibold text-gray-900">{showInvoice.patientId?.contact}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="bg-blue-600 text-white rounded-xl overflow-hidden">
                  <th className="text-left px-4 py-3 rounded-tl-xl font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Service Description</th>
                  <th className="text-center px-4 py-3 font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-3 rounded-tr-xl font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {showInvoice.items?.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.serviceName}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹{item.unitPrice?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{item.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">Subtotal</span><span className="font-semibold">₹{showInvoice.subtotal?.toLocaleString()}</span></div>
                {showInvoice.discount > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">Discount</span><span className="font-semibold text-red-600">−₹{showInvoice.discount?.toLocaleString()}</span></div>}
                {showInvoice.tax > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">Tax ({showInvoice.tax}%)</span><span className="font-semibold">₹{((showInvoice.subtotal * showInvoice.tax) / 100).toFixed(2)}</span></div>}
                <div className="flex justify-between py-3 bg-blue-600 text-white rounded-xl px-3 font-bold text-base">
                  <span>Total</span><span>₹{showInvoice.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {showInvoice.notes && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                <span className="font-semibold">Notes: </span>{showInvoice.notes}
              </div>
            )}
            <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
              Thank you for choosing MediCore Hospital. Get well soon! 💙
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 no-print">
            <button onClick={() => setShowInvoice(null)} className="btn-secondary">Close</button>
            <button onClick={printInvoice} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
