// ARQUIVO: src/pages/Profiles.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';
import { FaPlus } from 'react-icons/fa';

import './Profiles.css'; 

// MOCK: URL de Avatar Padrão (Usado se o perfil for novo/vazio)
// Use um gerador de avatar que produza imagens quadradas ou mais consistentes.
// Dicebear é uma ótima opção para avatares gerados.
const DEFAULT_AVATAR_BASE = "https://api.dicebear.com/7.x/pixel-art/svg?seed=";
const MAX_PROFILES = 5;

const Profiles = () => {
    const { user, loading, profiles, setSelectedProfile } = useAuth();
    const navigate = useNavigate();

    if (loading) return <Spinner />;

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleProfileSelect = (profile) => {
        setSelectedProfile(profile);
        navigate('/browse'); 
    };

    const handleManageProfiles = () => {
        navigate('/edit-profiles'); 
    };

    return (
        <div className="profiles-wrapper">
            <h1 className="profiles-title">Quem está assistindo ?</h1>
            
            <div className="profiles-list">
                {/* 1. LISTA DE PERFIS EXISTENTES */}
                {profiles.map((profile) => (
                    <div 
                        key={profile.id} 
                        className="profile-item-container" 
                        onClick={() => handleProfileSelect(profile)}
                        role="button" // Acessibilidade: Indica que é clicável
                        tabIndex="0" // Permite navegação por teclado
                        aria-label={`Selecionar perfil ${profile.name}`}
                    >
                        <div className="profile-avatar">
                            {/* AGORA USAMOS A TAG <img> DENTRO DO DIV PARA object-fit */}
                            <img 
                                src={profile.imageUrl || `${DEFAULT_AVATAR_BASE}${profile.id}`} 
                                alt={`Avatar de ${profile.name}`} 
                            />
                        </div>
                        <p className="profile-name">{profile.name}</p>
                    </div>
                ))}

                {/* 2. BOTÃO ADICIONAR PERFIL (Se houver espaço) */}
                {profiles.length < MAX_PROFILES && (
                    <div 
                        className="profile-item-container" 
                        onClick={handleManageProfiles} 
                        role="button" 
                        tabIndex="0"
                        aria-label="Adicionar novo perfil"
                    >
                        <div className="profile-avatar">
                            {/* Placeholder para o ícone de adição */}
                            <div className="add-profile-placeholder">
                                <FaPlus />
                            </div>
                        </div>
                        <p className="profile-name">Adicionar Perfil</p>
                    </div>
                )}
            </div>

            {/* 3. BOTÃO GERENCIAR */}
            <button 
                className="manage-profiles-button"
                onClick={handleManageProfiles}
            >
                Gerenciar Perfis
            </button>
        </div>
    );
};

export default Profiles;