import { useState, useEffect } from 'react';

const STORAGE_KEY = 'toaruflix_last_profile_id';

const useProfilePreference = () => {
    // 1. Estado para armazenar o ID
    const [lastProfileId, setLastProfileId] = useState(null);

    // 2. Efeito para carregar o ID do localStorage na montagem
    useEffect(() => {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId) {
            setLastProfileId(storedId);
        }
    }, []);

    // 3. Função para salvar o ID (chamada após o login/seleção de perfil)
    const saveProfileId = (profileId) => {
        if (profileId) {
            localStorage.setItem(STORAGE_KEY, profileId);
            setLastProfileId(profileId);
        } else {
            localStorage.removeItem(STORAGE_KEY);
            setLastProfileId(null);
        }
    };
    
    // 4. Função para limpar (logout)
    const clearProfileId = () => {
        localStorage.removeItem(STORAGE_KEY);
        setLastProfileId(null);
    };

    return { lastProfileId, saveProfileId, clearProfileId };
};

export default useProfilePreference;