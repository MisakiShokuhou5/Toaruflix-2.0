import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

/* --- PÁGINAS DO SISTEMA --- */
import Login from './pages/Login';
import Landing from './pages/Landing'; 
import Profiles from './pages/Profiles';
import EditProfiles from './pages/EditProfiles';
import Browse from './pages/Browse';
import Details from './pages/Details';
import MyList from './pages/MyList'; 
import MusicPage from './pages/MusicPage'; 
import AdminCentral from './pages/AdminPage';
import WatchPage from './pages/WatchPage'; // Player padrão (Logado)
import TierList from './pages/TierList';
import LightNovel from './pages/LightNovel';
import Manga from './pages/Manga';
import Account from './pages/Account';
import Support from './pages/Support'; 
import Privacy from './pages/Privacy'; 

/* --- PÁGINAS DA PARCERIA (FLUXO EXTERNO/FREEMIUM) --- */
import LandingPageFinal from './pages/Parceria/LandingPage'; 
import DetailsParceria from './pages/DetailsParceria';
import WatchParceria from './pages/WatchParceria'; // ✅ O Player da parceria

/* --- TELA DE BLOQUEIO (TERROR) --- */
import Terror from './pages/Terror';

/* --- COMPONENTES --- */
import Header from './components/Header';
import CookieConsentBanner from './components/CookieConsentBanner'; 

// --- DADOS ---
const ADMIN_EMAIL = 'joao@gmail.com'; 

/* --- COMPONENTES AUXILIARES --- */

// Tela de 404 Simples
const NotFoundPage = () => (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '3rem', color: '#8a2be2' }}>404</h1>
        <p>Página não encontrada.</p>
    </div>
);

// Tela de Carregamento Global
const LoadingScreen = () => (
    <div style={{ height: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        <div style={{ border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #8a2be2', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
    </div>
);

// Layout Padrão (Com Header Fixo e Padding)
const ContentLayout = ({ children }) => (
    <>
        <Header />
        <main style={{ paddingTop: '68px', minHeight: '100vh', background: '#000000' }}>
            {children}
        </main>
    </>
);

// Rota Protegida (Lógica Central de Acesso)
const ProtectedRoute = ({ children, useLayout = false }) => {
    const { user, loading, selectedProfile } = useAuth();

    if (loading) return <LoadingScreen />;
    
    // 1. Se não tá logado, manda pro Login
    if (!user) return <Navigate to="/login" />;

    // Rotas que permitem usuário logado mas SEM perfil selecionado
    const isProfileSetupRoute = children.type === Profiles || children.type === EditProfiles || children.type === Support;

    // 2. Se tá logado, mas não selecionou perfil e tenta acessar conteúdo -> Manda escolher perfil
    if (user && !selectedProfile && !isProfileSetupRoute) {
        return <Navigate to="/profiles" />;
    }

    // 3. Renderiza com ou sem Header
    if (useLayout) {
        return <ContentLayout>{children}</ContentLayout>;
    }

    return children;
};

// Rota de Admin
const AdminRoute = ({ children, useLayout = false }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" />;

    if (user.email !== ADMIN_EMAIL) {
        return <Navigate to="/browse" replace />;
    }

    if (useLayout) {
        return <ContentLayout>{children}</ContentLayout>;
    }

    return children;
};

/* =====================================================================
   CORE SYSTEM INITIALIZATION & TOARUFLIX APP
   ===================================================================== */

function ToaruflixApp() {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return (
        <BrowserRouter>
            <CookieConsentBanner /> 
            
            <Routes>
                {/* --- ROTAS PÚBLICAS / INSTITUCIONAIS --- */}
                <Route path="/privacy" element={<Privacy />} /> 
                
                {/* --- FLUXO PARCERIA (MAXPLAY FREE) --- */}
                <Route path="/MAXPLAY" element={<LandingPageFinal />} />
                <Route path="/details-parceria/:slug" element={<DetailsParceria />} />
                <Route path="/watch-parceria/:slug/:episodeId" element={<WatchParceria />} />
                
                {/* --- ROTAS DE AUTENTICAÇÃO --- */}
                <Route path="/" element={!user ? <Landing /> : <Navigate to="/profiles" replace />} />
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/profiles" />} />

                {/* --- ROTAS DE CONFIGURAÇÃO (Logado, sem perfil obrigatório) --- */}
                <Route path="/profiles" element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
                <Route path="/edit-profiles" element={<ProtectedRoute><EditProfiles /></ProtectedRoute>} />

                {/* --- ROTAS DE CONTEÚDO (Logado + Perfil Selecionado + Header) --- */}
                <Route path="/browse" element={<ProtectedRoute useLayout={true}><Browse /></ProtectedRoute>} />
                
                {/* Detalhes Padrão (Sistema Logado) */}
                <Route path="/details/:slug" element={<ProtectedRoute useLayout={true}><Details /></ProtectedRoute>} />
                
                {/* Minha Lista */}
                <Route path="/mylist" element={<ProtectedRoute useLayout={true}><MyList /></ProtectedRoute>} />

                {/* Tier List */}
                <Route path="/tier-list" element={<ProtectedRoute useLayout={true}><TierList /></ProtectedRoute>} />
                
                {/* Música */}
                <Route path="/music" element={<ProtectedRoute useLayout={false}><MusicPage /></ProtectedRoute>} />

                {/* Outras Categorias */}
                <Route path="/light-novels" element={<ProtectedRoute useLayout={true}><LightNovel /></ProtectedRoute>} />
                <Route path="/manga" element={<ProtectedRoute useLayout={true}><Manga /></ProtectedRoute>} />
                
                {/* Conta e Suporte */}
                <Route path="/account" element={<ProtectedRoute useLayout={true}><Account /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute useLayout={true}><Support /></ProtectedRoute>} />

                {/* --- ADMINISTRAÇÃO --- */}
                <Route path="/admin" element={<AdminRoute useLayout={true}><AdminCentral /></AdminRoute>} />

                {/* --- PLAYER PADRÃO (Sistema Logado - Tela Cheia) --- */}
                <Route path="/watch/:slug/:episodeId" element={<ProtectedRoute useLayout={false}><WatchPage /></ProtectedRoute>} />

                {/* --- 404 --- */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

/* =====================================================================
   O PORTEIRO - CONTROLE DE ACESSO GLOBAL
   ===================================================================== */

// CHAVE DE ACESSO:
// 'htmlprojetc on' -> Bloqueia a rede (Ativa Tela Terror)
// 'falseProject'   -> Libera o sistema direto (Roda o App)
const _SYSTEM_BOOT_SEQUENCE_ = 'htmlprojetc on'; 

// Verifica se a trava de segurança já foi liberada no navegador
const isSystemPermanentlyUnlocked = () => {
    return localStorage.getItem('toaruflix_unlocked') === 'true';
};

export default function App() {
    // 1. Prioridade Máxima: Se o sistema já foi desbloqueado, ignora a chave de boot
    if (isSystemPermanentlyUnlocked()) {
        return <ToaruflixApp />;
    }

    // 2. Sistema travado - Chama a tela do Accelerator
    if (_SYSTEM_BOOT_SEQUENCE_ === 'htmlprojetc on') {
        return <Terror />; 
    }
    
    // 3. Sistema livre (modo desenvolvimento sem trava)
    if (_SYSTEM_BOOT_SEQUENCE_ === 'falseProject') {
        return <ToaruflixApp />;
    }

    // Fallback de segurança 
    return <div style={{ background: '#000000', height: '100vh', width: '100vw' }} />;
}