import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage.jsx";
import AccountsPage from "../pages/AccountsPage.jsx";
import AdminAccountDetailsPage from "../pages/AdminAccountDetailsPage.jsx";
import LoanOverview from "../pages/LoanOverview.jsx";
import EmployeesPage from "../pages/EmployeesPage.jsx";
import EmployeeDetailsPage from "../pages/EmployeeDetailsPage.jsx";
import CreateEmployeePage from "../pages/CreateEmployeePage.jsx";
import EditEmployeePage from "../pages/EditEmployeePage.jsx";
import ChangePasswordPage from "../pages/ChangePasswordPage.jsx";
import RecipientsPage from "../pages/RecipientsPage.jsx";
import PaymentsPage from "../pages/PaymentsPage.jsx";
import CardsPage from "../pages/CardsPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminLoansPage from "../pages/AdminLoansPage.jsx";
import LoanApplicationPage from "../pages/LoanApplicationPage.jsx"
import BusinessDetailsPage from "../pages/BusinessDetailsPage.jsx";
import CreateBusinessAccountPage from "../pages/CreateBusinessAccountPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import EnterTokenPage from "../pages/EnterTokenPage.jsx";
import AccountDetailsPage from "../pages/AccountDetailsPage.jsx";
import CreateAccountPage from "../pages/CreateAccountPage.jsx";
import ClientDashboardPage from "../pages/ClientDashboardPage.jsx";
import ExchangePage from "../pages/ExchangePage.jsx";
import PaymentPage from "../pages/PaymentPage.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-loans" element={<ProtectedRoute><AdminLoansPage /></ProtectedRoute>} />

        <Route path="/forgot-password" element={<ProtectedRoute><ForgotPasswordPage /></ProtectedRoute>} />
        <Route path="/enter-token" element={<ProtectedRoute><EnterTokenPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><ClientDashboardPage /></ProtectedRoute>} />

        <Route path="/loan-request" element={<ProtectedRoute><LoanApplicationPage /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><LoanOverview /></ProtectedRoute>} />
        <Route path="/accounts/create" element={<ProtectedRoute><CreateAccountPage /></ProtectedRoute>} />
        <Route path="/admin/accounts/:accountNumber" element={<ProtectedRoute><AdminAccountDetailsPage /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
        <Route path="/employees/create" element={<ProtectedRoute><CreateEmployeePage /></ProtectedRoute>} />
        <Route path="/employees/edit/:id" element={<ProtectedRoute><EditEmployeePage /></ProtectedRoute>} />
        <Route path="/employees/:id/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetailsPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/recipients" element={<ProtectedRoute><RecipientsPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/accounts/business/:id" element={<ProtectedRoute><BusinessDetailsPage /></ProtectedRoute>}/>
        <Route path="/cards" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />

        <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetailsPage /></ProtectedRoute>} />
        <Route path="/exchange" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}
