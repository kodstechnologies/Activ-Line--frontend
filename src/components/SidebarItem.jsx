// import React from "react";

// const SidebarItem = ({ icon: Icon, label, active, onClick, role, collapsed, isDark }) => {

//   const getAccentColor = () => {
//     if (!isDark) {
//       switch (role) {
//         case "admin":
//         case "SUPER_ADMIN":
//           return "border-purple-600 text-purple-700 bg-purple-50";
//         case "franchise":
//           return "border-purple-500 text-purple-600 bg-purple-50";
//         case "staff":
//           return "border-green-600 text-green-700 bg-green-50";
//         default:
//           return "border-gray-400 text-gray-600 bg-gray-50";
//       }
//     }

//     // 🌙 Dark mode
//     switch (role) {
//       case "admin":
//       case "SUPER_ADMIN":
//         return "border-blue-500 text-blue-400 bg-blue-500/10";
//       case "franchise":
//         return "border-orange-500 text-orange-400 bg-orange-500/10";
//       case "staff":
//         return "border-emerald-500 text-emerald-400 bg-emerald-500/10";
//       default:
//         return "border-slate-600 text-slate-400 bg-slate-800";
//     }
//   };
//   const getIconColor = () => {
//     if (!active) return "";

//     if (!isDark) {
//       switch (role) {
//         case "admin":
//         case "SUPER_ADMIN":
//           return "text-purple-600";
//         case "franchise":
//           return "text-purple-600";
//         case "staff":
//           return "text-green-600";
//         default:
//           return "text-gray-600";
//       }
//     }

//     // dark mode
//     switch (role) {
//       case "admin":
//       case "SUPER_ADMIN":
//         return "text-blue-400";
//       case "franchise":
//         return "text-orange-400";
//       case "staff":
//         return "text-emerald-400";
//       default:
//         return "text-slate-400";
//     }
//   };
//   const getHoverColor = () => {
//     if (isDark) {
//       return "hover:text-white hover:bg-slate-800";
//     }

//     switch (role) {
//       case "admin":
//       case "SUPER_ADMIN":
//         return "hover:text-purple-600 hover:bg-purple-50";
//       case "franchise":
//         return "hover:text-purple-600 hover:bg-purple-50";
//       case "staff":
//         return "hover:text-green-600 hover:bg-green-50";
//       default:
//         return "hover:text-gray-600 hover:bg-gray-100";
//     }
//   };


//   const accentColor = getAccentColor();

//   const getTextColor = () => {
//   if (!active) return "";

//   if (isDark) {
//     return "text-white";
//   }

//   return "";
// };

//   return (
//     <button
//       onClick={onClick}
//       className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-4
//     ${collapsed ? 'px-3' : 'px-5'} py-4 text-base font-medium rounded-xl mb-1.5
//     transition-all duration-300 group relative ${getTextColor()}
//     ${active
//           ? `${collapsed
//             ? (!isDark ? 'bg-purple-100/80 text-purple-700' : 'bg-blue-500/10')
//             : `border-l-4 ${accentColor} shadow-sm`
//           }`
//           : `text-slate-400 ${getHoverColor()}`
//         }
//   `}
//     >

//       <Icon
//         className={`w-6 h-6 flex-shrink-0 transition-colors ${getIconColor()}`}
//       />

//       {!collapsed && <span className="whitespace-nowrap">{label}</span>}
//       {collapsed && active && (
//         <span className={`absolute left-full ml-2 px-2 py-1 text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 ${!isDark
//           ? "bg-purple-600 text-white"
//           : (role === "admin" || role === "SUPER_ADMIN" ? "bg-blue-500 text-white" : "bg-orange-500 text-white")
//           }`}>
//           {label}
//         </span>
//       )}
//     </button>
//   );
// };

// export default SidebarItem;



import React from "react";

const SidebarItem = ({ icon: Icon, label, active, onClick, onPrefetch, role, collapsed, isDark }) => {

  const getAccentColor = () => {
    if (!isDark) {
      switch (role) {
        case "admin":
        case "SUPER_ADMIN":
          return "border-purple-600 text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100 shadow-purple-100";
        case "franchise":
          return "border-purple-500 text-purple-600 bg-gradient-to-r from-purple-50 to-purple-100 shadow-purple-100";
        case "staff":
          return "border-emerald-600 text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100 shadow-emerald-100";
        default:
          return "border-indigo-400 text-indigo-600 bg-gradient-to-r from-gray-50 to-indigo-50 shadow-gray-100";
      }
    }

    // 🌙 Dark mode - Enhanced for better contrast
    switch (role) {
      case "admin":
      case "SUPER_ADMIN":
        return "border-blue-400 text-blue-300 bg-gradient-to-r from-blue-500/15 to-blue-600/10 shadow-blue-900/30";
      case "franchise":
        return "border-orange-400 text-orange-300 bg-gradient-to-r from-orange-500/15 to-orange-600/10 shadow-orange-900/30";
      case "staff":
        return "border-emerald-400 text-emerald-300 bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 shadow-emerald-900/30";
      default:
        return "border-slate-500 text-slate-300 bg-gradient-to-r from-slate-800/80 to-slate-900/60 shadow-slate-900/50";
    }
  };
  
  const getIconColor = () => {
    if (!active) return isDark ? "text-slate-500" : "text-gray-500";

    if (!isDark) {
      switch (role) {
        case "admin":
        case "SUPER_ADMIN":
          return "text-purple-600";
        case "franchise":
          return "text-purple-600";
        case "staff":
          return "text-emerald-600";
        default:
          return "text-indigo-600";
      }
    }

    // Enhanced dark mode icon colors
    switch (role) {
      case "admin":
      case "SUPER_ADMIN":
        return "text-blue-400";
      case "franchise":
        return "text-orange-400";
      case "staff":
        return "text-emerald-400";
      default:
        return "text-slate-300";
    }
  };
  
  const getHoverColor = () => {
    if (isDark) {
      return "hover:text-white hover:bg-gradient-to-r hover:from-slate-800/80 hover:to-slate-900/60 hover:shadow-lg hover:shadow-slate-900/30";
    }

    switch (role) {
      case "admin":
      case "SUPER_ADMIN":
        return "hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:shadow-purple-100";
      case "franchise":
        return "hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:shadow-purple-100";
      case "staff":
        return "hover:text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 hover:shadow-emerald-100";
      default:
        return "hover:text-indigo-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:shadow-gray-100";
    }
  };

  const accentColor = getAccentColor();

  const getTextColor = () => {
    if (active) {
      return isDark ? "text-white font-semibold" : "font-semibold";
    }
    return isDark ? "text-slate-400" : "text-gray-600";
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-4
    ${collapsed ? 'px-3' : 'px-5'} py-3.5 text-base font-small rounded-xl mb-1.5
    transition-all duration-300 group relative ${getTextColor()}
    hover:scale-[1.02] active:scale-[0.98] transform-gpu
    ${active
          ? `${collapsed
            ? (!isDark 
                ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 shadow-lg shadow-purple-200/50' 
                : 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300 shadow-lg shadow-blue-900/30')
            : `border-l-4 ${accentColor} shadow-lg transform translate-x-1`
          }`
          : `border-l-2 border-transparent ${getHoverColor()}`
        }
  `}
    >
      <div className="relative">
        <Icon
          className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${getIconColor()} 
          ${active ? 'scale-110' : 'scale-100'}`}
        />
        {active && (
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping
            ${!isDark 
              ? (role === "staff" ? "bg-emerald-500" : "bg-purple-500") 
              : (role === "staff" ? "bg-emerald-400" : role === "franchise" ? "bg-orange-400" : "bg-blue-400")
            }`}
          />
        )}
      </div>

      {!collapsed && (
        <span className="whitespace-nowrap text-lg font-medium tracking-wide">{label}</span>
      )}
      
      {collapsed && active && (
        <span className={`absolute left-full ml-2 px-3 py-2 text-sm font-semibold rounded-lg shadow-xl whitespace-nowrap 
          opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-all duration-300
          transform group-hover:translate-x-0 -translate-x-2
          ${!isDark
            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/50"
            : (role === "admin" || role === "SUPER_ADMIN" 
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50" 
                : role === "franchise"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/50"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/50")
          }`}
        >
          {label}
          <span className={`absolute left-0 top-1/2 -ml-1 w-2 h-2 rotate-45
            ${!isDark
              ? "bg-purple-600"
              : (role === "admin" || role === "SUPER_ADMIN" 
                  ? "bg-blue-500" 
                  : role === "franchise"
                  ? "bg-orange-500"
                  : "bg-emerald-500")
            }`}
          />
        </span>
      )}
    </button>
  );
};

export default SidebarItem;
