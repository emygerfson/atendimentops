import React, { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    where,
    doc,
    updateDoc,
    addDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/Auth";
import { Patient, RiskLevel } from "../types";
import { cn, handleFirestoreError, OperationType, triggerCall } from "../utils";
import { Activity, Clock, Volume2, Thermometer, Droplets, ClipboardList, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const TriageScreen = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState({
        bloodPressure: "120/80",
        temperature: 36.5,
        saturation: 98,
        observations: "",
        riskLevel: "URGENTE" as RiskLevel
    });
    const { profile } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "patients"), where("status", "==", "Aguardando Triagem"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, "patients", profile?.uid);
        });
        return unsubscribe;
    }, [profile]);

    const handleSelectPatient = async (p: Patient) => {
        setSelectedPatient(p);
        try {
            await updateDoc(doc(db, "patients", p.id), {
                status: "Em Triagem"
            });
            await triggerCall(p.fullName, p.ticketNumber, "Triagem");
        } catch (error) {
            console.error(error);
        }
    };

    const handleTriage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !profile) return;

        try {
            await addDoc(collection(db, "triage"), {
                ...formData,
                patientId: selectedPatient.id,
                nurseId: profile.uid,
                createdAt: new Date().toISOString()
            });
            await updateDoc(doc(db, "patients", selectedPatient.id), {
                status: "Aguardando Médico"
            });
            alert("Triagem finalizada!");
            setSelectedPatient(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar triagem.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold flex items-center gap-2">
                            <Activity className="text-primary size-5" />
                            Aguardando ({patients.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-primary/5 max-h-[calc(100vh-250px)] overflow-y-auto">
                        {patients.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handleSelectPatient(p)}
                                className={cn(
                                    "p-4 cursor-pointer transition-colors border-l-4",
                                    selectedPatient?.id === p.id ? "bg-primary/5 border-primary" : "hover:bg-primary/5 border-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.ticketNumber}</span>
                                        <h3 className="font-bold text-sm">{p.fullName}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">Aguardando</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{p.birthDate} • {p.gender}</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                                        {p.mainSymptom.substring(0, 20)}...
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <section className="lg:col-span-8">
                <AnimatePresence mode="wait">
                    {selectedPatient ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-8"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold">Avaliação de Triagem</h2>
                                    <p className="text-slate-500 text-sm">Paciente: {selectedPatient.fullName} | CPF: {selectedPatient.cpf}</p>
                                    <button
                                        onClick={() => triggerCall(selectedPatient.fullName, selectedPatient.ticketNumber, "Triagem")}
                                        className="mt-2 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                    >
                                        <Volume2 className="size-3" /> Re-chamar Paciente
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <Clock className="text-primary size-4" />
                                    <span className="text-sm font-mono font-bold">{new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <form onSubmit={handleTriage} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold flex items-center gap-2">
                                            <Activity className="text-primary size-4" /> Pressão Arterial
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={formData.bloodPressure}
                                                onChange={e => setFormData({ ...formData, bloodPressure: e.target.value })}
                                                className="w-full bg-primary/5 border-primary/20 rounded-lg focus:ring-primary px-4 py-3 text-lg font-bold"
                                                placeholder="120/80"
                                            />
                                            <span className="absolute right-3 top-3.5 text-xs font-medium text-slate-400">mmHg</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold flex items-center gap-2">
                                            <Thermometer className="text-primary size-4" /> Temperatura
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={formData.temperature}
                                                onChange={e => setFormData({ ...formData, temperature: Number(e.target.value) })}
                                                className="w-full bg-primary/5 border-primary/20 rounded-lg focus:ring-primary px-4 py-3 text-lg font-bold"
                                                type="number"
                                                step="0.1"
                                            />
                                            <span className="absolute right-3 top-3.5 text-xs font-medium text-slate-400">°C</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold flex items-center gap-2">
                                            <Droplets className="text-primary size-4" /> Saturação (O2)
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={formData.saturation}
                                                onChange={e => setFormData({ ...formData, saturation: Number(e.target.value) })}
                                                className="w-full bg-primary/5 border-primary/20 rounded-lg focus:ring-primary px-4 py-3 text-lg font-bold"
                                                type="number"
                                            />
                                            <span className="absolute right-3 top-3.5 text-xs font-medium text-slate-400">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <ClipboardList className="text-primary size-4" /> Sintomas e Observações
                                    </label>
                                    <textarea
                                        value={formData.observations}
                                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                        className="w-full bg-primary/5 border-primary/20 rounded-lg focus:ring-primary px-4 py-3"
                                        placeholder="Descreva as queixas do paciente..."
                                        rows={4}
                                    ></textarea>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <AlertCircle className="text-primary size-4" /> Classificação de Risco
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                        {(["EMERGÊNCIA", "MUITO URGENTE", "URGENTE", "POUCO URGENTE", "NÃO URGENTE"] as RiskLevel[]).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, riskLevel: level })}
                                                className={cn(
                                                    "h-16 flex flex-col items-center justify-center rounded-lg border-2 transition-all text-[10px] font-bold uppercase",
                                                    formData.riskLevel === level ? "ring-4 ring-primary/20 border-primary" : "border-transparent opacity-40 hover:opacity-80",
                                                    level === "EMERGÊNCIA" && "bg-red-600 text-white",
                                                    level === "MUITO URGENTE" && "bg-orange-500 text-white",
                                                    level === "URGENTE" && "bg-yellow-400 text-slate-900",
                                                    level === "POUCO URGENTE" && "bg-green-500 text-white",
                                                    level === "NÃO URGENTE" && "bg-blue-500 text-white",
                                                )}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-primary/10 flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPatient(null)}
                                        className="px-8 py-3 rounded-lg border border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                                    >
                                        Confirmar Triagem
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12">
                            <Activity className="size-12 mb-4 opacity-20" />
                            <p className="font-medium">Selecione um paciente na fila para iniciar a triagem.</p>
                        </div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
};
