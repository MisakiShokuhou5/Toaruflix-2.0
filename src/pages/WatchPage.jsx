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
                <FaExclamationTriangle size={40} color="#E50914" />
                <p>Nenhuma fonte de vídeo disponível para este episódio.</p>
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
            <p>Formato de vídeo não suportado: {type}</p>
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
                
                if (!seriesSnap.exists()) { throw new Error(`Série "${slug}" não encontrada.`); }
                setSeriesData(seriesSnap.data());

                // 2. Buscar Episódio Atual
                const episodeRef = doc(db, 'episodes', episodeId);
                const episodeSnap = await getDoc(episodeRef);

                 if (!episodeSnap.exists()) { throw new Error(`Episódio não encontrado.`); }
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
    
    // Estado para controlar qual player (fonte) está sendo usado (caso tenha redundância)
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
                <FaExclamationTriangle size={50} color="#E50914"/> 
                <h2>Erro ao carregar vídeo</h2>
                <p>{error || "Dados incompletos."}</p>
                <button onClick={() => navigate(`/details/${slug}`)} className="btn-back">
                    <FaArrowLeft /> Voltar para a Série
                </button>
            </div>
        );
    }

    return (
        <div className="watch-page-container">
            
            {/* Header Flutuante */}
            <header className="watch-header">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} className="btn-icon">
                        <FaArrowLeft />
                    </button>
                    {/* <div className="header-info">
                        <h1>{seriesData.titulo}</h1>
                        <span>
                            T{episode.temporada}:E{episode.numeroEpisodio} - {episode.tituloEpisodio}
                        </span>
                    </div> */}
                </div>

                {/* Seletor de Fonte (Só aparece se tiver mais de 1 link) */}
                {episode.videoLinks && episode.videoLinks.length > 1 && (
                    <div className="source-selector">
                        <FaServer />
                        <select 
                            value={selectedSourceIndex} 
                            onChange={(e) => setSelectedSourceIndex(Number(e.target.value))}
                        >
                            {episode.videoLinks.map((link, index) => (
                                <option key={index} value={index}>
                                    {link.label || `Fonte ${index + 1}`} ({link.type.toUpperCase()})
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
                    type={currentSource?.type} // Passamos explicitamente
                    onPlaybackUpdate={handlePlaybackUpdate}
                    episodeData={episode}
                    allEpisodes={allEpisodes}
                    onEpisodeChange={handleEpisodeChange}
                />
            </main>

            {/* Estilos CSS Inline para layout macro da página */}
            <style jsx="true">{`
                .watch-page-container {
                    background-color: #000;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    color: white;
                    overflow: hidden; /* Evita scroll duplo */
                }

                .watch-header {
                    height: 60px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    position: absolute; /* Flutua sobre o vídeo */
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 50;
                    pointer-events: none; /* Deixa clicar no vídeo embaixo nas áreas vazias */
                }

                .header-left, .source-selector {
                    pointer-events: auto; /* Reativa cliques nos botões */
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .header-info h1 {
                    font-size: 1rem;
                    margin: 0;
                    font-weight: 700;
                    color: #fff;
                }

                .header-info span {
                    font-size: 0.85rem;
                    color: #ccc;
                }

                .btn-icon {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }

                .btn-icon:hover { opacity: 1; }

                .source-selector {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0);
                    padding: 5px 10px;
                    border-radius: 4px;
                    backdrop-filter: blur(5px);
                }

                .source-selector select {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 0.85rem;
                    outline: none;
                    cursor: pointer;
                }
                
                .source-selector select option {
                    background: #030303;
                    color: white;
                    border: none;
                }

                .player-area {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-top: 0; /* Player ocupa tudo */
                }

                .player-message {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #ccc;
                }

                .error-container {
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    gap: 20px;
                }
                
                .btn-back {
                    padding: 10px 20px;
                    background-color: #E50914;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default WatchPage;