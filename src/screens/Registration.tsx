import React, { useState } from "react";
import {
    collection,
    addDoc,
    getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { ClipboardList, Send } from "lucide-react";

export const Registration = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        cpf: "",
        birthDate: "",
        insurance: "SUS",
        gender: "Masculino",
        mainSymptom: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Generate ticket number
            const patientsSnapshot = await getDocs(collection(db, "patients"));
            const ticketCount = patientsSnapshot.size + 1;
            const ticketNumber = `A${ticketCount.toString().padStart(3, '0')}`;

            await addDoc(collection(db, "patients"), {
                ...formData,
                status: "Aguardando Triagem",
                ticketNumber,
                createdAt: new Date().toISOString()
            });
            alert(`Paciente registrado! Senha gerada: ${ticketNumber}`);
            setFormData({
                fullName: "",
                cpf: "",
                birthDate: "",
                insurance: "SUS",
                gender: "Masculino",
                mainSymptom: ""
            });
        } catch (error) {
            console.error(error);
            alert("Erro ao registrar paciente.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight">Registro de Paciente</h2>
                <p className="text-slate-500">Formulário de admissão para novos atendimentos.</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <ClipboardList className="text-primary size-5" />
                    <h3 className="font-bold">Formulário de Admissão</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-2">Nome Completo</label>
                            <input
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary h-12 px-4"
                                placeholder="Nome completo do paciente"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">CPF</label>
                            <input
                                required
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary h-12 px-4"
                                placeholder="000.000.000-00"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Data de Nascimento</label>
                            <input
                                required
                                value={formData.birthDate}
                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary h-12 px-4"
                                type="date"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Convênio</label>
                            <select
                                value={formData.insurance}
                                onChange={e => setFormData({ ...formData, insurance: e.target.value })}
                                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary h-12 px-4"
                            >
                                <option value="SUS">SUS</option>
                                <option value="Unimed">Unimed</option>
                                <option value="Bradesco">Bradesco Saúde</option>
                                <option value="SulAmérica">SulAmérica</option>
                                <option value="Particular">Particular</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Gênero</label>
                            <div className="flex gap-4 h-12 items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        checked={formData.gender === "Masculino"}
                                        onChange={() => setFormData({ ...formData, gender: "Masculino" })}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">Masculino</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        checked={formData.gender === "Feminino"}
                                        onChange={() => setFormData({ ...formData, gender: "Feminino" })}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">Feminino</span>
                                </label>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-2">Motivo da Visita / Sintomas Principais</label>
                            <textarea
                                required
                                value={formData.mainSymptom}
                                onChange={e => setFormData({ ...formData, mainSymptom: e.target.value })}
                                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary p-4 resize-none"
                                placeholder="Descreva brevemente o motivo do atendimento..."
                                rows={4}
                            ></textarea>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                            type="submit"
                        >
                            <Send className="size-5" />
                            Finalizar Registro e Enviar para Triagem
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
