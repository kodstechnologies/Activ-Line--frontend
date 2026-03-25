import React, { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layout/MainLayout";
// Settings - Canned Responses
import Main from "../pages/Admin/Settings/CannedResponses/CannedResponses.jsx";
import CategoryResponses from
  "../pages/Admin/Settings/CannedResponses/CategoryResponses.jsx";
import Categories from "../pages/Admin/Settings/CannedResponses/Categories.jsx";


// import SubscriberDetailPage from "../pages/Admin/CustomerDetails";
// import SubscribersPage from "../pages/Admin/Customers";
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage.jsx"));

// Admin
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const DashboardPage = lazy(() =>
  import("../pages/Admin/DashboardPage/DashboardPage")
);
const StaffDashboardPage = lazy(() =>
  import("../pages/Staff/Dashboard/Staffdashboard")
);
const StaffCustomersPage = lazy(() =>
  import("../pages/Staff/Customers/StaffCustomers")
);
const StaffCustomerDetailsPage = lazy(() =>
  import("../pages/Staff/Customers/Staffcustomerdetails")
);
const Customers = lazy(() => import("../pages/Admin/Customers"));
const CustomerPlans = lazy(() => import("../pages/Admin/CustomerPlans"));
const CustomerDetails = lazy(() => import("../pages/Admin/CustomerDetails"));
const FranchiseCustomerDetails = lazy(() => import("../pages/Franchise/CustomerDetails"));
const FieldStaffPage = lazy(() => import("../pages/Admin/FieldStaffPage"));
const Staff = lazy(() => import("../pages/Admin/Staff"));
const Reports = lazy(() => import("../pages/Admin/Reports"));
const StaffReports = lazy(() => import("../pages/Staff/Staff Reports/StaffReports"));
const Logs = lazy(() => import("../pages/Admin/Logs"));
const Plans = lazy(() => import("../pages/Admin/Plans"));
const Payments = lazy(() => import("../pages/Admin/Payments"));
const OffersPage = lazy(() => import("../pages/Admin/OffersPage"));
const Tickets = lazy(() => import("../pages/Admin/Tickets"));
const SettingsPage = lazy(() => import("../pages/Admin/Settings/SettingsPage"));
const Frenchiseadmin = lazy(() =>
  import("../pages/Admin/Frenchiseadmin/Frenchiseadmin")
);
const AdminNotifications = lazy(() =>
  import("../pages/Admin/Notification/AdminNotification")
);
const FranchiseNotifications = lazy(() =>
  import("../pages/Franchise/Notification/FranchiseNotification")
);
const StaffNotifications = lazy(() =>
  import("../pages/Staff/Notification/StaffNotification")
);

const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const FranchisePage = lazy(() => import("../pages/Admin/Franchise"));

//franchise
const FranchiseDashboard = lazy(() =>
  import("../pages/Franchise/Dashboard/Dashboard")
);
const FranchiseCustomers = lazy(() => import('../pages/Franchise/Customers'));
const LocalStaff = lazy(() => import("../pages/Franchise/LocalStaff"));
const Collections = lazy(() => import("../pages/Franchise/Collections"));
const FranchisePlans = lazy(() => import("../pages/Franchise/Frenchiseplans"));
const PaymentHistory = lazy(() => import("../pages/Franchise/Paymenthistory"));
const StaffPaymentHistory = lazy(() => import("../pages/Staff/Payment_History/Paymenthistory"));
// const ZoneSupport = lazy(() => import('../pages/Franchise/ZoneSupport'));
const ZoneTickets = lazy(() => import("../pages/Franchise/ZoneTickets"));
const FranchiseProfile = lazy(() => import("../pages/Franchise/Frenchiseprofile"));
const FranchiseReport = lazy(() => import("../pages/Franchise/FrenchiseReport"));

//staff
const AssignedTickets = lazy(() => import("../pages/Staff/AssignedTickets"));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="text-slate-400">Loading...</div>
  </div>
);

// Public route wrapper (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProfileSwitcher = ({ franchiseUser, onUpdate }) => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (["franchise", "franchise_admin"].includes(role)) {
    return <FranchiseProfile franchiseUser={franchiseUser} onUpdate={onUpdate} />;
  }
  return <ProfilePage />;
};

const DashboardSwitcher = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (["staff", "admin_staff"].includes(role)) {
    return <StaffDashboardPage />;
  }
  return <DashboardPage />;
};

const CustomersSwitcher = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (["staff", "admin_staff"].includes(role)) {
    return <StaffCustomersPage />;
  }
  return <Customers />;
};

const ReportsSwitcher = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (["staff", "admin_staff"].includes(role)) {
    return <StaffReports />;
  }
  return <Reports />;
};

const Router = () => {
  const [franchiseUser, setFranchiseUser] = useState({
    name: "Sathya Networks",
    role: "Franchise Admin",
    zone: "Indiranagar - Sector 4",
  });
  return (
    <BrowserRouter>
   
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* 🔔 NOTIFICATIONS */}
          <Route
            path="admin-notifications"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                
                  <AdminNotifications />
                
              </ProtectedRoute>
            }
          />

          <Route
            path="franchise-notifications"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                
                  <FranchiseNotifications />
                
              </ProtectedRoute>
            }
          />

          <Route
            path="staff-notifications"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin_staff"]}>
                
                  <StaffNotifications />
                
              </ProtectedRoute>
            }
          />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
                <DashboardSwitcher />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="franchise"
            element={
              <ProtectedRoute allowedRoles={['admin', 'SUPER_ADMIN']}>
                <Suspense >
                  <FranchisePage />
                
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="franchise-dashboard"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                
                  <FranchiseDashboard />
                
              </ProtectedRoute>
            }
          />

          <Route
            path="my-customers"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                  <FranchiseCustomers onUpdateCash={() => {}} />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-customers-details/:id"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                <Suspense fallback={<LoadingFallback />}>
                  <FranchiseCustomerDetails />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="customers"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
                <CustomersSwitcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="customer-plans"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff", "franchise", "franchise_admin"]}>
                <Suspense fallback={<LoadingFallback />}>
                  <CustomerPlans />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="customer-details/:id"
            element={
              
                <CustomerDetails />
              
            }
          />
          <Route
            path="staff-customer/:id"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin_staff"]}>
                <StaffCustomerDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="field-staff"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                
                  <FieldStaffPage />
                
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="local-staff"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                
                  <LocalStaff />
                
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="collections"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                
                  <Collections cashInHand={12450} setCashInHand={() => {}} />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="franchise-plans"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                <FranchisePlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="payment-history"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="franchise-reports"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                <FranchiseReport />
              </ProtectedRoute>
            }
          />

          {/* <Route
            path="local-staff"
            element={
              <ProtectedRoute allowedRoles={['franchise']}>
                <Suspense >
                  <LocalStaff />
                
              </ProtectedRoute>
            }
          /> */}

          {/* Billing - accessible to both admin and franchise */}
          <Route
            path="payments"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                
                  <Payments />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="staff"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                
                  <Staff />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="franchise-admins"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                <Frenchiseadmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
                  <ReportsSwitcher />
              </ProtectedRoute>
            }
          />
          <Route
            path="logs"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
                
                  <Logs />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="plans"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
                
                  <Plans />
                
              </ProtectedRoute>
            }
          />

          {/* Offers - accessible to both admin and franchise */}
          <Route
            path="offers"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                
                  <OffersPage />
                
              </ProtectedRoute>
            }
          />

          {/* Support - accessible to both admin and franchise */}
          <Route
            path="tickets"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN"]}>
                
                  <Tickets />
                
              </ProtectedRoute>
            }
          />

          <Route
            path="Zone-tickets"
            element={
              <ProtectedRoute allowedRoles={["franchise", "franchise_admin"]}>
                  <ZoneTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="assigned-tickets"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin_staff"]}>
                
                  <AssignedTickets />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="staff-payment-history"
            element={
              <ProtectedRoute allowedRoles={["staff", "admin_staff"]}>
                <StaffPaymentHistory />
              </ProtectedRoute>
            }
          />
          {/* Settings - accessible to both admin and franchise */}
        {/* SETTINGS */}
<Route
  path="settings"
  element={
    <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
      <SettingsPage />
    </ProtectedRoute>
  }
/>

{/* CANNED RESPONSES */}
<Route
  path="settings/canned/categories"
  element={
    <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
      <Categories />
    </ProtectedRoute>
  }
/>

<Route
  path="settings/canned/:categoryId"
  element={
    <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "staff", "admin_staff"]}>
      <CategoryResponses />
    </ProtectedRoute>
  }
/>


          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={["admin", "SUPER_ADMIN", "franchise", "franchise_admin", "staff", "admin_staff"]}>
                <ProfileSwitcher
                  franchiseUser={franchiseUser}
                  onUpdate={setFranchiseUser}
                />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
     
    </BrowserRouter>
  );
};

export default Router;
