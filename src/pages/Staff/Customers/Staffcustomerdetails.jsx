import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft, User, Calendar, Hash, Wifi, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { getAssignedCustomerById } from '../../../api/staff/assigdcustomer.api';

// ── Small reusable components ────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, isDark }) => (
  <div className="flex items-start gap-3">
    <div className={`mt-0.5 p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
      <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
    </div>
    <div className="min-w-0">
      <p className={`text-xs font-medium mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm break-words ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{value || 'N/A'}</p>
    </div>
  </div>
);

const SectionCard = ({ title, children, isDark }) => (
  <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
    <h3 className={`text-base font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
    {children}
  </div>
);

// ── Mock data (replace with real API calls when ready) ───────────
const mockPayments = [
  { id: 1, date: '2025-11-18', description: 'Plan Renewal – Home 200', amount: '₹999.00', status: 'Paid' },
  { id: 2, date: '2025-10-18', description: 'Plan Renewal – Home 200', amount: '₹999.00', status: 'Paid' },
];

const mockTickets = [
  { id: '#7890', date: '3h ago', subject: 'Internet connection dropping', status: 'In Progress' },
];

const statusColor = {
  Paid: 'bg-green-500/10 text-green-500',
  'In Progress': 'bg-amber-500/10 text-amber-500',
  Closed: 'bg-gray-500/10 text-gray-500',
};

// ── Main Component ───────────────────────────────────────────────
const StaffCustomerDetails = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAssignedCustomerById(id);
      // Support both res.data.data and res.data directly
      setCustomer(res.data?.data ?? res.data);
    } catch (err) {
      console.error('Failed to fetch customer:', err);
      setError('Could not load customer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4" />
          <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Loading customer details...</p>
        </div>
      </div>
    );
  }

  // ── Error / not-found state ─────────────────────────────────────
  if (error || !customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/customers')}
          className={`group flex items-center text-sm font-medium transition-colors ${
            isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Customers
        </button>
        <div
          className={`rounded-xl shadow-sm border p-8 text-center ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}
        >
          <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {error || 'Customer not found'}
          </p>
          <button
            onClick={fetchCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────
  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed';
  const statusUp = (customer.status || 'ACTIVE').toUpperCase();
  const isActive = statusUp === 'ACTIVE';

  const installationAddr = customer.installationAddress
    ? [
        customer.installationAddress.line2,
        customer.installationAddress.city,
        customer.installationAddress.state,
        customer.installationAddress.country,
      ]
        .filter(Boolean)
        .join(', ') +
      (customer.installationAddress.pin ? ` – ${customer.installationAddress.pin}` : '')
    : null;

  // ── Main render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/customers')}
          className={`w-fit group flex items-center text-sm font-medium transition-colors ${
            isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Customers
        </button>

        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                isDark
                  ? 'bg-violet-600/20 text-violet-400 ring-2 ring-violet-600/30'
                  : 'bg-violet-100 text-violet-600 ring-2 ring-violet-200'
              }`}
            >
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fullName}</h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                @{customer.userName || 'N/A'}
              </p>
            </div>
          </div>

          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}
          >
            {statusUp}
          </span>
        </div>
      </div>

      {/* ── Grid layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="space-y-6 lg:col-span-1">

          {/* Contact Information */}
          <SectionCard title="Contact Information" isDark={isDark}>
            <div className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={customer.emailId} isDark={isDark} />
              <InfoRow icon={Phone} label="Phone" value={customer.phoneNumber} isDark={isDark} />
              {installationAddr && (
                <InfoRow icon={MapPin} label="Installation Address" value={installationAddr} isDark={isDark} />
              )}
            </div>
          </SectionCard>

          {/* Account Details */}
          <SectionCard title="Account Details" isDark={isDark}>
            <div className="space-y-4">
              <InfoRow icon={Hash} label="Account ID" value={customer.accountId} isDark={isDark} />
              <InfoRow icon={User} label="User Group" value={customer.userGroupId} isDark={isDark} />
              <InfoRow icon={Wifi} label="User Type" value={customer.userType} isDark={isDark} />
              {customer.cafNum && (
                <InfoRow icon={Hash} label="CAF Number" value={customer.cafNum} isDark={isDark} />
              )}
              {customer.activationDate && (
                <InfoRow icon={Calendar} label="Activation" value={customer.activationDate} isDark={isDark} />
              )}
            </div>
          </SectionCard>

          {/* Current Plan */}
          <SectionCard title="Current Plan" isDark={isDark}>
            <div className="mb-5">
              <p className={`text-lg font-bold mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                {customer.userType || 'Standard Plan'}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Username: {customer.userName || 'N/A'}
              </p>
            </div>
            <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20 text-sm">
              Change Plan
            </button>
          </SectionCard>

          {/* Admin Notes */}
          <SectionCard title="Admin Notes" isDark={isDark}>
            <div className="relative mb-4">
              <textarea
                className={`w-full h-32 p-4 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-slate-300 placeholder-slate-500'
                    : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400'
                }`}
                placeholder="Add notes for this customer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <button
              onClick={async () => {
                setSavingNote(true);
                // TODO: wire to a real save-note API endpoint
                await new Promise((r) => setTimeout(r, 600));
                setSavingNote(false);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-violet-500/20"
            >
              {savingNote ? <RefreshCw size={14} className="animate-spin" /> : null}
              {savingNote ? 'Saving...' : 'Save Note'}
            </button>
          </SectionCard>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Payment History */}
          <SectionCard title="Payment History" isDark={isDark}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr
                    className={`border-b uppercase text-xs ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    <th className="py-3 font-semibold tracking-wider">Date</th>
                    <th className="py-3 font-semibold tracking-wider">Description</th>
                    <th className="py-3 font-semibold tracking-wider">Amount</th>
                    <th className="py-3 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
                  {mockPayments.length > 0 ? (
                    mockPayments.map((p) => (
                      <tr key={p.id}>
                        <td className={`py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{p.date}</td>
                        <td className={`py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {p.description}
                        </td>
                        <td className={`py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{p.amount}</td>
                        <td className="py-4 text-right">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor[p.status] || 'bg-gray-500/10 text-gray-400'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={`py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        No payment history
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Support Tickets */}
          <SectionCard title="Support Tickets" isDark={isDark}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr
                    className={`border-b uppercase text-xs ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    <th className="py-3 font-semibold tracking-wider">Date</th>
                    <th className="py-3 font-semibold tracking-wider">Subject</th>
                    <th className="py-3 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
                  {mockTickets.length > 0 ? (
                    mockTickets.map((t) => (
                      <tr key={t.id}>
                        <td className={`py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.date}</td>
                        <td className={`py-4 font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                          {t.id} – {t.subject}
                        </td>
                        <td className="py-4 text-right">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor[t.status] || 'bg-gray-500/10 text-gray-400'}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className={`py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        No tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
};

export default StaffCustomerDetails;
