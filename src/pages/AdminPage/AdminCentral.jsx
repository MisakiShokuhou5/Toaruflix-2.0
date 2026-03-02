// ARQUIVO: src/pages/AdminPage/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// Ajuste o caminho se necessário: assumindo que o firebase está em '../firebase/config'
import { db } from '../../../firebase/config'; 
import { FaTv, FaListOl, FaStar, FaUserFriends, FaBook, FaArrowLeft } from 'react-icons/fa'; // 🛑 NOVO ÍCONE: FaBook e FaArrowLeft adicionados

// Importa os subcomponentes modulares
import ManageSeries from './ManageSeries';
import ManageEpisodes from './ManageEpisodes';
import ManageHeroConfig from './ManageHeroConfig'; 
import AdminCharacters from './AdminCharacters';

// Importa o CSS na mesma pasta
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
                {/* 🛑 NOVO BOTÃO DE LIGHT NOVELS */}
                <button className={`tab-button ${activeTab === 'lightnovels' ? 'active' : ''}`} onClick={() => setActiveTab('lightnovels')}>
                    <FaBook /> Light Novels (Nexora)
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
            
            {activeTab === 'characters' && (
                <AdminCharacters />
            )}

            {activeTab === 'hero' && (
                <ManageHeroConfig onMessage={handleMessage} animeList={animeList} setRefreshTrigger={setRefreshTrigger} />
            )}

            {/* 🛑 ABA INCORPORADA NEXORA LIGHT NOVELS */}
            {activeTab === 'lightnovels' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('series')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            color: '#8a2be2',
                            border: '1px solid #8a2be2',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: 'fit-content',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#8a2be2'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8a2be2'; }}
                    >
                        <FaArrowLeft /> Voltar ao Painel Padrão
                    </button>
                    
                    <div style={{ 
                        width: '100%', 
                        height: '80vh', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: '1px solid rgba(138, 43, 226, 0.3)',
                        boxShadow: '0 0 20px rgba(138, 43, 226, 0.1)'
                    }}>
                        <iframe 
                            src="https://back-end-nexora.vercel.app/api/v1/toaruflix-2.0" 
                            title="Nexora Light Novel Admin"
                            style={{ width: '100%', height: '100%', border: 'none', background: '#050505' }}
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPage;