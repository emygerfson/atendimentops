import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { Activity } from "lucide-react";

export const Login = () => {
    const { user, loading, login } = useAuth();

    console.log("Login Screen Rendering: user =", user?.email, "loading =", loading);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando Sessão...</div>;
    if (user) {
        console.log("Login Screen: User found, redirecting to /");
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
                <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-primary/30">
                    <Activity className="size-10" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">MedControl Pro</h1>
                    <p className="text-slate-500 text-sm mt-1">Sistema Integrado de Gestão Hospitalar</p>
                </div>
                <button
                    onClick={() => {
                        console.log("Login Button Clicked");
                        login().then(() => console.log("login() promise resolved"))
                            .catch(err => console.error("login() promise rejected:", err));
                    }}
                    className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all"
                >
                    <img src="https://www.google.com/favicon.ico" className="size-5" alt="Google" />
                    Entrar com Google
                </button>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Acesso restrito a profissionais autorizados</p>
            </div>
        </div>
    );
};
