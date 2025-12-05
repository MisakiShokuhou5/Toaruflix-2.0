// ARQUIVO: src/App.jsx
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
import MusicPage from './pages/MusicPage'; // ✅ PÁGINA DE MÚSICA ADICIONADA
import AdminCentral from './pages/AdminPage';
import WatchPage from './pages/WatchPage';
import TierList from './pages/TierList';
import LightNovel from './pages/LightNovel';
import Manga from './pages/Manga';
import Account from './pages/Account';
import Support from './pages/Support'; 
import Privacy from './pages/Privacy'; 

// ✅ PÁGINA ESPECIAL DE PARCERIA
import LandingPageFinal from './pages/Parceria/LandingPage'; 

/* --- COMPONENTES --- */
import Header from './components/Header';
import CookieConsentBanner from './components/CookieConsentBanner'; 

// --- DADOS ---
const ADMIN_EMAIL = 'joao@gmail.com'; // Altere para o seu e-mail de admin

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


// --- APP PRINCIPAL ---
function App() {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return (
        <BrowserRouter>
            <CookieConsentBanner /> 
            
            <Routes>
                {/* --- ROTAS PÚBLICAS --- */}
                <Route path="/privacy" element={<Privacy />} /> 
                <Route path="/MAXPLAY" element={<LandingPageFinal />} />
                
                {/* Se usuário já logado tentar acessar home/login, vai para profiles */}
                <Route path="/" element={!user ? <Landing /> : <Navigate to="/profiles" replace />} />
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/profiles" />} />

                {/* --- ROTAS DE CONFIGURAÇÃO (Logado, sem perfil obrigatório) --- */}
                <Route path="/profiles" element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
                <Route path="/edit-profiles" element={<ProtectedRoute><EditProfiles /></ProtectedRoute>} />

                {/* --- ROTAS DE CONTEÚDO (Logado + Perfil Selecionado + Header) --- */}
                <Route path="/browse" element={<ProtectedRoute useLayout={true}><Browse /></ProtectedRoute>} />
                <Route path="/details/:slug" element={<ProtectedRoute useLayout={true}><Details /></ProtectedRoute>} />
                
                {/* ROTA MINHA LISTA */}
                <Route path="/mylist" element={<ProtectedRoute useLayout={true}><MyList /></ProtectedRoute>} />

                {/* ROTA TIER LIST */}
                <Route path="/tier-list" element={<ProtectedRoute useLayout={true}><TierList /></ProtectedRoute>} />
                
                {/* ✅ ROTA DE MÚSICA (Spotify Style) - Sem Layout Padrão pois ela tem layout próprio */}
                <Route path="/music" element={<ProtectedRoute useLayout={false}><MusicPage /></ProtectedRoute>} />

                <Route path="/light-novels" element={<ProtectedRoute useLayout={true}><LightNovel /></ProtectedRoute>} />
                <Route path="/manga" element={<ProtectedRoute useLayout={true}><Manga /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute useLayout={true}><Account /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute useLayout={true}><Support /></ProtectedRoute>} />

                {/* --- ADMINISTRAÇÃO --- */}
                <Route path="/admin" element={<AdminRoute useLayout={true}><AdminCentral /></AdminRoute>} />

                {/* --- PLAYER (Tela cheia, sem Header) --- */}
                <Route path="/watch/:slug/:episodeId" element={<ProtectedRoute useLayout={false}><WatchPage /></ProtectedRoute>} />

                {/* --- 404 --- */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;