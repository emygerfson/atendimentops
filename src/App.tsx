import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import {
  Activity,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { AuthProvider, useAuth } from "./components/Auth";
import { UserRole } from "./types";
import { cn } from "./utils";
import { Sidebar, TopBar, CallDisplay } from "./components/UIComponents";

// Lazy load screens (optional, but good for performance)
import { Dashboard } from "./screens/Dashboard";
import { Registration } from "./screens/Registration";
import { TriageScreen } from "./screens/TriageScreen";
import { ConsultationScreen } from "./screens/ConsultationScreen";
import { MedicationRoom } from "./screens/MedicationRoom";
import { AdminPanel } from "./screens/AdminPanel";
import { Login } from "./screens/Login";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const ModuleGuard: React.FC<{ children: React.ReactNode; label: string; requiredRole?: UserRole }> = ({ children, label, requiredRole }) => {
  const { profile } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(profile?.role === "admin");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    if (profile?.role === "admin") {
      setIsAuthorized(true);
    }
  }, [profile]);

  if (isAuthorized) return <>{children}</>;

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();

    if (requiredRole && profile?.role !== requiredRole && profile?.role !== "admin") {
      setRoleError(true);
      return;
    }

    if (input === profile?.password) {
      setIsAuthorized(true);
      setError(false);
      setRoleError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
          <ShieldCheck className="size-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Acesso Restrito: {label}</h2>
          <p className="text-sm text-slate-500 mt-1">Digite sua senha pessoal para continuar</p>
        </div>
        <form onSubmit={handleCheck} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            className={cn(
              "w-full h-12 px-4 rounded-xl border bg-slate-50 text-center text-lg font-bold focus:ring-2 focus:ring-primary outline-none transition-all",
              error ? "border-red-500 animate-shake" : "border-slate-200"
            )}
            placeholder="••••••"
            autoFocus
          />
          {error && <p className="text-xs font-bold text-red-500">Senha incorreta. Use sua senha pessoal.</p>}
          {roleError && <p className="text-xs font-bold text-red-500">Seu cargo não tem permissão para este módulo.</p>}

          <button
            type="submit"
            className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Confirmar Identidade
          </button>
        </form>
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Logado como: <span className="text-primary font-bold">{profile?.name}</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Cargo: <span className="text-primary font-bold">{profile?.role}</span></p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background-light">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <TopBar />
                  <main className="p-8 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/registro" element={<ModuleGuard requiredRole="receptionist" label="Recepção"><Registration /></ModuleGuard>} />
                      <Route path="/triagem" element={<ModuleGuard requiredRole="nurse" label="Triagem"><TriageScreen /></ModuleGuard>} />
                      <Route path="/prontuarios" element={<ModuleGuard requiredRole="doctor" label="Médico"><ConsultationScreen /></ModuleGuard>} />
                      <Route path="/medicacao" element={<ModuleGuard requiredRole="nurse" label="Enfermagem"><MedicationRoom /></ModuleGuard>} />
                      <Route path="/admin" element={<ModuleGuard requiredRole="admin" label="Administração"><AdminPanel /></ModuleGuard>} />
                    </Routes>
                  </main>
                  <footer className="bg-white border-t border-slate-100 px-8 py-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex gap-6">
                      <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500"></span> Sistema Online</span>
                      <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary"></span> Banco de Dados Conectado</span>
                    </div>
                    <div>V. 1.0.0-PRO</div>
                  </footer>
                </div>
              </div>
              <CallDisplay />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
