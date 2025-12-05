// ARQUIVO: src/pages/AdminPage/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// Ajuste o caminho se necessário: assumindo que o firebase está em '../firebase/config'
import { db } from '../../../firebase/config'; 
import { FaTv, FaListOl, FaStar, FaUserFriends } from 'react-icons/fa'; // 🛑 NOVO ÍCONE: FaUserFriends para Personagens

// Importa os subcomponentes modulares
import ManageSeries from './ManageSeries';
import ManageEpisodes from './ManageEpisodes';
import ManageHeroConfig from './ManageHeroConfig'; 
import AdminCharacters from './AdminCharacters'; // 🛑 NOVO: Importação do AdminCharacters

// Importa o CSS na mesma pasta
import './AdminPage.css'; 


// ----------------------------------------------------------------
// HOOK: Busca a lista de animes e seus episódios do Firestore
// ----------------------------------------------------------------
const useAnimeList = (refreshTrigger) => { 
    // [Lógica do Hook Mantida]
    const [animeList, setAnimeList] = useState([]);
    const [episodesData, setEpisodesData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const animesQ = collection(db, 'animes');
                const animesSnapshot = await getDocs(animesQ);
                const list = animesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAnimeList(list);

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
                console.error("Erro ao buscar conteúdo no Admin Page:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [refreshTrigger]); 

    return { animeList, episodesData, loading };
};


// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL (AdminPage)
// ----------------------------------------------------------------

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('series');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
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
                {/* 🛑 NOVO BOTÃO DE PERSONAGENS */}
                <button className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`} onClick={() => setActiveTab('characters')}>
                    <FaUserFriends /> Gerenciar Personagens
                </button>
                <button className={`tab-button ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => setActiveTab('hero')}>
                    <FaStar /> Configurações do Hero
                </button>
            </div>

            {/* CONTEÚDO DA ABA SELECIONADA */}
            {activeTab === 'series' && (
                <ManageSeries onMessage={handleMessage} animeList={animeList} />
            )}

            {activeTab === 'episodes' && (
                <ManageEpisodes onMessage={handleMessage} animeList={animeList} episodesData={episodesData} />
            )}
            
            {/* 🛑 RENDERIZAÇÃO DO NOVO COMPONENTE */}
            {activeTab === 'characters' && (
                <AdminCharacters />
            )}

            {activeTab === 'hero' && (
                <ManageHeroConfig onMessage={handleMessage} animeList={animeList} setRefreshTrigger={setRefreshTrigger} />
            )}

        </div>
    );
};

export default AdminPage;