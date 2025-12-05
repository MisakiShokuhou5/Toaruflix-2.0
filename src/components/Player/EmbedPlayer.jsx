// ARQUIVO: src/components/Player/EmbedPlayer.jsx - CORREÇÃO DE SCROLLBARS
import React, { useState, useMemo } from 'react';
import { FaList, FaTimes, FaCheckCircle } from 'react-icons/fa';
import './PlayerStyles.css'; 

const PLAYER_HEIGHT = 'calc(100vh - 60px)';
const DEFAULT_RUNTIME = 24 * 60; 

const formatTime = (seconds) => {
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const EmbedPlayer = ({ link, episodeData, allEpisodes = [], onEpisodeChange }) => {
    
    const [showEpisodes, setShowEpisodes] = useState(false);

    // LÓGICA DE EPISÓDIOS (MANTIDA)
    const handleEpisodeClick = (episode) => {
        if (episode.id !== episodeData?.id) {
            if (onEpisodeChange) {
                onEpisodeChange(episode.animeSlug, episode.id);
            }
        }
        setShowEpisodes(false);
    };

    const currentEpisodeId = useMemo(() => { if (!episodeData) return 'N/A'; return `S${episodeData.temporada}E${episodeData.numeroEpisodio}`; }, [episodeData]);

    const sortedEpisodes = useMemo(() => {
        if (!allEpisodes || allEpisodes.length === 0) return [];
        return allEpisodes.slice().sort((a, b) => {
            if (a.temporada !== b.temporada) return a.temporada - b.temporada;
            return a.numeroEpisodio - b.numeroEpisodio;
        });
    }, [allEpisodes]);

    const groupedEpisodes = useMemo(() => {
        if (!sortedEpisodes || sortedEpisodes.length === 0) return {};
        return sortedEpisodes.reduce((acc, ep) => {
            const key = ep.temporada;
            if (!acc[key]) acc[key] = [];
            acc[key].push(ep);
            return acc;
        }, {});
    }, [sortedEpisodes]);
    
    const seasonKeys = Object.keys(groupedEpisodes).sort((a, b) => Number(a) - Number(b));


    // --- LÓGICA DE RENDERIZAÇÃO DO IFRAME (MANTIDA) ---
    const renderEmbedContent = () => {
        const embedStyles = { width: '100%', height: '100%', border: 'none' }; 

        if (link.startsWith('<iframe')) {
            return (
                <div className="embed-iframe-wrapper" style={embedStyles} dangerouslySetInnerHTML={{ __html: link }} />
            );
        }
        return (
            <iframe
                title="Embedded Player"
                src={link}
                allowFullScreen
                allow="autoplay; encrypted-media"
                style={embedStyles}
            />
        );
    };

    return (
        <div 
            className="embed-container" 
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: PLAYER_HEIGHT, 
                // 🛑 CORREÇÃO: Esconde o overflow para evitar scrollbars no wrapper do player
                overflow: 'hidden' 
            }}
        >
            
            {/* 1. O IFRAME (Player externo) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
                {renderEmbedContent()}
            </div>
            
            {/* 2. UI de Controles (Apenas Botão de Lista) */}
            <div 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }} 
            >
                
                {/* Botão de Lista de Episódios Flutuante */}
                {!showEpisodes && (
                    <div style={{ position: 'absolute',  right: '20px', pointerEvents: 'auto', zIndex: 11 }}>
                        <button onClick={() => setShowEpisodes(true)} className="control-button floating-episode-button">
                             <FaList /> Episódios
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Lista de Episódios (Overlay Lateral) */}
            <div 
                className={`episode-list-overlay ${showEpisodes ? 'visible' : ''}`}
            >
                <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Episódios</h3>
                        <button onClick={() => setShowEpisodes(false)} className="control-button"> <FaTimes /> </button>
                    </div>
                    
                    <select style={{ padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', marginBottom: '15px' }}>
                        {seasonKeys.map(key => (
                            <option key={key} value={key}>Temporada {key} ({groupedEpisodes[key].length} episódios)</option>
                        ))}
                    </select>

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                        {seasonKeys.map(tempKey => (
                            <div key={tempKey}>
                                {groupedEpisodes[tempKey].map(ep => (
                                    <div 
                                        key={ep.id} 
                                        onClick={() => handleEpisodeClick(ep)}
                                        style={{ 
                                            padding: '10px 0', borderBottom: '1px solid #333', cursor: 'pointer',
                                            opacity: ep.id === currentEpisodeId ? 1 : 0.7,
                                            fontWeight: ep.id === currentEpisodeId ? 'bold' : 'normal',
                                            background: ep.id === currentEpisodeId ? 'rgba(229, 9, 20, 0.1)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>
                                                {ep.id === currentEpisodeId && <FaCheckCircle style={{ marginRight: '8px', color: '#E50914' }} />}
                                                {ep.numeroEpisodio}. {ep.tituloEpisodio}
                                            </span>
                                            <span style={{ fontSize: '0.8rem' }}>{formatTime(ep.runtime * 60)}</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#aaa', margin: '5px 0 0 0' }}>{ep.descricao || 'Descrição indisponível.'}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmbedPlayer;