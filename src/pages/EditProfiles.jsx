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

// --- Avatares pré-definidos (Escolha imagens quadradas e de alta qualidade) ---
const avatarOptions = [
    // NOVOS ENDEREÇOS DO SEU REPOSITÓRIO
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/Accelerator.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/kakine.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/mikoto.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/mugino.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/misaki.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/Junko.png?raw=true',
    'https://github.com/MisakiShokuhou5/A-certain-Digital-Database/blob/main/src/profile/index.png?raw=true',
];
const MAX_PROFILES = 5;

// CORREÇÃO DO ERRO: DEFINIÇÃO DA CONSTANTE DE COR
const COLOR_TEXT_LIGHT = '#ffffff'; 
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
        } else { // Modo de criação
            setName('');
            // Define um avatar aleatório para o novo perfil
            setImageUrl(avatarOptions[Math.floor(Math.random() * avatarOptions.length)]); 
        }
    }, [profile, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        // Garante que o perfil tenha um ID ou um objeto vazio para a criação
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">{isEditMode ? 'Editar Perfil' : 'Adicionar Perfil'}</h2>
                <input 
                    className="modal-input"
                    type="text" 
                    placeholder="Nome do Perfil" 
                    value={name}
                    onChange={(e) => setName(e.target.value)} 
                    disabled={isSaving}
                />
                {/* A constante COLOR_TEXT_LIGHT é usada aqui: */}
                <label style={{ color: COLOR_TEXT_LIGHT, fontSize: '1.1rem', marginBottom: '1rem', display: 'block' }}>
                    Escolha um avatar:
                </label>
                <div className="avatar-grid">
                    {avatarOptions.map(avatarUrl => (
                        <img 
                            key={avatarUrl}
                            src={avatarUrl}
                            alt="Avatar option"
                            className={`avatar-option ${imageUrl === avatarUrl ? 'selected' : ''}`}
                            onClick={() => setImageUrl(avatarUrl)}
                            loading="lazy"
                        />
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="modal-button save" onClick={handleSave} disabled={!name || isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button className="modal-button cancel" onClick={onClose} disabled={isSaving}>Cancelar</button>
                    {isEditMode && (
                        <button className="modal-button delete" onClick={handleDelete} disabled={isSaving}>
                            Deletar
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
    
    // Estado para controlar o modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Armazena o perfil que está sendo editado (null para Adicionar)
    const [selectedProfileToEdit, setSelectedProfileToEdit] = useState(null); 

    if (loading) return <Spinner />;
    if (!user) {
        navigate('/login');
        return null;
    }

    // --- Handlers de Ação ---

    const handleProfileClick = (profile) => {
        setSelectedProfileToEdit(profile);
        setIsModalOpen(true);
    };

    const handleAddProfileClick = () => {
        if (profiles.length >= MAX_PROFILES) {
            alert(`Limite máximo de ${MAX_PROFILES} perfis alcançado.`);
            return;
        }
        setSelectedProfileToEdit(null); // Criação
        setIsModalOpen(true);
    };

    const handleSaveProfile = async (profileData) => {
        if (!user) return;
        
        try {
            if (profileData.id) {
                // EDIÇÃO (UPDATE)
                const profileDoc = doc(db, `users/${user.uid}/profiles`, profileData.id);
                await updateDoc(profileDoc, { 
                    name: profileData.name, 
                    imageUrl: profileData.imageUrl 
                });
                
            } else {
                // CRIAÇÃO (ADD)
                const profilesCollection = collection(db, `users/${user.uid}/profiles`);
                await addDoc(profilesCollection, { 
                    name: profileData.name, 
                    imageUrl: profileData.imageUrl,
                    createdAt: serverTimestamp()
                });
            }
            
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Falha ao salvar o perfil.");
        }
    };

    const handleDeleteProfile = async (profileId) => {
        if (!user) return;
        
        if (profiles.length <= 1) {
            alert("Você deve manter pelo menos um perfil.");
            return;
        }

        try {
            // Se o perfil deletado for o perfil ativo, desativa a seleção
            if (selectedProfileToEdit?.id === selectedProfile?.id) {
                setSelectedProfile(null);
            }
            
            const profileDoc = doc(db, `users/${user.uid}/profiles`, profileId);
            await deleteDoc(profileDoc);
            
        } catch (error) {
            console.error("Erro ao deletar perfil:", error);
            alert("Falha ao deletar o perfil.");
        }
    };
    
    const handleDone = () => {
        // Redireciona para o Browse se já tiver um perfil selecionado
        if (selectedProfile) {
            navigate('/browse');
        } 
        // Se nenhum perfil estiver selecionado após a edição, vai para a seleção
        else if (profiles.length > 0) {
            navigate('/profiles'); 
        } 
        // Caso raro: se não houver perfis (deletou o último), também volta para o profiles (que forçará o logout se não for permitido)
        else {
            navigate('/profiles'); 
        }
    };


    return (
        <div className="profiles-container">
            <h1 className="profiles-title">Gerenciar Perfis</h1>
            <div className="profile-list">
                
                {/* Renderiza Perfis Existentes */}
                {profiles.map(profile => (
                    <div 
                        key={profile.id} 
                        className="profile-item-container" 
                        onClick={() => handleProfileClick(profile)}
                        role="button"
                        tabIndex="0"
                        aria-label={`Editar perfil ${profile.name}`}
                    >
                        <div className="profile-avatar">
                            <img 
                                src={profile.imageUrl || DEFAULT_AVATAR} 
                                alt={`Perfil de ${profile.name}`} 
                                loading="lazy"
                            />
                            <div className="edit-overlay">
                                <FaPen />
                            </div>
                        </div>
                        <p className="profile-name">{profile.name}</p>
                    </div>
                ))}
                
                {/* Botão Adicionar Perfil */}
                {profiles.length < MAX_PROFILES && (
                    <div 
                        className="profile-item-container" 
                        onClick={handleAddProfileClick}
                        role="button"
                        tabIndex="0"
                        aria-label="Adicionar novo perfil"
                    >
                        <div className="profile-avatar">
                            <div className="add-profile-placeholder">
                                <FaPlus />
                            </div>
                        </div>
                        <p className="profile-name">Adicionar Perfil</p>
                    </div>
                )}
            </div>

            <button className="done-button" onClick={handleDone}>
                Concluído
            </button>
            
            {/* Modal de Edição/Criação */}
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