import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { NotFound } from './pages/NotFound';
import { useAuthStore } from './store/authStore';

import { DashboardHome } from './pages/dashboard/DashboardHome';
import { VendorList } from './pages/vendors/VendorList';
import { VendorForm } from './pages/vendors/VendorForm';
import { VendorDetail } from './pages/vendors/VendorDetail';
import { RFQList } from './pages/rfqs/RFQList';
import { RFQForm } from './pages/rfqs/RFQForm';
import { RFQDetail } from './pages/rfqs/RFQDetail';
import { QuotationList } from './pages/quotations/QuotationList';
import { QuotationForm } from './pages/quotations/QuotationForm';
import { QuotationDetail } from './pages/quotations/QuotationDetail';
import { ApprovalList } from './pages/approvals/ApprovalList';
import { ApprovalRequestForm } from './pages/approvals/ApprovalRequestForm';
import { ApprovalDetail } from './pages/approvals/ApprovalDetail';
import { POList } from './pages/purchase-orders/POList';
import { PODetail } from './pages/purchase-orders/PODetail';
import { InvoiceList } from './pages/invoices/InvoiceList';
import { InvoiceDetail } from './pages/invoices/InvoiceDetail';
import { ActivityList } from './pages/logs/ActivityList';
import { NotificationList } from './pages/notifications/NotificationList';
import { ReportsDashboard } from './pages/reports/ReportsDashboard';


const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Layout Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/new" element={<VendorForm />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />
          <Route path="/vendors/:id/edit" element={<VendorForm />} />
          <Route path="/rfqs" element={<RFQList />} />
          <Route path="/rfqs/new" element={<RFQForm />} />
          <Route path="/rfqs/:id" element={<RFQDetail />} />
          <Route path="/rfqs/:id/edit" element={<RFQForm />} />
          <Route path="/quotations" element={<QuotationList />} />
          <Route path="/quotations/new" element={<QuotationForm />} />
          <Route path="/quotations/:id" element={<QuotationDetail />} />
          <Route path="/approvals" element={<ApprovalList />} />
          <Route path="/approvals/new" element={<ApprovalRequestForm />} />
          <Route path="/approvals/:id" element={<ApprovalDetail />} />
          <Route path="/purchase-orders" element={<POList />} />
          <Route path="/purchase-orders/:id" element={<PODetail />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/activity-logs" element={<ActivityList />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/reports" element={<ReportsDashboard />} />
          
          {/* Default redirect inside layout */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
