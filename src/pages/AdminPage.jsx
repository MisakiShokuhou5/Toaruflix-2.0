// ARQUIVO: src/pages/AdminCentral.jsx 
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// Importa o db assumindo que o caminho é '../firebase/config' a partir da raiz /pages
import { db } from '../firebase/config'; 
// ÍCONES: Adicionado FaBook e FaScroll para Leitura, FaHeadset para Suporte
import { FaTv, FaListOl, FaStar, FaUserFriends, FaBook, FaScroll, FaHeadset } from 'react-icons/fa'; 

// Importa os subcomponentes da pasta AdminPage/
import ManageSeries from './AdminPage/ManageSeries';
import ManageEpisodes from './AdminPage/ManageEpisodes';
import ManageHeroConfig from './AdminPage/ManageHeroConfig'; 
import AdminCharacters from './AdminPage/AdminCharacters'; 
import AdminLightNovel from './AdminPage/AdminLightNovel'; 
import AdminManga from './AdminPage/AdminManga';       
import AdminSupport from './AdminPage/AdminSupport';     // 🛑 NOVO: Importação do AdminSupport

// Importa o CSS da pasta AdminPage/
import './AdminPage.css'; 


// ----------------------------------------------------------------
// HOOK: Busca a lista de animes e seus episódios do Firestore
// ----------------------------------------------------------------
const useAnimeList = (refreshTrigger) => { 
    const [animeList, setAnimeList] = useState([]);
    const [episodesData, setEpisodesData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                // 1. Busca Animes (Metadados da Série)
                const animesQ = collection(db, 'animes');
                const animesSnapshot = await getDocs(animesQ);
                const list = animesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAnimeList(list);

                // 2. Busca Episódios (Detalhes de Cada Episódio)
                const episodesQ = collection(db, 'episodes');
                const episodesSnapshot = await getDocs(episodesQ);
                const episodesMap = {};

                episodesSnapshot.docs.forEach(doc => {
                    const ep = doc.data();
                    const slug = ep.animeSlug;
                    
                    if (!episodesMap[slug]) {
                        episodesMap[slug] = [];
                    }
                    episodesMap[slug].push(ep);
                });
                setEpisodesData(episodesMap);

            } catch (error) {
                console.error("Erro ao buscar conteúdo no Admin Central:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [refreshTrigger]); 

    return { animeList, episodesData, loading };
};


// ----------------------------------------------------------------
// COMPONENTE CENTRAL (AdminCentral.jsx)
// ----------------------------------------------------------------

const AdminCentral = () => {
    const [activeTab, setActiveTab] = useState('series');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Gatilho para forçar refresh
    const { animeList, episodesData, loading } = useAnimeList(refreshTrigger);

    const handleMessage = (msg, success) => {
        setMessage(msg);
        setIsSuccess(success);
        setTimeout(() => setMessage(''), 5000); 
    };

    if (loading) {
        return (
             <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#141414', color: 'white' }}>
                <p>Carregando dados do Painel Administrativo...</p>
            </div>
        );
    }
    
    return (
        <div className="admin-container">
            <h1>Painel Administrativo ToaruFlix</h1>
            
            {/* Mensagem de Status */}
            {message && (
                <p className={`status-message ${isSuccess ? 'success' : 'error'}`}>
                    {message}
                </p>
            )}

            {/* BARRA DE NAVEGAÇÃO ENTRE ABAS */}
            <div className="tab-bar">
                <button className={`tab-button ${activeTab === 'series' ? 'active' : ''}`} onClick={() => setActiveTab('series')}>
                    <FaTv /> Gerenciar Séries
                </button>
                <button className={`tab-button ${activeTab === 'episodes' ? 'active' : ''}`} onClick={() => setActiveTab('episodes')}>
                    <FaListOl /> Gerenciar Episódios
                </button>
                <button className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')}>
                    <FaUserFriends /> Gerenciar Personagens 
                </button>
                {/* Botão Light Novel */}
                <button className={`tab-button ${activeTab === 'lightnovels' ? 'active' : ''}`} onClick={() => setActiveTab('lightnovels')}>
                    <FaBook /> Light Novels
                </button>
                {/* Botão Mangá */}
                <button className={`tab-button ${activeTab === 'mangas' ? 'active' : ''}`} onClick={() => setActiveTab('mangas')}>
                    <FaScroll /> Mangás
                </button>
                {/* 🛑 NOVO BOTÃO: Suporte */}
                <button className={`tab-button ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
                    <FaHeadset /> Tickets Suporte 
                </button>
                <button className={`tab-button ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => setActiveTab('hero')}>
                    <FaStar /> Configurações do Hero
                </button>
            </div>

            {/* CONTEÚDO DA ABA SELECIONADA - Usando os componentes modulares importados */}
            {activeTab === 'series' && (
                <ManageSeries onMessage={handleMessage} animeList={animeList} />
            )}

            {activeTab === 'episodes' && (
                <ManageEpisodes onMessage={handleMessage} animeList={animeList} episodesData={episodesData} />
            )}
            
            {activeTab === 'characters' && (
                <AdminCharacters />
            )}

            {/* Renderiza AdminLightNovel */}
            {activeTab === 'lightnovels' && (
                <AdminLightNovel />
            )}

            {/* Renderiza AdminManga */}
            {activeTab === 'mangas' && (
                <AdminManga />
            )}

            {/* 🛑 NOVO: Renderiza AdminSupport */}
            {activeTab === 'support' && (
                <AdminSupport />
            )}

            {activeTab === 'hero' && (
                <ManageHeroConfig onMessage={handleMessage} animeList={animeList} setRefreshTrigger={setRefreshTrigger} />
            )}
        </div>
    );
};

export default AdminCentral;