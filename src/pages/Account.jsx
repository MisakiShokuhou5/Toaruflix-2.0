// ----------------------------------------------------------------
// ARQUIVO: src/pages/Account.jsx
// DESCRIÇÃO: Perfil e Configurações (Minimalist B&W + Fundo Dinâmico)
// ----------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
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

// --- ESTILO GLOBAL PRETO E BRANCO ---
const GlobalStyle = createGlobalStyle`
    body {
        background-color: #000000;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
    }
`;

// --- STYLED COMPONENTS (Minimalismo Premium) ---
const PageContainer = styled.div`
    min-height: 100vh;
    padding-top: 100px;
    padding-bottom: 50px;
    position: relative;
    display: flex;
    justify-content: center;

    /* FUNDO DINÂMICO */
    background-image: url('${props => props.$bgImage}'); 
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    transition: background-image 0.5s ease-in-out;

    /* Overlay escuro para destacar o texto */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.98) 100%);
        z-index: 1;
    }
`;

const MainLayout = styled.div`
    position: relative;
    z-index: 2; /* Acima do overlay */
    width: 100%;
    max-width: 1000px;
    padding: 2rem;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 4rem; /* Mais respiro entre o menu e o conteúdo */

    @media (max-width: 800px) {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 1rem;
    }
`;

// Sidebar sem bordas
const Sidebar = styled.aside`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const UserCard = styled.div`
    padding: 0 0 1.5rem 0;
    text-align: left;
    border-bottom: 1px solid #333333;
    margin-bottom: 1rem;

    svg { font-size: 3rem; color: #ffffff; margin-bottom: 1rem; }
    h3 { margin: 0 0 0.3rem 0; font-size: 1.2rem; font-weight: 700; }
    p { color: #888888; font-size: 0.85rem; word-break: break-all; margin: 0; }
`;

const MenuButton = styled.button`
    background: transparent;
    color: ${props => props.$active ? '#ffffff' : '#888888'};
    border: none;
    padding: 15px 0;
    text-align: left;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: ${props => props.$active ? '600' : '400'};
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
    
    /* Sem borda nos lados, apenas uma linha indicadora subtil se ativo */
    position: relative;

    &:hover {
        color: #ffffff;
    }

    svg {
        font-size: 1.1rem;
    }
`;

// Conteúdo sem bordas laterais
const ContentArea = styled.main`
    background: transparent;
    padding: 0;
    min-height: 400px;
`;

const SectionHeader = styled.div`
    margin-bottom: 2.5rem;
    border-bottom: 1px solid #333333;
    padding-bottom: 1.5rem;
    
    h2 { 
        font-size: 1.8rem; 
        font-weight: 700; 
        display: flex; 
        align-items: center; 
        gap: 12px; 
        margin: 0;
        letter-spacing: -0.5px;
    }
`;

const FormGroup = styled.div`
    margin-bottom: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Label = styled.label`
    color: #888888;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

// Inputs com borda apenas embaixo
const Input = styled.input`
    background: transparent;
    border: none;
    border-bottom: 1px solid #333333;
    padding: 15px 0;
    border-radius: 0;
    color: #ffffff;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;

    &:focus {
        outline: none;
        border-bottom: 2px solid #ffffff;
    }
    &:disabled { 
        color: #666666; 
        border-bottom-color: #222222;
        cursor: not-allowed; 
    }
`;

// Botões Alto Contraste
const ActionButton = styled.button`
    background-color: ${props => props.$danger ? 'transparent' : '#ffffff'};
    border: 1px solid ${props => props.$danger ? '#aaaaaa' : '#ffffff'};
    color: ${props => props.$danger ? '#aaaaaa' : '#000000'};
    padding: 16px 30px;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s ease;
    margin-top: 10px;

    &:hover:not(:disabled) {
        background-color: ${props => props.$danger ? '#ffffff' : '#dddddd'};
        color: ${props => props.$danger ? '#000000' : '#000000'};
        border-color: #ffffff;
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const StatusMessage = styled.div`
    padding: 15px 0;
    margin-top: 20px;
    margin-bottom: 20px;
    color: ${props => props.type === 'error' ? '#aaaaaa' : '#ffffff'};
    border-bottom: 1px solid ${props => props.type === 'error' ? '#444444' : '#ffffff'};
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
`;

const DangerZone = styled.div`
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px dashed #333333;

    h3 { 
        color: #ffffff; 
        margin: 0 0 15px 0; 
        font-size: 1.2rem; 
        display: flex;
        align-items: center;
        gap: 10px;
    }
    p { 
        color: #888888; 
        font-size: 0.95rem; 
        margin-bottom: 1.5rem; 
        line-height: 1.6;
    }
`;

const Account = () => {
    const auth = getAuth();
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('profile');
    
    // Estados dos formulários
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    
    // Feedback visual
    const [statusMsg, setStatusMsg] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- LÓGICA DO FUNDO DINÂMICO ---
    const [backgroundImage, setBackgroundImage] = useState('https://image.tmdb.org/t/p/original/8Z2NOJ1X5Dq2NuuWk9A1h6Zf4S.jpg');

    useEffect(() => {
        const fetchBackgroundFromJSON = async () => {
            try {
                const response = await fetch('https://a-certain-digital-database.netlify.app/src/json/Anime.json');
                const data = await response.json();
                
                let allImages = [];

                Object.values(data).forEach(franchise => {
                    if (Array.isArray(franchise)) {
                        franchise.forEach(anime => {
                            if (anime.FundoImagem) allImages.push(anime.FundoImagem);
                        });
                    } else {
                        Object.values(franchise).forEach(anime => {
                            if (anime.FundoImagem) allImages.push(anime.FundoImagem);
                        });
                    }
                });

                if (allImages.length > 0) {
                    const randomImg = allImages[Math.floor(Math.random() * allImages.length)];
                    setBackgroundImage(randomImg);
                }
            } catch (error) {
                console.error("Erro ao puxar imagem de fundo do JSON:", error);
            }
        };

        fetchBackgroundFromJSON();
    }, []);

    // --- FUNÇÕES DA CONTA ---
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
            if (error.code === 'auth/requires-recent-login') {
                setStatusMsg({ type: 'error', text: 'Por segurança, faça logout e login novamente antes de alterar a senha.' });
            } else {
                setStatusMsg({ type: 'error', text: 'Erro: ' + error.message });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("ATENÇÃO: Isso excluirá permanentemente sua conta e todos os dados. Não há como desfazer. Deseja continuar?");
        if (!confirmDelete) return;

        const password = window.prompt("Por favor, digite sua senha atual para confirmar a exclusão:");
        if (!password) return;

        setIsSubmitting(true);
        try {
            if (auth.currentUser && auth.currentUser.email) {
                const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await deleteUser(auth.currentUser);
                
                alert("Sua conta foi excluída com sucesso.");
                navigate('/'); 
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
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #333'}}>
                            <div>
                                <strong style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem'}}><FaGlobe /> Idioma do Sistema</strong>
                                <p style={{color: '#888888', fontSize: '0.9rem', margin: '5px 0 0 0'}}>O idioma padrão da interface.</p>
                            </div>
                            <span style={{color: '#ffffff', fontWeight: '600'}}>Português (BR)</span>
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
            <GlobalStyle />
            {/* INJEÇÃO SEGURA DAS FONTES */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}
            </style>

            <Header />
            <PageContainer $bgImage={backgroundImage}>
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

                        <MenuButton onClick={handleLogout} style={{marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '1.5rem'}}>
                            <FaSignOutAlt /> Sair do Sistema
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