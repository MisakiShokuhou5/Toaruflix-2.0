// ARQUIVO: src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [profiles, setProfiles] = useState([]);
    
    // Unificamos o loading. Começa true.
    const [loading, setLoading] = useState(true);

    /**
     * Auxiliares de LocalStorage
     */
    const clearProfilePreference = (uid) => {
        if (uid) localStorage.removeItem(`selectedProfileId_${uid}`);
    };

    const setProfilePreference = (uid, profileId) => {
        if (uid && profileId) localStorage.setItem(`selectedProfileId_${uid}`, profileId);
    };

    // 1. Monitora Autenticação
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            
            // SE NÃO TIVER USUÁRIO:
            // Podemos parar o loading imediatamente, pois não há perfis para carregar.
            if (!currentUser) {
                setSelectedProfile(null);
                setProfiles([]);
                setLoading(false); 
            }
            
            // SE TIVER USUÁRIO:
            // NÃO setamos loading(false) aqui! 
            // Deixamos o loading(true) até que o useEffect dos perfis (abaixo) resolva qual perfil usar.
        });
        return () => unsubscribe();
    }, []);

    // 2. Monitora Perfis (Só roda se tiver user)
    useEffect(() => {
        if (user) {
            // Garantimos que está carregando enquanto buscamos os dados
            // (Caso o user mude sem recarregar a página)
            setLoading(true); 

            const profilesCollectionRef = collection(db, `users/${user.uid}/profiles`);
            const q = query(profilesCollectionRef, orderBy('createdAt', 'asc'));

            const unsubscribeProfiles = onSnapshot(q, (snapshot) => {
                const profilesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProfiles(profilesData);

                // Tenta recuperar a preferência salva
                const storedProfileId = localStorage.getItem(`selectedProfileId_${user.uid}`);
                let activeProfile = null;
                
                if (profilesData.length > 0) {
                    // 1. Tenta achar o perfil salvo no storage
                    if (storedProfileId) {
                        activeProfile = profilesData.find(p => p.id === storedProfileId);
                    }
                    // 2. Se não achou (ou não tinha salvo), pega o primeiro da lista (Auto-select igual Netflix)
                    if (!activeProfile) {
                        activeProfile = profilesData[0];
                    }
                } 
                
                // Atualiza o estado
                setSelectedProfile(activeProfile);
                
                // Se escolhemos um perfil automaticamente, salvamos a preferência para consistência
                if (activeProfile) {
                    setProfilePreference(user.uid, activeProfile.id);
                }

                // ✅ AGORA SIM, liberamos o app
                setLoading(false);

            }, (error) => {
                console.error("Erro ao carregar perfis:", error);
                // Mesmo com erro, precisamos liberar o loading para não travar a tela
                setLoading(false); 
            });

            return () => unsubscribeProfiles();
        }
    }, [user]);

    // Logout Otimizado
    const signOut = async () => {
        if (user) {
            clearProfilePreference(user.uid);
        }
        setSelectedProfile(null);
        setProfiles([]);
        await firebaseSignOut(auth);
    };

    // Seleção Manual de Perfil
    const handleSetSelectedProfile = (profile) => {
        setSelectedProfile(profile);
        if (user && profile) {
            setProfilePreference(user.uid, profile.id);
        }
    };

    const value = {
        user,
        loading, // Loading unificado
        selectedProfile,
        profiles,
        signOut,
        setSelectedProfile: handleSetSelectedProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);