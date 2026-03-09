import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    UserPlus,
    Stethoscope,
    ClipboardList,
    Search,
    Bell,
    LogOut,
    Activity,
    ShieldCheck,
    Volume2,
    VolumeX,
    Plus
} from "lucide-react";
import { useAuth } from "./Auth";
import { cn, speak } from "../utils";
import { query, collection, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

export const Sidebar = () => {
    const location = useLocation();
    const { profile, logout } = useAuth();

    const navItems = [
        { path: "/", icon: LayoutDashboard, label: "Painel Geral", roles: ["admin", "doctor", "nurse", "receptionist"] },
        { path: "/registro", icon: UserPlus, label: "Recepção", roles: ["admin", "receptionist"], password: "123" },
        { path: "/triagem", icon: Stethoscope, label: "Triagem", roles: ["admin", "nurse"], password: "456" },
        { path: "/prontuarios", icon: ClipboardList, label: "Médico", roles: ["admin", "doctor"], password: "789" },
        { path: "/medicacao", icon: SyringeIcon, label: "Enfermagem", roles: ["admin", "nurse"], password: "000" },
        { path: "/admin", icon: ShieldCheck, label: "Administração", roles: ["admin"] },
    ];

    return (
        <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col gap-2 h-screen sticky top-0">
            <div className="flex items-center gap-3 px-3 py-4 mb-4">
                <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Activity className="size-6" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-tight">MedControl Pro</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital Central</p>
                </div>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase px-3 py-2 tracking-widest">Menu Principal</p>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <item.icon className="size-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all w-full"
                >
                    <LogOut className="size-5" />
                    <span className="text-sm font-medium">Sair do Sistema</span>
                </button>
            </div>
        </aside>
    );
};

// Syringe icon fix
const SyringeIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m9 11 4 4" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" />
    </svg>
);

export const TopBar = () => {
    const { profile } = useAuth();

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-3 sticky top-0 z-50">
            <div className="flex flex-1 justify-center max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary text-sm transition-all"
                        placeholder="Buscar paciente por nome, prontuário ou leito..."
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold">{profile?.name || "Usuário"}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{profile?.role || "Plantonista"}</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors">
                        <Bell className="size-5" />
                    </button>
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-primary/20">
                        {profile?.name?.substring(0, 2).toUpperCase() || "US"}
                    </div>
                </div>
            </div>
        </header>
    );
};

export const CallDisplay = () => {
    const [lastCall, setLastCall] = useState<any>(null);
    const [show, setShow] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "calls"), orderBy("timestamp", "desc"), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const call = snapshot.docs[0].data();
                const callTime = call.timestamp?.toDate?.() || new Date();
                const now = new Date();
                if (now.getTime() - callTime.getTime() < 30000) {
                    setLastCall(call);
                    setShow(true);
                    if (audioEnabled) {
                        speak(`Senha ${call.ticketNumber}, ${call.patientName}, favor dirigir-se ao setor de ${call.sector}`);
                    }
                    const timer = setTimeout(() => setShow(false), 10000);
                    return () => clearTimeout(timer);
                }
            }
        });
        return unsubscribe;
    }, [audioEnabled]);

    const enableAudio = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.resume();
        setAudioEnabled(true);
        speak("Sistema de voz ativado com sucesso.");
    };

    return (
        <>
            {!audioEnabled && (
                <div className="fixed top-4 right-4 z-[110]">
                    <button
                        onClick={enableAudio}
                        className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-amber-600 transition-all animate-pulse"
                    >
                        <VolumeX className="size-4" /> Ativar Som do Painel
                    </button>
                </div>
            )}

            <AnimatePresence>
                {show && lastCall && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="fixed bottom-8 right-8 z-[100] w-96 bg-primary text-white p-8 rounded-3xl shadow-2xl border-4 border-white/20 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Volume2 className="size-32" />
                        </div>
                        <div className="relative z-10 text-center">
                            <p className="text-xs font-black uppercase tracking-[0.3em] mb-4 opacity-80">Chamada em Andamento</p>
                            <div className="bg-white/10 rounded-2xl py-6 mb-6">
                                <h2 className="text-6xl font-black mb-1">{lastCall.ticketNumber}</h2>
                                <p className="text-sm font-bold uppercase tracking-widest opacity-60">{lastCall.sector}</p>
                            </div>
                            <h3 className="text-2xl font-black leading-tight mb-2">{lastCall.patientName}</h3>
                            <div className="flex items-center justify-center gap-2 text-xs font-bold opacity-80">
                                <Activity className="size-4" />
                                <span>Favor comparecer ao setor</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
