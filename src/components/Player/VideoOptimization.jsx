import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * Hook de Otimização Extrema para Mobile e Redes Instáveis
 * Inclui: Prevenção de Erros, Adaptação de Hardware e Logs Avançados
 */
export const useVideoOptimization = (videoRef, link, type, setIsBuffering) => {
    const hlsRef = useRef(null);
    const retryCountRef = useRef(0); // Mantém contagem de erros para não entrar em loop infinito

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !link) return;

        // Limpeza de instâncias fantasmas
        if (hlsRef.current) {
            console.log("%c🧹 [Motor HLS] Limpando instância anterior...", "color: #ff9900; font-weight: bold;");
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const initPlayer = () => {
            setIsBuffering(true);
            retryCountRef.current = 0; // Reseta contagem de erros ao iniciar
            
            // 1. DETECÇÃO DE AMBIENTE (Hardware e Rede)
            const deviceMemory = navigator.deviceMemory || 4; // Em GB (Se não suportado, assume 4GB)
            const isLowEndDevice = deviceMemory <= 2; // Celular fraco (2GB RAM ou menos)
            
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const isSlowNetwork = connection ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false;

            console.groupCollapsed("%c🚀 [Motor HLS] Inicializando Otimização Avançada", "color: #00ff00; font-weight: bold;");
            console.log(`💻 Hardware: ${isLowEndDevice ? 'Baixo Desempenho (<= 2GB RAM)' : 'Bom Desempenho (> 2GB RAM)'}`);
            console.log(`📶 Rede Detectada: ${connection ? connection.effectiveType.toUpperCase() : 'Desconhecida'} ${isSlowNetwork ? '(Lenta)' : '(Rápida)'}`);
            console.groupEnd();

            if (type === 'm3u8' && Hls.isSupported()) {
                
                // =========================================================
                // CONFIGURAÇÕES DINÂMICAS E AGRESSIVAS
                // =========================================================
                const hlsConfig = {
                    // --- Qualidade e Bateria ---
                    capLevelToPlayerSize: true, 
                    startLevel: -1, // Deixa o HLS decidir a resolução inicial baseado na rede real, não tenta forçar HD logo de cara
                    
                    // --- Otimização de Buffer Dinâmica ---
                    // Se o celular for fraco ou a rede lenta, puxa menos vídeo por vez para não travar
                    maxBufferLength: isLowEndDevice ? 5 : (isSlowNetwork ? 8 : 15), 
                    maxMaxBufferLength: isLowEndDevice ? 10 : 30,
                    // Limite rigoroso de RAM (10MB para celular fraco, 30MB para PC bom)
                    maxBufferSize: isLowEndDevice ? 10 * 1024 * 1024 : 30 * 1024 * 1024, 
                    
                    // --- Tolerância e Sobrevivência de Rede ---
                    maxStarvationDelay: 2, 
                    fragLoadingTimeOut: isSlowNetwork ? 40000 : 20000, // Dá mais tempo se a rede for 3G
                    manifestLoadingTimeOut: 20000,
                    levelLoadingTimeOut: 20000,
                    
                    // --- Recuperação de Falhas ---
                    fragLoadingMaxRetry: 6, // Tenta baixar um pedaço do vídeo até 6 vezes antes de desistir
                    fragLoadingRetryDelay: 1000, // Espera 1s entre tentativas
                    manifestLoadingMaxRetry: 3,
                };

                const hls = new Hls(hlsConfig);
                hlsRef.current = hls;
                
                hls.loadSource(link);
                hls.attachMedia(video);
                
                // =========================================================
                // EVENTOS DE SUCESSO E PERFORMANCE
                // =========================================================
                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    setIsBuffering(false);
                    console.log(`%c✅ [Motor HLS] Playlist carregada. ${data.levels.length} resoluções disponíveis.`, "color: #00bfff; font-weight: bold;");
                    
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => console.log("%c⚠️ [Motor HLS] Autoplay bloqueado. Aguardando interação do usuário.", "color: #facc15;"));
                    }
                });

                hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    const level = hls.levels[data.level];
                    console.log(`%c🔄 [Motor HLS] Resolução adaptada para: ${level.height}p (${(level.bitrate / 1000000).toFixed(2)} Mbps)`, "color: #b19cd9;");
                });

                // =========================================================
                // TRATAMENTO DE ERROS AVANÇADO (Plano de Contingência)
                // =========================================================
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        retryCountRef.current += 1;
                        
                        // Proteção contra Loop Infinito (Desiste após 5 falhas fatais seguidas)
                        if (retryCountRef.current > 5) {
                            console.error("%c❌ [Motor HLS] Falha crítica irreversível. Limite de tentativas excedido.", "color: #ff0000; font-weight: bold; font-size: 14px;");
                            setIsBuffering(false);
                            hls.destroy();
                            return; // Aqui você poderia engatilhar um alerta na tela para o usuário
                        }

                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.warn(`%c📶 [Motor HLS] Erro de Rede (${data.details}). Tentativa ${retryCountRef.current}/5. Reconectando...`, "color: #facc15; font-weight: bold;");
                                setIsBuffering(true);
                                // Backoff exponencial: espera mais tempo a cada falha antes de tentar de novo
                                setTimeout(() => hls.startLoad(), retryCountRef.current * 1000); 
                                break;
                                
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.warn(`%c🎥 [Motor HLS] Erro de Mídia (${data.details}). O arquivo pode estar corrompido. Tentando recuperar frame...`, "color: #ff8c00; font-weight: bold;");
                                hls.recoverMediaError(); 
                                break;
                                
                            default:
                                console.error(`%c💥 [Motor HLS] Erro fatal desconhecido (${data.details}). Reiniciando motor completo...`, "color: #ff0000; font-weight: bold;");
                                hls.destroy();
                                initPlayer(); // Reinicia do zero
                                break;
                        }
                    } else {
                        // Erros não fatais (avisos) - O vídeo continua rodando, mas é bom monitorar
                        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                            console.warn("%c⏳ [Motor HLS] Gargalo de Buffer! A internet não está acompanhando o vídeo.", "color: #facc15;");
                            setIsBuffering(true);
                        }
                    }
                });

            } else {
                // =========================================================
                // FALLBACK PARA NAVEGADORES NATIVOS (iOS / Safari)
                // =========================================================
                console.log("%c🍎 [Motor Nativo] HLS.js não suportado. Usando player nativo do navegador.", "color: #00ff00; font-weight: bold;");
                video.src = link;
                video.preload = "auto";
                
                video.addEventListener('loadedmetadata', () => {
                    setIsBuffering(false);
                });

                video.addEventListener('error', () => {
                    console.error("%c❌ [Motor Nativo] Falha ao carregar o vídeo.", "color: #ff0000; font-weight: bold;");
                    setIsBuffering(false);
                });
            }
        };

        initPlayer();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [link, type, videoRef, setIsBuffering]);

    return hlsRef;
};