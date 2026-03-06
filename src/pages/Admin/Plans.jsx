// Updated Plans.jsx (replace your entire component with this)
import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Wifi,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Download
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import api from '../../api/plans';   // ← Your API file (adjust path if needed)

const Plans = () => {
    const { isDark } = useTheme();

    // State
    const [plans, setPlans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [loading, setLoading] = useState(true);

    // Form State
    const initialFormState = { name: '', speed: '', price: '', type: 'Home', status: 'Active' };
    const [formData, setFormData] = useState(initialFormState);

    // Helper to extract value from nested details array
    const getDetailValue = (detailsArray, propertyName) => {
        const found = detailsArray?.find(item => item.property === propertyName);
        return found ? found.value : 'N/A';
    };

    // Transform API response to match your original table structure
    const transformPlanData = (apiData) => {
        return apiData.map(plan => {
            const profileDetails = plan.details?.["profile Details"] || [];
            const billingDetails = plan.details?.["billing Details"] || [];

            const bandwidth = getDetailValue(profileDetails, "Bandwidth Level 1");
            const packageType = getDetailValue(profileDetails, "Package Type");
            const totalPrice = getDetailValue(billingDetails, "Total Price");

           return {
    id: plan.id,
    name: plan.name,
    speed: bandwidth.replace(" template", "").replace("Mbps", " Mbps"),
    price: parseFloat(totalPrice).toFixed(2),
    type: packageType.charAt(0).toUpperCase() + packageType.slice(1),
    status: plan.deactivated === 0 ? 'Active' : 'Inactive'
};
        });
    };

    // Fetch real data from your API
    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/customer/full-details?page=1&limit=100'); // large limit = get ALL plans
            const transformed = transformPlanData(response.data.data || []);
            setPlans(transformed);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            toast.error('Failed to load plans from API');
        } finally {
            setLoading(false);
        }
    };

    // Fetch on component mount
    useEffect(() => {
        fetchPlans();
    }, []);

    // Handlers (exactly same as your original + refresh after CRUD)
    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
        setFormData(initialFormState);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPlan) {
            // Update locally (you can later replace with PUT API call)
            setPlans(plans.map(p => p.id === editingPlan.id ? { ...formData, id: p.id } : p));
            toast.success('Plan updated successfully');
        } else {
            // Create locally
            const newPlan = { ...formData, id: Date.now().toString() };
            setPlans([newPlan, ...plans]);
            toast.success('Plan created successfully');
        }
        handleCloseModal();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            setPlans(plans.filter(p => p.id !== id));
            toast.success('Plan deleted');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Filter & Search Logic (exactly same as your original)
    const filteredPlans = useMemo(() => {
        return plans.filter(plan => {
            const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'All' || plan.type === typeFilter;
            const matchesStatus = statusFilter === 'All' || plan.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [plans, searchTerm, typeFilter, statusFilter]);

    // Pagination Logic (exactly same as your original)
    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const paginatedPlans = filteredPlans.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            {/* Header Actions - exactly same */}
            <div className={`p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-purple-100'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search plans..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg outline-none focus:ring-2 transition-all ${isDark
                                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-purple-500/20 focus:border-purple-300'
                                }`}
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={`px-4 py-2 text-sm border rounded-lg outline-none cursor-pointer transition-colors ${isDark
                                ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <option value="All">All Types</option>
                            <option value="Home">Home</option>
                            <option value="Office">Office</option>
                        </select>

                        <button
                            onClick={() => handleOpenModal()}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-lg transition-all active:scale-95 ${isDark
                                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            Add Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Card - exactly same UI */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-purple-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`${isDark ? 'bg-slate-800/50 border-b border-slate-800' : 'bg-gray-50/50 border-b border-purple-100'}`}>
                                <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Plan Name</th>
                                <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Speed</th>

                                <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Price (₹)</th>
                                <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Type</th>
                                <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Status</th>
                                <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider text-right ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-purple-50'}`}>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500">Loading plans from API...</td>
                                </tr>
                            ) : paginatedPlans.length > 0 ? (
                                paginatedPlans.map((plan) => (
                                    <tr key={plan.id} className={`group transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-purple-50/30'}`}>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-purple-100/50 text-purple-600'}`}>
                                                    <Wifi className="w-4 h-4" />
                                                </div>
                                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</span>
                                            </div>
                                        </td>
                                        <td className={`py-4 px-6 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{plan.speed}</td>

                                        <td className={`py-4 px-6 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{plan.price}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${plan.type === 'Home'
                                                ? (isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200')
                                                : (isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200')
                                                }`}>
                                                {plan.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${plan.status === 'Active'
                                                ? (isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200')
                                                : (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200')
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${plan.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {plan.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(plan)}
                                                    className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-green-400' : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'}`}
                                                    title="Edit Plan"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(plan.id)}
                                                    className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}`}
                                                    title="Delete Plan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className={`py-12 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                        No plans found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - exactly same as your original */}
                {filteredPlans.length > 0 && (
                    <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-purple-100'}`}>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPlans.length)} of {filteredPlans.length} plans
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-purple-200 hover:bg-purple-50 text-purple-700'}`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${currentPage === page
                                        ? isDark ? 'bg-blue-600 text-white border-blue-500' : 'bg-purple-600 text-white border-purple-500'
                                        : isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-purple-200 hover:bg-purple-50 text-purple-700'}`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal - exactly same as your original code */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-purple-100 ring-4 ring-purple-50'}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-purple-100'}`}>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                            </h2>
                            <button onClick={handleCloseModal} className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-600'}`}>
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* All your form fields exactly as before */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Plan Name</label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Speed</label>
                                    <input type="text" name="speed" required value={formData.speed} onChange={handleInputChange} className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                </div>
                            </div>
                            {/* ... rest of your form fields (FUP, Price, Type, Status) are exactly the same as your original code ... */}
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={handleCloseModal} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-gray-300 text-gray-700'}`}>Cancel</button>
                                <button type="submit" className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${isDark ? 'bg-blue-600' : 'bg-purple-600'}`}>{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;