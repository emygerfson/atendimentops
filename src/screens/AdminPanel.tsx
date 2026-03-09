import React, { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    query,
    doc,
    updateDoc,
    setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";
import { cn } from "../utils";
import { UserPlus, Plus, Users, ShieldCheck } from "lucide-react";

export const AdminPanel = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "receptionist", password: "" });

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
        });
        return unsubscribe;
    }, []);

    const handleUpdateRole = async (uid: string, newRole: any) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", uid), { role: newRole });
            alert("Cargo atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar cargo.");
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (uid: string, newPassword: string) => {
        if (!newPassword) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", uid), { password: newPassword });
            alert("Senha atualizada com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar senha.");
        }
        setLoading(false);
    };

    const handleRegisterUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Preencha todos os campos, incluindo a senha.");
            return;
        }

        setLoading(true);
        try {
            const existing = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
            if (existing) {
                alert("Este e-mail já está cadastrado.");
                setLoading(false);
                return;
            }

            const tempId = `pre_${Date.now()}`;
            const userProfile: UserProfile = {
                uid: tempId,
                name: newUser.name,
                email: newUser.email.toLowerCase(),
                role: newUser.role as any,
                password: newUser.password
            };

            await setDoc(doc(db, "users", tempId), userProfile);
            setNewUser({ name: "", email: "", role: "receptionist", password: "" });
            alert("Usuário pré-cadastrado com sucesso! Ele poderá acessar o sistema com este e-mail e senha.");
        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar usuário.");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight">Painel Administrativo</h2>
                <p className="text-slate-500">Gerenciamento de usuários e permissões do sistema.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold flex items-center gap-2">
                                <UserPlus className="size-5 text-primary" />
                                Cadastrar Novo Usuário
                            </h3>
                        </div>
                        <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: Dr. João Silva"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">E-mail (Google)</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="usuario@gmail.com"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cargo / Função</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
                                >
                                    <option value="receptionist">Recepcionista</option>
                                    <option value="nurse">Enfermagem / Triagem</option>
                                    <option value="doctor">Médico</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Senha de Acesso</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: 123456"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Plus className="size-4" />
                                Cadastrar Profissional
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <Users className="size-5 text-primary" />
                                Usuários Cadastrados
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: {users.length}</span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                            {users.map((user) => (
                                <div key={user.uid} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "size-12 rounded-full flex items-center justify-center font-bold text-lg",
                                            user.uid.startsWith('pre_') ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-primary/10 text-primary"
                                        )}>
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold">{user.name}</p>
                                                {user.uid.startsWith('pre_') && (
                                                    <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-black">Pendente</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[8px] font-bold text-slate-400 uppercase">Cargo</label>
                                            <select
                                                value={user.role}
                                                disabled={loading}
                                                onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                                                className="rounded-lg border-slate-200 bg-slate-50 text-xs font-bold h-10 px-3 focus:ring-primary outline-none"
                                            >
                                                <option value="receptionist">Recepcionista</option>
                                                <option value="nurse">Enfermagem / Triagem</option>
                                                <option value="doctor">Médico</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[8px] font-bold text-slate-400 uppercase">Senha</label>
                                            <input
                                                type="text"
                                                defaultValue={user.password || ""}
                                                onBlur={(e) => handleUpdatePassword(user.uid, e.target.value)}
                                                className="w-24 rounded-lg border-slate-200 bg-slate-50 text-xs font-bold h-10 px-3 focus:ring-primary outline-none"
                                                placeholder="Senha"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="size-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-bold">Nenhum usuário cadastrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                <div className="flex gap-4">
                    <ShieldCheck className="size-6 text-amber-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900">Como funciona o cadastro?</h4>
                        <p className="text-sm text-amber-800 mt-1">
                            Ao cadastrar um e-mail, você está pré-autorizando o profissional. Quando ele logar pela primeira vez usando esse e-mail do Google,
                            o sistema automaticamente vinculará a conta dele ao cargo que você definiu. Usuários com status <span className="font-bold">Pendente</span> ainda não realizaram o primeiro acesso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
