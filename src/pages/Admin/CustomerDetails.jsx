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

  // Filter and paginate Support Tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...supportTickets];
    
    // Search by subject or ID
    if (ticketSearchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
        ticket.id.toString().includes(ticketSearchTerm)
      );
    }
    
    // Filter by status
    if (ticketStatusFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.status.toLowerCase() === ticketStatusFilter.toLowerCase()
      );
    }
    
    // Filter by date range
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
          status: room?.status || 'Open',
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

  // Statistics
  const ticketStats = useMemo(() => {
    const openTickets = supportTickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = supportTickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = supportTickets.filter(t => t.status === 'Resolved').length;
    return { openTickets, inProgressTickets, resolvedTickets };
  }, [supportTickets]);

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
      <div className="space-y-6 p-6">
        <button
          onClick={() => navigate('/customers')}
          className="group flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Customers
        </button>
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 text-center">
          <p className="text-white/80">Customer not found</p>
        </div>
      </div>
    );
  }

  // Glassmorphic styles
  const glassCardClass = `backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-violet-500/10`;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 dark:from-slate-950 dark:via-purple-950/30 dark:to-indigo-950/40">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section with Stats */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="w-fit group flex items-center text-sm font-medium text-white/80 hover:text-white transition-all backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Back to Customers
          </button>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-sm mt-1 text-white/60">
                Customer ID: {customer.userName || 'N/A'}
              </p>
            </div>
            <span className={`px-5 py-2 rounded-full text-sm font-medium backdrop-blur-md border ${customer.status?.toUpperCase() === 'ACTIVE'
              ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/10'
              : 'bg-red-500/20 text-red-300 border-red-500/30 shadow-lg shadow-red-500/10'
              }`}>
              {customer.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Quick Stats Cards - Glassmorphic with Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${glassCardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Total Tickets</p>
                <p className="text-3xl font-bold text-white mt-1">{supportTickets.length}</p>
              </div>
              <div className="bg-violet-500/20 p-3 rounded-xl backdrop-blur-sm">
                <Ticket className="w-6 h-6 text-violet-300" />
              </div>
            </div>
          </div>
          <div className={`${glassCardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Open Tickets</p>
                <p className="text-3xl font-bold text-white mt-1">{ticketStats.openTickets}</p>
              </div>
              <div className="bg-amber-500/20 p-3 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-6 h-6 text-amber-300" />
              </div>
            </div>
          </div>
          <div className={`${glassCardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-white mt-1">{ticketStats.inProgressTickets}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-xl backdrop-blur-sm">
                <Clock className="w-6 h-6 text-blue-300" />
              </div>
            </div>
          </div>
          <div className={`${glassCardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Resolved</p>
                <p className="text-3xl font-bold text-white mt-1">{ticketStats.resolvedTickets}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl backdrop-blur-sm">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Contact Information */}
            <div className={`${glassCardClass} p-6`}>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white/90">
                <User className="w-5 h-5 text-violet-300" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="bg-violet-500/20 p-2 rounded-lg group-hover:bg-violet-500/30 transition-all">
                    <Mail className="w-4 h-4 text-violet-300" />
                  </div>
                  <span className="text-sm text-white/80 break-all">
                    {customer.emailId || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="bg-violet-500/20 p-2 rounded-lg group-hover:bg-violet-500/30 transition-all">
                    <Phone className="w-4 h-4 text-violet-300" />
                  </div>
                  <span className="text-sm text-white/80">
                    {customer.phoneNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="bg-violet-500/20 p-2 rounded-lg group-hover:bg-violet-500/30 transition-all">
                    <MapPin className="w-4 h-4 text-violet-300" />
                  </div>
                  <span className="text-sm text-white/80">
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
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white/90">
                <FileText className="w-5 h-5 text-violet-300" />
                Documents
              </h3>
              {documentEntries.length === 0 ? (
                <p className="text-sm text-white/50">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {documentEntries.map(([label, url]) => (
                    <div key={label} className="group relative">
                      <div className="w-full aspect-square rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm transition-all group-hover:border-violet-500/50 group-hover:shadow-lg">
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-white/80">{label}</div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-violet-300 hover:text-violet-200 transition-colors"
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white/90 relative z-10">
                <Zap className="w-5 h-5 text-violet-300" />
                Current Plan
              </h3>
              <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-amber-300" />
                  <p className="text-xl font-bold text-white">
                    {customer.userType || 'ActivLine Home 200'}
                  </p>
                </div>
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Username: {customer.userName || 'N/A'}
                </p>
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

          {/* Right Column - History & Logs */}
          <div className="space-y-6 lg:col-span-2">
            {/* Support Tickets with Filters and Pagination */}
            <div className={`${glassCardClass} p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white/90">
                  <Ticket className="w-5 h-5 text-violet-300" />
                  Support Tickets
                </h3>
                <div className="flex gap-2">
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-white/60">
                    Total: {supportTickets.length}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by ID or subject..."
                    value={ticketSearchTerm}
                    onChange={(e) => setTicketSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                  <option value="all" className="bg-slate-800">All Status</option>
                  <option value="open" className="bg-slate-800">Open</option>
                  <option value="in progress" className="bg-slate-800">In Progress</option>
                  <option value="resolved" className="bg-slate-800">Resolved</option>
                </select>
                <select
                  value={ticketDateFilter}
                  onChange={(e) => setTicketDateFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                  <option value="all" className="bg-slate-800">All Time</option>
                  <option value="today" className="bg-slate-800">Today</option>
                  <option value="week" className="bg-slate-800">Last 7 Days</option>
                  <option value="month" className="bg-slate-800">Last 30 Days</option>
                  <option value="year" className="bg-slate-800">Last Year</option>
                </select>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase text-xs">
                      <th className="py-3 font-semibold tracking-wider">Ticket ID</th>
                      <th className="py-3 font-semibold tracking-wider">Date</th>
                      <th className="py-3 font-semibold tracking-wider">Subject</th>
                      <th className="py-3 font-semibold tracking-wider">Status</th>
                      <th className="py-3 font-semibold tracking-wider">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedTickets.map((ticket) => (
                      <tr key={ticket.id} className="group hover:bg-white/5 transition-all cursor-pointer">
                        <td className="py-4 font-mono text-xs text-white/50">
                          #{ticket.id}
                        </td>
                        <td className="py-4 text-white/70">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-white/40" />
                            {ticket.date}
                          </div>
                        </td>
                        <td className="py-4 font-medium text-violet-300">
                          {ticket.subject}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1 backdrop-blur-sm ${
                            ticket.status === 'Open' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : ticket.status === 'In Progress'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
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
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : ticket.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredTickets.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="text-sm text-white/50">
                    Showing {((ticketCurrentPage - 1) * ticketsPerPage) + 1} to {Math.min(ticketCurrentPage * ticketsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTicketCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={ticketCurrentPage === 1}
                      className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white/60 hover:bg-white/10"
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
                                : 'text-white/60 hover:bg-white/10'
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
                      className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white/60 hover:bg-white/10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Modal - Glassmorphic */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
            <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-gray-200'} backdrop-blur-xl`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Plan</h3>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
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
                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Groups
                      </h4>
                      {groupLoading && (
                        <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Loading...</span>
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
                      className={`w-full p-2.5 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
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

                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Plans
                      </h4>
                      {profilesLoading && (
                        <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Loading...</span>
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
                                    : 'border-violet-500 bg-violet-50'
                                  : isDark
                                    ? 'border-white/10 bg-black/20 hover:bg-white/5'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Star className="w-3 h-3 text-amber-400" />
                                    {info.name || 'Profile'}
                                  </div>
                                  <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                    Profile ID: {info.profileId || '—'} | Group ID: {info.groupId || '—'}
                                  </div>
                                  {(info.planName || info.amount) && (
                                    <div className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
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

                <div>
                  <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-violet-400" />
                      Selected Plan
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>Profile ID</div>
                        <div className="font-semibold font-mono text-sm">{paymentForm.profileId || '—'}</div>
                      </div>
                      <div>
                        <div className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>Group ID</div>
                        <div className="font-semibold font-mono text-sm">{paymentForm.groupId || '—'}</div>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <div className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>Amount</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
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