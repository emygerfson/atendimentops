import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Iniciando monitoramento de estado...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged: firebaseUser =", firebaseUser?.email);
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          console.log("AuthProvider: Buscando perfil para", firebaseUser.uid);
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            console.log("AuthProvider: Perfil encontrado:", data.role);
            const isAdmin = firebaseUser.email === "emy.silva1404@gmail.com";

            if (isAdmin && data.role !== "admin") {
              const updatedProfile = { ...data, role: "admin" as const };
              await setDoc(docRef, updatedProfile);
              setProfile(updatedProfile);
            } else {
              setProfile(data);
            }
          } else {
            console.log("AuthProvider: Perfil não existe, verificando pré-cadastro...");
            // Check if user was pre-registered by email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", firebaseUser.email));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
              const existingDoc = querySnap.docs[0];
              const existingData = existingDoc.data() as UserProfile;
              console.log("AuthProvider: Pré-cadastro encontrado:", existingData.role);

              const updatedProfile: UserProfile = {
                ...existingData,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || existingData.name
              };

              await setDoc(doc(db, "users", firebaseUser.uid), updatedProfile);
              if (existingDoc.id !== firebaseUser.uid) {
                await deleteDoc(doc(db, "users", existingDoc.id));
              }
              setProfile(updatedProfile);
            } else {
              console.log("AuthProvider: Criando novo perfil padrão...");
              const isAdmin = firebaseUser.email === "emy.silva1404@gmail.com";
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Usuário",
                email: firebaseUser.email || "",
                role: isAdmin ? "admin" : "receptionist",
              };
              await setDoc(docRef, newProfile);
              setProfile(newProfile);
            }
          }
        } else {
          console.log("AuthProvider: Nenhum usuário logado.");
          setProfile(null);
        }
      } catch (error) {
        console.error("AuthProvider: Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
        console.log("AuthProvider: Loading finalizado.");
      }
    });

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("AuthProvider: Resultado do redirecionamento recebido:", result.user.email);
        }
      } catch (error) {
        console.error("AuthProvider: Erro no resultado do redirecionamento:", error);
      }
    };
    checkRedirect();
    return unsubscribe;
  }, []);

  const login = async (useRedirect = false) => {
    console.log("Auth: login() chamado, useRedirect =", useRedirect);
    try {
      const provider = new GoogleAuthProvider();
      if (useRedirect) {
        console.log("Auth: Iniciando signInWithRedirect...");
        await signInWithRedirect(auth, provider);
      } else {
        console.log("Auth: Iniciando signInWithPopup...");
        const result = await signInWithPopup(auth, provider);
        console.log("Auth: signInWithPopup resolvido para:", result.user.email);
      }
    } catch (error: any) {
      console.error("Auth: Erro ao fazer login:", error);

      if (error.code === "auth/popup-blocked") {
        console.log("Auth: Popup bloqueado detectado.");
        if (confirm("O popup foi bloqueado. Deseja tentar o login via redirecionamento?")) {
          login(true);
        }
      } else if (error.code === "auth/unauthorized-domain") {
        console.log("Auth: Domínio não autorizado detectado:", window.location.hostname);
        alert("Este domínio (" + window.location.hostname + ") não está autorizado no console do Firebase.");
      } else {
        alert("Erro ao fazer login: " + (error.message || "Tente novamente."));
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
