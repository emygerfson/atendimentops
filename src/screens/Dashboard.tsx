import React, { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/Auth";
import { Patient } from "../types";
import { cn, handleFirestoreError, OperationType } from "../utils";
import { Activity } from "lucide-react";

const CallingPanel = ({ patients }: { patients: Patient[] }) => {
    const callingTriage = patients.find(p => p.status === "Em Triagem");
    const callingDoctor = patients.find(p => p.status === "Em Consulta");
    const callingMedication = patients.find(p => p.status === "Em Medicação");

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center animate-pulse">
                <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Triagem</p>
                <h2 className="text-5xl font-black mb-2">{callingTriage?.ticketNumber || "---"}</h2>
                <p className="text-sm font-medium truncate w-full">{callingTriage?.fullName || "Aguardando..."}</p>
            </div>
            <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center animate-pulse">
                <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Consultório Médico</p>
                <h2 className="text-5xl font-black mb-2">{callingDoctor?.ticketNumber || "---"}</h2>
                <p className="text-sm font-medium truncate w-full">{callingDoctor?.fullName || "Aguardando..."}</p>
            </div>
            <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center animate-pulse">
                <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Medicação</p>
                <h2 className="text-5xl font-black mb-2">{callingMedication?.ticketNumber || "---"}</h2>
                <p className="text-sm font-medium truncate w-full">{callingMedication?.fullName || "Aguardando..."}</p>
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
            setPatients(data);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, "patients", user?.uid);
        });
        return unsubscribe;
    }, [user]);

    const getStatusColor = (status: string) => {
        if (status.includes("Triagem")) return "text-blue-600 bg-blue-50 border-blue-100";
        if (status.includes("Médico") || status.includes("Consulta")) return "text-red-600 bg-red-50 border-red-100";
        if (status.includes("Medicação")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
        return "text-slate-600 bg-slate-50 border-slate-100";
    };

    const getStatusLabel = (status: string) => {
        if (status.includes("Triagem")) return "Triagem";
        if (status.includes("Médico") || status.includes("Consulta")) return "Médico";
        if (status.includes("Medicação")) return "Enfermagem";
        return status;
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <h1 className="text-4xl font-black text-slate-900 mb-3">Painel de Atendimento</h1>
                <p className="text-slate-500 font-medium text-lg">Acompanhe o status do seu atendimento em tempo real</p>
            </div>

            <CallingPanel patients={patients} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-50/50 border-b border-slate-200 p-6">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Paciente</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-right">Localização / Status</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {patients.filter(p => p.status !== "Alta").map((patient) => (
                        <div key={patient.id} className="grid grid-cols-2 items-center p-6 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="size-14 rounded-2xl bg-primary/5 flex flex-col items-center justify-center text-primary border border-primary/10">
                                    <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">Senha</span>
                                    <span className="text-xl font-black leading-none">{patient.ticketNumber}</span>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900">{patient.fullName}</p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className={cn(
                                    "px-6 py-2 rounded-xl border-2 font-black text-sm uppercase tracking-wider shadow-sm",
                                    getStatusColor(patient.status)
                                )}>
                                    {getStatusLabel(patient.status)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {patients.filter(p => p.status !== "Alta").length === 0 && (
                        <div className="p-20 text-center text-slate-400">
                            <Activity className="size-16 mx-auto mb-4 opacity-10" />
                            <p className="text-lg font-medium">Nenhum paciente em atendimento no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
