import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
    FaPlay, FaPause, FaVolumeUp, FaVolumeMute, 
    FaExpand, FaCompress, FaStepBackward, FaStepForward, 
    FaSpinner, FaRedo, FaUndo 
} from 'react-icons/fa';
import './Player.css';

const VideoPlayer = ({ link, type, episodeData, allEpisodes, onEpisodeChange }) => {
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [showControls, setShowControls] = useState(true);

    // --- Lógica de HLS e Inicialização ---
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        let hls;

        const initPlayer = () => {
            setIsBuffering(true);
            if (type === 'm3u8' && Hls.isSupported()) {
                hls = new Hls({ capLevelToPlayerSize: true });
                hls.loadSource(link);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsBuffering(false);
                    video.play().catch(() => {});
                });
            } else {
                video.src = link;
            }
        };

        initPlayer();
        return () => { if (hls) hls.destroy(); };
    }, [link, type]);

    // --- Controles de Tempo ---
    const skip = (amount) => {
        videoRef.current.currentTime += amount;
    };

    const togglePlay = useCallback(() => {
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
    }, []);

    // Atalhos de Teclado
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') skip(10);
            if (e.code === 'ArrowLeft') skip(-10);
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [togglePlay]);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (time) => {
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div 
            className={`max-player-container ${showControls ? 'controls-active' : 'controls-hidden'}`}
            ref={playerContainerRef}
            onMouseMove={() => {
                setShowControls(true);
                clearTimeout(window.controlsTimeout);
                window.controlsTimeout = setTimeout(() => isPlaying && setShowControls(false), 3000);
            }}
        >
            {isBuffering && <div className="max-loading"><FaSpinner className="max-spin" /></div>}

            <video
                ref={videoRef}
                className="max-video-element"
                onTimeUpdate={() => setCurrentTime(videoRef.current.currentTime)}
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
                playsInline
            />

            {/* Interface Estilo MAX */}
            <div className="max-ui-wrapper">
                <div className="max-top-info">
                    <h2 className="max-series-title">{episodeData?.tituloEpisodio}</h2>
                    <p className="max-ep-detail">S{episodeData?.temporada} E{episodeData?.numeroEpisodio}</p>
                </div>

                <div className="max-center-controls">
                    <button className="max-big-btn" onClick={() => skip(-10)}><FaUndo /></button>
                    <button className="max-main-play" onClick={togglePlay}>
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button className="max-big-btn" onClick={() => skip(10)}><FaRedo /></button>
                </div>

                <div className="max-bottom-controls">
                    <div className="max-progress-area">
                        <input 
                            type="range" 
                            className="max-seekbar"
                            min="0" max={duration || 0}
                            value={currentTime}
                            onChange={(e) => videoRef.current.currentTime = e.target.value}
                            style={{ '--progress': `${(currentTime / duration) * 100}%` }}
                        />
                    </div>
                    
                    <div className="max-actions-row">
                        <div className="max-group">
                            <button onClick={() => {
                                videoRef.current.muted = !isMuted;
                                setIsMuted(!isMuted);
                            }} className="max-icon-btn">
                                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                            </button>
                            <span className="max-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>

                        <div className="max-group">
                            <button className="max-icon-btn" onClick={handleFullscreen}>
                                {isFullscreen ? <FaCompress /> : <FaExpand />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;