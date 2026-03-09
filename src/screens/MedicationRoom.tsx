import React, { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    where,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../components/Auth";
import { Patient } from "../types";
import { handleFirestoreError, OperationType, triggerCall } from "../utils";
import { Volume2, CheckCircle2, LogOut } from "lucide-react";

export const MedicationRoom = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [medications, setMedications] = useState<any[]>([]);
    const { profile } = useAuth();
    const [confirmFinish, setConfirmFinish] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "patients"), where("status", "in", ["Aguardando Medicação", "Em Medicação"]));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!selectedPatient) return;
        const q = query(collection(db, "medications"), where("patientId", "==", selectedPatient.id), where("administered", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, "medications", profile?.uid);
        });
        return unsubscribe;
    }, [selectedPatient, profile]);

    const handleSelectPatientWithStatus = async (p: Patient) => {
        setSelectedPatient(p);
        try {
            await updateDoc(doc(db, "patients", p.id), {
                status: "Em Medicação"
            });
            await triggerCall(p.fullName, p.ticketNumber, "Medicação");
        } catch (error) {
            console.error(error);
        }
    };

    const handleFinishMedication = async (patientId: string) => {
        try {
            await updateDoc(doc(db, "patients", patientId), {
                status: "Alta"
            });
            alert("Atendimento finalizado. Paciente recebeu alta.");
            setSelectedPatient(null);
            setConfirmFinish(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao finalizar atendimento.");
        }
    };

    const handleAdminister = async (medId: string) => {
        if (!profile) return;
        try {
            await updateDoc(doc(db, "medications", medId), {
                administered: true,
                administeredAt: new Date().toISOString(),
                nurseId: profile.uid
            });

            const remaining = medications.filter(m => m.id !== medId);
            if (remaining.length === 0) {
                alert("Todas as medicações administradas. Você já pode finalizar o atendimento.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Sala de Medicação</h2>
                <p className="text-slate-500">Administração de medicamentos prescritos.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {patients.map(p => (
                    <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-5 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {p.fullName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold">{p.fullName}</h3>
                                    <p className="text-xs text-slate-500">Leito: 04-A • Prontuário: #458293</p>
                                    <button
                                        onClick={() => triggerCall(p.fullName, p.ticketNumber, "Medicação")}
                                        className="mt-1 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                    >
                                        <Volume2 className="size-3" /> Re-chamar Paciente
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (selectedPatient?.id === p.id) {
                                        setSelectedPatient(null);
                                    } else {
                                        handleSelectPatientWithStatus(p);
                                    }
                                }}
                                className="text-primary font-bold text-sm flex items-center gap-1"
                            >
                                {selectedPatient?.id === p.id ? "Fechar" : "Ver Prescrição"}
                            </button>
                        </div>

                        {selectedPatient?.id === p.id && (
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medicamentos Pendentes</h4>
                                    {medications.length === 0 && (
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Tudo Administrado</span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {medications.map(med => (
                                        <div key={med.id} className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1">
                                                <p className="font-bold">{med.medicationName}</p>
                                                <p className="text-xs text-slate-500">{med.dosage} • {med.route} • {med.schedule}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAdminister(med.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold"
                                            >
                                                <CheckCircle2 className="size-4" /> Administrar
                                            </button>
                                        </div>
                                    ))}
                                    {medications.length === 0 && (
                                        <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                            <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm text-slate-500">Nenhum medicamento pendente para este paciente.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    {confirmFinish === p.id ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleFinishMedication(p.id)}
                                                className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                                            >
                                                <CheckCircle2 className="size-4" /> Confirmar Alta
                                            </button>
                                            <button
                                                onClick={() => setConfirmFinish(null)}
                                                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmFinish(p.id)}
                                            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                                        >
                                            <LogOut className="size-4" /> Finalizar Atendimento e Dar Alta
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
