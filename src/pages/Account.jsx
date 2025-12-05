// ----------------------------------------------------------------
// ARQUIVO: src/pages/Account.jsx
// VERSÃO FINAL CORRIGIDA: Inclui todas as funcionalidades, Fundo Preto Puro e Importação Consertada.
// ----------------------------------------------------------------
import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
// 🛑 CORRIGIDO: Adicionado FaCog à lista de importações
import { FaUserCircle, FaEnvelope, FaLock, FaCheckCircle, FaExclamationTriangle, FaTrash, FaPen, FaBell, FaGlobe, FaCog } from 'react-icons/fa'; 
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner'; 
import { useAuth } from '../contexts/AuthContext'; 

// --- CONFIGURAÇÃO DE CORES (Paleta Dark Pura/Netflix) ---
const COLORS = {
    primary: '#e50914', // Vermelho Netflix
    secondaryBlue: '#0076a8', 
    darkestBlack: '#000000', // Preto Puro
    midBg: '#000000ff', // Fundo dos blocos de conteúdo
    textLight: '#ffffff',
    textMuted: '#ffffffff', 
    success: '#4CAF50',
    error: '#FF5722',
};

// --- STYLED COMPONENTS ---

const AccountContainer = styled.div`
    background-color: ${COLORS.darkestBlack}; /* Fundo Preto Puro */
    min-height: 100vh;
    color: ${COLORS.textLight};
    padding: 100px 4rem 4rem 4rem;
    
    @media (max-width: 768px) {
        padding: 80px 1rem 2rem 1rem;
    }
`;

const ContentWrapper = styled.div`
    max-width: 900px;
    margin: 0 auto;
    border-radius: 8px;
    padding: 2.5rem;
    background-color: ${COLORS.midBg};
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
`;

const Title = styled.h1`
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 2.5rem;
    color: ${COLORS.textLight};
    border-bottom: 3px solid ${COLORS.primary}; /* Destaque Netflix */
    padding-bottom: 0.5rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.6rem;
    font-weight: 700;
    margin-top: 2.5rem;
    margin-bottom: 1.5rem;
    color: ${COLORS.textLight};
    padding-bottom: 5px;
    border-bottom: 1px solid #333;
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const BlockContainer = styled.div`
    background-color: #0a0a0a8f;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    color: white;
`;

const Detail = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.1rem;
    color: ${COLORS.textMuted};
    margin-bottom: 1rem;

    strong {
        font-weight: 600;
        color: ${COLORS.textLight};
        margin-left: 0.5rem;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 1rem 0;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Label = styled.label`
    font-size: 1rem;
    color: ${COLORS.textMuted};
    font-weight: bold;
`;

const Input = styled.input`
    padding: 14px;
    background-color: #333;
    border: 1px solid #555;
    color: ${COLORS.textLight};
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
        border-color: ${COLORS.primary};
        outline: none;
    }
`;

const ActionButton = styled.button`
    background-color: ${props => props.$isDanger ? COLORS.error : COLORS.primary};
    color: white;
    padding: 14px 25px;
    border: none;
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s, opacity 0.2s;
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;

    &:hover {
        background-color: ${props => props.$isDanger ? '#cc371a' : '#c70810'};
    }
    &:disabled {
        background-color: #555;
        cursor: not-allowed;
        opacity: 0.7;
    }
`;

const Message = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 15px;
    border-radius: 4px;
    margin-top: 1rem;
    font-weight: bold;
    font-size: 1rem;
    color: ${props => (props.type === 'success' ? COLORS.success : COLORS.error)};
    background-color: ${props => (props.type === 'success' ? `${COLORS.success}30` : `${COLORS.error}30`)};
`;

const OptionItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px dashed #333;
    
    &:last-child {
        border-bottom: none;
    }

    & > span {
        color: ${COLORS.textLight};
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;

// --- MOCK DE FUNÇÕES DE AUTENTICAÇÃO ---

const updateUserPassword = async (oldPassword, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (oldPassword === '123456') { 
        throw new Error("A senha atual fornecida está incorreta.");
    }
    return true; 
};

const updateDisplayName = async (newDisplayName) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (newDisplayName.length < 3) {
        throw new Error("O nome deve ter pelo menos 3 caracteres.");
    }
    return true; 
};

const deleteUserAccount = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true; 
};

// --- COMPONENTE PRINCIPAL ---

const Account = () => {
    const { user, loading, logout } = useAuth(); 
    
    const [mockUser, setMockUser] = useState(() => user || {
        displayName: "Usuário MaxPlay Premium",
        email: "usuario.premium@email.com",
    });

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

    const [newDisplayName, setNewDisplayName] = useState(mockUser.displayName);
    const [displayNameMessage, setDisplayNameMessage] = useState(null);
    const [isDisplayNameSubmitting, setIsDisplayNameSubmitting] = useState(false);
    
    const [isDeleting, setIsDeleting] = useState(false);
    
    const isPasswordFormValid = useMemo(() => {
        return (
            oldPassword.length > 0 &&
            newPassword.length >= 6 && 
            newPassword === confirmNewPassword &&
            newPassword !== oldPassword
        );
    }, [oldPassword, newPassword, confirmNewPassword]);

    // Handlers
    const handleChangePassword = useCallback(async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!isPasswordFormValid) {
            let errorText = "Verifique os campos: ";
            if (newPassword.length < 6) errorText += "Nova senha deve ter 6+ caracteres. ";
            if (newPassword !== confirmNewPassword) errorText += "A nova senha não confere. ";
            if (newPassword === oldPassword) errorText += "A nova senha deve ser diferente da atual.";

            setPasswordMessage({ type: 'error', text: errorText });
            return;
        }

        setIsPasswordSubmitting(true);
        try {
            await updateUserPassword(oldPassword, newPassword); 
            setPasswordMessage({ type: 'success', text: "Senha alterada com sucesso! Faça login novamente na próxima vez." });
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.message.includes('incorreta') ? error.message : "Falha ao alterar senha. Tente novamente mais tarde." });
        } finally {
            setIsPasswordSubmitting(false);
        }
    }, [oldPassword, newPassword, isPasswordFormValid]);
    
    const handleUpdateName = useCallback(async (e) => {
        e.preventDefault();
        setDisplayNameMessage(null);
        
        if (newDisplayName === mockUser.displayName) {
            setDisplayNameMessage({ type: 'error', text: "O novo nome é o mesmo que o atual." });
            return;
        }

        setIsDisplayNameSubmitting(true);
        try {
            await updateDisplayName(newDisplayName);
            setMockUser(prev => ({ ...prev, displayName: newDisplayName }));
            setDisplayNameMessage({ type: 'success', text: "Nome de usuário atualizado com sucesso!" });
        } catch (error) {
            setDisplayNameMessage({ type: 'error', text: error.message || "Falha ao atualizar o nome." });
        } finally {
            setIsDisplayNameSubmitting(false);
        }
    }, [newDisplayName, mockUser.displayName]);

    const handleDeleteAccount = useCallback(async () => {
        const confirmDelete = window.confirm("ATENÇÃO: Você tem certeza que deseja excluir sua conta permanentemente? Esta ação é irreversível.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await deleteUserAccount();
            logout(); 
        } catch (error) {
            setIsDeleting(false);
            alert("Erro ao tentar excluir a conta. Por favor, tente reautenticar e tente novamente.");
            console.error("Delete error:", error);
        }
    }, [logout]);
    
    if (loading) {
        return <AccountContainer style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><Spinner /></AccountContainer>;
    }

    return (
        <>
            <Header />
            <AccountContainer>
                
                <ContentWrapper>
                    <Title>Configurações da Conta</Title>
                    
                    {/* --- 1. DETALHES PESSOAIS --- */}
                    <SectionTitle>
                        <FaUserCircle style={{ color: COLORS.secondaryBlue }} />
                        Detalhes Pessoais
                    </SectionTitle>
                    <BlockContainer>
                        <Detail>
                            <FaEnvelope style={{ color: COLORS.primary }} />
                            Email: <strong>{mockUser.email}</strong>
                        </Detail>
                        
                        {/* Formulário de Nome */}
                        <Form onSubmit={handleUpdateName}>
                            <FormGroup style={{ maxWidth: '400px' , color: "white"}}>
                                <Label htmlFor="displayName">Nome de Exibição</Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={newDisplayName}
                                    onChange={(e) => setNewDisplayName(e.target.value)}
                                    placeholder="Defina seu nome"
                                    required
                                />
                            </FormGroup>
                            {displayNameMessage && (
                                <Message type={displayNameMessage.type} style={{ width: 'fit-content' }}>
                                    {displayNameMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                    {displayNameMessage.text}
                                </Message>
                            )}
                            <ActionButton 
                                type="submit" 
                                disabled={newDisplayName === mockUser.displayName || isDisplayNameSubmitting} 
                                style={{ width: 'fit-content' }}
                            >
                                <FaPen />
                                {isDisplayNameSubmitting ? 'Atualizando...' : 'Atualizar Nome'}
                            </ActionButton>
                        </Form>
                    </BlockContainer>
                    
                    {/* --- 2. SEGURANÇA E ACESSO --- */}
                    <SectionTitle>
                        <FaLock style={{ color: COLORS.secondaryBlue }} />
                        Segurança e Acesso
                    </SectionTitle>
                    <BlockContainer>
                         <h3 style={{ marginBottom: '1rem', color: COLORS.textLight }}>Alterar Senha</h3>
                        <Form onSubmit={handleChangePassword}>
                            <FormGroup>
                                <Label htmlFor="oldPassword">Senha Atual</Label>
                                <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Digite sua senha atual" required />
                            </FormGroup>
                            <FormGroup>
                                <Label htmlFor="newPassword">Nova Senha (mínimo 6 caracteres)</Label>
                                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Digite a nova senha" required minLength="6" />
                            </FormGroup>
                            <FormGroup>
                                <Label htmlFor="confirmNewPassword">Confirme a Nova Senha</Label>
                                <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirme a nova senha" required minLength="6" />
                            </FormGroup>

                            {passwordMessage && (
                                <Message type={passwordMessage.type}>
                                    {passwordMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                    {passwordMessage.text}
                                </Message>
                            )}
                            
                            <ActionButton type="submit" disabled={!isPasswordFormValid || isPasswordSubmitting} style={{ width: 'fit-content' }}>
                                {isPasswordSubmitting ? 'Alterando...' : 'Alterar Senha'}
                            </ActionButton>
                        </Form>
                    </BlockContainer>
                    
                    {/* --- 3. CONFIGURAÇÕES GERAIS --- */}
                     <SectionTitle>
                        <FaCog style={{ color: COLORS.secondaryBlue }} />
                        Configurações Gerais
                    </SectionTitle>
                    <BlockContainer>
                        <OptionItem>
                            <span><FaBell style={{ color: COLORS.primary }} /> Gerenciar Notificações</span>
                            <ActionButton style={{ background: '#333', padding: '10px 15px', fontSize: '1rem' }}>Editar</ActionButton>
                        </OptionItem>
                         <OptionItem style={{ borderBottom: 'none' }}>
                            <span><FaGlobe style={{ color: COLORS.primary }} /> Idioma Preferido</span>
                            <ActionButton style={{ background: '#333', padding: '10px 15px', fontSize: '1rem' }}>Português (Brasil)</ActionButton>
                        </OptionItem>
                    </BlockContainer>

                    {/* --- 4. OPÇÕES DE CONTA (DELETAR) --- */}
                    <SectionTitle>
                        <FaTrash style={{ color: COLORS.error }} />
                        Opções de Risco
                    </SectionTitle>
                    <BlockContainer>
                        <p style={{ color: 'white', marginBottom: '1.5rem' }}>
                            Ao clicar abaixo, sua conta e todos os dados associados serão excluídos permanentemente do sistema. Esta ação não pode ser desfeita.
                        </p>
                        <ActionButton 
                            $isDanger
                            onClick={handleDeleteAccount} 
                            disabled={isDeleting} 
                            style={{ width: 'fit-content' }}
                        >
                            {isDeleting ? 'Excluindo Conta...' : 'Excluir Conta Permanentemente'}
                        </ActionButton>
                    </BlockContainer>

                </ContentWrapper>
            </AccountContainer>
        </>
    );
};

export default Account;