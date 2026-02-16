// import React, { useState, useMemo, useCallback } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Search, Filter, Plus, XCircle, ChevronDown, ChevronLeft, ChevronRight, Edit, Eye } from 'lucide-react';
// import { useEffect } from "react";
// import { getCustomers } from "../../api/customer.api";
// import { useTheme } from '../../context/ThemeContext';
// import api from "../../api/axios";

// const SubscribersPage = () => {
//   const navigate = useNavigate();
//   const { isDark } = useTheme();
//   const [subscribers, setSubscribers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [totalItems, setTotalItems] = useState(0);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [selectedSubscriber, setSelectedSubscriber] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   const [newSubscriber, setNewSubscriber] = useState({
//     userGroupId: '',
//     accountId: '',
//     userName: '',
//     password: '',
//     firstName: '',
//     lastName: '',
//     phoneNumber: '',
//     emailId: '',
//     userType: 'business',
//     activationDate: 'now',
//     customActivationDate: '',
//     customExpirationDate: '',
//     installation_address_line2: '',
//     installation_address_city: '',
//     installation_address_pin: '',
//     installation_address_state: '',
//     installation_address_country: 'IN',
//     caf_num: '',
//     createBilling: true,
//     notifyUserSms: true,
//     // Files are handled separately in state or just appended to FormData
//   });
//   const [editSubscriber, setEditSubscriber] = useState({
//     userGroupId: '',
//     accountId: '',
//     userName: '',
//     firstName: '',
//     lastName: '',
//     phoneNumber: '',
//     emailId: '',
//     userType: 'business',
//     activationDate: 'now',
//     customActivationDate: '',
//     customExpirationDate: '',
//     installation_address_line2: '',
//     installation_address_city: '',
//     installation_address_pin: '',
//     installation_address_state: '',
//     installation_address_country: 'IN',
//     caf_num: '',
//     createBilling: true,
//     notifyUserSms: true,
//     status: 'Active',
//   });

//   // Separate state for edit files
//   const [editFiles, setEditFiles] = useState({
//     idFile: null,
//     addressFile: null,
//     cafFile: null,
//     reportFile: null,
//     signFile: null,
//     profilePicFile: null
//   });

//   // Separate state for files
//   const [files, setFiles] = useState({
//     idFile: null,
//     addressFile: null,
//     cafFile: null,
//     reportFile: null,
//     signFile: null,
//     profilePicFile: null
//   });

//   const formatDateForInput = (dateStr) => {
//     if (!dateStr) return '';
//     // Check if it matches DD-MM-YYYY HH:mm (e.g., 26-01-2026 10:30)
//     const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})\s(\d{2}):(\d{2})$/;
//     const match = dateStr.match(ddmmyyyy);
//     if (match) {
//       return `${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}`;
//     }
//     return dateStr; 
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setNewSubscriber(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleFileChange = (e) => {
//     const { name, files: fileList } = e.target;
//     if (fileList.length > 0) {
//       setFiles(prev => ({
//         ...prev,
//         [name]: fileList[0]
//       }));
//     }
//   };

//   const handleEditFileChange = (e) => {
//     const { name, files: fileList } = e.target;
//     if (fileList.length > 0) {
//       setEditFiles(prev => ({
//         ...prev,
//         [name]: fileList[0]
//       }));
//     }
//   };

//   const handleAddSubscriber = async () => {
//     const formData = new FormData();

//     // Append text fields
//     Object.keys(newSubscriber).forEach(key => {
//       if (key === 'createBilling' || key === 'notifyUserSms') {
//         formData.append(key, newSubscriber[key] ? 'on' : 'off');
//       } else {
//         formData.append(key, newSubscriber[key]);
//       }
//     });

//     // Append files
//     Object.keys(files).forEach(key => {
//       if (files[key]) {
//         formData.append(key, files[key]);
//       }
//     });

//     try {
//       const res = await api.post('/api/customer/create', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       if (res.data.success) {
//         setIsModalOpen(false);
//         fetchCustomers(currentPage, itemsPerPage);
//         // Reset form
//         setNewSubscriber({
//           userGroupId: '', accountId: '', userName: '', password: '', firstName: '', lastName: '',
//           phoneNumber: '', emailId: '', userType: 'business', activationDate: 'now',
//           customActivationDate: '', customExpirationDate: '', installation_address_line2: '',
//           installation_address_city: '', installation_address_pin: '', installation_address_state: '',
//           installation_address_country: 'IN', caf_num: '', createBilling: true, notifyUserSms: true
//         });
//         setFiles({ idFile: null, addressFile: null, cafFile: null, reportFile: null, signFile: null, profilePicFile: null });
//       }
//     } catch (err) {
//       console.error("Failed to create customer", err);
//       alert("Failed to create customer: " + (err.response?.data?.message || err.message));
//     }
//   };

//   const handleViewDetail = (subscriber) => {
//     navigate(`/customers-details/${subscriber.id}`, { state: { subscriber } });
//   };

//   const handleEditClick = (subscriber, e) => {
//     e.stopPropagation();
//     setSelectedSubscriber(subscriber);
//     setEditFiles({ idFile: null, addressFile: null, cafFile: null, reportFile: null, signFile: null, profilePicFile: null });
//     setEditSubscriber({
//       userGroupId: subscriber.userGroupId || '',
//       accountId: subscriber.accountId || '',
//       userName: subscriber.userName || '',
//       firstName: subscriber.firstName || '',
//       lastName: subscriber.lastName || '',
//       phoneNumber: subscriber.phoneNumber || '',
//       emailId: subscriber.emailId || '',
//       userType: subscriber.userType || 'business',
//       activationDate: subscriber.activationDate || 'now',
//       customActivationDate: formatDateForInput(subscriber.customActivationDate) || '',
//       customExpirationDate: formatDateForInput(subscriber.customExpirationDate) || '',
//       installation_address_line2: subscriber.installationAddress?.line2 || '',
//       installation_address_city: subscriber.installationAddress?.city || '',
//       installation_address_pin: subscriber.installationAddress?.pin || '',
//       installation_address_state: subscriber.installationAddress?.state || '',
//       installation_address_country: subscriber.installationAddress?.country || 'IN',
//       caf_num: subscriber.cafNum || '',
//       createBilling: subscriber.createBilling === 'on' || subscriber.createBilling === true,
//       notifyUserSms: subscriber.notifyUserSms === 'on' || subscriber.notifyUserSms === true,
//       status: subscriber.status || 'Active'
//     });
//     setIsEditModalOpen(true);
//   };

//   // const handleViewClick = (subscriber, e) => {
//   //   e.stopPropagation();
//   //   setSelectedSubscriber(subscriber);
//   //   setIsViewModalOpen(true);
//   // };
//   const handleViewClick = (subscriber, e) => {
//     e.stopPropagation(); // prevents row click issues (important in tables)

//     navigate(`/customer-details/${subscriber.id}`, {
//       state: { subscriber }
//     });
//   };

//   const handleEditInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setEditSubscriber(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleUpdateSubscriber = async () => {
//     if (!selectedSubscriber) return;

//     try {
//       const formData = new FormData();

//       // Append text fields
//       Object.keys(editSubscriber).forEach(key => {
//         if (key === 'createBilling' || key === 'notifyUserSms') {
//           formData.append(key, editSubscriber[key] ? 'on' : 'off');
//         } else {
//           formData.append(key, editSubscriber[key]);
//         }
//       });

//       // Append files
//       Object.keys(editFiles).forEach(key => {
//         if (editFiles[key]) {
//           formData.append(key, editFiles[key]);
//         }
//       });

//       const updateId = selectedSubscriber.activlineUserId || selectedSubscriber.id;
//       const res = await api.post(`/api/customer/update/${updateId}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
      
//       if (res.data.success) {
//         setIsEditModalOpen(false);
//         fetchCustomers(currentPage, itemsPerPage);
//         setSelectedSubscriber(null);
//       } else {
//         alert("Failed to update customer");
//       }
//     } catch (err) {
//       console.error("Update failed", err);
//       alert("Update failed: " + (err.response?.data?.message || err.message));
//     }
//   };

//   const fetchCustomers = useCallback(async (page, limit) => {
//     try {
//       setLoading(true);

//       const res = await getCustomers(page, limit);
//       setTotalItems(res.data.total || 0);

//       const customers = res.data.data || [];

//       // 🔥 Map backend → UI format
//       const formatted = customers.map(c => ({
//         ...c, // Preserve original data for editing
//         id: c._id,
//         name: `${c.firstName || ""} ${c.lastName || ""}`,
//         mobile: c.phoneNumber,
//         email: c.emailId,
//         location: c.address?.city || "N/A",
//         plan: c.userType || "Plan N/A",
//         tech: "Fiber",
//         status: c.status || "Active",
//       }));

//       setSubscribers(formatted);
//     } catch (err) {
//       console.error("Failed to fetch customers", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchCustomers(currentPage, itemsPerPage);
//   }, [fetchCustomers, currentPage, itemsPerPage]);

//   // Pagination calculations
//   const paginationData = useMemo(() => {
//     const totalPages = Math.ceil(totalItems / itemsPerPage);
//     const startIndex = (currentPage - 1) * itemsPerPage;
    
//     // Ensure we strictly show 'itemsPerPage' amount of data
//     // This handles cases where API might return more data than requested limit
//     const paginatedSubscribers = subscribers.slice(0, itemsPerPage);
//     const endIndex = startIndex + paginatedSubscribers.length;

//     return {
//       paginatedSubscribers,
//       totalPages: totalPages > 0 ? totalPages : 1,
//       totalItems: totalItems,
//       startIndex: totalItems > 0 ? startIndex + 1 : 0,
//       endIndex: endIndex
//     };
//   }, [subscribers, currentPage, itemsPerPage, totalItems]);

//   const handlePageChange = (page) => {
//     if (page < 1 || page > paginationData.totalPages) return;
//     setCurrentPage(page);
//     // Scroll to top of table
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleItemsPerPageChange = (value) => {
//     setItemsPerPage(Number(value));
//     setCurrentPage(1);
//   };

//   return (
//     <div className={`rounded-xl shadow-sm border flex flex-col h-full relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
//       <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
//         <div>
//           <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscribers</h2>
//           <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage users, activations, and KYC</p>
//         </div>
//         <div className="flex gap-3">
//           <button className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}>
//             <Filter className="w-4 h-4" /> Filter
//           </button>
//           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 shadow-sm shadow-blue-900/20">
//             <Plus className="w-4 h-4" /> Add Subscriber
//           </button>
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col min-h-0 p-6">
//         <div className="relative mb-6 flex-shrink-0">
//           <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
//           <input type="text" placeholder="Search by name, mobile, or ID..." className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`} />
//         </div>

//         <div className="flex-1 min-h-0 overflow-hidden">
//           <div className={`rounded-lg border overflow-hidden h-full ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
//             <div className="overflow-x-auto overflow-y-auto h-full">
//               <table className="w-full text-left">
//                 <thead>
//                   <tr className={`${isDark ? 'bg-slate-800/50 border-b border-slate-800' : 'bg-gray-50 border-b border-gray-200'}`}>
//                     <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Customer</th>
//                     <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Contact</th>
//                     <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Plan Info</th>
//                     <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</th>
//                     <th className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider text-right ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
//                   {paginationData.paginatedSubscribers.length > 0 ? (
//                     paginationData.paginatedSubscribers.map((sub, i) => (
//                       <tr
//                         key={i}
//                         className={`group transition-all duration-150 ${isDark ? 'hover:bg-slate-800/50 bg-slate-900/30' : 'hover:bg-gray-50 bg-white'}`}
//                       >
//                         <td className="py-5 px-6">
//                           <div className="flex items-center gap-4">
//                             <div className={`w-11 h-11 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0 ${isDark ? 'ring-2 ring-blue-500/20' : 'ring-2 ring-blue-500/10'}`}>
//                               {sub.name.charAt(0)}
//                             </div>
//                             <div className="min-w-0">

//                               <div className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{sub.name}</div>
//                               <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{sub.id}</div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{sub.mobile || 'N/A'}</div>
//                           <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{sub.email || 'N/A'}</div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{sub.plan}</div>
//                           <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{sub.tech}</div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sub.status === 'Active'
//                             ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
//                             : sub.status === 'Suspended'
//                               ? (isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200')
//                               : (isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gray-100 text-gray-600 border border-gray-300')
//                             }`}>
//                             {sub.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
//                             {sub.status}
//                           </span>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className="flex items-center justify-end gap-2">
//                             <button
//                               onClick={(e) => handleViewClick(sub, e)}
//                               className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
//                               title="View Details"
//                             >
//                               <Eye className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={(e) => handleEditClick(sub, e)}
//                               className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-green-400' : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'}`}
//                               title="Edit Customer"
//                             >
//                               <Edit className="w-4 h-4" />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="5" className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
//                         No subscribers found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Pagination Controls */}
//         <div className={`mt-6 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Show</span>
//               <select
//                 value={itemsPerPage}
//                 onChange={(e) => handleItemsPerPageChange(e.target.value)}
//                 className={`px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
//               >
//                 <option value={5}>5</option>
//                 <option value={10}>10</option>
//                 <option value={25}>25</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//               <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>entries</span>
//             </div>
//             <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
//               Showing <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.startIndex}</span> to{' '}
//               <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.endIndex}</span> of{' '}
//               <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paginationData.totalItems}</span> entries
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
//                 ? isDark
//                   ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
//                   : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                 : isDark
//                   ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
//                 }`}
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>

//             <div className="flex items-center gap-1">
//               {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1)
//                 .filter(page => {
//                   // Show first page, last page, current page, and pages around current
//                   if (page === 1 || page === paginationData.totalPages) return true;
//                   if (Math.abs(page - currentPage) <= 1) return true;
//                   return false;
//                 })
//                 .map((page, index, array) => {
//                   // Add ellipsis
//                   const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
//                   return (
//                     <React.Fragment key={page}>
//                       {showEllipsisBefore && (
//                         <span className={`px-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>...</span>
//                       )}
//                       <button
//                         onClick={() => handlePageChange(page)}
//                         className={`px-3 py-1.5 rounded-lg text-sm font-medium border
//         ${currentPage === page
//                             ? isDark
//                               ? 'bg-blue-600 text-white border-blue-500'
//                               : 'bg-purple-600 text-white border-purple-500'
//                             : isDark
//                               ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
//                               : 'border-purple-200 text-purple-700 hover:bg-purple-50'
//                           }`}
//                       >
//                         {page}
//                       </button>
//                     </React.Fragment>
//                   );
//                 })}
//             </div>

//             <button
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === paginationData.totalPages}
//               className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === paginationData.totalPages
//                 ? isDark
//                   ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
//                   : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                 : isDark
//                   ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
//                 }`}
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Add Subscriber Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
//             <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
//               <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Customer</h3>
//               <button onClick={() => setIsModalOpen(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-5 h-5" /></button>
//             </div>
//             <div className="p-6 space-y-4">
//               {/* Account Info */}
//               <h4 className={`text-sm font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Account Information</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Group ID</label>
//                   <input type="number" name="userGroupId" value={newSubscriber.userGroupId} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Account ID</label>
//                   <input type="text" name="accountId" value={newSubscriber.accountId} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Username</label>
//                   <input type="text" name="userName" value={newSubscriber.userName} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Password</label>
//                   <input type="password" name="password" value={newSubscriber.password} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//               </div>

//               {/* Personal Info */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Personal Information</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>First Name</label>
//                   <input type="text" name="firstName" value={newSubscriber.firstName} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Last Name</label>
//                   <input type="text" name="lastName" value={newSubscriber.lastName} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Phone Number</label>
//                   <input type="tel" name="phoneNumber" value={newSubscriber.phoneNumber} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email ID</label>
//                   <input type="email" name="emailId" value={newSubscriber.emailId} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//               </div>

//               {/* Service Info */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Service Details</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Type</label>
//                   <select name="userType" value={newSubscriber.userType} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
//                     <option value="business">Business</option>
//                     <option value="home">Home</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>CAF Number</label>
//                   <input type="text" name="caf_num" value={newSubscriber.caf_num} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Activation Date</label>
//                   <select name="activationDate" value={newSubscriber.activationDate} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
//                     <option value="now">Now</option>
//                     <option value="custom">Custom</option>
//                   </select>
//                 </div>
//                 {newSubscriber.activationDate === 'custom' && (
//                   <>
//                     <div>
//                       <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Activation</label>
//                       <input type="datetime-local" name="customActivationDate" value={newSubscriber.customActivationDate} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                     </div>
//                     <div>
//                       <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Expiration</label>
//                       <input type="datetime-local" name="customExpirationDate" value={newSubscriber.customExpirationDate} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                     </div>
//                   </>
//                 )}
//               </div>

//               {/* Address */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="col-span-2">
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Address Line 2</label>
//                   <input type="text" name="installation_address_line2" value={newSubscriber.installation_address_line2} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="Floor, Building, Street" />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>City</label>
//                   <input type="text" name="installation_address_city" value={newSubscriber.installation_address_city} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>State</label>
//                   <input type="text" name="installation_address_state" value={newSubscriber.installation_address_state} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pin Code</label>
//                   <input type="text" name="installation_address_pin" value={newSubscriber.installation_address_pin} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Country</label>
//                   <input type="text" name="installation_address_country" value={newSubscriber.installation_address_country} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//               </div>

//               {/* Settings */}
//               <div className="flex gap-6 mt-4">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input type="checkbox" name="createBilling" checked={newSubscriber.createBilling} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                   <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Create Billing</span>
//                 </label>
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input type="checkbox" name="notifyUserSms" checked={newSubscriber.notifyUserSms} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                   <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Notify User via SMS</span>
//                 </label>
//               </div>

//               {/* Documents */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Documents Upload</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {['idFile', 'addressFile', 'cafFile', 'reportFile', 'signFile', 'profilePicFile'].map((fileKey) => (
//                   <div key={fileKey}>
//                     <label className={`block text-sm font-medium mb-1 capitalize ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
//                       {fileKey.replace('File', '').replace(/([A-Z])/g, ' $1')}
//                     </label>
//                     <input type="file" name={fileKey} onChange={handleFileChange} className={`w-full text-sm ${isDark ? 'text-slate-400 file:bg-slate-800 file:text-slate-300' : 'text-gray-600 file:bg-gray-100 file:text-gray-700'} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold hover:file:bg-blue-100 transition-all`} />
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
//               <button onClick={() => setIsModalOpen(false)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
//               <button onClick={handleAddSubscriber} disabled={!newSubscriber.firstName || !newSubscriber.phoneNumber} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">Create Account</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Subscriber Modal */}
//       {isEditModalOpen && selectedSubscriber && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
//             <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
//               <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Customer</h3>
//               <button onClick={() => setIsEditModalOpen(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-5 h-5" /></button>
//             </div>
//             <div className="p-6 space-y-4">
//               {/* Account Info */}
//               <h4 className={`text-sm font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Account Information</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Group ID</label>
//                   <input type="number" name="userGroupId" value={editSubscriber.userGroupId} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Account ID</label>
//                   <input type="text" name="accountId" value={editSubscriber.accountId} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Username</label>
//                   <input type="text" name="userName" value={editSubscriber.userName} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//               </div>

//               {/* Personal Info */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Personal Information</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>First Name</label>
//                   <input type="text" name="firstName" value={editSubscriber.firstName} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Last Name</label>
//                   <input type="text" name="lastName" value={editSubscriber.lastName} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Phone Number</label>
//                   <input type="tel" name="phoneNumber" value={editSubscriber.phoneNumber} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email ID</label>
//                   <input type="email" name="emailId" value={editSubscriber.emailId} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//               </div>

//               {/* Service Info */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Service Details</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Type</label>
//                   <select name="userType" value={editSubscriber.userType} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
//                     <option value="business">Business</option>
//                     <option value="home">Home</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>CAF Number</label>
//                   <input type="text" name="caf_num" value={editSubscriber.caf_num} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Activation Date</label>
//                   <select name="activationDate" value={editSubscriber.activationDate} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
//                     <option value="now">Now</option>
//                     <option value="custom">Custom</option>
//                   </select>
//                 </div>
//                 {editSubscriber.activationDate === 'custom' && (
//                   <>
//                     <div>
//                       <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Activation</label>
//                       <input type="datetime-local" name="customActivationDate" value={editSubscriber.customActivationDate} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                     </div>
//                     <div>
//                       <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Expiration</label>
//                       <input type="datetime-local" name="customExpirationDate" value={editSubscriber.customExpirationDate} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                     </div>
//                   </>
//                 )}
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</label>
//                   <select name="status" value={editSubscriber.status} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
//                     <option value="Active">Active</option>
//                     <option value="Suspended">Suspended</option>
//                     <option value="Inactive">Inactive</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Address */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="col-span-2">
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Address Line 2</label>
//                   <input type="text" name="installation_address_line2" value={editSubscriber.installation_address_line2} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="Floor, Building, Street" />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>City</label>
//                   <input type="text" name="installation_address_city" value={editSubscriber.installation_address_city} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>State</label>
//                   <input type="text" name="installation_address_state" value={editSubscriber.installation_address_state} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pin Code</label>
//                   <input type="text" name="installation_address_pin" value={editSubscriber.installation_address_pin} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Country</label>
//                   <input type="text" name="installation_address_country" value={editSubscriber.installation_address_country} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
//                 </div>
//               </div>

//               {/* Settings */}
//               <div className="flex gap-6 mt-4">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input type="checkbox" name="createBilling" checked={editSubscriber.createBilling} onChange={handleEditInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                   <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Create Billing</span>
//                 </label>
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input type="checkbox" name="notifyUserSms" checked={editSubscriber.notifyUserSms} onChange={handleEditInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                   <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Notify User via SMS</span>
//                 </label>
//               </div>

//               {/* Documents */}
//               <h4 className={`text-sm font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Update Documents</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {['idFile', 'addressFile', 'cafFile', 'reportFile', 'signFile', 'profilePicFile'].map((fileKey) => (
//                   <div key={fileKey}>
//                     <label className={`block text-sm font-medium mb-1 capitalize ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
//                       {fileKey.replace('File', '').replace(/([A-Z])/g, ' $1')}
//                     </label>
//                     <input type="file" name={fileKey} onChange={handleEditFileChange} className={`w-full text-sm ${isDark ? 'text-slate-400 file:bg-slate-800 file:text-slate-300' : 'text-gray-600 file:bg-gray-100 file:text-gray-700'} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold hover:file:bg-blue-100 transition-all`} />
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
//               <button onClick={() => setIsEditModalOpen(false)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
//               <button onClick={handleUpdateSubscriber} disabled={!editSubscriber.firstName} className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">Update Customer</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* View Subscriber Modal */}
//       {isViewModalOpen && selectedSubscriber && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className={`rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
//             <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
//               <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscriber Details</h3>
//               <button onClick={() => setIsViewModalOpen(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-5 h-5" /></button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="col-span-2 flex items-center gap-4 pb-4 border-b">
//                   <div className={`w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0 ${isDark ? 'ring-2 ring-blue-500/20' : 'ring-2 ring-blue-500/10'}`}>
//                     {selectedSubscriber.name.charAt(0)}
//                   </div>
//                   <div>
//                     <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.name}</h4>
//                     <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{selectedSubscriber.id}</p>
//                   </div>
//                 </div>
//                 <div className="col-span-2">
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Mobile Number</label>
//                   <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>+91 9876543210</p>
//                 </div>
//                 <div className="col-span-2">
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Email</label>
//                   <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.name.toLowerCase().replace(' ', '.')}@example.com</p>
//                 </div>
//                 <div className="col-span-2">
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</label>
//                   <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.location}, Bangalore</p>
//                 </div>
//                 <div>
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Plan</label>
//                   <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.plan}</p>
//                 </div>
//                 <div>
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Technology</label>
//                   <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.tech}</p>
//                 </div>
//                 <div>
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Status</label>
//                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedSubscriber.status === 'Active'
//                     ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
//                     : selectedSubscriber.status === 'Suspended'
//                       ? (isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200')
//                       : (isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gray-100 text-gray-600 border border-gray-300')
//                     }`}>
//                     {selectedSubscriber.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
//                     {selectedSubscriber.status}
//                   </span>
//                 </div>
//                 <div>
//                   <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Due Amount</label>
//                   <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.due}</p>
//                 </div>
//               </div>
//             </div>

//             <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
//               <Link
//                 to={`/subscribers/${selectedSubscriber.id}`}
//                 state={{ subscriber: selectedSubscriber }}
//                 className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors
//              bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
//               >
//                 View more
//               </Link>


//               <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-500">Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SubscribersPage;



import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, XCircle, ChevronDown, ChevronLeft, ChevronRight, Edit, Eye } from 'lucide-react';
import { useEffect } from "react";
import { useTheme } from '../../context/ThemeContext';
import api from "../../api/axios";
import Lottie from "lottie-react";
import fadeSlideAnimation from "../../animations/Profile Avatar of Young Boy.json";



const SubscribersPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);const [totalPages, setTotalPages] = useState(1);
 const [showFilter, setShowFilter] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
const [selectedPlan, setSelectedPlan] = useState('All');
const [selectedStatus, setSelectedStatus] = useState('All');

  const [newSubscriber, setNewSubscriber] = useState({
    userGroupId: '',
    accountId: '',
    userName: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emailId: '',
    userType: 'business',
    activationDate: 'now',
    customActivationDate: '',
    customExpirationDate: '',
    installation_address_line2: '',
    installation_address_city: '',
    installation_address_pin: '',
    installation_address_state: '',
    installation_address_country: 'IN',
    caf_num: '',
    createBilling: true,
    notifyUserSms: true,
    // Files are handled separately in state or just appended to FormData
  });
  const [editSubscriber, setEditSubscriber] = useState({
    userGroupId: '',
    accountId: '',
    userName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emailId: '',
    userType: 'business',
    activationDate: 'now',
    customActivationDate: '',
    customExpirationDate: '',
    installation_address_line2: '',
    installation_address_city: '',
    installation_address_pin: '',
    installation_address_state: '',
    installation_address_country: 'IN',
    caf_num: '',
    createBilling: true,
    notifyUserSms: true,
    status: 'Active',
  });

  // Separate state for edit files
  const [editFiles, setEditFiles] = useState({
    idFile: null,
    addressFile: null,
    cafFile: null,
    reportFile: null,
    signFile: null,
    profilePicFile: null
  });

  // Separate state for files
  const [files, setFiles] = useState({
    idFile: null,
    addressFile: null,
    cafFile: null,
    reportFile: null,
    signFile: null,
    profilePicFile: null
  });

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    // Check if it matches DD-MM-YYYY HH:mm (e.g., 26-01-2026 10:30)
    const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})\s(\d{2}):(\d{2})$/;
    const match = dateStr.match(ddmmyyyy);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}`;
    }
    return dateStr; 
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSubscriber(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const handleEditFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      setEditFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const handleAddSubscriber = async () => {
    const formData = new FormData();

    // Append text fields
    Object.keys(newSubscriber).forEach(key => {
      if (key === 'createBilling' || key === 'notifyUserSms') {
        formData.append(key, newSubscriber[key] ? 'on' : 'off');
      } else {
        formData.append(key, newSubscriber[key]);
      }
    });

    // Append files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });

    try {
      const res = await api.post('/api/customer/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setIsModalOpen(false);
        fetchCustomers(currentPage, itemsPerPage);
        // Reset form
        setNewSubscriber({
          userGroupId: '', accountId: '', userName: '', password: '', firstName: '', lastName: '',
          phoneNumber: '', emailId: '', userType: 'business', activationDate: 'now',
          customActivationDate: '', customExpirationDate: '', installation_address_line2: '',
          installation_address_city: '', installation_address_pin: '', installation_address_state: '',
          installation_address_country: 'IN', caf_num: '', createBilling: true, notifyUserSms: true
        });
        setFiles({ idFile: null, addressFile: null, cafFile: null, reportFile: null, signFile: null, profilePicFile: null });
      }
    } catch (err) {
      console.error("Failed to create customer", err);
      alert("Failed to create customer: " + (err.response?.data?.message || err.message));
    }
  };

  const handleViewDetail = (subscriber) => {
    navigate(`/customers-details/${subscriber.id}`, { state: { subscriber } });
  };

  const handleEditClick = (subscriber, e) => {
    e.stopPropagation();
    setSelectedSubscriber(subscriber);
    setEditFiles({ idFile: null, addressFile: null, cafFile: null, reportFile: null, signFile: null, profilePicFile: null });
    setEditSubscriber({
      userGroupId: subscriber.userGroupId || '',
      accountId: subscriber.accountId || '',
      userName: subscriber.userName || '',
      firstName: subscriber.firstName || '',
      lastName: subscriber.lastName || '',
      phoneNumber: subscriber.phoneNumber || '',
      emailId: subscriber.emailId || '',
      userType: subscriber.userType || 'business',
      activationDate: subscriber.activationDate || 'now',
      customActivationDate: formatDateForInput(subscriber.customActivationDate) || '',
      customExpirationDate: formatDateForInput(subscriber.customExpirationDate) || '',
      installation_address_line2: subscriber.installationAddress?.line2 || '',
      installation_address_city: subscriber.installationAddress?.city || '',
      installation_address_pin: subscriber.installationAddress?.pin || '',
      installation_address_state: subscriber.installationAddress?.state || '',
      installation_address_country: subscriber.installationAddress?.country || 'IN',
      caf_num: subscriber.cafNum || '',
      createBilling: subscriber.createBilling === 'on' || subscriber.createBilling === true,
      notifyUserSms: subscriber.notifyUserSms === 'on' || subscriber.notifyUserSms === true,
      status: subscriber.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  // const handleViewClick = (subscriber, e) => {
  //   e.stopPropagation();
  //   setSelectedSubscriber(subscriber);
  //   setIsViewModalOpen(true);
  // };
  const handleViewClick = (subscriber, e) => {
    e.stopPropagation(); // prevents row click issues (important in tables)

    navigate(`/customer-details/${subscriber.id}`, {
      state: { subscriber }
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditSubscriber(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdateSubscriber = async () => {
    if (!selectedSubscriber) return;

    try {
      const formData = new FormData();

      // Append text fields
      Object.keys(editSubscriber).forEach(key => {
        if (key === 'createBilling' || key === 'notifyUserSms') {
          formData.append(key, editSubscriber[key] ? 'on' : 'off');
        } else {
          formData.append(key, editSubscriber[key]);
        }
      });

      // Append files
      Object.keys(editFiles).forEach(key => {
        if (editFiles[key]) {
          formData.append(key, editFiles[key]);
        }
      });

      const updateId = selectedSubscriber.activlineUserId || selectedSubscriber.id;
      const res = await api.post(`/api/customer/update/${updateId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setIsEditModalOpen(false);
        fetchCustomers(currentPage, itemsPerPage);
        setSelectedSubscriber(null);
      } else {
        alert("Failed to update customer");
      }
    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

const fetchCustomers = useCallback(async (page, limit) => {
  try {
    setLoading(true);

      const res = await api.get('/api/customer/customers', {
        params: {
          page,
          limit,
          search: searchTerm,
          status: selectedStatus,
          plan: selectedPlan,
        }
    });

    const { data, pagination } = res.data;

    setTotalItems(pagination.total || 0);
    setTotalPages(pagination.totalPages || 1);

    const customers = data || [];

    const formatted = customers.map(c => ({
      ...c,
      id: c._id,
      name: `${c.firstName || ""} ${c.lastName || ""}`,
      mobile: c.phoneNumber,
      email: c.emailId,
      location: c.address?.city || "N/A",
      plan: c.userType || "Plan N/A",
      tech: "Fiber",
      status: c.status || "Active",
    }));

    setSubscribers(formatted);

  } catch (err) {
    console.error("Failed to fetch customers", err);
  } finally {
    setLoading(false);
  }
}, [searchTerm, selectedStatus, selectedPlan]);


useEffect(() => {
  fetchCustomers(currentPage, itemsPerPage);
}, [fetchCustomers, currentPage, itemsPerPage]);


  // Pagination calculations

  const paginationData = useMemo(() => {
    return {
      paginatedSubscribers: subscribers,
      totalPages: totalPages,
      totalItems: totalItems,
      startIndex: totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
      endIndex: Math.min(currentPage * itemsPerPage, totalItems)
    };
  }, [subscribers, totalPages, totalItems, currentPage, itemsPerPage]);

const handlePageChange = (page) => {
  if (page < 1 || page > totalPages) return;
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className={`rounded-xl shadow-sm border flex flex-col h-full relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
    <div className="flex items-center gap-3">

  {/* 🎬 Lottie Animation */}

  <div className="w-30 h-20">
    <Lottie animationData={fadeSlideAnimation} loop={true} />
  </div>

  {/* 📝 Text */}
  <div>
    <h2
      className={`text-2xl font-bold ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      Customers
    </h2>

    <p
      className={`text-base ${
        isDark ? "text-slate-400" : "text-gray-600"
      }`}
    >
      Manage users, activations
    </p>
  </div>

</div>


 <div className="flex gap-3 relative items-center w-full md:w-auto">

  {/* 🔍 Search Box */}
  <div className="relative flex-1 md:flex-none">
    <Search
      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
        isDark ? 'text-slate-400' : 'text-gray-400'
      }`}
    />
    <input
      type="text"
      placeholder="Search Customers..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
      }}
      className={`w-full md:w-64 pl-9 pr-3 py-2 border rounded-lg text-sm outline-none 
        focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all
        ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
        }`}
    />
  </div>

  {/* 🧰 Filter Button */}
  <button
    onClick={() => setShowFilter(prev => !prev)}
    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-base transition-all
      ${isDark 
        ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
  >
    <Filter className="w-4 h-4" />
    Filter
  </button>

  {/* ➕ Add Customer */}
  <button
    onClick={() => setIsModalOpen(true)}
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all text-base"
  >
    <Plus className="w-4 h-4" />
    Add Customer
  </button>

  {/* ✅ Filter Popup (UNCHANGED) */}
  {showFilter && (
    <div className={`absolute right-0 top-12 w-72 p-4 rounded-xl shadow-2xl border z-50 animate-in fade-in zoom-in duration-150
      ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>

      <h4 className={`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Filters
      </h4>

      <label className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
        Plan
      </label>
      <select
        value={selectedPlan}
        onChange={(e) => {
          setSelectedPlan(e.target.value);
          setCurrentPage(1);
        }}
        className={`w-full mt-1 mb-3 p-2 border rounded-lg text-base
          ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`}
      >
        <option value="All">All Plans</option>
        <option value="business">Business</option>
        <option value="home">Home</option>
      </select>

      <label className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
        Status
      </label>
      <select
        value={selectedStatus}
        onChange={(e) => {
          setSelectedStatus(e.target.value);
          setCurrentPage(1);
        }}
        className={`w-full mt-1 mb-3 p-2 border rounded-lg text-base
          ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`}
      >
        <option value="All">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      <button
        onClick={() => {
          setSelectedPlan('All');
          setSelectedStatus('All');
          setSearchTerm('');
          setCurrentPage(1);
        }}
        className="w-full mt-2 py-2 text-base font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
      >
        Clear Filters
      </button>
    </div>
  )}
</div>



      </div>

      <div className="flex-1 flex flex-col min-h-0 p-6">
        {/* <div className="relative mb-6 flex-shrink-0">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
         <input
  type="text"
  placeholder="Search by name, mobile, or email..."
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }}
  className="..."
  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
/>

        </div> */}

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={`rounded-lg border overflow-hidden h-full ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="overflow-x-auto overflow-y-auto h-full">
              <table className="w-full text-left">
                <thead>
                  <tr className={`${isDark ? 'bg-slate-800/50 border-b border-slate-800' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Customer</th>
                    <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Contact</th>
                    <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Plan Info</th>
                    <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</th>
                    <th className={`py-4 px-6 text-sm font-semibold uppercase tracking-wider text-right ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                  {paginationData.paginatedSubscribers.length > 0 ? (
                    paginationData.paginatedSubscribers.map((sub, i) => (
                      <tr
                        key={i}
                        className={`group transition-all duration-150 ${isDark ? 'hover:bg-slate-800/50 bg-slate-900/30' : 'hover:bg-gray-50 bg-white'}`}
                      >
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-base flex-shrink-0 ${isDark ? 'ring-2 ring-blue-500/20' : 'ring-2 ring-blue-500/10'}`}>
                              {sub.name.charAt(0)}
                            </div>
                            <div className="min-w-0">

                              <div className={`font-semibold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{sub.name}</div>
                              <div className={`text-sm mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{sub.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className={`text-base font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{sub.mobile || 'N/A'}</div>
                          <div className={`text-sm mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{sub.email || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className={`text-base font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{sub.plan}</div>
                          <div className={`text-sm mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{sub.tech}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${sub.status === 'Active'
                            ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
                            : sub.status === 'Suspended'
                              ? (isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200')
                              : (isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gray-100 text-gray-600 border border-gray-300')
                            }`}>
                            {sub.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleViewClick(sub, e)}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleEditClick(sub, e)}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-green-400' : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'}`}
                              title="Edit Customer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className={`py-12 text-center text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        No subscribers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className={`mt-6 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className={`px-3 py-1.5 border rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>entries</span>
            </div>
          <div className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
  Showing{" "}
  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
    {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
  </span>
  {" "}to{" "}
  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
    {Math.min(currentPage * itemsPerPage, totalItems)}
  </span>
  {" "}of{" "}
  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
    {totalItems}
  </span>
  {" "}entries
</div>

          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-base font-medium transition-all ${currentPage === 1
                ? isDark
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages}, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current
                  if (page === 1 || page === paginationData.totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  // Add ellipsis
                  const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className={`px-2 text-base ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-lg text-base font-medium border
        ${currentPage === page
                            ? isDark
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-purple-600 text-white border-purple-500'
                            : isDark
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                          }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === totalPages}

              className={`px-3 py-2 rounded-lg text-base font-medium transition-all ${currentPage === paginationData.totalPages
                ? isDark
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Subscriber Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Customer</h3>
              <button onClick={() => setIsModalOpen(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Account Info */}
              <h4 className={`text-base font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Group ID</label>
                  <input type="number" name="userGroupId" value={newSubscriber.userGroupId} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Account ID</label>
                  <input type="text" name="accountId" value={newSubscriber.accountId} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Username</label>
                  <input type="text" name="userName" value={newSubscriber.userName} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Password</label>
                  <input type="password" name="password" value={newSubscriber.password} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              {/* Personal Info */}
              <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>First Name</label>
                  <input type="text" name="firstName" value={newSubscriber.firstName} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Last Name</label>
                  <input type="text" name="lastName" value={newSubscriber.lastName} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Phone Number</label>
                  <input type="tel" name="phoneNumber" value={newSubscriber.phoneNumber} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email ID</label>
                  <input type="email" name="emailId" value={newSubscriber.emailId} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              {/* Service Info */}
              <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Service Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Type</label>
                  <select name="userType" value={newSubscriber.userType} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                    <option value="business">Business</option>
                    <option value="home">Home</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>CAF Number</label>
                  <input type="text" name="caf_num" value={newSubscriber.caf_num} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Activation Date</label>
                  <select name="activationDate" value={newSubscriber.activationDate} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                    <option value="now">Now</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {newSubscriber.activationDate === 'custom' && (
                  <>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Activation</label>
                      <input type="datetime-local" name="customActivationDate" value={newSubscriber.customActivationDate} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    </div>
                    <div>
                      <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Expiration</label>
                      <input type="datetime-local" name="customExpirationDate" value={newSubscriber.customExpirationDate} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    </div>
                  </>
                )}
              </div>

              {/* Address */}
              <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Address Line 2</label>
                  <input type="text" name="installation_address_line2" value={newSubscriber.installation_address_line2} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="Floor, Building, Street" />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>City</label>
                  <input type="text" name="installation_address_city" value={newSubscriber.installation_address_city} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>State</label>
                  <input type="text" name="installation_address_state" value={newSubscriber.installation_address_state} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pin Code</label>
                  <input type="text" name="installation_address_pin" value={newSubscriber.installation_address_pin} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Country</label>
                  <input type="text" name="installation_address_country" value={newSubscriber.installation_address_country} onChange={handleInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              {/* Settings */}
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="createBilling" checked={newSubscriber.createBilling} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Create Billing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="notifyUserSms" checked={newSubscriber.notifyUserSms} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Notify User via SMS</span>
                </label>
              </div>

              {/* Documents */}
              <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Documents Upload</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['idFile', 'addressFile', 'cafFile', 'reportFile', 'signFile', 'profilePicFile'].map((fileKey) => (
                  <div key={fileKey}>
                    <label className={`block text-base font-medium mb-1 capitalize ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {fileKey.replace('File', '').replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input type="file" name={fileKey} onChange={handleFileChange} className={`w-full text-base ${isDark ? 'text-slate-400 file:bg-slate-800 file:text-slate-300' : 'text-gray-600 file:bg-gray-100 file:text-gray-700'} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold hover:file:bg-blue-100 transition-all`} />
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <button onClick={() => setIsModalOpen(false)} className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={handleAddSubscriber} disabled={!newSubscriber.firstName || !newSubscriber.phoneNumber} className="px-4 py-2 text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">Create Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {isEditModalOpen && selectedSubscriber && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
               <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Customer</h3>
              <button onClick={() => setIsEditModalOpen(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Account Info */}
               <h4 className={`text-base font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Group ID</label>
                   <input type="number" name="userGroupId" value={editSubscriber.userGroupId} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Account ID</label>
                   <input type="text" name="accountId" value={editSubscriber.accountId} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Username</label>
                   <input type="text" name="userName" value={editSubscriber.userName} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              {/* Personal Info */}
               <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>First Name</label>
                   <input type="text" name="firstName" value={editSubscriber.firstName} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Last Name</label>
                   <input type="text" name="lastName" value={editSubscriber.lastName} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Phone Number</label>
                   <input type="tel" name="phoneNumber" value={editSubscriber.phoneNumber} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email ID</label>
                   <input type="email" name="emailId" value={editSubscriber.emailId} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              {/* Service Info */}
               <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Service Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Type</label>
                   <select name="userType" value={editSubscriber.userType} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                    <option value="business">Business</option>
                    <option value="home">Home</option>
                  </select>
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>CAF Number</label>
                   <input type="text" name="caf_num" value={editSubscriber.caf_num} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Activation Date</label>
                   <select name="activationDate" value={editSubscriber.activationDate} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                    <option value="now">Now</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {editSubscriber.activationDate === 'custom' && (
                  <>
                    <div>
                       <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Activation</label>
                       <input type="datetime-local" name="customActivationDate" value={editSubscriber.customActivationDate} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    </div>
                    <div>
                       <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Custom Expiration</label>
                       <input type="datetime-local" name="customExpirationDate" value={editSubscriber.customExpirationDate} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    </div>
                  </>
                )}
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</label>
                   <select name="status" value={editSubscriber.status} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Address */}
               <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Address Line 2</label>
                   <input type="text" name="installation_address_line2" value={editSubscriber.installation_address_line2} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="Floor, Building, Street" />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>City</label>
                   <input type="text" name="installation_address_city" value={editSubscriber.installation_address_city} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>State</label>
                   <input type="text" name="installation_address_state" value={editSubscriber.installation_address_state} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pin Code</label>
                   <input type="text" name="installation_address_pin" value={editSubscriber.installation_address_pin} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                   <label className={`block text-base font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Country</label>
                   <input type="text" name="installation_address_country" value={editSubscriber.installation_address_country} onChange={handleEditInputChange} className={`w-full p-2.5 border rounded-lg text-base outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              {/* Settings */}
              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="createBilling" checked={editSubscriber.createBilling} onChange={handleEditInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                   <span className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Create Billing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="notifyUserSms" checked={editSubscriber.notifyUserSms} onChange={handleEditInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                   <span className={`text-base ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Notify User via SMS</span>
                </label>
              </div>

              {/* Documents */}
               <h4 className={`text-base font-bold uppercase mt-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Update Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['idFile', 'addressFile', 'cafFile', 'reportFile', 'signFile', 'profilePicFile'].map((fileKey) => (
                  <div key={fileKey}>
                     <label className={`block text-base font-medium mb-1 capitalize ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {fileKey.replace('File', '').replace(/([A-Z])/g, ' $1')}
                    </label>
                     <input type="file" name={fileKey} onChange={handleEditFileChange} className={`w-full text-base ${isDark ? 'text-slate-400 file:bg-slate-800 file:text-slate-300' : 'text-gray-600 file:bg-gray-100 file:text-gray-700'} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold hover:file:bg-blue-100 transition-all`} />
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
               <button onClick={() => setIsEditModalOpen(false)} className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
               <button onClick={handleUpdateSubscriber} disabled={!editSubscriber.firstName} className="px-4 py-2 text-base font-bold text-white bg-green-600 rounded-lg hover:bg-green-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">Update Customer</button>
            </div>
          </div>
        </div>
      )}

      {/* View Subscriber Modal */}
      {isViewModalOpen && selectedSubscriber && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
               <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscriber Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-4 pb-4 border-b">
                   <div className={`w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0 ${isDark ? 'ring-2 ring-blue-500/20' : 'ring-2 ring-blue-500/10'}`}>
                    {selectedSubscriber.name.charAt(0)}
                  </div>
                  <div>
                     <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.name}</h4>
                     <p className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{selectedSubscriber.id}</p>
                  </div>
                </div>
                <div className="col-span-2">
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Mobile Number</label>
                   <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>+91 9876543210</p>
                </div>
                <div className="col-span-2">
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Email</label>
                   <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.name.toLowerCase().replace(' ', '.')}@example.com</p>
                </div>
                <div className="col-span-2">
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Installation Address</label>
                   <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.location}, Bangalore</p>
                </div>
                <div>
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Plan</label>
                   <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.plan}</p>
                </div>
                <div>
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Technology</label>
                   <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.tech}</p>
                </div>
                <div>
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Status</label>
                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${selectedSubscriber.status === 'Active'
                    ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
                    : selectedSubscriber.status === 'Suspended'
                      ? (isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200')
                      : (isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-gray-100 text-gray-600 border border-gray-300')
                    }`}>
                    {selectedSubscriber.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                    {selectedSubscriber.status}
                  </span>
                </div>
                <div>
                   <label className={`block text-sm font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Due Amount</label>
                   <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubscriber.due}</p>
                </div>
              </div>
            </div>

            <div className={`p-4 border-t flex gap-3 justify-end rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              <Link
                to={`/subscribers/${selectedSubscriber.id}`}
                state={{ subscriber: selectedSubscriber }}
                 className="px-4 py-2 text-base font-medium rounded-lg border transition-colors
             bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
              >
                View more
              </Link>


               <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-base font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-500">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribersPage;
