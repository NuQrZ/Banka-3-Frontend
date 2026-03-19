import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage.jsx";
import EmployeesPage from "../pages/EmployeesPage.jsx";
import EmployeeDetailsPage from "../pages/EmployeeDetailsPage.jsx";
import CreateEmployeePage from "../pages/CreateEmployeePage.jsx";
import EditEmployeePage from "../pages/EditEmployeePage.jsx";
import ChangePasswordPage from "../pages/ChangePasswordPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import BusinessDetailsPage from "../pages/BusinessDetailsPage.jsx";
import CreateBusinessAccountPage from "../pages/CreateBusinessAccountPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import EnterTokenPage from "../pages/EnterTokenPage.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/enter-token" element={<EnterTokenPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />


        <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
        <Route path="/employees/create" element={<ProtectedRoute><CreateEmployeePage /></ProtectedRoute>} />
        <Route path="/employees/edit/:id" element={<ProtectedRoute><EditEmployeePage /></ProtectedRoute>} />
        <Route path="/employees/:id/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetailsPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/accounts/business/:id" element={<ProtectedRoute><BusinessDetailsPage /></ProtectedRoute>}/>
        <Route path="/create-business" element={<ProtectedRoute><CreateBusinessAccountPage /></ProtectedRoute>}/>

      </Routes>
    </BrowserRouter>
  );
}
