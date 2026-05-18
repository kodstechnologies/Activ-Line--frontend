// import { useState } from "react";
import { 
  Edit, 
  Trash2, 
  Search, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
// import { itemsPerPageOptions } from "../../../../data/CannedResponsedata";
import { useEffect, useState } from "react";
import { getCannedCategories } from "../../../../api/cannedResponse.api";

const AllResponses = ({
  responses,
  filteredResponses,
  onDelete,
  isDark,
  search,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  selectedCategory,
  setSelectedCategory
}) => {

  const [copiedId, setCopiedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", message: "" });

  // Calculate pagination
  const totalItems = filteredResponses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredResponses.slice(startIndex, endIndex);
console.log("All responses")
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleEdit = (response) => {
    setEditing(response.id);
    setForm({ title: response.title, message: response.message });
    document.querySelector('[data-editor]')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1);
  };
const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await getCannedCategories();
      setCategories(res.data.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };
  fetchCategories();
}, []);

  // Generate visible page numbers
  const getVisiblePageNumbers = () => {
    const visiblePages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          visiblePages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          visiblePages.push(i);
        }
      }
    }
    
    return visiblePages;
  };

  return (
    <div>
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div>
    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
      All Responses
    </h3>
    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      Showing {currentItems.length} of {filteredResponses.length} responses
      {search && ` for "${search}"`}
    </p>
  </div>

  {/* 🔽 CATEGORY DROPDOWN */}
  <select
    value={selectedCategory || ""}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className={`px-4 py-2 rounded-lg border text-sm
      ${isDark
        ? "bg-gray-900 border-gray-700 text-white"
        : "bg-white border-gray-300 text-gray-900"
      }`}
  >
    <option value="" disabled>
      Select Category
    </option>
    {categories.map((cat) => (
      <option key={cat._id} value={cat._id}>
        {cat.name}
      </option>
    ))}
  </select>
</div>


      {currentItems.length === 0 ? (
        <div className={`text-center py-16 border-2 border-dashed rounded-2xl ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
          <Search className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No responses found
          </h3>
          <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
            {search ? "Try a different search term" : "Create your first response to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {currentItems.map((response) => (
              <div
                key={response.id}
                className={`group rounded-xl border p-5 transition-all duration-200
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-700' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                  } hover:shadow-xl`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {response.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleCopy(response.message, response.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors
                          ${isDark 
                            ? 'text-gray-400 hover:text-green-400' 
                            : 'text-gray-500 hover:text-green-600'
                          }`}
                      >
                        {copiedId === response.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy message
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(response)}
                      className={`p-2 rounded-lg transition-colors
                        ${isDark 
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20' 
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(response.id)}
                      className={`p-2 rounded-lg transition-colors
                        ${isDark 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative mb-4">
                  <div className={`absolute -left-3 top-0 bottom-0 w-0.5 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}></div>
                  <p className={`text-sm pl-3 line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {response.message}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleCopy(response.message, response.id)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
                      border transition-colors
                      ${isDark 
                        ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {copiedId === response.id ? (
                      <>
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Copied to clipboard!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="font-medium">Copy to clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{startIndex + 1}-{endIndex}</span> of{" "}
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalItems}</span> responses
              </div>
              
              <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 disabled:opacity-30' : 'hover:bg-gray-100 disabled:opacity-30'} disabled:cursor-not-allowed`}
                >
                  <ChevronsLeft className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
                
                {/* Previous Page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 disabled:opacity-30' : 'hover:bg-gray-100 disabled:opacity-30'} disabled:cursor-not-allowed`}
                >
                  <ChevronLeft className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getVisiblePageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                        ${currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'text-gray-400 hover:bg-gray-800'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                {/* Next Page */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 disabled:opacity-30' : 'hover:bg-gray-100 disabled:opacity-30'} disabled:cursor-not-allowed`}
                >
                  <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
                
                {/* Last Page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 disabled:opacity-30' : 'hover:bg-gray-100 disabled:opacity-30'} disabled:cursor-not-allowed`}
                >
                  <ChevronsRight className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
              </div>
              
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Page <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentPage}</span> of{" "}
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalPages}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllResponses;