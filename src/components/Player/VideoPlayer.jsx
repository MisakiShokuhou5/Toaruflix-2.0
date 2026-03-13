import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaSpinner, FaEyeSlash } from 'react-icons/fa';
import VideoDiagnostic from './VideoDiagnostic'; // <-- Importando o componente de diagnóstico
import './Player.css';

// ============================================================================
// ÍCONES OFICIAIS (Base64 Limpos e Corrigidos)
// ============================================================================
const ICONS = {
    rewind10: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NyIgaGVpZ2h0PSI2NyIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDY3IDY3Ij48cGF0aCBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMzLjUgMEM1MiAwIDY3IDE1IDY3IDMzLjVTNTIgNjcgMzMuNSA2NyAwIDUyIDAgMzMuNWMuMDMtMS40IDEuMTctMi41MyAyLjU4LTIuNTMgMS40IDAgMi41NSAxLjEzIDIuNTcgMi41MyAwIDE1LjY1IDEyLjcgMjguMzUgMjguMzUgMjguMzUgMTUuNjYgMCAyOC4zNS0xMi43IDI4LjM1LTI4LjM1IDAtMTUuNjYtMTIuNjktMjguMzUtMjguMzUtMjguMzVoLS4wNGMtNyAwLTEzLjc2IDIuNjEtMTguOTQgNy4zLS40Ni40Mi0uOTEuODUtMS4zNCAxLjI5aDYuNThjMS40MiAwIDIuNTctMS4xNiAyLjU3IDIuNTggMCAxLjQyLTEuMTUgMi41OC0yLjU3IDIuNThINi4wMWMtMS40MiAwLTIuNTctMS4xNi0yLjU3LTIuNThWMi41OEMzLjQ0IDEuMTUgNC41OSAwIDYuMDEgMGMxLjQzIDAgMi41OCAxLjE1IDIuNTggMi41OHY4LjUyYy43OC0uODYgMS42MS0xLjcgMi40Ny0yLjQ3QTMzLjQwNyAzMy40MDcgMCAwIDEgMzMuNDYgMGguMDR6bS40OCA0MS4zNGMtMS42LTIuMjEtMi01LjItMi03Ljg1IDAtMi42NS40LTUuNjMgMi03LjgzIDEuNDQtMS45NyAzLjQ3LTIuODQgNS44OC0yLjg0IDIuNDEgMCA0LjQyLjg3IDUuODYgMi44NCAxLjYxIDIuMjEgMi4wMyA1LjE2IDIuMDMgNy44MyAwIDIuNjYtLjQgNS42NC0yIDcuODUtMS40MyAxLjk3LTMuNDcgMi44NC01Ljg5IDIuODQtMi40MSAwLTQuNDUtLjg2LTUuODgtMi44NHptLTkuNzMtMTIuNzdsLTUgMS41OHYtNC4yMWw1Ljg3LTIuNjVoNC4yOHYyMC40N2gtNS4xNVYyOC41N3ptMTcuNjEgOS45NmMuNjEtMS4zMy42OC0zLjYuNjgtNS4wNHMtLjA3LTMuNy0uNjgtNS4wMmMtLjQtLjg2LTEuMDQtMS4yOS0yLTEuMjktLjk1IDAtMS41OS40Mi0xLjk5IDEuMjktLjYxIDEuMzItLjY4IDMuNTgtLjY4IDUuMDIgMCAxLjQ0LjA3IDMuNzEuNjggNS4wNC40Ljg3IDEuMDQgMS4yOSAxLjk5IDEuMjkuOTYgMCAxLjYtLjQyIDItMS4yOXoiLz48L3N2Zz4=",
    forward10: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NyIgaGVpZ2h0PSI2NyIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDY3IDY3Ij48cGF0aCBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zMy41IDBDMTUgMCAwIDE1IDAgMzMuNVMxNSA2NyAzMy41IDY3IDY3IDUyIDY3IDMzLjVhMi41ODMgMi41ODMgMCAwIDAtMi41OC0yLjUzYy0xLjQgMC0yLjU1IDEuMTMtMi41NyAyLjUzIDAgMTUuNjYtMTIuNjkgMjguMzUtMjguMzUgMjguMzUtMTUuNjUgMC0yOC4zNS0xMi43LTI4LjM1LTI4LjM1IDAtMTUuNjYgMTIuNy0yOC4zNSAyOC4zNS0yOC4zNSA3LjMgMCAxMy45NiAyLjc2IDE4Ljk5IDcuMy40Ni40Mi45Ljg1IDEuMzQgMS4yOWgtNi41OWEyLjU4IDIuNTggMCAwIDAgMCA1LjE2aDEzLjc1YzEuNDIgMCAyLjU3LTEuMTYgMi41Ny0yLjU4VjIuNThjMC0xLjQzLTEuMTUtMi41OC0yLjU3LTIuNTgtMS40MyAwLTIuNTggMS4xNS0yLjU4IDIuNTh2OC41MmMtLjc4LS44Ny0xLjYxLTEuNy0yLjQ3LTIuNDhBMzMuNDQ2IDMzLjQ0NiAwIDAgMCAzMy41NCAwaC0uMDR6bS40OCA0MS4zNGMtMS42LTIuMjEtMi01LjItMi03Ljg1IDAtMi42NS40LTUuNjMgMi03LjgzIDEuNDQtMS45NyAzLjQ3LTIuODQgNS44OC0yLjg0IDIuNDEgMCA0LjQyLjg3IDUuODYgMi44NCAxLjYxIDIuMjEgMi4wMyA1LjE2IDIuMDMgNy44MyAwIDIuNjYtLjQgNS42NC0yIDcuODUtMS40MyAxLjk3LTMuNDcgMi44NC01Ljg5IDIuODQtMi40MSAwLTQuNDUtLjg3LTUuODgtMi44NHptLTkuNzMtMTIuNzdsLTUgMS41OHYtNC4yMWw1Ljg3LTIuNjVoNC4yOHYyMC40N2gtNS4xNVYyOC41N3ptMTcuNjEgOS45NmMuNjEtMS4zMy42OC0zLjYuNjgtNS4wNHMtLjA3LTMuNy0uNjgtNS4wMmMtLjQtLjg3LTEuMDQtMS4yOS0yLTEuMjktLjk1IDAtMS41OS40Mi0xLjk5IDEuMjktLjYxIDEuMzItLjY4IDMuNTgtLjY4IDUuMDIgMCAxLjQ0LjA3IDMuNzEuNjggNS4wNC40Ljg2IDEuMDQgMS4yOCAxLjk5IDEuMjguOTYgMCAxLjYtLjQyIDItMS4yOHoiLz48L3N2Zz4=",
    pause: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NyIgaGVpZ2h0PSI2NyIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDY3IDY3Ij48cGF0aCBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni4zMzIgNS43NzNhNC4xMjUgNC4xMjUgMCAwIDAtNC4xMjUgNC4xMjV2NDYuNzVhNC4xMjcgNC4xMjcgMCAwIDAgNC4xMjUgNC4xMjUgNC4xMjcgNC4xMjcgMCAwIDAgNC4xMjUtNC4xMjVWOS44OThhNC4xMjUgNC4xMjUgMCAwIDAtNC4xMjUtNC4xMjV6TTI1LjcwNyA5Ljg5OHY0Ni43NWE0LjEyNSA0LjEyNSAwIDEgMS04LjI1IDBWOS44OThhNC4xMjMgNC4xMjMgMCAwIDEgNC4xMjUtNC4xMjUgNC4xMjMgNC4xMjMgMCAwIDEgNC4xMjUgNC4xMjV6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=",
    play: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NyIgaGVpZ2h0PSI2NyIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDY3IDY3Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjAuMjggOS42NWMtMi4yMDUtMS4yNjgtNC4wMjYtLjIyOC00LjAyNiAyLjMwN3Y0My44MDVjMCAyLjUzNSAxLjgyIDMuNTc0IDQuMDI3IDIuMzA3bDM4LjQ3MS0yMS45MDNhMi41NTYgMi41NTYgMCAwIDAgMS4wOTQtLjkzNSAyLjUxNCAyLjUxNCAwIDAgMCAwLTIuNzQzIDIuNTU2IDIuNTU2IDAgMCAwLTEuMDkzLS45MzZMMjAuMjggOS42NXoiLz48L3N2Zz4=",
    volume: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDI1IDI0Ij48cGF0aCBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTUgMjBWNEw4LjExNSA3LjkzNEEuNS41IDAgMCAxIDcuODY3IDhIMy41YS41LjUgMCAwIDAtLjUuNXY3YS41LjUgMCAwIDAgLjUuNWg0LjM2N2EuNS41IDAgMCAxIC4yNDguMDY2TDE1IDIweiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xNy41IDEyYTIgMiAwIDAgMS0yIDJ2LTRhMiAyIDAgMCAxIDIgMnoiLz48cGF0aCBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xOC41MzYgNy4wOGEuNzUuNzUgMCAwIDEgMS4wNTMuMTI1QTcuNzIgNy43MiAwIDAgMSAyMS4yNSAxMmE3LjcyIDcuNzIgMCAwIDEtMS42NjEgNC43OTUuNzUuNzUgMCAxIDEtMS4xNzgtLjkyOUE2LjIyIDYuMjIgMCAwIDAgMTkuNzUgMTJjMC0xLjQ2LS41LTIuODAyLTEuMzM5LTMuODY2YS43NS43NSAwIDAgMSAuMTI1LTEuMDUzeiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PHBhdGggZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMjAuNTI0IDQuNDM4YS43NS43NSAwIDAgMSAxLjA1NS4xMDMgMTEuNzA1IDExLjcwNSAwIDAgMSAyLjY3MSA3LjQ2YzAgMi44My0xLjAwMiA1LjQzLTIuNjcgNy40NThhLjc1Ljc1IDAgMSAxLTEuMTYtLjk1M0ExMC4yMDUgMTAuMjA1IDAgMCAwIDIyLjc1IDEyYTEwLjIgMTAuMiAwIDAgMC0yLjMzLTYuNTA2Ljc1Ljc1IDAgMCAxIC4xMDQtMS4wNTZ6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=",
    fullscreenOpen: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDI1IDI1Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNC43NDYgOC4wNTZWNi4yOTRMMTguNzMgMjAuMjc4aC0xLjc2MmExLjExMSAxLjExMSAwIDEgMCAwIDIuMjIyaDQuNDQ0YTEuMTEgMS4xMSAwIDAgMCAxLjExMS0xLjExMXYtNC40NDVhMS4xMTEgMS4xMTEgMCAwIDAtMi4yMjIgMHYxLjc2Mkw2LjMxNyA0LjcyMmgxLjc2MmExLjExMSAxLjExMSAwIDEgMCAwLTIuMjIySDMuNjM1Yy0uNjE0IDAtMS4xMTIuNDk3LTEuMTEyIDEuMTExdjQuNDQ1YTEuMTExIDEuMTExIDAgMSAwIDIuMjIzIDB6Ii8+PC9zdmc+",
    fullscreenClose: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDI1IDI1Ij48cGF0aCBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjg0OSA0LjcxbDQuNzcgNC43N0g1Ljg1N2ExLjExMSAxLjExMSAwIDEgMCAwIDIuMjIxSDEwLjNhMS4xMSAxLjExIDAgMCAwIDEuMTExLTEuMTFWNi4xNDVhMS4xMTEgMS4xMTEgMCAwIDAtMi4yMjIgMHYxLjc2MmwtNC43Ny00Ljc3QTEuMTExIDEuMTExIDAgMSAwIDIuODUgNC43MDl6bTE5LjM0OSAxNi4yMDZsLTQuNzctNC43N2gxLjc2MmExLjExMSAxLjExMSAwIDAgMCAwLTIuMjIzaC00LjQ0NGMtLjYxNCAwLTEuMTExLjQ5OC0xLjExMSAxLjExMnY0LjQ0NGExLjExMSAxLjExMSAwIDAgMCAyLjIyMiAwdi0xLjc2Mmw0Ljc3IDQuNzdhMS4xMTEgMS4xMTEgMCAxIDAgMS41NzEtMS41NzF6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=",
    pip: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCB3aWR0aD0iOSIgaGVpZ2h0PSI2IiB4PSIxMSIgeT0iMTEuOTkiIGZpbGw9IiNmZmYiIHJ4PSIxIi8+PHJlY3Qgd2lkdGg9IjIyIiBoZWlnaHQ9IjE4IiB4PSIxIiB5PSIzIiBzdHJva2U9IiNCM0IzQjMiIHN0cm9rZS13aWR0aD0iMiIgcng9IjMiLz48L3N2Zz4="
};

const VideoPlayer = ({ link, type, episodeData }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    
    // ============================================================================
    // ESTADOS (UI & PLAYER)
    // ============================================================================
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [showControls, setShowControls] = useState(true);
    
    // NOVO: Estado para mostrar o diagnóstico (padrão falso)
    const [showDiagnostic, setShowDiagnostic] = useState(false);

    // ============================================================================
    // LÓGICA DO COMANDO DE CONSOLE (Ativar Diagnóstico)
    // ============================================================================
    useEffect(() => {
        // Cria os comandos globais no objeto window
        window.enablePlayerStats = () => {
            setShowDiagnostic(true);
            console.log("%c📊 Diagnóstico Ativado!", "color: lightgreen; font-weight: bold; font-size: 14px;");
        };

        window.disablePlayerStats = () => {
            setShowDiagnostic(false);
            console.log("%c📊 Diagnóstico Desativado!", "color: orange; font-weight: bold; font-size: 14px;");
        };

        // Deixa uma dica silenciosa no console
        console.log("%c💡 DICA DEV: Digite 'enablePlayerStats()' no console para ver o painel de diagnóstico em tempo real.", "color: #00bfff; font-style: italic;");

        // Limpa os comandos globais quando o componente for desmontado para evitar vazamento de memória
        return () => {
            delete window.enablePlayerStats;
            delete window.disablePlayerStats;
        };
    }, []);

    // ============================================================================
    // LÓGICA DE OTIMIZAÇÃO DE REDE (Preconnect & DNS-Prefetch)
    // ============================================================================
    useEffect(() => {
        const cdns = [
            'https://cdn.plyr.io',
            'https://cdnjs.cloudflare.com',
            'https://unpkg.com',
            'https://cdn.jsdelivr.net'
        ];

        cdns.forEach(domain => {
            const dns = document.createElement('link');
            dns.rel = 'dns-prefetch';
            dns.href = domain;
            document.head.appendChild(dns);

            const preconnect = document.createElement('link');
            preconnect.rel = 'preconnect';
            preconnect.href = domain;
            preconnect.crossOrigin = 'anonymous';
            document.head.appendChild(preconnect);
        });
    }, []);

    // ============================================================================
    // LÓGICA DO PLAYER (HLS, Estabilidade e Buffering)
    // ============================================================================
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        let hls;

        const initPlayer = () => {
            setIsBuffering(true);
            
            if (type === 'm3u8' && Hls.isSupported()) {
                hls = new Hls({ 
                    capLevelToPlayerSize: true,
                    maxBufferLength: 30, 
                    maxMaxBufferLength: 60 
                });
                
                hls.loadSource(link);
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsBuffering(false);
                    video.play().catch(() => console.warn("Autoplay bloqueado pelo navegador"));
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log("Erro de rede detectado, tentando recuperar...");
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log("Erro de mídia detectado, tentando recuperar...");
                                hls.recoverMediaError();
                                break;
                            default:
                                console.error("Erro fatal irrecoverável no HLS.");
                                hls.destroy();
                                break;
                        }
                    }
                });

            } else {
                video.src = link;
                video.play().catch(() => console.warn("Autoplay bloqueado pelo navegador"));
            }
        };

        initPlayer();
        return () => { if (hls) hls.destroy(); };
    }, [link, type]);

    const handleVideoError = () => {
        console.error("Erro no carregamento do vídeo nativo. Tentando recarregar...");
        setIsBuffering(true);
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.load();
            }
        }, 2000);
    };

    // ============================================================================
    // LÓGICA DE UI E CONTROLES
    // ============================================================================
    
    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    const forceHideControls = (e) => {
        e.stopPropagation();
        setShowControls(false);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };

    const skip = (amount) => {
        if (videoRef.current) videoRef.current.currentTime += amount;
    };

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
    }, []);

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            videoRef.current.muted = newVolume === 0;
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(err => console.log(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const togglePiP = async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled && videoRef.current) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error("Erro ao ativar PiP:", error);
        }
    };

    const closePlayer = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        navigate(-1);
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') skip(10);
            if (e.code === 'ArrowLeft') skip(-10);
            if (e.code === 'KeyF') toggleFullscreen();
            if (e.code === 'KeyP') togglePiP();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [togglePlay]);

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div 
            className={`pv-player-container ${showControls ? 'controls-active' : 'controls-hidden'}`}
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            onClick={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* PAINEL DE DIAGNÓSTICO (Aparece apenas se a variável de estado for true) */}
            {showDiagnostic && <VideoDiagnostic videoRef={videoRef} />}

            {isBuffering && <div className="pv-loading"><FaSpinner className="pv-spin" /></div>}

            <video
                ref={videoRef}
                className="pv-video-element"
                preload="auto"
                onClick={togglePlay}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
                onPause={() => setIsPlaying(false)}
                onError={handleVideoError}
                playsInline
            />

            <div className="pv-controls-overlay">
                
                <div className="pv-top-right">
                    <button 
                        className="pv-action-btn" 
                        onClick={forceHideControls} 
                        title="Esconder Controles"
                    >
                        <FaEyeSlash size={22} color="#fff" />
                    </button>

                    <div className="pv-volume-wrapper">
                        <button className="pv-action-btn">
                            <img src={ICONS.volume} alt="Volume" />
                        </button>
                        <div className="pv-volume-slider-container">
                            <input 
                                type="range" 
                                className="pv-volume-slider"
                                min="0" max="1" step="0.05"
                                value={volume}
                                onChange={handleVolumeChange}
                                style={{ '--vol-progress': `${volume * 100}%` }}
                            />
                        </div>
                    </div>

                    {document.pictureInPictureEnabled && (
                        <button className="pv-action-btn" onClick={togglePiP} title="Picture-in-Picture">
                            <img src={ICONS.pip} alt="PiP" />
                        </button>
                    )}

                    <button className="pv-action-btn" onClick={toggleFullscreen}>
                        <img 
                            src={isFullscreen ? ICONS.fullscreenClose : ICONS.fullscreenOpen} 
                            alt="Tela Cheia" 
                        />
                    </button>
                    
                    <button className="pv-action-btn" onClick={closePlayer} style={{ marginLeft: '10px' }}>
                        <FaTimes size={22} color="#fff" />
                    </button>
                </div>

                <div className="pv-center-controls" onClick={(e) => e.stopPropagation()}>
                    <button className="pv-center-btn" onClick={() => skip(-10)}>
                        <img src={ICONS.rewind10} alt="-10s" />
                    </button>
                    
                    <button className="pv-center-btn play-pause" onClick={togglePlay}>
                        <img src={isPlaying ? ICONS.pause : ICONS.play} alt="Play/Pause" />
                    </button>
                    
                    <button className="pv-center-btn" onClick={() => skip(10)}>
                        <img src={ICONS.forward10} alt="+10s" />
                    </button>
                </div>

                <div className="pv-bottom-controls" onClick={(e) => e.stopPropagation()}>
                    <div className="pv-time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    
                    <div className="pv-progress-wrapper">
                        <input 
                            type="range" 
                            className="pv-seekbar"
                            min="0" max={duration || 100}
                            value={currentTime}
                            onChange={(e) => {
                                const newTime = parseFloat(e.target.value);
                                videoRef.current.currentTime = newTime;
                                setCurrentTime(newTime);
                            }}
                            style={{ '--progress': `${(currentTime / duration) * 100}%` }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VideoPlayer;