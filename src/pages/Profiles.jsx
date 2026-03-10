// ARQUIVO: src/pages/Profiles.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';
import { FaPlus } from 'react-icons/fa';

import './Profiles.css'; 

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
        <div className="sl-auth-wrapper">
            <h1 className="sl-auth-title">Escolha seu perfil</h1>
            
            <div className="sl-auth-list">
                {/* 1. LISTA DE PERFIS EXISTENTES */}
                {profiles.map((profile) => (
                    <div 
                        key={profile.id} 
                        className="sl-auth-item" 
                        onClick={() => handleProfileSelect(profile)}
                        role="button"
                        tabIndex="0"
                        aria-label={`Selecionar perfil ${profile.name}`}
                    >
                        <div className="sl-auth-avatar">
                            <img 
                                src={profile.imageUrl || `${DEFAULT_AVATAR_BASE}${profile.id}`} 
                                alt={`Avatar de ${profile.name}`} 
                            />
                        </div>
                        <p className="sl-auth-name">{profile.name}</p>
                    </div>
                ))}

                {/* 2. BOTÃO ADICIONAR PERFIL */}
                {profiles.length < MAX_PROFILES && (
                    <div 
                        className="sl-auth-item sl-auth-add" 
                        onClick={handleManageProfiles} 
                        role="button" 
                        tabIndex="0"
                        aria-label="Adicionar novo perfil"
                    >
                        <div className="sl-auth-avatar">
                            <div className="sl-auth-placeholder">
                                <FaPlus />
                            </div>
                        </div>
                        <p className="sl-auth-name">NOVO ACESSO</p>
                    </div>
                )}
            </div>

            {/* 3. BOTÃO GERENCIAR */}
            <button 
                className="sl-auth-manage-btn"
                onClick={handleManageProfiles}
            >
                Configurar Credenciais
            </button>
        </div>
    );
};

export default Profiles;