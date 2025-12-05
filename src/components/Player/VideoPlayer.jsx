// ARQUIVO: src/components/Player/VideoPlayer.jsx - FINALIZADO
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeOff, FaCog, FaExpand, FaCompress, FaHistory, FaList, FaCheckCircle, FaTimes, FaStepBackward, FaStepForward } from 'react-icons/fa';
import './PlayerStyles.css';

const PLAYER_HEIGHT = 'calc(100vh - 60px)';
const DEFAULT_RUNTIME = 24 * 60; 
const CURSOR_HIDE_DELAY = 3000; 

const formatTime = (seconds) => {
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const VideoPlayer = ({ link, type, onPlaybackUpdate, episodeData, allEpisodes = [], onEpisodeChange }) => {
    
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const cursorTimer = useRef(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(DEFAULT_RUNTIME);
    const [showEpisodes, setShowEpisodes] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMouseActive, setIsMouseActive] = useState(true);

    // LÓGICA DE EPISÓDIOS E NAVEGAÇÃO
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
    const currentEpisodeIndex = sortedEpisodes.findIndex(ep => ep.id === episodeData?.id);
    const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
    const prevEpisode = sortedEpisodes[currentEpisodeIndex - 1];
    
    // --- FUNÇÕES DE CONTROLE ---
    const resetTimer = () => {
        // Mostra os controles imediatamente ao mover o mouse
        setIsMouseActive(true);
        clearTimeout(cursorTimer.current);
        // Agenda para esconder o gradiente se o vídeo estiver tocando
        if (isPlaying && !showEpisodes) { 
            cursorTimer.current = setTimeout(() => { setIsMouseActive(false); }, CURSOR_HIDE_DELAY);
        }
    };
    
    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused || videoRef.current.ended) { videoRef.current.play(); } else { videoRef.current.pause(); }
        }
        setIsPlaying(prev => !prev);
        resetTimer();
    };

    const handleSeek = (e) => { 
        if (!videoRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        videoRef.current.currentTime = (offsetX / rect.width) * duration;
        resetTimer();
    };
    const toggleMute = () => { setIsMuted(prev => !prev); resetTimer(); };
    const changeVolume = (e) => { const newVolume = Number(e.target.value); setVolume(newVolume); if (newVolume > 0) setIsMuted(false); resetTimer(); };
    const skipTime = (amount) => { if (videoRef.current) { videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + amount, duration)); } resetTimer(); };
    const toggleFullscreen = () => { if (!document.fullscreenElement) { containerRef.current.requestFullscreen(); } else { document.exitFullscreen(); } resetTimer(); };
    const handleEpisodeClick = (episode) => { if (onEpisodeChange) onEpisodeChange(episode.animeSlug, episode.id); setShowEpisodes(false); resetTimer(); };
    const handleNextEpisode = () => { if (nextEpisode && onEpisodeChange) onEpisodeChange(nextEpisode.animeSlug, nextEpisode.id); resetTimer(); };
    const handlePrevEpisode = () => { if (prevEpisode && onEpisodeChange) onEpisodeChange(prevEpisode.animeSlug, prevEpisode.id); resetTimer(); };


    // 🛑 EFEITO DE CARREGAMENTO (IMPORTANTE PARA MP4/M3U8)
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !link) return;
        
        // 1. Atribuição do link para carregamento
        if (type === 'm3u8' || type === 'mp4') {
             videoElement.src = link; 
        }

        // 2. Event Listeners
        const handleLoadedMetadata = () => { setDuration(videoElement.duration || DEFAULT_RUNTIME); };
        const handleTimeUpdate = () => {
            setCurrentTime(videoElement.currentTime);
            if (onPlaybackUpdate && videoElement.duration > 0) {
                 onPlaybackUpdate({ currentTime: videoElement.currentTime, duration: videoElement.duration });
            }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => { setVolume(videoElement.volume); setIsMuted(videoElement.muted); };
        const handleFullscreenChange = () => { setIsFullscreen(!!document.fullscreenElement); };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('volumechange', handleVolumeChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        videoElement.play().catch(error => console.log("Falha na reprodução automática:", error));

        return () => {
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('volumechange', handleVolumeChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            
            if (videoElement) {
                videoElement.pause();
                videoElement.src = '';
            }
        };
    }, [link, type, onPlaybackUpdate]);

    useEffect(() => { if (videoRef.current) { videoRef.current.volume = volume; videoRef.current.muted = isMuted; } }, [volume, isMuted]);
    useEffect(() => { resetTimer(); return () => clearTimeout(cursorTimer.current); }, [isPlaying, showEpisodes]);
    
    // --- RENDERIZAÇÃO ---
    const progressPercent = (currentTime / duration) * 100;
    
    const containerClasses = `toaru-player-container`; 
    // Controles são visíveis se a lista estiver aberta OU o mouse ativo OU o vídeo pausado
    const isOverlayVisible = showEpisodes || isMouseActive || !isPlaying;
    
    // Gradiente para o efeito de "hover" (cobre topo e base)
    const overlayBackground = isOverlayVisible ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)' : 'none';

    return (
        <div 
            ref={containerRef} 
            className={containerClasses} 
            onMouseMove={resetTimer} 
            onMouseLeave={() => { setIsMouseActive(false); }} 
            style={{ height: PLAYER_HEIGHT }}
        >
            
            {/* 1. Elemento de Vídeo NATIVO */}
            <video 
                ref={videoRef} 
                className="toaru-video-element"
                onClick={togglePlay}
                autoPlay 
                style={{ objectFit: 'contain' }}
            >
                Seu navegador não suporta a tag de vídeo.
            </video>
            
            {/* 2. Overlay de Controles (Completo) */}
            <div 
                className={`player-controls-overlay ${isOverlayVisible ? 'controls-visible' : 'controls-hidden'}`}
                onClick={(e) => { if (e.target === e.currentTarget) togglePlay(); }}
                style={{ 
                    background: overlayBackground,
                    opacity: isOverlayVisible ? 1 : 0, // Controla a opacidade geral do overlay
                    pointerEvents: 'auto', 
                }}
            >
                
                {/* 2.1 Botões de Ação Central (Aparece no Pause) */}
                {(!isPlaying) && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}>
                        <button onClick={togglePlay} className="control-button big-play-pause">
                            <FaPlay />
                        </button>
                    </div>
                )}


                {/* 2.2 Barra de Progresso e 2.3 Controles de Mídia */}
                <div style={{ pointerEvents: 'auto', width: '100%' }}> 
                    {/* Barra de Progresso */}
                    <div className="progress-bar-container" onClick={handleSeek}>
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    
                    {/* Controles de Mídia */}
                    <div className="media-controls-row">
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <button onClick={togglePlay} className="control-button primary-control">{isPlaying ? <FaPause /> : <FaPlay />}</button>
                            <button onClick={() => skipTime(-10)} className="control-button"><FaHistory style={{ transform: 'scaleX(-1)'}} title="Retroceder 10s"/></button>
                            <button onClick={() => skipTime(10)} className="control-button"><FaHistory title="Avançar 10s"/></button>
                            <button onClick={handlePrevEpisode} className="control-button" disabled={!prevEpisode}><FaStepBackward /></button>
                            <button onClick={handleNextEpisode} className="control-button" disabled={!nextEpisode}><FaStepForward /></button>
                            <span className="time-display" style={{ fontSize: '0.9rem', color: '#ccc' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <button onClick={toggleMute} className="control-button">{isMuted || volume === 0 ? <FaVolumeOff /> : <FaVolumeUp />}</button>
                            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={changeVolume} style={{ width: '80px', cursor: 'pointer' }} />
                            <button onClick={() => setShowEpisodes(true)} className="control-button" title="Lista de Episódios"><FaList /></button>
                            <button className="control-button" title="Configurações"><FaCog /></button>
                            <button onClick={toggleFullscreen} className="control-button">{isFullscreen ? <FaCompress /> : <FaExpand />}</button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 3. Lista de Episódios (Lateral) */}
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

export default VideoPlayer;