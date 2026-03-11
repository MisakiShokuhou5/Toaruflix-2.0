import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase/config'; 
import Spinner from '../components/shared/Spinner';
import { FaArrowLeft, FaExclamationTriangle, FaServer } from 'react-icons/fa';

// Importação dos Players Personalizados
import VideoPlayer from '../components/Player/VideoPlayer'; 
import EmbedPlayer from '../components/Player/EmbedPlayer'; 

// --- Componente Switch de Player ---
const DynamicPlayer = ({ currentSource, onPlaybackUpdate, episodeData, allEpisodes, onEpisodeChange }) => {
    
    // Se não houver fonte selecionada ou URL vazia
    if (!currentSource || !currentSource.url) {
        return (
            <div className="player-message error">
                <FaExclamationTriangle size={30} color="#ff3333" />
                <p>SISTEMA: FONTE DE TRANSMISSÃO INDISPONÍVEL.</p>
            </div>
        );
    }

    const { url, type } = currentSource;

    // 1. Player Nativo (MP4) ou HLS (M3U8)
    if (type === 'mp4' || type === 'm3u8') {
        return (
            <VideoPlayer 
                link={url} 
                type={type} 
                onPlaybackUpdate={onPlaybackUpdate}
                episodeData={episodeData}
                allEpisodes={allEpisodes}
                onEpisodeChange={onEpisodeChange}
            />
        );
    }

    // 2. Player Embed (Iframe / Drive / Outros)
    if (type === 'embed' || type === 'drive') {
        return (
            <EmbedPlayer 
                link={url} 
                episodeData={episodeData}
            />
        );
    }

    return (
        <div className="player-message error">
            <FaExclamationTriangle size={30} color="#ff3333" />
            <p>SISTEMA: FORMATO DE ARQUIVO NÃO SUPORTADO ({type.toUpperCase()}).</p>
        </div>
    );
};

// --- Hook de Dados (Otimizado) ---
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
                // 1. Buscar dados da Série
                const seriesRef = doc(db, 'animes', slug);
                const seriesSnap = await getDoc(seriesRef);
                
                if (!seriesSnap.exists()) { throw new Error(`DIRETÓRIO "${slug}" NÃO LOCALIZADO.`); }
                setSeriesData(seriesSnap.data());

                // 2. Buscar Episódio Atual
                const episodeRef = doc(db, 'episodes', episodeId);
                const episodeSnap = await getDoc(episodeRef);

                if (!episodeSnap.exists()) { throw new Error(`ARQUIVO CORROMPIDO OU INEXISTENTE.`); }
                setEpisode({ id: episodeSnap.id, ...episodeSnap.data() });

                // 3. Buscar Todos os Episódios (Para navegação Next/Prev)
                const episodesRef = collection(db, 'episodes');
                const qAllEpisodes = query(episodesRef, where('animeSlug', '==', slug));
                const allEpisodesSnap = await getDocs(qAllEpisodes);
                
                const episodesList = allEpisodesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // IMPORTANTE: Ordenar episódios corretamente (Temp -> Num)
                const sortedEpisodes = episodesList.sort((a, b) => {
                    if (a.temporada !== b.temporada) return a.temporada - b.temporada;
                    return a.numeroEpisodio - b.numeroEpisodio;
                });

                setAllEpisodes(sortedEpisodes);
                setError(null);

            } catch (err) {
                console.error("Erro WatchPage:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, episodeId]);

    return { seriesData, episode, allEpisodes, loading, error };
};


// --- Componente Principal ---
const WatchPage = () => {
    const { slug, episodeId } = useParams();
    const navigate = useNavigate();
    const { seriesData, episode, allEpisodes, loading, error } = useWatchData(slug, episodeId);
    
    // Estado para controlar qual player (fonte) está sendo usado
    const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);

    // Resetar índice da fonte quando mudar de episódio
    useEffect(() => {
        setSelectedSourceIndex(0);
    }, [episodeId]);

    // Handler para salvar progresso (Futuro)
    const handlePlaybackUpdate = (data) => { 
        // Ex: if (data.percentage > 90) marcarComoVisto();
    };
    
    // Navegação disparada pelo VideoPlayer (botão Next/Prev)
    const handleEpisodeChange = (newSlug, newEpisodeId) => {
        navigate(`/watch/${newSlug}/${newEpisodeId}`);
    };

    // Extrair a fonte atual baseada no índice selecionado
    const currentSource = useMemo(() => {
        if (!episode || !episode.videoLinks || episode.videoLinks.length === 0) return null;
        return episode.videoLinks[selectedSourceIndex];
    }, [episode, selectedSourceIndex]);

    if (loading) return <Spinner />;
    
    if (error || !episode || !seriesData) {
        return (
            <div className="watch-page-container error-container">
                <FaExclamationTriangle size={40} color="#ff3333"/> 
                <h2>FALHA NA CONEXÃO DE VÍDEO</h2>
                <p>{error || "DADOS INCOMPLETOS NA REDE."}</p>
                <button onClick={() => navigate(`/details/${slug}`)} className="btn-back">
                    <FaArrowLeft /> RETORNAR AO DIRETÓRIO
                </button>
            </div>
        );
    }

    return (
        <div className="watch-page-container">
            
            {/* Header Flutuante / Terminal */}
            <header className="watch-header">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} className="btn-icon">
                        <FaArrowLeft /> VOLTAR
                    </button>
                </div>

                {/* Seletor de Fonte */}
                {episode.videoLinks && episode.videoLinks.length > 1 && (
                    <div className="source-selector">
                        <FaServer color="#00ffaa"/>
                        <select 
                            value={selectedSourceIndex} 
                            onChange={(e) => setSelectedSourceIndex(Number(e.target.value))}
                        >
                            {episode.videoLinks.map((link, index) => (
                                <option key={index} value={index}>
                                    {link.label || `ROTA ${index + 1}`} ({link.type.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </header>

            {/* Área do Player */}
            <main className="player-area">
                <DynamicPlayer 
                    currentSource={currentSource}
                    type={currentSource?.type}
                    onPlaybackUpdate={handlePlaybackUpdate}
                    episodeData={episode}
                    allEpisodes={allEpisodes}
                    onEpisodeChange={handleEpisodeChange}
                />
            </main>

            {/* Estilos CSS Inline para layout macro da página (STARLINK THEME) */}
            <style jsx="true">{`
                .watch-page-container {
                    background-color: #000000;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    color: #ffffff;
                    overflow: hidden; 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    letter-spacing: 1px;
                }

                .watch-header {
                    height: 70px;
                   
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 40px;
                    position: absolute; 
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 50;
                    pointer-events: none; 
                    
                }

                .header-left, .source-selector {
                    pointer-events: auto; 
                }

                .btn-icon {
                    background: transparent;
                    border: 1px solid #1a1a1a;
                    color: #7a7a7a;
                    font-size: 0.75rem;
                    padding: 10px 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    font-family: inherit;
                }

                .btn-icon:hover { 
                    color: #ffffff; 
                    border-color: #ffffff;
                    background: rgba(255, 255, 255, 0.05);
                }

                .source-selector {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 8px 15px;
                    border: 1px solid #1a1a1a;
                    backdrop-filter: blur(5px);
                    color: #7a7a7a;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }

                .source-selector select {
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    font-size: 0.75rem;
                    outline: none;
                    cursor: pointer;
                    text-transform: uppercase;
                    font-family: inherit;
                    letter-spacing: 1px;
                }
                
                .source-selector select option {
                    background: #000000;
                    color: #ffffff;
                }

                .player-area {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-top: 0; 
                    
                    /* Fundo Radar atrás do player */
                    background-image: 
                        linear-gradient(rgba(26, 26, 26, 0.4) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(26, 26, 26, 0.4) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                .player-message {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #ff3333;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 0.8rem;
                    text-align: center;
                    gap: 15px;
                }

                .error-container {
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    gap: 20px;
                    
                    /* Fundo Radar na tela de erro */
                    background-image: 
                        linear-gradient(rgba(26, 26, 26, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(26, 26, 26, 0.3) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                .error-container h2 {
                    font-size: 1.2rem;
                    font-weight: 300;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    margin: 0;
                }

                .error-container p {
                    color: #7a7a7a;
                    font-size: 0.8rem;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                
                .btn-back {
                    padding: 15px 30px;
                    background-color: transparent;
                    color: #ffffff;
                    border: 1px solid #ffffff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    font-family: inherit;
                    font-size: 0.75rem;
                    transition: all 0.2s;
                    margin-top: 10px;
                }

                .btn-back:hover {
                    background-color: #ffffff;
                    color: #000000;
                }

                @media (max-width: 768px) {
                    .watch-header {
                        padding: 0 20px;
                    }
                    .source-selector {
                        padding: 5px 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default WatchPage;