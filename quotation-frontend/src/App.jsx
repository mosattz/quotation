import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateJob from "./pages/CreateJob";
import { isAdminUser, isAuthed } from "./utils/auth";

function RequireAuth({ children }) {
  if (!isAuthed()) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  if (!isAuthed()) return <Navigate to="/" replace />;
  if (!isAdminUser()) return <Navigate to="/technician" replace />;
  return children;
}

function DashboardRedirect() {
  if (!isAuthed()) return <Navigate to="/" replace />;
  return isAdminUser() ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/technician" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={<DashboardRedirect />}
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Dashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/technician"
          element={
            <RequireAuth>
              <CreateJob />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
