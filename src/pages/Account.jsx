// ----------------------------------------------------------------
// ARQUIVO: src/pages/Account.jsx
// ----------------------------------------------------------------
import React, { useState } from 'react';
import styled from 'styled-components';
import { 
    FaUserCircle, FaLock, FaCheckCircle, 
    FaExclamationTriangle, FaTrash, FaPen, 
    FaSignOutAlt, FaGlobe, FaShieldAlt
} from 'react-icons/fa'; 
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner'; 
import { useAuth } from '../contexts/AuthContext'; 
import { useNavigate } from 'react-router-dom';

// ✅ IMPORTAÇÕES REAIS DO FIREBASE
import { 
    getAuth, 
    updateProfile, 
    updatePassword, 
    deleteUser, 
    reauthenticateWithCredential, 
    EmailAuthProvider 
} from 'firebase/auth';

// --- CORES (Mantendo o tema Dark Premium) ---
const COLORS = {
    primary: '#e50914', 
    background: '#141414',
    panelBg: '#1f1f1f',
    textLight: '#ffffff',
    textMuted: '#b3b3b3', 
    border: '#333333',
    success: '#4CAF50',
    error: '#e50914',
    inputBg: '#333333',
};

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
    background-color: ${COLORS.background};
    min-height: 100vh;
    color: ${COLORS.textLight};
    padding-top: 90px;
`;

const MainLayout = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;

    @media (max-width: 800px) {
        grid-template-columns: 1fr;
    }
`;

// Sidebar
const Sidebar = styled.aside`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const UserCard = styled.div`
    background: ${COLORS.panelBg};
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    border: 1px solid ${COLORS.border};
    margin-bottom: 1rem;

    svg { font-size: 3.5rem; color: ${COLORS.textMuted}; margin-bottom: 0.8rem; }
    h3 { margin-bottom: 0.3rem; font-size: 1.1rem; }
    p { color: ${COLORS.textMuted}; font-size: 0.8rem; word-break: break-all; }
`;

const MenuButton = styled.button`
    background: ${props => props.$active ? COLORS.primary : 'transparent'};
    color: ${COLORS.textLight};
    border: none;
    padding: 12px 15px;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
    border-left: 3px solid ${props => props.$active ? '#fff' : 'transparent'};

    &:hover {
        background: ${props => props.$active ? COLORS.primary : '#333'};
    }
`;

// Conteúdo
const ContentArea = styled.main`
    background: ${COLORS.panelBg};
    padding: 2.5rem;
    border-radius: 8px;
    border: 1px solid ${COLORS.border};
    min-height: 400px;
`;

const SectionHeader = styled.div`
    margin-bottom: 2rem;
    border-bottom: 1px solid ${COLORS.border};
    padding-bottom: 1rem;
    h2 { font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; gap: 10px; }
`;

const FormGroup = styled.div`
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Label = styled.label`
    color: ${COLORS.textMuted};
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
`;

const Input = styled.input`
    background: ${COLORS.inputBg};
    border: none;
    padding: 12px 15px;
    border-radius: 4px;
    color: white;
    font-size: 1rem;
    border-bottom: 2px solid transparent;
    &:focus {
        outline: none;
        background: #404040;
        border-bottom-color: ${COLORS.primary};
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ActionButton = styled.button`
    background-color: ${props => props.$danger ? 'transparent' : COLORS.primary};
    border: ${props => props.$danger ? `1px solid ${COLORS.error}` : 'none'};
    color: ${props => props.$danger ? COLORS.error : 'white'};
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: 0.2s;
    margin-top: 10px;

    &:hover {
        background-color: ${props => props.$danger ? 'rgba(229, 9, 20, 0.1)' : '#c40812'};
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const StatusMessage = styled.div`
    padding: 12px;
    border-radius: 4px;
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    background: ${props => props.type === 'error' ? 'rgba(229, 9, 20, 0.15)' : 'rgba(76, 175, 80, 0.15)'};
    color: ${props => props.type === 'error' ? '#ff8a80' : '#81c784'};
    border: 1px solid ${props => props.type === 'error' ? COLORS.error : COLORS.success};
`;

const DangerZone = styled.div`
    margin-top: 3rem;
    border: 1px solid ${COLORS.error};
    border-radius: 8px;
    padding: 1.5rem;
    background: rgba(229, 9, 20, 0.05);

    h3 { color: ${COLORS.error}; margin-bottom: 10px; font-size: 1.1rem; }
    p { color: ${COLORS.textMuted}; font-size: 0.9rem; margin-bottom: 1rem; }
`;

const Account = () => {
    const auth = getAuth(); // Instância direta do Auth
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    
    // Estados dos formulários
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    
    // Feedback visual
    const [statusMsg, setStatusMsg] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FUNÇÃO 1: ATUALIZAR NOME (REAL) ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMsg(null);

        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: displayName });
                setStatusMsg({ type: 'success', text: 'Nome atualizado com sucesso!' });
            }
        } catch (error) {
            console.error(error);
            setStatusMsg({ type: 'error', text: 'Erro ao atualizar nome: ' + error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- FUNÇÃO 2: ALTERAR SENHA (REAL) ---
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setStatusMsg(null);

        if (passwords.new !== passwords.confirm) {
            setStatusMsg({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }
        if (passwords.new.length < 6) {
            setStatusMsg({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, passwords.new);
                setStatusMsg({ type: 'success', text: 'Senha alterada! Use a nova senha no próximo login.' });
                setPasswords({ new: '', confirm: '' });
            }
        } catch (error) {
            console.error(error);
            // Se pedir login recente, avisa o usuário
            if (error.code === 'auth/requires-recent-login') {
                setStatusMsg({ type: 'error', text: 'Por segurança, faça logout e login novamente antes de alterar a senha.' });
            } else {
                setStatusMsg({ type: 'error', text: 'Erro: ' + error.message });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- FUNÇÃO 3: EXCLUIR CONTA (REAL COM RE-AUTH) ---
    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("ATENÇÃO: Isso excluirá permanentemente sua conta e todos os dados. Não há como desfazer. Deseja continuar?");
        if (!confirmDelete) return;

        // Firebase exige re-autenticação para operações sensíveis como deletar
        const password = window.prompt("Por favor, digite sua senha atual para confirmar a exclusão:");
        if (!password) return;

        setIsSubmitting(true);
        try {
            if (auth.currentUser && auth.currentUser.email) {
                // 1. Re-autenticar o usuário
                const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
                await reauthenticateWithCredential(auth.currentUser, credential);

                // 2. Deletar o usuário
                await deleteUser(auth.currentUser);
                
                alert("Sua conta foi excluída com sucesso.");
                navigate('/'); // Redireciona para home/login
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            if (error.code === 'auth/wrong-password') {
                alert("Senha incorreta. A conta não foi excluída.");
            } else {
                alert("Falha ao excluir conta: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div style={{height: '100vh', display:'flex', justifyContent:'center', alignItems:'center'}}><Spinner /></div>;

    const renderContent = () => {
        switch(activeTab) {
            case 'profile':
                return (
                    <>
                        <SectionHeader>
                            <h2><FaUserCircle /> Meu Perfil</h2>
                        </SectionHeader>
                        <form onSubmit={handleUpdateProfile}>
                            <FormGroup>
                                <Label>E-mail (Login)</Label>
                                <Input disabled value={user?.email || ''} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Nome de Exibição</Label>
                                <Input 
                                    value={displayName} 
                                    onChange={(e) => setDisplayName(e.target.value)} 
                                    placeholder="Como você quer ser chamado?"
                                />
                            </FormGroup>
                            <ActionButton disabled={isSubmitting || !displayName}>
                                {isSubmitting ? <Spinner size="small" /> : <><FaPen /> Salvar Alterações</>}
                            </ActionButton>
                        </form>
                    </>
                );
            case 'security':
                return (
                    <>
                        <SectionHeader>
                            <h2><FaLock /> Segurança da Conta</h2>
                        </SectionHeader>
                        <form onSubmit={handleUpdatePassword}>
                            <FormGroup>
                                <Label>Nova Senha</Label>
                                <Input 
                                    type="password" 
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Confirmar Nova Senha</Label>
                                <Input 
                                    type="password" 
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                    placeholder="Repita a senha"
                                />
                            </FormGroup>
                            <ActionButton disabled={isSubmitting || !passwords.new}>
                                {isSubmitting ? <Spinner size="small" /> : 'Atualizar Senha'}
                            </ActionButton>
                        </form>
                    </>
                );
            case 'settings':
                return (
                    <>
                        <SectionHeader>
                            <h2><FaShieldAlt /> Configurações Gerais</h2>
                        </SectionHeader>
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #333'}}>
                            <div>
                                <strong style={{display: 'flex', alignItems: 'center', gap: '8px'}}><FaGlobe /> Idioma do Sistema</strong>
                                <p style={{color: COLORS.textMuted, fontSize: '0.85rem'}}>O idioma padrão da interface.</p>
                            </div>
                            <span style={{background: '#333', padding: '5px 10px', borderRadius: '4px', fontSize: '0.9rem'}}>Português (BR)</span>
                        </div>

                        <DangerZone>
                            <h3><FaExclamationTriangle /> Zona de Perigo</h3>
                            <p>Ao excluir sua conta, todos os seus dados (favoritos, histórico) serão apagados permanentemente dos nossos servidores. Esta ação não pode ser desfeita.</p>
                            <ActionButton 
                                $danger 
                                onClick={handleDeleteAccount}
                                disabled={isSubmitting}
                            >
                                <FaTrash /> {isSubmitting ? 'Processando...' : 'Excluir Minha Conta'}
                            </ActionButton>
                        </DangerZone>
                    </>
                );
            default: return null;
        }
    };

    return (
        <>
            <Header />
            <PageContainer>
                <MainLayout>
                    {/* MENU LATERAL */}
                    <Sidebar>
                        <UserCard>
                            <FaUserCircle />
                            <h3>{user?.displayName || 'Usuário'}</h3>
                            <p>{user?.email}</p>
                        </UserCard>
                        
                        <nav style={{display:'flex', flexDirection:'column', gap: '5px'}}>
                            <MenuButton $active={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); setStatusMsg(null);}}>
                                <FaUserCircle /> Dados Pessoais
                            </MenuButton>
                            <MenuButton $active={activeTab === 'security'} onClick={() => {setActiveTab('security'); setStatusMsg(null);}}>
                                <FaLock /> Senha
                            </MenuButton>
                            <MenuButton $active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setStatusMsg(null);}}>
                                <FaShieldAlt /> Configurações
                            </MenuButton>
                        </nav>

                        <MenuButton onClick={handleLogout} style={{marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '1rem'}}>
                            <FaSignOutAlt /> Sair
                        </MenuButton>
                    </Sidebar>

                    {/* ÁREA DE CONTEÚDO */}
                    <ContentArea>
                        {renderContent()}
                        
                        {/* MENSAGEM GLOBAL DE STATUS */}
                        {statusMsg && (
                            <StatusMessage type={statusMsg.type}>
                                {statusMsg.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                {statusMsg.text}
                            </StatusMessage>
                        )}
                    </ContentArea>
                </MainLayout>
            </PageContainer>
        </>
    );
};

export default Account;