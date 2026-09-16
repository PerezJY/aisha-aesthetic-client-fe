import { renderSeoHead } from './seo';
import { useEffect } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import Dashboard from './features/Dashboard';
import LandingPage from './features/LandingPage';
import Booking from './features/booking/BookingPage';
import Appointments from './features/appointments/AppointmentsPage';
import History from './features/History';
import Signin from './features/Signin';
import Signup from './features/Signup';
import Profile from './features/profile';
import SalesReportPage from './features/admin/SalesReportPage';
import AdminDashboard from './features/admin/AdminDashboard';
import DatabaseBackupsPage from './features/admin/DatabaseBackupsPage';
import ArchivesPage from './features/admin/ArchivesPage';
import EmployeeDashboard from './features/employee/EmployeeDashboard';
import CustomerDashboard from './features/customer/CustomerDashboard';
import AdminAppointments from './features/appointments/AdminAppointments';
import AccountManagement from './features/accounts/AccountManagementPage';
import AdminShopareas from './features/shop-areas/AdminShopAreasPage';
import AdminServices from './features/services/AdminServicesPage';
import WalkinManagement from './features/walkins/WalkinManagementPage';
import Notification from './features/Notification';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import ProtectedLayout from './layouts/ProtectedLayout';

import {
  getCurrentUser,
  getRoleDestination,
} from './utils/auth';
// ==========================================
// APP
// ==========================================

function App() {
  const location = useLocation();
  const currentUser = getCurrentUser();

  // ==========================================
  // DYNAMIC DOCUMENT TITLE
  // ==========================================

  useEffect(() => {
    document.head.querySelectorAll('[data-seo]').forEach(element => element.remove());
    document.head.insertAdjacentHTML('beforeend', renderSeoHead(location.pathname, import.meta.env.VITE_SITE_URL || window.location.origin));
  }, [location.pathname]);

  // ==========================================
  // ROOT REDIRECT
  // ==========================================

  if (location.pathname === '/') {
    return <LandingPage />;
  }

  // ==========================================
  // ROUTES
  // ==========================================

  return (
    <Routes>

      {/* ======================================
          AUTH
      ======================================= */}

      <Route
        path="/signin"
        element={
          <PublicRoute>
            <Signin />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* ======================================
          ROLE DASHBOARDS
      ======================================= */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <AdminDashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <ProtectedLayout>
              <EmployeeDashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <ProtectedLayout>
              <CustomerDashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================================
          LEGACY ADMIN DASHBOARD
      ======================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================================
          ADMIN TOOLS
      ======================================= */}

      <Route
        path="/admin-appointments"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <AdminAppointments />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/account-management"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <AccountManagement />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/shop-areas"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <AdminShopareas />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <AdminServices />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales-report"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <SalesReportPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/database-backups" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ProtectedLayout><DatabaseBackupsPage /></ProtectedLayout>
        </ProtectedRoute>
      } />
      <Route path="/archives" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ProtectedLayout><ArchivesPage /></ProtectedLayout>
        </ProtectedRoute>
      } />

      {/* ======================================
          SHARED ADMIN + EMPLOYEE
      ======================================= */}

      <Route
        path="/walkins"
        element={
          <ProtectedRoute
            allowedRoles={['employee', 'admin']}
          >
            <ProtectedLayout>
              <WalkinManagement />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================================
          SHARED ALL ROLES
      ======================================= */}

      <Route
        path="/notifications"
        element={
          <ProtectedRoute
            allowedRoles={[
              'admin',
              'employee',
              'customer',
            ]}
          >
            <ProtectedLayout>
              <Notification />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute
            allowedRoles={[
              'admin',
              'employee',
              'customer',
            ]}
          >
            <ProtectedLayout>
              <Appointments />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute
            allowedRoles={[
              'admin',
              'employee',
              'customer',
            ]}
          >
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================================
          CUSTOMER ONLY
      ======================================= */}

      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <ProtectedLayout>
              <Booking />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <ProtectedLayout>
              <History />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================================
          UNKNOWN ROUTE
      ======================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={getRoleDestination(currentUser)}
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;
