// ARQUIVO: src/pages/WatchPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import Spinner from '../components/shared/Spinner';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
// 🛑 CORREÇÃO DE IMPORTAÇÃO
import VideoPlayer from '../components/Player/VideoPlayer'; 
import EmbedPlayer from '../components/Player/EmbedPlayer'; 

const PLAYER_HEIGHT = 'calc(100vh - 60px)'; 

// --- 1. COMPONENTE Player Dinâmico (Switch) ---
const DynamicPlayer = ({ link, type, onPlaybackUpdate, episodeData, allEpisodes, handleEpisodeChange }) => {
    
    if (!link) {
        return (
            <div className="player-error" style={{ height: PLAYER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black', flexDirection: 'column' }}>
                <FaExclamationTriangle style={{ fontSize: '2rem', color: '#E50914', marginBottom: '10px' }}/> Link de vídeo não cadastrado.
            </div>
        );
    }
    
    // 1. Player Nativo (MP4/M3U8)
    if (type === 'mp4' || type === 'm3u8') {
        return (
            <VideoPlayer 
                link={link} 
                type={type} 
                onPlaybackUpdate={onPlaybackUpdate}
                episodeData={episodeData}
                allEpisodes={allEpisodes}
                onEpisodeChange={handleEpisodeChange}
            />
        );
    }

    // 2. Player Embed (iframe)
    if (type === 'embed') {
        return (
            <EmbedPlayer 
                link={link} 
                episodeData={episodeData}
                allEpisodes={allEpisodes}
                onEpisodeChange={handleEpisodeChange}
            />
        );
    }

    return (
        <div className="player-error" style={{ height: PLAYER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black' }}>
            Tipo de link desconhecido.
        </div>
    );
};

// --- 2. HOOK: Busca dados do Episódio e da Série (MANTIDO) ---
const useWatchData = (slug, episodeId) => {
    const [seriesData, setSeriesData] = useState(null);
    const [episode, setEpisode] = useState(null);
    const [allEpisodes, setAllEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug || !episodeId) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const seriesRef = doc(db, 'animes', slug);
                const seriesSnap = await getDoc(seriesRef);
                
                if (!seriesSnap.exists()) { throw new Error(`Série "${slug}" não encontrada.`); }
                setSeriesData(seriesSnap.data());

                const episodeRef = doc(db, 'episodes', episodeId);
                const episodeSnap = await getDoc(episodeRef);

                 if (!episodeSnap.exists()) { throw new Error(`Episódio ${episodeId} não encontrado.`); }
                setEpisode({ id: episodeSnap.id, ...episodeSnap.data() });

                const episodesRef = collection(db, 'episodes');
                const qAllEpisodes = query( episodesRef, where('animeSlug', '==', slug) );
                const allEpisodesSnap = await getDocs(qAllEpisodes);
                const episodesList = allEpisodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllEpisodes(episodesList);
                
                setError(null);
            } catch (err) {
                console.error("Erro ao buscar dados de Watch:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, episodeId]);

    return { seriesData, episode, allEpisodes, loading, error };
};


// --- 3. COMPONENTE PRINCIPAL WatchPage (MANTIDO) ---
const WatchPage = () => {
    const { slug, episodeId } = useParams();
    const navigate = useNavigate();
    const { seriesData, episode, allEpisodes, loading, error } = useWatchData(slug, episodeId);
    
    const handlePlaybackUpdate = (data) => { /* logic */ };
    
    const handleEpisodeChange = (newSlug, newEpisodeId) => {
        navigate(`/watch/${newSlug}/${newEpisodeId}`);
    };

    if (loading) return <Spinner />;
    if (error || !episode || !seriesData) {
        return (
            <div className="watch-error" style={{ minHeight: '100vh', background: '#141414', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <FaExclamationTriangle style={{ fontSize: '3rem', color: '#E50914', marginBottom: '20px' }}/> 
                <p>Erro ao carregar o vídeo: {error || "Dados incompletos."}</p>
                <button onClick={() => navigate(`/details/${slug}`)} className="back-button" style={{ padding: '10px 20px', background: '#E50914', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
                    <FaArrowLeft style={{ marginRight: '8px' }}/> Voltar para a Série
                </button>
            </div>
        );
    }

    const { tituloEpisodio, temporada, numeroEpisodio, linkVideo, linkType } = episode;
    const seriesTitle = seriesData.titulo;

    return (
        <div className="watch-page-container" style={{ background: 'black', minHeight: '100vh', color: 'white' }}>
            
            <header style={{ 
                padding: '10px 20px', 
                background: 'rgba(0, 0, 0, 0.8)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                position: 'relative',
                height: '60px'
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>
                    <FaArrowLeft />
                </button>
                <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 300 }}>
                    {seriesTitle}: <strong style={{ fontWeight: 600 }}>T{temporada}:E{numeroEpisodio}</strong>
                    <span style={{ fontSize: '1rem', marginLeft: '10px', color: '#ccc' }}>{tituloEpisodio}</span>
                </h1>
            </header>

            <DynamicPlayer 
                link={linkVideo} 
                type={linkType} 
                onPlaybackUpdate={handlePlaybackUpdate}
                episodeData={episode}
                allEpisodes={allEpisodes}
                handleEpisodeChange={handleEpisodeChange}
            />

        </div>
    );
};

export default WatchPage;