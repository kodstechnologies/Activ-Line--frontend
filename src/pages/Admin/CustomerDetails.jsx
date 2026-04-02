import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, ArrowLeft, Search,
  ChevronLeft, ChevronRight, Calendar,
  User, FileText,
  AlertCircle, Shield, Ticket, Clock, CheckCircle, Zap, CreditCard, Award, Star, Layers, BarChart3
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEffect } from "react";
import {
  getSingleCustomer,
  getAdminCustomerTickets,
  getAdminCustomerPaymentHistory,
  getFranchiseGroupDetails,
  getFranchiseProfiles,
  createPlanOrder,
  verifyPlanPayment
} from "../../api/customer.api";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [customer, setCustomer] = useState(null);
  const { id } = useParams();

  // Pagination and filter states for Support Tickets
  const [ticketCurrentPage, setTicketCurrentPage] = useState(1);
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketDateFilter, setTicketDateFilter] = useState('all');
  const [ticketsPerPage] = useState(5);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ groupId: '', profileId: '', amount: '' });
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const normalizeTicketStatus = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') {
      return 'In Progress';
    }
    if (normalized === 'RESOLVED') {
      return 'Resolved';
    }
    return 'Open';
  };

  // Filter and paginate Support Tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...supportTickets];
    
    if (ticketSearchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
        ticket.id.toString().includes(ticketSearchTerm)
      );
    }
    
    if (ticketStatusFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.status.toLowerCase() === ticketStatusFilter.toLowerCase()
      );
    }
    
    if (ticketDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.date.split('-').reverse().join('-'));
        const diffTime = today - ticketDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch(ticketDateFilter) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [supportTickets, ticketSearchTerm, ticketStatusFilter, ticketDateFilter]);

  const paginatedTickets = useMemo(() => {
    const startIndex = (ticketCurrentPage - 1) * ticketsPerPage;
    const endIndex = startIndex + ticketsPerPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, ticketCurrentPage, ticketsPerPage]);

  const totalTicketPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  useEffect(() => {
    setTicketCurrentPage(1);
  }, [ticketSearchTerm, ticketStatusFilter, ticketDateFilter]);

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  useEffect(() => {
    const loadPayments = async () => {
      const userName =
        customer?.userName ||
        customer?.username ||
        customer?.customer?.userName ||
        "";

      if (!userName) {
        setCustomerPayments([]);
        return;
      }

      try {
        setPaymentsLoading(true);
        const res = await getAdminCustomerPaymentHistory({
          userName,
          page: 1,
          limit: 20,
          status: "SUCCESS",
        });
        const rows = res?.data?.data || [];
        setCustomerPayments(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.error(err);
        setCustomerPayments([]);
      } finally {
        setPaymentsLoading(false);
      }
    };

    loadPayments();
  }, [customer]);

  const fetchCustomer = async () => {
    try {
      const res = await getSingleCustomer(id);
      setCustomer(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadTickets = async () => {
      try {
        if (!id) return;
        const roomsRes = await getAdminCustomerTickets(id);
        const rooms = roomsRes?.data?.data || roomsRes?.data || [];
        const mappedRooms = (Array.isArray(rooms) ? rooms : []).map((room, idx) => ({
          id: room?.roomId || room?._id || room?.id || `#${idx + 1}`,
          date: room?.createdAt ? new Date(room.createdAt).toLocaleDateString('en-IN') : '—',
          subject: room?.subject || room?.title || 'Support Ticket',
          status: normalizeTicketStatus(room?.status),
          priority: room?.priority || 'Medium',
          category: room?.category || 'General'
        }));
        setSupportTickets(mappedRooms);
      } catch (err) {
        console.error(err);
      }
    };

    loadTickets();
  }, [id]);


  const accountId =
    customer?.accountId ||
    customer?.accountID ||
    customer?.franchiseAccountId ||
    customer?.account?.id ||
    '';

  const ticketStats = useMemo(() => {
    const openTickets = supportTickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = supportTickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = supportTickets.filter(t => t.status === 'Resolved').length;
    return { openTickets, inProgressTickets, resolvedTickets };
  }, [supportTickets]);

  const latestSuccessfulPayment = useMemo(() => {
    return [...customerPayments]
      .sort(
        (a, b) =>
          new Date(b?.paidAt || b?.createdAt || 0) -
          new Date(a?.paidAt || a?.createdAt || 0)
      )[0] || null;
  }, [customerPayments]);

  const formatPaymentAmount = (amount, currency = 'INR') => {
    const value = Number(amount || 0);
    if (Number.isNaN(value)) return '--';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPaymentDate = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const extractProfileInfo = (profile) => {
    if (!profile) return { profileId: '', groupId: '', name: '', planName: '', amount: '' };
    const profileId =
      profile?.Profile?.id ||
      profile.profileId ||
      profile.profile_id ||
      profile.id ||
      profile._id ||
      profile?.profile?.id ||
      '';
    const groupId =
      profile?.Profile?.groupId ||
      profile.groupId ||
      profile.group_id ||
      profile.userGroupId ||
      profile?.group?.id ||
      profile?.groupId ||
      '';
    const name =
      profile?.Profile?.name ||
      profile.userName ||
      profile.username ||
      profile.name ||
      profile.fullName ||
      profile.customerName ||
      '';
    const planName =
      profile?.Profile?.name ||
      profile.planName ||
      profile.plan?.planName ||
      profile.plan?.name ||
      profile.planTitle ||
      '';
    const detailsBilling = Array.isArray(profile?.details?.["billing Details"])
      ? profile.details["billing Details"]
      : [];
    const totalPriceItem = detailsBilling.find(
      (item) => String(item?.property || '').toLowerCase().includes('total price')
    );
    const amount =
      totalPriceItem?.value ||
      profile.amount ||
      profile.planAmount ||
      profile.plan?.amount ||
      '';
    return { profileId, groupId, name, planName, amount };
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Razorpay can only be loaded in the browser.'));
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });

  const handleSelectProfile = (profile) => {
    const info = extractProfileInfo(profile);
    setSelectedProfile(profile);
    setPaymentForm({
      profileId: info.profileId || '',
      groupId: info.groupId || '',
      amount: info.amount !== '' ? info.amount : ''
    });
    setPaymentVerified(false);
    setPaymentStatus(null);
  };

  const handleCreateOrder = async () => {
    const groupId = paymentForm.groupId?.toString().trim();
    const profileId = paymentForm.profileId?.toString().trim();
    const amountValue = paymentForm.amount;
    const resolvedUserName =
      customer?.userName ||
      customer?.username ||
      customer?.customer?.userName ||
      '';

    if (!accountId) {
      setPaymentStatus({ type: 'error', message: 'Account ID is missing.' });
      return;
    }
    if (!groupId || !profileId || !amountValue) {
      setPaymentStatus({ type: 'error', message: 'Please select a plan first.' });
      return;
    }

    setIsPaying(true);
    setPaymentStatus(null);
    setPaymentVerified(false);

    try {
      const createPayload = {
        accountId,
        groupId,
        profileId,
        amount: Number(amountValue)
      };
      if (resolvedUserName) {
        createPayload.userName = resolvedUserName;
      }

      const createRes = await createPlanOrder(createPayload);
      const createResponsePayload = createRes?.data?.data ?? createRes?.data ?? {};
      const orderId =
        createResponsePayload.orderId ||
        createResponsePayload.razorpayOrderId ||
        createResponsePayload.id ||
        createResponsePayload.order?.id;
      const currency = createResponsePayload.currency || createResponsePayload.order?.currency || 'INR';
      const orderAmount = createResponsePayload.amount ?? createResponsePayload.order?.amount;

      if (!orderId) {
        throw new Error('Order ID not returned from create-order API.');
      }

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Razorpay key not found. Please set VITE_RAZORPAY_KEY_ID in .env.');
      }

      await loadRazorpayScript();

      const amountInPaise = orderAmount ?? Math.round(Number(amountValue) * 100);

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency,
        name: 'Activline',
        description: 'Customer plan payment',
        order_id: orderId,
        prefill: {
          name: resolvedUserName || '',
          email: customer?.emailId || '',
          contact: customer?.phoneNumber || ''
        },
        notes: {
          accountId,
          groupId,
          profileId
        },
        handler: async (response) => {
          try {
            const verifyUrl =
              import.meta.env.VITE_PAYMENT_VERIFY_URL ||
              'http://localhost:8000/api/payment/plan/verify-payment';

            await verifyPlanPayment(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                accountId,
                groupId,
                profileId,
                ...(resolvedUserName ? { userName: resolvedUserName } : {})
              },
              verifyUrl
            );

            setPaymentStatus({ type: 'success', message: 'Payment verified successfully.' });
            setPaymentVerified(true);
          } catch (verifyErr) {
            const msg =
              verifyErr?.response?.data?.message ||
              verifyErr?.message ||
              'Payment verification failed.';
            setPaymentStatus({ type: 'error', message: msg });
            setPaymentVerified(false);
          }
        },
        theme: {
          color: '#8b5cf6'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (resp) => {
        const msg = resp?.error?.description || 'Payment failed. Please try again.';
        setPaymentStatus({ type: 'error', message: msg });
        setPaymentVerified(false);
      });
      razorpay.open();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to start payment.';
      setPaymentStatus({ type: 'error', message: msg });
      setPaymentVerified(false);
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!isPlanModalOpen || !accountId) return;
    setGroupLoading(true);
    setGroupError('');
    getFranchiseGroupDetails(accountId)
      .then((res) => {
        if (!active) return;
        const rows = res?.data?.data?.data || res?.data?.data || [];
        setGroupOptions(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!active) return;
        setGroupOptions([]);
        setGroupError(err?.response?.data?.message || err?.message || 'Failed to load groups');
      })
      .finally(() => {
        if (!active) return;
        setGroupLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isPlanModalOpen, accountId]);

  useEffect(() => {
    let active = true;
    if (!isPlanModalOpen || !accountId) return;
    setProfilesLoading(true);
    setProfilesError('');
    getFranchiseProfiles(accountId, true, customer?.userType)
      .then((res) => {
        if (!active) return;
        const rows = res?.data?.data ?? res?.data ?? [];
        setProfiles(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!active) return;
        setProfiles([]);
        setProfilesError(err?.response?.data?.message || err?.message || 'Failed to load profiles');
      })
      .finally(() => {
        if (!active) return;
        setProfilesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isPlanModalOpen, accountId, customer?.userType]);

  const filteredProfiles = selectedGroupId
    ? profiles.filter((profile) => {
        const info = extractProfileInfo(profile);
        return info.groupId === selectedGroupId;
      })
    : profiles;

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
      <div className="space-y-6 p-6 min-h-screen">
        <button
          onClick={() => navigate('/customers')}
          className={`group flex items-center text-sm font-medium transition-colors ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Customers
        </button>
        <div className={`rounded-xl shadow-sm border p-8 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <p className={isDark ? 'text-white' : 'text-gray-900'}>Customer not found</p>
        </div>
      </div>
    );
  }

  // Dynamic glass styles based on theme
  const glassCardClass = isDark 
    ? 'backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-violet-500/10'
    : 'bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-violet-500/10';

  const bgGradient = isDark
    ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40'
    : 'bg-gradient-to-br from-violet-50 via-white to-indigo-50';

  return (
    <div className={`min-h-screen p-6 ${bgGradient}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/customers')}
            className={`w-fit group flex items-center text-sm font-medium transition-colors ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Back to Customers
          </button>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className={`text-4xl font-bold ${isDark ? 'bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent' : 'text-gray-900'}`}>
                {customer.firstName} {customer.lastName}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Customer ID: {customer.userName || 'N/A'}
              </p>
            </div>
            <span className={`px-5 py-2 rounded-full text-sm font-medium backdrop-blur-md border ${customer.status?.toUpperCase() === 'ACTIVE'
              ? isDark 
                ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/10'
                : 'bg-green-100 text-green-700 border-green-200 shadow-sm'
              : isDark
                ? 'bg-red-500/20 text-red-300 border-red-500/30 shadow-lg shadow-red-500/10'
                : 'bg-red-100 text-red-700 border-red-200 shadow-sm'
              }`}>
              {customer.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', value: supportTickets.length, icon: Ticket, color: 'violet' },
            { label: 'Open Tickets', value: ticketStats.openTickets, icon: AlertCircle, color: 'amber' },
            { label: 'In Progress', value: ticketStats.inProgressTickets, icon: Clock, color: 'blue' },
            { label: 'Resolved', value: ticketStats.resolvedTickets, icon: CheckCircle, color: 'green' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            const colorClasses = isDark
              ? {
                  violet: 'bg-violet-500/20 text-violet-300',
                  amber: 'bg-amber-500/20 text-amber-300',
                  blue: 'bg-blue-500/20 text-blue-300',
                  green: 'bg-green-500/20 text-green-300'
                }
              : {
                  violet: 'bg-violet-100 text-violet-600',
                  amber: 'bg-amber-100 text-amber-600',
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600'
                };
            return (
              <div key={idx} className={`${glassCardClass} p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Contact Information */}
            <div className={`${glassCardClass} p-6`}>
              <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
                <User className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className={`p-2 rounded-lg transition-all ${isDark ? 'bg-violet-500/20 group-hover:bg-violet-500/30' : 'bg-violet-100 group-hover:bg-violet-200'}`}>
                    <Mail className={`w-4 h-4 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                  </div>
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    {customer.emailId || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className={`p-2 rounded-lg transition-all ${isDark ? 'bg-violet-500/20 group-hover:bg-violet-500/30' : 'bg-violet-100 group-hover:bg-violet-200'}`}>
                    <Phone className={`w-4 h-4 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                  </div>
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    {customer.phoneNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className={`p-2 rounded-lg transition-all ${isDark ? 'bg-violet-500/20 group-hover:bg-violet-500/30' : 'bg-violet-100 group-hover:bg-violet-200'}`}>
                    <MapPin className={`w-4 h-4 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                  </div>
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    {customer.installationAddress
                      ? [
                          customer.installationAddress.line2,
                          customer.installationAddress.city,
                          customer.installationAddress.state,
                          customer.installationAddress.country,
                        ]
                          .filter(Boolean)
                          .join(', ') + (customer.installationAddress.pin ? ` - ${customer.installationAddress.pin}` : '')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className={`${glassCardClass} p-6`}>
              <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
                <FileText className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                Documents
              </h3>
              {documentEntries.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {documentEntries.map(([label, url]) => (
                    <div key={label} className="group relative">
                      <div className={`w-full aspect-square rounded-xl overflow-hidden border transition-all group-hover:border-violet-500/50 group-hover:shadow-lg ${isDark ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2">
                        <div className={`text-xs font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{label}</div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs ${isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-600 hover:text-violet-700'} transition-colors`}
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Plan */}
            <div className={`${glassCardClass} p-6 relative overflow-hidden`}>
              {!isDark && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              )}
              <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 relative z-10 ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
                <Zap className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                Current Plan
              </h3>
              <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className={`w-5 h-5 ${isDark ? 'text-amber-300' : 'text-amber-500'}`} />
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {latestSuccessfulPayment?.planName || customer.userType || 'No plan found'}
                  </p>
                </div>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'} flex items-center gap-2`}>
                  <User className="w-3 h-3" />
                  Username: {customer.userName || 'N/A'}
                </p>
                <div className={`mt-3 space-y-1 text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  <p>Amount: {latestSuccessfulPayment ? formatPaymentAmount(latestSuccessfulPayment.amount, latestSuccessfulPayment.currency) : '--'}</p>
                  <p>Last Paid: {latestSuccessfulPayment ? formatPaymentDate(latestSuccessfulPayment.paidAt || latestSuccessfulPayment.createdAt) : '--'}</p>
                  <p>Plan End: {latestSuccessfulPayment ? formatPaymentDate(latestSuccessfulPayment.planEndDate) : '--'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-xl relative z-10"
              >
                Change Plan
              </button>
            </div>
          </div>

          {/* Right Column - Support Tickets */}
          <div className="space-y-6 lg:col-span-2">
            <div className={`${glassCardClass} p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
                  <Ticket className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                  Support Tickets
                </h3>
                <div className={`rounded-lg px-3 py-1.5 text-sm ${isDark ? 'bg-white/5 text-white/60' : 'bg-gray-100 text-gray-600'}`}>
                  Total: {supportTickets.length}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search by ID or subject..."
                    value={ticketSearchTerm}
                    onChange={(e) => setTicketSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border ${isDark ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'} focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all`}
                  />
                </div>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:border-violet-500/50 cursor-pointer`}
                >
                  <option value="all" className={isDark ? 'bg-slate-800' : 'bg-white'}>All Status</option>
                  <option value="open" className={isDark ? 'bg-slate-800' : 'bg-white'}>Open</option>
                  <option value="in progress" className={isDark ? 'bg-slate-800' : 'bg-white'}>In Progress</option>
                  <option value="resolved" className={isDark ? 'bg-slate-800' : 'bg-white'}>Resolved</option>
                </select>
                <select
                  value={ticketDateFilter}
                  onChange={(e) => setTicketDateFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:border-violet-500/50 cursor-pointer`}
                >
                  <option value="all" className={isDark ? 'bg-slate-800' : 'bg-white'}>All Time</option>
                  <option value="today" className={isDark ? 'bg-slate-800' : 'bg-white'}>Today</option>
                  <option value="week" className={isDark ? 'bg-slate-800' : 'bg-white'}>Last 7 Days</option>
                  <option value="month" className={isDark ? 'bg-slate-800' : 'bg-white'}>Last 30 Days</option>
                  <option value="year" className={isDark ? 'bg-slate-800' : 'bg-white'}>Last Year</option>
                </select>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-500'} uppercase text-xs`}>
                      <th className="py-3 font-semibold tracking-wider">Ticket ID</th>
                      <th className="py-3 font-semibold tracking-wider">Date</th>
                      <th className="py-3 font-semibold tracking-wider">Subject</th>
                      <th className="py-3 font-semibold tracking-wider">Status</th>
                      <th className="py-3 font-semibold tracking-wider">Priority</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    {paginatedTickets.map((ticket) => (
                      <tr key={ticket.id} className={`group transition-all cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-violet-50'}`}>
                        <td className={`py-4 font-mono text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          #{ticket.id}
                        </td>
                        <td className={`py-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-3 h-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                            {ticket.date}
                          </div>
                        </td>
                        <td className={`py-4 font-medium ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
                          {ticket.subject}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1 ${
                            ticket.status === 'Open' 
                              ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'
                              : ticket.status === 'In Progress'
                              ? isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                              : isDark ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {ticket.status === 'Open' && <AlertCircle className="w-3 h-3" />}
                            {ticket.status === 'In Progress' && <Clock className="w-3 h-3" />}
                            {ticket.status === 'Resolved' && <CheckCircle className="w-3 h-3" />}
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                            ticket.priority === 'High' 
                              ? isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
                              : ticket.priority === 'Medium'
                              ? isDark ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : isDark ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredTickets.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}">
                  <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    Showing {((ticketCurrentPage - 1) * ticketsPerPage) + 1} to {Math.min(ticketCurrentPage * ticketsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTicketCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={ticketCurrentPage === 1}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalTicketPages) }, (_, i) => {
                        let pageNum;
                        if (totalTicketPages <= 5) {
                          pageNum = i + 1;
                        } else if (ticketCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (ticketCurrentPage >= totalTicketPages - 2) {
                          pageNum = totalTicketPages - 4 + i;
                        } else {
                          pageNum = ticketCurrentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setTicketCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              ticketCurrentPage === pageNum
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                : isDark ? 'text-white/60 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setTicketCurrentPage(prev => Math.min(totalTicketPages, prev + 1))}
                      disabled={ticketCurrentPage === totalTicketPages}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'text-white/60 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`${glassCardClass} p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
                  <CreditCard className={`w-5 h-5 ${isDark ? 'text-violet-300' : 'text-violet-500'}`} />
                  Payment History
                </h3>
                <div className={`rounded-lg px-3 py-1.5 text-sm ${isDark ? 'bg-white/5 text-white/60' : 'bg-gray-100 text-gray-600'}`}>
                  Total: {customerPayments.length}
                </div>
              </div>

              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
                    />
                  ))}
                </div>
              ) : customerPayments.length === 0 ? (
                <div className={`rounded-xl border p-6 text-center text-sm ${isDark ? 'border-white/10 bg-white/5 text-white/60' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  No successful payment history found for this customer.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-white/10 text-white/40' : 'border-gray-200 text-gray-500'} uppercase text-xs`}>
                        <th className="py-3 font-semibold tracking-wider">Plan</th>
                        <th className="py-3 font-semibold tracking-wider">Amount</th>
                        <th className="py-3 font-semibold tracking-wider">Status</th>
                        <th className="py-3 font-semibold tracking-wider">Paid At</th>
                        <th className="py-3 font-semibold tracking-wider">Order ID</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                      {customerPayments.map((payment) => (
                        <tr key={payment.paymentId || payment.razorpayPaymentId} className={`${isDark ? 'hover:bg-white/5' : 'hover:bg-violet-50'} transition-all`}>
                          <td className="py-4">
                            <div>
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {payment.planName || '--'}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                Profile ID: {payment.profileId || '--'}
                              </div>
                            </div>
                          </td>
                          <td className={`py-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPaymentAmount(payment.amount, payment.currency)}
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1 ${
                              payment.status === 'SUCCESS'
                                ? isDark
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : 'bg-green-100 text-green-700 border border-green-200'
                                : isDark
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                              {payment.status || '--'}
                            </span>
                          </td>
                          <td className={`py-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {formatPaymentDate(payment.paidAt || payment.createdAt)}
                          </td>
                          <td className={`py-4 font-mono text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            {payment.orderId || payment.razorpayPaymentId || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Modal - Glassmorphic with theme support */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-gray-200'} backdrop-blur-xl`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Plan</h3>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    Account ID: {accountId || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className={`text-sm font-semibold ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* Groups section */}
                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Layers className="w-4 h-4" />
                        Groups
                      </h4>
                      {groupLoading && (
                        <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Loading...</span>
                      )}
                    </div>

                    {groupError && (
                      <div className={`text-sm mb-3 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        {groupError}
                      </div>
                    )}

                    <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      Select Group
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => {
                        const nextGroupId = e.target.value;
                        setSelectedGroupId(nextGroupId);
                        setSelectedProfile(null);
                        setPaymentForm({ groupId: nextGroupId, profileId: '', amount: '' });
                        setPaymentStatus(null);
                        setPaymentVerified(false);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="">All Groups</option>
                      {groupOptions.map((group) => (
                        <option key={group.Group_id || group.Group_name} value={group.Group_id || ''}>
                          {group.Group_name || group.Group_id}
                        </option>
                      ))}
                    </select>

                    {selectedGroupId && (
                      <div className={`mt-3 text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        Showing plans for Group ID: {selectedGroupId}
                      </div>
                    )}
                  </div>

                  {/* Plans section */}
                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <CreditCard className="w-4 h-4" />
                        Plans
                      </h4>
                      {profilesLoading && (
                        <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Loading...</span>
                      )}
                    </div>

                    {profilesError && (
                      <div className={`text-sm mb-3 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        {profilesError}
                      </div>
                    )}

                    {!profilesLoading && !profilesError && filteredProfiles.length === 0 && (
                      <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        No plans found for this group.
                      </div>
                    )}

                    {filteredProfiles.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 max-h-[55vh] overflow-y-auto">
                        {filteredProfiles.map((profile, idx) => {
                          const info = extractProfileInfo(profile);
                          const isSelected =
                            selectedProfile &&
                            (selectedProfile._id === profile._id ||
                              selectedProfile.id === profile.id ||
                              info.profileId === paymentForm.profileId);
                          return (
                            <div
                              key={profile._id || profile.id || info.profileId || idx}
                              className={`rounded-lg border p-3 transition-all ${
                                isSelected
                                  ? isDark
                                    ? 'border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20'
                                    : 'border-violet-500 bg-violet-50 shadow-md'
                                  : isDark
                                    ? 'border-white/10 bg-black/20 hover:bg-white/5'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Star className={`w-3 h-3 ${isDark ? 'text-amber-300' : 'text-amber-500'}`} />
                                    {info.name || 'Profile'}
                                  </div>
                                  <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                    Profile ID: {info.profileId || '—'} | Group ID: {info.groupId || '—'}
                                  </div>
                                  {(info.planName || info.amount) && (
                                    <div className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                      {info.planName ? `Plan: ${info.planName}` : ''}
                                      {info.planName && info.amount ? ' • ' : ''}
                                      {info.amount ? `Amount: ₹${info.amount}` : ''}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectProfile(profile)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                                      : isDark
                                        ? 'bg-white/10 text-white/80 hover:bg-white/20'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Plan Summary */}
                <div>
                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
                    <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <CheckCircle className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                      Selected Plan
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>Profile ID</div>
                        <div className={`font-semibold font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{paymentForm.profileId || '—'}</div>
                      </div>
                      <div>
                        <div className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>Group ID</div>
                        <div className={`font-semibold font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{paymentForm.groupId || '—'}</div>
                      </div>
                      <div className="pt-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}">
                        <div className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>Amount</div>
                        <div className={`text-2xl font-bold ${isDark ? 'bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent' : 'text-violet-700'}`}>
                          ₹{paymentForm.amount || '0'}
                        </div>
                      </div>
                    </div>

                    {paymentStatus && (
                      <div className={`mt-4 text-sm ${paymentStatus.type === 'success'
                        ? isDark ? 'text-green-300' : 'text-green-700'
                        : isDark ? 'text-red-300' : 'text-red-600'
                        }`}>
                        {paymentStatus.message}
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        onClick={handleCreateOrder}
                        disabled={isPaying || !paymentForm.groupId || !paymentForm.profileId || !paymentForm.amount}
                        className="w-full px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isPaying ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </span>
                        ) : (
                          'Pay with Razorpay'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPlanModalOpen(false)}
                        disabled={!paymentVerified}
                        className="w-full px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Use This Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
