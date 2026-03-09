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
import { Patient, PrescriptionItem } from "../types";
import { cn, handleFirestoreError, OperationType, triggerCall } from "../utils";
import { ClipboardList, Volume2, Plus, Printer } from "lucide-react";

export const ConsultationScreen = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState({
        mainComplaint: "",
        history: "",
        physicalExam: "",
        diagnosis: "",
        prescription: [] as PrescriptionItem[]
    });
    const { profile } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "patients"), where("status", "==", "Aguardando Médico"));
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
                status: "Em Consulta"
            });
            await triggerCall(p.fullName, p.ticketNumber, "Consultório Médico");
        } catch (error) {
            console.error(error);
        }
    };

    const handleFinish = async () => {
        if (!selectedPatient || !profile) return;
        try {
            const consultationRef = await addDoc(collection(db, "consultations"), {
                ...formData,
                patientId: selectedPatient.id,
                doctorId: profile.uid,
                status: "Finalizada",
                createdAt: new Date().toISOString()
            });

            // Add medications to the medication room
            for (const item of formData.prescription) {
                await addDoc(collection(db, "medications"), {
                    patientId: selectedPatient.id,
                    consultationId: consultationRef.id,
                    medicationName: item.medicationName,
                    dosage: item.dosage,
                    route: item.route,
                    schedule: item.schedule,
                    administered: false,
                    nurseNotes: ""
                });
            }

            await updateDoc(doc(db, "patients", selectedPatient.id), {
                status: formData.prescription.length > 0 ? "Aguardando Medicação" : "Alta"
            });

            alert("Atendimento finalizado!");
            setSelectedPatient(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao finalizar atendimento.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <ClipboardList className="text-primary size-5" /> Fila de Espera
                </h3>
                <div className="space-y-3">
                    {patients.map(p => (
                        <div
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className={cn(
                                "p-4 rounded-xl border transition-all cursor-pointer",
                                selectedPatient?.id === p.id ? "bg-primary/5 border-primary" : "bg-white border-slate-200 hover:border-primary/20"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.ticketNumber}</span>
                                <h4 className="font-bold">{p.fullName}</h4>
                            </div>
                            <p className="text-xs text-slate-500">{p.birthDate} • {p.gender}</p>
                        </div>
                    ))}
                </div>
            </aside>

            <section className="lg:col-span-8">
                {selectedPatient ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {selectedPatient.fullName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedPatient.fullName}</h2>
                                    <p className="text-xs text-slate-500">{selectedPatient.insurance} • {selectedPatient.cpf}</p>
                                    <button
                                        onClick={() => triggerCall(selectedPatient.fullName, selectedPatient.ticketNumber, "Consultório Médico")}
                                        className="mt-1 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                                    >
                                        <Volume2 className="size-3" /> Re-chamar Paciente
                                    </button>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-primary border border-primary px-3 py-1.5 rounded-lg">Histórico Completo</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold flex items-center gap-2">Queixa Principal</label>
                                <textarea
                                    value={formData.mainComplaint}
                                    onChange={e => setFormData({ ...formData, mainComplaint: e.target.value })}
                                    className="w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-sm min-h-[80px]"
                                    placeholder="Relato do paciente..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Histórico (HDA)</label>
                                    <textarea
                                        value={formData.history}
                                        onChange={e => setFormData({ ...formData, history: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-sm min-h-[120px]"
                                    ></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Exame Físico</label>
                                    <textarea
                                        value={formData.physicalExam}
                                        onChange={e => setFormData({ ...formData, physicalExam: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-sm min-h-[120px]"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold">Diagnóstico (CID-10)</label>
                                <input
                                    value={formData.diagnosis}
                                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                                    className="w-full rounded-lg border-slate-200 bg-slate-50 p-3 text-sm"
                                    placeholder="CID-10..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold">Prescrição</label>
                                <div className="border border-dashed border-primary/30 rounded-xl p-4 bg-primary/5">
                                    <button
                                        onClick={() => setFormData({ ...formData, prescription: [...formData.prescription, { medicationName: "", dosage: "", route: "Oral", schedule: "Agora" }] })}
                                        className="text-xs font-bold text-primary flex items-center gap-1 mb-4"
                                    >
                                        <Plus className="size-3" /> Adicionar Medicamento
                                    </button>
                                    <div className="space-y-3">
                                        {formData.prescription.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-4 gap-2 bg-white p-2 rounded-lg border border-primary/10">
                                                <input
                                                    placeholder="Medicamento"
                                                    className="text-xs border-none focus:ring-0"
                                                    value={item.medicationName}
                                                    onChange={e => {
                                                        const newP = [...formData.prescription];
                                                        newP[idx].medicationName = e.target.value;
                                                        setFormData({ ...formData, prescription: newP });
                                                    }}
                                                />
                                                <input
                                                    placeholder="Dosagem"
                                                    className="text-xs border-none focus:ring-0"
                                                    value={item.dosage}
                                                    onChange={e => {
                                                        const newP = [...formData.prescription];
                                                        newP[idx].dosage = e.target.value;
                                                        setFormData({ ...formData, prescription: newP });
                                                    }}
                                                />
                                                <input
                                                    placeholder="Via"
                                                    className="text-xs border-none focus:ring-0"
                                                    value={item.route}
                                                    onChange={e => {
                                                        const newP = [...formData.prescription];
                                                        newP[idx].route = e.target.value;
                                                        setFormData({ ...formData, prescription: newP });
                                                    }}
                                                />
                                                <input
                                                    placeholder="Horário"
                                                    className="text-xs border-none focus:ring-0"
                                                    value={item.schedule}
                                                    onChange={e => {
                                                        const newP = [...formData.prescription];
                                                        newP[idx].schedule = e.target.value;
                                                        setFormData({ ...formData, prescription: newP });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-primary/10 bg-slate-50 flex justify-end gap-3">
                            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Printer className="size-4" /> Imprimir
                            </button>
                            <button
                                onClick={handleFinish}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-200"
                            >
                                Finalizar Atendimento
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12">
                        <ClipboardList className="size-12 mb-4 opacity-20" />
                        <p className="font-medium">Selecione um paciente para iniciar a consulta.</p>
                    </div>
                )}
            </section>
        </div>
    );
};
