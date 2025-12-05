import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaInfoCircle, FaVolumeMute, FaVolumeUp, FaStar } from 'react-icons/fa'; 
import { motion } from 'framer-motion'; 
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'; 
import { db } from '../../firebase/config'; 
import './Hero.css'; 
// Importe Hls.js se for usá-lo:
// import Hls from 'hls.js'; 

// --- FUNÇÃO AUXILIAR: SLUGIFY (Mantida) ---
const slugify = (text) => {
    if (!text) return 'unknown';
    return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'); 	
};

// --- HOOK: Busca Destaques do Hero no Firestore (ATUALIZADO) ---
const useHeroHighlights = () => {
    const [heroItems, setHeroItems] = useState([]);
    const [episodesByAnime, setEpisodesByAnime] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHighlights = async () => {
            setLoading(true);
            try {
                // 1. Busca Séries Hero, ordenadas pelo heroOrder (1, 2, 3...)
                const q = query(
                    collection(db, 'animes'), 
                    where('isHero', '==', true),
                    orderBy('heroOrder', 'asc')
                );
                const snapshot = await getDocs(q);
                const highlights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHeroItems(highlights);
                
                // 2. Busca todos os episódios 
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
                setEpisodesByAnime(episodesMap);

            } catch (error) {
                console.error("Erro ao buscar destaques do Hero:", error);
                setHeroItems([]); 
            } finally {
                setLoading(false);
            }
        };
        fetchHighlights();
    }, []);

    return { heroItems, loading, episodesByAnime };
};


// --- FUNÇÃO DE INICIALIZAÇÃO DE VÍDEO HLS/UNIVERSAL ---
const initializeVideo = (videoElement, teaserUrl, isMuted, VIDEO_START_TIME) => {
    if (!videoElement || !teaserUrl) return;

    videoElement.muted = isMuted; 
    videoElement.currentTime = VIDEO_START_TIME; 

    // LÓGICA HLS.JS (Descomentar e usar 'Hls' se você instalou a biblioteca)
    // if (Hls.isSupported() && teaserUrl.endsWith('.m3u8')) {
    //     let hls = new Hls();
    //     hls.loadSource(teaserUrl);
    //     hls.attachMedia(videoElement);
    //     videoElement.play();
    //     return hls; // Retorna a instância HLS para limpeza
    // } 
    
    // LÓGICA PADRÃO (MP4, MKV, ou navegadores com suporte nativo a M3U8)
    videoElement.load(); // Carrega o novo source
    videoElement.play();
    return null; // Nenhuma instância HLS para limpar
};


const Hero = () => {
    const navigate = useNavigate();
    const { heroItems, loading, episodesByAnime } = useHeroHighlights(); 
    
    const [activeIndex, setActiveIndex] = useState(0); 
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true); 
    const videoRef = useRef(null);
    
    const validAnimes = useMemo(() => {
        // Filtra para garantir que apenas itens com título e backdrop sejam usados
        return heroItems.filter(a => a.titulo && a.backdropUrl);
    }, [heroItems]);


    // Usa useCallback para evitar recriação desnecessária
    const advanceToNext = useCallback(() => {
        setActiveIndex(prevIndex => (prevIndex + 1) % validAnimes.length);
        setIsPlayingVideo(false); 
    }, [validAnimes.length]);

    const highlightAnime = validAnimes[activeIndex];

    const teaserUrl = highlightAnime?.heroTeaserUrl;
    const VIDEO_START_TIME = highlightAnime?.heroVideoStartTime || 15;
    const VIDEO_DURATION_LIMIT = highlightAnime?.heroVideoDuration || 30;
    const ROTATION_DURATION_SECONDS = 15; 
    

    // --- LÓGICA DE ROTAÇÃO E REPRODUÇÃO (EFEITO PRINCIPAL) ---
    useEffect(() => {
        if (validAnimes.length === 0 || !highlightAnime) return;

        let rotationTimer;
        let videoStopTimer;
        let hlsInstance = null;
        
        const startRotation = () => {
            rotationTimer = setTimeout(advanceToNext, ROTATION_DURATION_SECONDS * 1000); 
        };

        const videoElement = videoRef.current;
        
        if (teaserUrl && videoElement) {
            
            // 1. Inicializa o vídeo (incluindo lógica HLS/universal)
            hlsInstance = initializeVideo(videoElement, teaserUrl, isMuted, VIDEO_START_TIME);
            
            videoElement.play().then(() => {
                setIsPlayingVideo(true);
            }).catch(e => {
                console.warn("Autoplay de vídeo falhou. Usando imagem estática.", e);
                setIsPlayingVideo(false);
                startRotation(); 
            });
            
            // 2. Limita a duração do teaser
            videoStopTimer = setTimeout(() => {
                if (videoElement) {
                    videoElement.pause();
                    setIsPlayingVideo(false);
                }
                startRotation(); 
            }, VIDEO_DURATION_LIMIT * 1000); 

        } else {
            startRotation();
        }

        return () => {
            clearTimeout(rotationTimer);
            clearTimeout(videoStopTimer);
            // Limpa a instância HLS se ela existir
            // if (hlsInstance) hlsInstance.destroy();
        };
    // Mantido [advanceToNext] nas dependências. isMuted é gerenciado no hook separado.
    }, [activeIndex, validAnimes, teaserUrl, VIDEO_START_TIME, VIDEO_DURATION_LIMIT, advanceToNext]); 

    // --- CORREÇÃO DE REINÍCIO: EFEITO SEPARADO PARA VOLUME ---
    useEffect(() => {
        if (videoRef.current) {
            // Apenas altera a propriedade 'muted' do elemento DOM.
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]); // Só executa quando o estado 'isMuted' muda.
    
    const handleVolumeToggle = () => {
        setIsMuted(prev => !prev);
    };

    const handleIndicatorClick = (index) => {
        if (index !== activeIndex) {
            setActiveIndex(index);
            setIsPlayingVideo(false); 
        }
    };
    
    if (loading || validAnimes.length === 0 || !highlightAnime) {
        return <div className="hero-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Carregando Destaques...</div>;
    }

    const animeId = highlightAnime.id; 
    const dummyRating = 8.1; 
    const dummyRuntime = 25; 
    const dummyYear = highlightAnime.anoLancamento || '2025';

    // --- LÓGICA ATUALIZADA DO BOTÃO ASSISTIR (Busca o primeiro episódio real) ---
    const findFirstEpisode = () => {
        const episodes = episodesByAnime[animeId];
        if (!episodes || episodes.length === 0) return null;

        // Ordena para garantir que o T1 Ep. 1 seja o primeiro
        const firstEpisode = episodes.sort((a, b) => {
            if (a.temporada !== b.temporada) return a.temporada - b.temporada;
            return a.numeroEpisodio - b.numeroEpisodio;
        })[0];
        
        return firstEpisode;
    };

    const handleWatch = () => {
        const firstEpisode = findFirstEpisode();
        if (firstEpisode) {
            // Usa o ID do documento do episódio para a navegação
            const episodeId = firstEpisode.id;
            navigate(`/watch/${animeId}/${episodeId}`); 
        } else {
            console.warn(`Nenhum episódio encontrado para ${highlightAnime.titulo}. Redirecionando para detalhes.`);
            navigate(`/details/${animeId}`); 
        }
    };

    const handleInfo = () => {
        navigate(`/details/${animeId}`); 
    };


    return (
        <div className="hero-container">
            {/* VÍDEO TEASER - Usa a tag <source> para universalidade */}
            {teaserUrl && (
                <video
                    key={animeId + activeIndex} 
                    ref={videoRef}
                    className={`teaser-video ${!isPlayingVideo ? 'hidden' : ''}`}
                    muted={isMuted} 
                    loop={false} 
                    playsInline 
                    // onEnded não é mais necessário se usarmos o videoStopTimer
                >
                    {/* ⬅️ SUPORTE UNIVERSAL: O navegador tentará reproduzir o primeiro formato compatível */}
                    <source src={teaserUrl} type={teaserUrl.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
                    Seu navegador não suporta a tag de vídeo.
                </video>
            )}
            
            {/* IMAGEM DE FUNDO */}
            <motion.div
                className="hero-background-image"
                style={{ 
                    backgroundImage: `url(${highlightAnime.backdropUrl})`,
                    opacity: isPlayingVideo ? 0 : 1
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isPlayingVideo ? 0 : 1 }}
                transition={{ duration: 1 }}
            />

            <div className="gradient-overlay" />
            
            <div className="hero-content">
                
                {/* Metadados */}
                <p style={{ color: '#808080', fontSize: '0.9rem', marginBottom: '5px' }}>
                    SÉRIE | {dummyYear} | <FaStar style={{ color: '#8a2be2' }} /> {dummyRating} PONTOS | {dummyRuntime} MIN
                </p>

                {/* 1. Título */}
                <h1 className="hero-title">
                    {highlightAnime.titulo || 'Destaque ToaruFlix'}
                </h1>
                
                {/* 2. Sinopse */}
                <p className="hero-synopsis">
                    {highlightAnime.sinopse || "Sinopse do destaque."}
                </p>
                
                {/* 3. Botões e Controle de Volume */}
                <div className="button-group">
                    <button className="hero-button play-button" onClick={handleWatch}>
                        <FaPlay /> Assistir
                    </button>
                    <button className="hero-button info-button" onClick={handleInfo}>
                        <FaInfoCircle /> Mais Infos
                    </button>

                    {/* Botão de Volume */}
                    {teaserUrl && (
                        <button className="volume-button" onClick={handleVolumeToggle} aria-label={isMuted ? "Ativar Volume" : "Silenciar"}>
                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                    )}
                </div>
            </div>

            {/* 4. INDICADORES DE ROTAÇÃO */}
            <div className="indicator-container">
                {validAnimes.map((_, index) => (
                    <div 
                        key={index}
                        className={`indicator-dot ${index === activeIndex ? 'active' : 'inactive'}`}
                        onClick={() => handleIndicatorClick(index)}
                    >
                        {/* SVG e base mantidos */}
                        <svg className={`indicator-progress-ring ${index === activeIndex ? 'active' : 'inactive'}`} viewBox="0 0 16 16">
                            <circle cx="8" cy="8" r="7" /> 
                        </svg>
                        <div className={`indicator-base ${index === activeIndex ? 'active' : 'inactive'}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Hero;