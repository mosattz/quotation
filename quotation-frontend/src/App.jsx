import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateJob from "./pages/CreateJob";
import Landing from "./pages/Landing";
import { isAdminUser, isAuthed } from "./utils/auth";

function RequireAuth({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  if (!isAdminUser()) return <Navigate to="/technician" replace />;
  return children;
}

function DashboardRedirect() {
  if (!isAuthed()) return <Navigate to="/login" replace />;
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
        {/* Static-site hosts sometimes keep /index.html in the URL; normalize it. */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
