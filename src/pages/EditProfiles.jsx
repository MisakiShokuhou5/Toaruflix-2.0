// ARQUIVO: src/pages/EditProfiles.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';
import { FaPen, FaPlus } from 'react-icons/fa';

// Importa os estilos CSS
import './EditProfiles.css'; 

// --- Avatares pré-definidos ---
const avatarOptions = [
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/Accelerator.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/kakine.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/mikoto.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/mugino.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/misaki.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/Junko.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/index.png?raw=true',
];
const MAX_PROFILES = 5;
const DEFAULT_AVATAR = avatarOptions[0];

// --- Subcomponente Modal ---
const ProfileFormModal = ({ isOpen, onClose, profile, onSave, onDelete }) => {
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState(DEFAULT_AVATAR);
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!profile?.id;

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setImageUrl(profile.imageUrl || DEFAULT_AVATAR);
        } else { 
            setName('');
            setImageUrl(avatarOptions[Math.floor(Math.random() * avatarOptions.length)]); 
        }
    }, [profile, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({ ...profile, name, imageUrl }); 
        setIsSaving(false);
        onClose();
    };
    
    const handleDelete = async () => {
        if(window.confirm(`Tem certeza que deseja deletar o perfil "${profile.name}"?`)){
            setIsSaving(true);
            await onDelete(profile.id);
            setIsSaving(false);
            onClose();
        }
    }

    return (
        <div className="starlink-profile-modal-overlay">
            <div className="starlink-profile-modal-content">
                <h2 className="starlink-profile-modal-title">
                    {isEditMode ? 'CONFIGURAR PERFIL' : 'INICIALIZAR PERFIL'}
                </h2>
                
                <input 
                    className="starlink-profile-modal-input"
                    type="text" 
                    placeholder="IDENTIFICAÇÃO DO USUÁRIO" 
                    value={name}
                    onChange={(e) => setName(e.target.value)} 
                    disabled={isSaving}
                />
                
                <label className="starlink-profile-modal-label">
                    SELECIONE UM AVATAR DE SISTEMA:
                </label>
                
                <div className="starlink-profile-avatar-grid">
                    {avatarOptions.map(avatarUrl => (
                        <img 
                            key={avatarUrl}
                            src={avatarUrl}
                            alt="Avatar option"
                            className={`starlink-profile-avatar-option ${imageUrl === avatarUrl ? 'selected' : ''}`}
                            onClick={() => setImageUrl(avatarUrl)}
                            loading="lazy"
                        />
                    ))}
                </div>
                
                <div className="starlink-profile-modal-actions">
                    <button className="starlink-profile-btn starlink-profile-btn-save" onClick={handleSave} disabled={!name || isSaving}>
                        {isSaving ? 'PROCESSANDO...' : 'SALVAR DADOS'}
                    </button>
                    <button className="starlink-profile-btn starlink-profile-btn-cancel" onClick={onClose} disabled={isSaving}>
                        CANCELAR
                    </button>
                    {isEditMode && (
                        <button className="starlink-profile-btn starlink-profile-btn-delete" onClick={handleDelete} disabled={isSaving}>
                            PURGAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Componente Principal ---
const EditProfiles = () => {
    const { user, loading, profiles, selectedProfile, setSelectedProfile } = useAuth();
    const navigate = useNavigate();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfileToEdit, setSelectedProfileToEdit] = useState(null); 

    if (loading) return <Spinner />;
    if (!user) {
        navigate('/login');
        return null;
    }

    const handleProfileClick = (profile) => {
        setSelectedProfileToEdit(profile);
        setIsModalOpen(true);
    };

    const handleAddProfileClick = () => {
        if (profiles.length >= MAX_PROFILES) {
            alert(`LIMITE DE SEGURANÇA: MÁXIMO DE ${MAX_PROFILES} PERFIS ALCANÇADO.`);
            return;
        }
        setSelectedProfileToEdit(null); 
        setIsModalOpen(true);
    };

    const handleSaveProfile = async (profileData) => {
        if (!user) return;
        try {
            if (profileData.id) {
                const profileDoc = doc(db, `users/${user.uid}/profiles`, profileData.id);
                await updateDoc(profileDoc, { 
                    name: profileData.name, 
                    imageUrl: profileData.imageUrl 
                });
            } else {
                const profilesCollection = collection(db, `users/${user.uid}/profiles`);
                await addDoc(profilesCollection, { 
                    name: profileData.name, 
                    imageUrl: profileData.imageUrl,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("FALHA DE COMUNICAÇÃO: NÃO FOI POSSÍVEL SALVAR O PERFIL.");
        }
    };

    const handleDeleteProfile = async (profileId) => {
        if (!user) return;
        if (profiles.length <= 1) {
            alert("PROTOCOLO DE SEGURANÇA: VOCÊ DEVE MANTER PELO MENOS UM PERFIL ATIVO.");
            return;
        }

        try {
            if (selectedProfileToEdit?.id === selectedProfile?.id) {
                setSelectedProfile(null);
            }
            const profileDoc = doc(db, `users/${user.uid}/profiles`, profileId);
            await deleteDoc(profileDoc);
        } catch (error) {
            console.error("Erro ao deletar perfil:", error);
            alert("FALHA DE COMUNICAÇÃO: NÃO FOI POSSÍVEL DELETAR O PERFIL.");
        }
    };
    
    const handleDone = () => {
        if (selectedProfile) {
            navigate('/browse');
        } else if (profiles.length > 0) {
            navigate('/profiles'); 
        } else {
            navigate('/profiles'); 
        }
    };

    return (
        <div className="starlink-profile-container">
            <h1 className="starlink-profile-title">GERENCIAR PERFIS</h1>
            
            <div className="starlink-profile-list">
                {profiles.map(profile => (
                    <div 
                        key={profile.id} 
                        className="starlink-profile-item" 
                        onClick={() => handleProfileClick(profile)}
                        role="button"
                        tabIndex="0"
                    >
                        <div className="starlink-profile-avatar">
                            <img 
                                src={profile.imageUrl || DEFAULT_AVATAR} 
                                alt={`Perfil de ${profile.name}`} 
                                loading="lazy"
                            />
                            <div className="starlink-profile-edit-overlay">
                                <FaPen />
                            </div>
                        </div>
                        <p className="starlink-profile-name">{profile.name}</p>
                    </div>
                ))}
                
                {profiles.length < MAX_PROFILES && (
                    <div 
                        className="starlink-profile-item starlink-profile-add-item" 
                        onClick={handleAddProfileClick}
                        role="button"
                        tabIndex="0"
                    >
                        <div className="starlink-profile-avatar starlink-profile-add-placeholder">
                            <FaPlus />
                        </div>
                        <p className="starlink-profile-name">ADICIONAR</p>
                    </div>
                )}
            </div>

            <button className="starlink-profile-done-button" onClick={handleDone}>
                FINALIZAR CONFIGURAÇÃO
            </button>
            
            <ProfileFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profile={selectedProfileToEdit}
                onSave={handleSaveProfile}
                onDelete={handleDeleteProfile}
            />
        </div>
    );
};

export default EditProfiles;