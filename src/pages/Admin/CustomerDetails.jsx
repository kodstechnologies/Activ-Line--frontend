import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEffect } from "react";
import { getSingleCustomer } from "../../api/customer.api";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  // Renamed variable from subscriber to customer as requested
  // const customer = location.state?.customer || location.state?.subscriber; // Fallback for backward compatibility
  const [customer, setCustomer] = useState(null);
  const { id } = useParams();

  const [notes, setNotes] = useState('');       

  // Mock Data for UI demonstration
  const paymentHistory = [
    { id: 1, date: '2025-11-18', description: 'ActivLine Home 200 (Renewal)', amount: '₹999.00', status: 'Paid' },
    { id: 2, date: '2025-10-18', description: 'ActivLine Home 200 (Renewal)', amount: '₹999.00', status: 'Paid' },
  ];
useEffect(() => {
  if (id) fetchCustomer();
}, [id]);

const fetchCustomer = async () => {
  try {
    const res = await getSingleCustomer(id);
    setCustomer(res.data.data);
  } catch (err) {
    console.error(err);
  }
};

  const supportTickets = [
    { id: '#7890', date: '3h ago', subject: 'Internet connection dropping', status: 'In Progress' },
  ];

  const documents = customer?.documents || {};
  const documentEntries = [
    ['ID Proof', documents.idFile],
    ['Address Proof', documents.addressFile],
    ['CAF', documents.cafFile],
    ['Report', documents.reportFile],
    ['Signature', documents.signFile],
    ['Profile Photo', documents.profilePicFile],
  ].filter(([, url]) => Boolean(url));

  if (!customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/customers')}
          className={`group flex items-center text-sm font-medium transition-colors ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
            }`}
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Customers
        </button>
        <div className={`rounded-xl shadow-sm border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <p className={isDark ? 'text-white' : 'text-gray-900'}>Customer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/customers')}
          className={`w-fit group flex items-center text-sm font-medium transition-colors ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
            }`}
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Customers
        </button>

        <div className="flex justify-between items-center">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {customer.firstName} {customer.lastName}
          </h1>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${customer.status?.toUpperCase() === 'ACTIVE'
            ? 'bg-green-500/10 text-green-500'
            : 'bg-red-500/10 text-red-500'
            }`}>
            {customer.status || 'Active'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="space-y-6 lg:col-span-1">

          {/* Contact Information */}
          <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className={`w-5 h-5 mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {customer.emailId || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {customer.phoneNumber || 'N/A'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className={`w-5 h-5 mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {customer.installationAddress
                    ? [
                        customer.installationAddress.line2,
                        customer.installationAddress.city,
                        customer.installationAddress.state,
                        customer.installationAddress.country,
                      ]
                        .filter(Boolean)
                        .join(', ') + (customer.installationAddress.pin ? ` - ${customer.installationAddress.pin}` : '')
                    : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Documents</h3>
            {documentEntries.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No documents uploaded.</p>
            ) : (
              <div className="space-y-4">
                {documentEntries.map(([label, url]) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-lg overflow-hidden border ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                      <img
                        src={url}
                        alt={label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs ${isDark ? 'text-violet-400' : 'text-violet-600'} hover:underline`}
                      >
                        View document
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Plan */}
          <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Plan</h3>
            <div className="mb-6">
              <p className={`text-lg font-bold mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                {customer.userType || 'ActivLine Home 200'}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Username: {customer.userName || 'N/A'}
              </p>
            </div>
            <button className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
              Change Plan
            </button>
          </div>

          {/* Admin Notes */}
          <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Notes</h3>
            <div className="relative mb-4">
              <textarea
                className={`w-full h-32 p-4 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all ${isDark
                  ? 'bg-slate-800/50 border-slate-700 text-slate-300 placeholder-slate-500'
                  : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400'
                  }`}
                placeholder="Add notes for this customer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="absolute bottom-3 right-3 text-slate-400 pointer-events-none">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 9L9 1M9 9L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <button className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-violet-500/20">
              Save Note
            </button>
          </div>

        </div>

        {/* Right Column - History & Logs */}
        <div className="space-y-6 lg:col-span-2">

          {/* Payment History */}
          <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'} uppercase text-xs`}>
                    <th className="py-3 font-semibold tracking-wider">Date</th>
                    <th className="py-3 font-semibold tracking-wider">Description</th>
                    <th className="py-3 font-semibold tracking-wider">Amount</th>
                    <th className="py-3 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="group">
                      <td className={`py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{payment.date}</td>
                      <td className={`py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{payment.description}</td>
                      <td className={`py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{payment.amount}</td>
                      <td className="py-4 text-right">
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Support Tickets */}
          <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Support Tickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'} uppercase text-xs`}>
                    <th className="py-3 font-semibold tracking-wider">Date</th>
                    <th className="py-3 font-semibold tracking-wider">Subject</th>
                    <th className="py-3 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
                  {supportTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className={`py-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{ticket.date}</td>
                      <td className={`py-4 font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{ticket.id} - {ticket.subject}</td>
                      <td className="py-4 text-right">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full">
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
