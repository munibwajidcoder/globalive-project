import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Company Panel
import CompanyDashboard from "./pages/company/CompanyDashboard";
import SuperAdmins from "./pages/company/SuperAdmins";
import CompanyAnalytics from "./pages/company/Analytics";
import CompanySettings from "./pages/company/Settings";
import CompanyUsers from "./pages/company/Users";
import CompanyAgencies from "./pages/company/Agencies";
import CompanyTransactions from "./pages/company/Transactions";
import CompanyHosts from "./pages/company/Hosts";
import CompanyBeans from "./pages/company/Beans";
import CompanyPolicy from "./pages/company/Policy";
import CompanyReports from "./pages/company/Reports";
import CompanySupport from "./pages/company/Support";
import CompanyTopupAgents from "./pages/company/topup-agents";
import CompanyResellers from "./pages/company/resellers";
import CompanyGames from "./pages/company/Games";
import CompanyLogs from "./pages/company/Logs";

// Super Admin Panel
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SubAdmins from "./pages/super-admin/SubAdmins";
import SuperAdminAgencies from "./pages/super-admin/Agencies";
import Cashout from "./pages/super-admin/Cashout";
import SuperAdminHosts from "./pages/super-admin/Hosts";
import SuperAdminUsers from "./pages/super-admin/Users";
import SuperAdminReports from "./pages/super-admin/Reports";
import SuperAdminDiamonds from "./pages/super-admin/Diamonds";
import SuperAdminSupport from "./pages/super-admin/Support";

// Sub Admin Panel
import SubAdminDashboard from "./pages/sub-admin/SubAdminDashboard";
import SubAdminAgencies from "./pages/sub-admin/Agencies";
import SubAdminUsers from "./pages/sub-admin/Users";
import SubAdminReports from "./pages/sub-admin/Reports";
import SubAdminHosts from "./pages/sub-admin/Hosts";
import SubAdminDisputes from "./pages/sub-admin/Disputes";
import SubAdminSupport from "./pages/sub-admin/Support";

// Agency Panel
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import AgencyHosts from "./pages/agency/Hosts";
import AgencyUsers from "./pages/agency/Users";
import AgencyPerformance from "./pages/agency/Performance";
import AgencyCashout from "./pages/agency/AgencyCashout";
import AgencyProfile from "./pages/agency/Profile";
import AgencyApprovals from "./pages/agency/Approvals";
import AgencySupport from "./pages/agency/Support";
import AgencyReports from "./pages/agency/Reports";

// Reseller Panel
import ResellerDashboard from "./pages/reseller/ResellerDashboard";
import ResellerSales from "./pages/reseller/Sales";
import ResellerReports from "./pages/reseller/Reports";

// Top-Up Agent Panel
import TopUpAgentDashboard from "./pages/topup-agent/TopUpAgentDashboard";
import TopUpUsers from "./pages/topup-agent/Users";
import TopUpResellers from "./pages/topup-agent/Resellers";
import TopUpTransactions from "./pages/topup-agent/Transactions";
import TopUpReports from "./pages/topup-agent/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Company Routes */}
            <Route path="/company" element={<ProtectedRoute allowedRoles={["company"]}><CompanyDashboard /></ProtectedRoute>} />
            <Route path="/company/users" element={<ProtectedRoute allowedRoles={["company"]}><CompanyUsers /></ProtectedRoute>} />
            <Route path="/company/agencies" element={<ProtectedRoute allowedRoles={["company"]}><CompanyAgencies /></ProtectedRoute>} />
            <Route path="/company/transactions" element={<ProtectedRoute allowedRoles={["company"]}><CompanyTransactions /></ProtectedRoute>} />
            <Route path="/company/hosts" element={<ProtectedRoute allowedRoles={["company"]}><CompanyHosts /></ProtectedRoute>} />
            <Route path="/company/beans" element={<ProtectedRoute allowedRoles={["company"]}><CompanyBeans /></ProtectedRoute>} />
            <Route path="/company/policy" element={<ProtectedRoute allowedRoles={["company"]}><CompanyPolicy /></ProtectedRoute>} />
            <Route path="/company/reports" element={<ProtectedRoute allowedRoles={["company"]}><CompanyReports /></ProtectedRoute>} />
            <Route path="/company/support" element={<ProtectedRoute allowedRoles={["company"]}><CompanySupport /></ProtectedRoute>} />
            <Route path="/company/super-admins" element={<ProtectedRoute allowedRoles={["company"]}><SuperAdmins /></ProtectedRoute>} />
            <Route path="/company/analytics" element={<ProtectedRoute allowedRoles={["company"]}><CompanyAnalytics /></ProtectedRoute>} />
            <Route path="/company/topup-agents" element={<ProtectedRoute allowedRoles={["company"]}><CompanyTopupAgents /></ProtectedRoute>} />
            <Route path="/company/resellers" element={<ProtectedRoute allowedRoles={["company"]}><CompanyResellers /></ProtectedRoute>} />
            <Route path="/company/games" element={<ProtectedRoute allowedRoles={["company"]}><CompanyGames /></ProtectedRoute>} />
            <Route path="/company/settings" element={<ProtectedRoute allowedRoles={["company"]}><CompanySettings /></ProtectedRoute>} />
            <Route path="/company/logs" element={<ProtectedRoute allowedRoles={["company"]}><CompanyLogs /></ProtectedRoute>} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/sub-admins" element={<ProtectedRoute allowedRoles={["super-admin"]}><SubAdmins /></ProtectedRoute>} />
            <Route path="/super-admin/agencies" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminAgencies /></ProtectedRoute>} />
            <Route path="/super-admin/diamonds" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminDiamonds /></ProtectedRoute>} />
            <Route path="/super-admin/cashout" element={<ProtectedRoute allowedRoles={["super-admin"]}><Cashout /></ProtectedRoute>} />
            <Route path="/super-admin/hosts" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminHosts /></ProtectedRoute>} />
            <Route path="/super-admin/users" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminUsers /></ProtectedRoute>} />
            <Route path="/super-admin/reports" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminReports /></ProtectedRoute>} />
            <Route path="/super-admin/support" element={<ProtectedRoute allowedRoles={["super-admin"]}><SuperAdminSupport /></ProtectedRoute>} />
            
            {/* Sub Admin Routes */}
            <Route path="/sub-admin" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminDashboard /></ProtectedRoute>} />
            <Route path="/sub-admin/users" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminUsers /></ProtectedRoute>} />
            <Route path="/sub-admin/agencies" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminAgencies /></ProtectedRoute>} />
            <Route path="/sub-admin/reports" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminReports /></ProtectedRoute>} />
            <Route path="/sub-admin/hosts" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminHosts /></ProtectedRoute>} />
            <Route path="/sub-admin/disputes" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminDisputes /></ProtectedRoute>} />
            <Route path="/sub-admin/support" element={<ProtectedRoute allowedRoles={["sub-admin"]}><SubAdminSupport /></ProtectedRoute>} />
            
            {/* Agency Routes */}
            <Route path="/agency" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyDashboard /></ProtectedRoute>} />
            <Route path="/agency/users" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyUsers /></ProtectedRoute>} />
            <Route path="/agency/hosts" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyHosts /></ProtectedRoute>} />
            <Route path="/agency/performance" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyPerformance /></ProtectedRoute>} />
            <Route path="/agency/cashout" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyCashout /></ProtectedRoute>} />
            <Route path="/agency/profile" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyProfile /></ProtectedRoute>} />
            <Route path="/agency/approvals" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyApprovals /></ProtectedRoute>} />
            <Route path="/agency/support" element={<ProtectedRoute allowedRoles={["agency"]}><AgencySupport /></ProtectedRoute>} />
            <Route path="/agency/reports" element={<ProtectedRoute allowedRoles={["agency"]}><AgencyReports /></ProtectedRoute>} />
            
            {/* Reseller Routes */}
            <Route path="/reseller" element={<ProtectedRoute allowedRoles={["reseller"]}><ResellerDashboard /></ProtectedRoute>} />
            <Route path="/reseller/sales" element={<ProtectedRoute allowedRoles={["reseller"]}><ResellerSales /></ProtectedRoute>} />
            <Route path="/reseller/reports" element={<ProtectedRoute allowedRoles={["reseller"]}><ResellerReports /></ProtectedRoute>} />
            
            {/* Top-Up Agent Routes */}
            <Route path="/topup-agent" element={<ProtectedRoute allowedRoles={["topup-agent"]}><TopUpAgentDashboard /></ProtectedRoute>} />
            <Route path="/topup-agent/users" element={<ProtectedRoute allowedRoles={["topup-agent"]}><TopUpUsers /></ProtectedRoute>} />
            <Route path="/topup-agent/resellers" element={<ProtectedRoute allowedRoles={["topup-agent"]}><TopUpResellers /></ProtectedRoute>} />
            <Route path="/topup-agent/transactions" element={<ProtectedRoute allowedRoles={["topup-agent"]}><TopUpTransactions /></ProtectedRoute>} />
            <Route path="/topup-agent/reports" element={<ProtectedRoute allowedRoles={["topup-agent"]}><TopUpReports /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;