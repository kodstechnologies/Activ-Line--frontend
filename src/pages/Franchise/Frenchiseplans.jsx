// FrenchisePlans.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Wifi,
  Eye,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Cpu,
  Clock,
  Calendar,
  DollarSign,
  Package,
  Activity,
  Shield,
  Server,
  ArrowRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { getPlans, getProfileDetails } from '../../api/frenchise/frenchiseplans';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 }
};

// Skeleton loader component
const TableSkeleton = ({ isDark }) => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className={`flex items-center justify-between p-4 rounded-lg ${
          isDark ? 'bg-slate-800/50' : 'bg-gray-100'
        } animate-pulse`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${
            isDark ? 'bg-slate-700' : 'bg-gray-200'
          }`} />
          <div className={`h-4 w-32 rounded ${
            isDark ? 'bg-slate-700' : 'bg-gray-200'
          }`} />
        </div>
        <div className={`h-8 w-8 rounded ${
          isDark ? 'bg-slate-700' : 'bg-gray-200'
        }`} />
      </motion.div>
    ))}
  </div>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, isDark }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ scale: 1.02 }}
    className={`rounded-xl p-4 border ${
      isDark 
        ? 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700' 
        : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-100'
    } shadow-lg hover:shadow-xl transition-all duration-300`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  </motion.div>
);

// Plan Card Component
const PlanCard = ({ plan, onViewDetails, isLoading, isDark }) => (
  <motion.tr
    variants={fadeInUp}
    whileHover={{ scale: 1.01 }}
    className={`group cursor-pointer transition-all duration-300 ${
      isDark 
        ? 'hover:bg-gradient-to-r hover:from-slate-800/90 hover:to-slate-800/70' 
        : 'hover:bg-gradient-to-r hover:from-purple-50/90 hover:to-purple-50/70'
    }`}
    onClick={() => onViewDetails(plan)}
  >
    <td className="py-4 px-6">
      <motion.div 
        className="flex items-center gap-4"
        whileHover={{ x: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={`relative p-3 rounded-xl ${
          isDark 
            ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
            : 'bg-gradient-to-br from-purple-100 to-blue-100'
        }`}>
          <Wifi size={20} className={isDark ? 'text-blue-400' : 'text-purple-600'} />
          <motion.div
            className="absolute inset-0 rounded-xl bg-blue-400/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {plan.name}
          </span>
          
        </div>
      </motion.div>
    </td>
    <td className="py-4 px-6">
      <motion.div 
        className="flex justify-end gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(plan);
          }}
          disabled={isLoading}
          className={`relative p-2.5 rounded-lg overflow-hidden group/btn ${
            isDark 
              ? 'hover:bg-slate-700 text-blue-400' 
              : 'hover:bg-purple-100 text-purple-600'
          } transition-all duration-300`}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Eye size={18} />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </>
          )}
        </motion.button>
      </motion.div>
    </td>
  </motion.tr>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, isDark }) => {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <motion.div 
      variants={fadeInUp}
      className="flex items-center justify-between"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`p-2 rounded-lg border transition-all duration-300 ${
          isDark 
            ? 'border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent' 
            : 'border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent'
        }`}
      >
        <ChevronLeft size={18} />
      </motion.button>

      <div className="flex items-center gap-2">
        {getPageNumbers().map((page, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all duration-300 ${
              page === currentPage
                ? isDark
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/25'
                : typeof page === 'number'
                ? isDark
                  ? 'hover:bg-slate-800 text-slate-300'
                  : 'hover:bg-gray-100 text-gray-600'
                : isDark
                ? 'text-slate-500'
                : 'text-gray-400'
            }`}
            disabled={typeof page !== 'number'}
          >
            {page}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`p-2 rounded-lg border transition-all duration-300 ${
          isDark 
            ? 'border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent' 
            : 'border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent'
        }`}
      >
        <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
};

// Details Modal Component
const DetailsModal = ({ isOpen, details, onClose, isDark }) => {
  if (!isOpen || !details) return null;

  const detailItems = [
    { icon: Calendar, label: 'Monthly Plan', value: details.monthlyPlan, color: 'from-blue-500 to-cyan-500' },
    { icon: Package, label: 'Package Type', value: details.packageType, color: 'from-purple-500 to-pink-500' },
    { icon: Server, label: 'Template', value: details.template, color: 'from-orange-500 to-red-500' },
    { icon: Clock, label: 'Period', value: details.period, color: 'from-green-500 to-emerald-500' },
    { icon: DollarSign, label: 'Total Price', value: `₹${details.totalPrice}`, color: 'from-yellow-500 to-amber-500' },
    { icon: Zap, label: 'Billing Type', value: details.billingType, color: 'from-indigo-500 to-purple-500' },
    { icon: Globe, label: 'Connection Type', value: details.connectionType, color: 'from-teal-500 to-cyan-500' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700' 
              : 'bg-gradient-to-br from-white to-purple-50/50 border border-purple-100'
          }`}
        >
          {/* Modal Header */}
          <div className={`relative p-6 border-b ${
            isDark ? 'border-slate-700' : 'border-purple-100'
          }`}>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className={`p-3 rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                  : 'bg-gradient-to-br from-purple-100 to-blue-100'
              }`}>
                <Sparkles size={24} className={isDark ? 'text-blue-400' : 'text-purple-600'} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {details.planName}
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Plan Details & Specifications
                </p>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`absolute top-6 right-6 p-2 rounded-lg ${
                isDark 
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              } transition-all duration-300`}
            >
              <XCircle size={22} />
            </motion.button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {detailItems.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className={`group relative p-4 rounded-xl border ${
                    isDark 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' 
                      : 'bg-white/50 border-gray-200 hover:border-purple-200'
                  } transition-all duration-300 overflow-hidden`}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)`
                    }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${item.color}`}>
                        <item.icon size={14} className="text-white" />
                      </div>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {item.label}
                      </span>
                    </div>
                    <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Additional Info */}
            <motion.div
              variants={fadeInUp}
              className={`mt-6 p-4 rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20' 
                  : 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Info size={20} className={isDark ? 'text-blue-400' : 'text-purple-600'} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Plan Summary
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    This {details.packageType} plan offers {details.monthlyPlan} with {details.connectionType} connection. 
                    Billed {details.billingType.toLowerCase()} at ₹{details.totalPrice} per {details.period.toLowerCase()}.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Modal Footer */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-purple-100'}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-600/25'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:shadow-purple-600/25'
              }`}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Component
const FrenchisePlans = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // State
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  
  const itemsPerPage = 10;
  const tableContainerRef = useRef(null);

  // Derived values
  const accountId = useMemo(() => {
    if (!user) return '';
    return user.accountId || user.userName || user.username || user._id || '';
  }, [user]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Fetch plans
  const fetchPlans = useCallback(async (page = currentPage) => {
    if (!accountId) {
      setPlans([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const params = { page, limit: itemsPerPage };
      const res = await getPlans(accountId, params);

      if (!res.data.success) throw new Error(res.data.message || "Request failed");

      const rawItems = res.data?.data || [];
      const transformed = rawItems.map(item => {
        const profile = item.Profile || item || {};
        return {
          id: profile.id || profile._id || `plan-${Math.random()}`,
          name: profile.name || 'Unnamed Plan',
        };
      });

      setPlans(transformed);
      setTotal(res.data.meta?.total || transformed.length);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not load plans");
    } finally {
      setLoading(false);
    }
  }, [accountId, currentPage]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const findValue = (items, keys) => {
    const normalizedKeys = keys.map(k => k.toLowerCase());
    const found = (items || []).find((entry) => {
      const prop = String(entry?.property || '').trim().toLowerCase();
      return normalizedKeys.some((key) => prop.includes(key));
    });
    return found?.value ?? 'N/A';
  };

  const handleViewDetails = async (plan) => {
    if (!accountId) {
      toast.error('Account ID missing. Please login again.');
      return;
    }

    setDetailsLoadingId(plan.id);
    try {
      const res = await getProfileDetails(accountId, plan.id);
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Failed to fetch plan details');
      }

      const message = res?.data?.data?.message || {};
      const profileDetails = message['profile Details'] || message.profileDetails || [];
      const billingDetails = message['billing Details'] || message.billingDetails || [];

      setSelectedPlanDetails({
        planName: plan.name || 'N/A',
        monthlyPlan: findValue(profileDetails, ['reset billing cycle']),
        packageType: findValue(profileDetails, ['package type']),
        template: findValue(profileDetails, ['bandwidth level 1', 'template']),
        period: findValue(billingDetails, ['period']),
        totalPrice: findValue(billingDetails, ['total price']),
        billingType: findValue(profileDetails, ['billing type']),
        connectionType: findValue(profileDetails, ['connection type']),
      });
      setDetailsModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || 'Could not load plan details');
    } finally {
      setDetailsLoadingId(null);
    }
  };

  // Calculate stats
  const stats = useMemo(() => [
    { icon: Package, label: 'Total Plans', value: total, color: 'from-blue-600 to-cyan-600' },

    { icon: Shield, label: 'Pages', value: totalPages, color: 'from-purple-600 to-pink-600' },
  ], [total, plans.length, totalPages]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header Section */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <motion.div variants={fadeInUp} className="space-y-1">
          <h1 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${
            isDark 
              ? 'from-blue-400 to-purple-400' 
              : 'from-purple-600 to-blue-600'
          } bg-clip-text text-transparent`}>
            Frenchise Plans
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Manage and monitor all your franchise plans
          </p>
        </motion.div>

        <motion.div 
          variants={fadeInUp}
          className={`px-4 py-2 rounded-lg ${
            isDark 
              ? 'bg-slate-800/50 border border-slate-700' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className={isDark ? 'text-blue-400' : 'text-purple-600'} />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Account ID: {accountId ? `${accountId.slice(0, 8)}...` : 'N/A'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} isDark={isDark} />
        ))}
      </motion.div>

      {/* Main Table Card */}
      <motion.div
        ref={tableContainerRef}
        variants={fadeInUp}
        className={`rounded-xl shadow-xl border overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' 
            : 'bg-gradient-to-br from-white to-purple-50/30 border-gray-200'
        }`}
      >
        {/* Table Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Wifi size={20} className={isDark ? 'text-blue-400' : 'text-purple-600'} />
            <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Available Plans
            </h2>
           
          </div>
          
          {!loading && plans.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
           
            </motion.div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`${isDark ? 'bg-slate-800/60' : 'bg-gray-50/80'}`}>
                <th className={`py-4 px-6 text-xs uppercase font-semibold tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <Package size={14} />
                    <span>Plan Details</span>
                  </div>
                </th>
                <th className={`py-4 px-6 text-xs uppercase font-semibold tracking-wider text-right ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  <div className="flex items-center justify-end gap-2">
                    <Zap size={14} />
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan={2} className="py-8">
                    <TableSkeleton isDark={isDark} />
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <motion.tr
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                >
                  <td colSpan={2} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className={`p-4 rounded-full ${
                        isDark ? 'bg-slate-800' : 'bg-gray-100'
                      }`}>
                        <Package size={32} className={isDark ? 'text-slate-600' : 'text-gray-400'} />
                      </div>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        No plans found
                      </p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onViewDetails={handleViewDetails}
                    isLoading={detailsLoadingId === plan.id}
                    isDark={isDark}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && !loading && (
          <div className={`px-6 py-4 border-t ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              isDark={isDark}
            />
          </div>
        )}
      </motion.div>

      {/* Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        details={selectedPlanDetails}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPlanDetails(null);
        }}
        isDark={isDark}
      />
    </motion.div>
  );
};

export default FrenchisePlans;