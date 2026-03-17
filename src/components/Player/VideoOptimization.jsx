import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; 

export const useVideoOptimization = (videoRef, link, type, setIsBuffering) => {
    const hlsRef = useRef(null);
    const retryCountRef = useRef(0);
    const currentDriveKeyIndex = useRef(0);
    const [driveKeys, setDriveKeys] = useState([]);

    // Busca as chaves globais do Drive no banco de dados
    useEffect(() => {
        const fetchKeys = async () => {
            if (type !== 'drive') return;
            try {
                const db = getFirestore();
                const docRef = doc(db, 'settings', 'driveConfig');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists() && docSnap.data().keys) {
                    setDriveKeys(docSnap.data().keys);
                } else {
                    console.error("❌ Nenhuma API Key do Drive configurada no Firestore.");
                }
            } catch (error) {
                console.error("Erro ao buscar chaves do Drive:", error);
            }
        };
        fetchKeys();
    }, [type]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !link) return;

        // Limpa instâncias anteriores
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const initPlayer = () => {
            setIsBuffering(true);
            retryCountRef.current = 0;

            // =========================================================
            // LÓGICA GOOGLE DRIVE (Rotação Automática de API KEYS)
            // =========================================================
            if (type === 'drive') {
                if (driveKeys.length === 0) return; // Aguarda as chaves carregarem

                const loadDriveSource = () => {
                    const activeKey = driveKeys[currentDriveKeyIndex.current];
                    console.log(`%c🔄 [Google Drive] Carregando com a chave index: ${currentDriveKeyIndex.current}`, "color: #00a8ff; font-weight: bold;");
                    
                    // Constrói a URL usando o link (que no painel deve ser apenas o FILE_ID)
                    const streamUrl = `https://www.googleapis.com/drive/v3/files/${link}?alt=media&key=${activeKey}`;
                    
                    video.src = streamUrl;
                    video.preload = "auto";

                    // Remove event listeners antigos para evitar loop
                    video.onloadedmetadata = () => setIsBuffering(false);
                    video.onerror = null; 

                    video.onerror = () => {
                        console.warn(`%c⚠️ [Google Drive] Erro ou Limite de Cota na chave index ${currentDriveKeyIndex.current}. Alternando...`, "color: #ff9900;");
                        
                        currentDriveKeyIndex.current += 1;
                        
                        // Verifica se todas as chaves falharam
                        if (currentDriveKeyIndex.current >= driveKeys.length) {
                            console.error("%c❌ [Google Drive] TODAS as API Keys falharam. O limite geral foi atingido ou o FILE_ID é inválido.", "color: #ff0000; font-weight: bold;");
                            setIsBuffering(false);
                            return;
                        }
                        
                        // Tenta com a próxima chave
                        setIsBuffering(true);
                        loadDriveSource(); 
                    };
                };

                loadDriveSource();

            } 
            // =========================================================
            // LÓGICA HLS (m3u8) OTIMIZADA PARA MOBILE
            // =========================================================
            else if (type === 'm3u8' && Hls.isSupported()) {
                const deviceMemory = navigator.deviceMemory || 4;
                const isLowEndDevice = deviceMemory <= 2;
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                const isSlowNetwork = connection ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false;

                const hlsConfig = {
                    capLevelToPlayerSize: true, 
                    startLevel: -1,
                    maxBufferLength: isLowEndDevice ? 5 : (isSlowNetwork ? 8 : 15), 
                    maxMaxBufferLength: isLowEndDevice ? 10 : 30,
                    maxBufferSize: isLowEndDevice ? 10 * 1024 * 1024 : 30 * 1024 * 1024, 
                    maxStarvationDelay: 2, 
                    fragLoadingTimeOut: isSlowNetwork ? 40000 : 20000, 
                    manifestLoadingTimeOut: 20000,
                    levelLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 6,
                    fragLoadingRetryDelay: 1000,
                    manifestLoadingMaxRetry: 3,
                };

                const hls = new Hls(hlsConfig);
                hlsRef.current = hls;
                
                hls.loadSource(link);
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsBuffering(false);
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => console.log("%c⚠️ Autoplay bloqueado pelo navegador.", "color: #facc15;"));
                    }
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        retryCountRef.current += 1;
                        if (retryCountRef.current > 5) {
                            setIsBuffering(false);
                            hls.destroy();
                            return;
                        }
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            setIsBuffering(true);
                            setTimeout(() => hls.startLoad(), retryCountRef.current * 1000); 
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError(); 
                        } else {
                            hls.destroy();
                            initPlayer();
                        }
                    } else if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                        setIsBuffering(true);
                    }
                });

            } 
            // =========================================================
            // FALLBACK NATIVO (MP4 / iOS Safari)
            // =========================================================
            else {
                video.src = link;
                video.preload = "auto";
                video.addEventListener('loadedmetadata', () => setIsBuffering(false));
                video.addEventListener('error', () => setIsBuffering(false));
            }
        };

        // Só inicializa se não for drive, OU se for drive e já tiver chaves prontas
        if (type !== 'drive' || driveKeys.length > 0) {
            initPlayer();
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [link, type, videoRef, setIsBuffering, driveKeys]);

    return hlsRef;
};