import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// ── LOADING SPINNER ───────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-white/30 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// ── PROTECTED ROUTE ───────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== "admin")
    return <Navigate to="/" replace />;
  return children;
}

// ── ROOT REDIRECT ─────────────────────────────────────────────
// Waits for profile to fully load before deciding where to send the user.
// This is the fix for the "always goes to client view" bug.
function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;
  return <ClientDashboard />;
}

// ── LOGIN WRAPPER ─────────────────────────────────────────────
// Redirects away from login if already authenticated
function LoginPageWrapper() {
  const { session, profile, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  if (session) {
    if (profile?.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

// ── APP ROOT ──────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPageWrapper />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
