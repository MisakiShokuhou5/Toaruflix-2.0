import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './Hero.css';

const useHeroHighlights = () => {
    const [heroItems, setHeroItems] = useState([]);
    const [episodesByAnime, setEpisodesByAnime] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHighlights = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'animes'),
                    where('isHero', '==', true),
                    orderBy('heroOrder', 'asc')
                );
                const snapshot = await getDocs(q);
                const highlights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHeroItems(highlights);

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
                console.error("Erro ao buscar dados:", error);
                setHeroItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchHighlights();
    }, []);

    return { heroItems, loading, episodesByAnime };
};

const initializeVideo = (videoElement, teaserUrl, isMuted, VIDEO_START_TIME) => {
    if (!videoElement || !teaserUrl) return;
    videoElement.muted = isMuted;
    videoElement.currentTime = VIDEO_START_TIME;
    videoElement.load();
    return null;
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const Hero = () => {
    const navigate = useNavigate();
    const { heroItems, loading, episodesByAnime } = useHeroHighlights();

    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [dynamicVideoDuration, setDynamicVideoDuration] = useState(null); // Armazena a duração real do vídeo
    const videoRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const validAnimes = useMemo(() => {
        return heroItems.filter(a => a.titulo && (a.backdropUrl || a.posterUrl));
    }, [heroItems]);

    const advanceToNext = useCallback(() => {
        setActiveIndex(prevIndex => (prevIndex + 1) % validAnimes.length);
        setIsPlayingVideo(false);
        setDynamicVideoDuration(null); // Reseta a duração pro próximo slide
    }, [validAnimes.length]);

    const highlightAnime = validAnimes[activeIndex];
    const teaserUrl = highlightAnime?.heroTeaserUrl;
    const playFullVideo = highlightAnime?.playFullVideo === true; // Verifica se é pra tocar o vídeo todo
    
    // Se for vídeo completo, inicia do zero, senão, respeita o limite do banco de dados
    const VIDEO_START_TIME = playFullVideo ? 0 : (highlightAnime?.heroVideoStartTime || 15);
    const VIDEO_DURATION_LIMIT = highlightAnime?.heroVideoDuration || 30;
    const ROTATION_DURATION_SECONDS = 15;

    // A Mágica do Tempo Perfeito:
    // Se for celular: usa tempo padrão.
    // Se for PC e vídeo ativado:
    //    - Se for vídeo completo e já sabemos a duração, usa a duração real do vídeo.
    //    - Se for só um trecho, usa o tempo salvo no banco.
    let currentSlideDuration = ROTATION_DURATION_SECONDS;
    if (!isMobile && teaserUrl) {
        if (playFullVideo) {
            currentSlideDuration = dynamicVideoDuration || ROTATION_DURATION_SECONDS; 
        } else {
            currentSlideDuration = VIDEO_DURATION_LIMIT;
        }
    }

    useEffect(() => {
        if (validAnimes.length === 0 || !highlightAnime) return;

        const videoElement = videoRef.current;
        let slideTimer;

        // Se a gente quer tocar o vídeo inteiro, mas o vídeo ainda não carregou os metadados
        // pra nos dizer a duração, a gente espera. Não dispara o timer ainda.
        if (!isMobile && teaserUrl && playFullVideo && !dynamicVideoDuration) {
            if (videoElement) {
                initializeVideo(videoElement, teaserUrl, isMuted, VIDEO_START_TIME);
                videoElement.play().then(() => setIsPlayingVideo(true)).catch(() => setIsPlayingVideo(false));
            }
            return; 
        }

        // 1. Inicia o timer sincronizado
        slideTimer = setTimeout(advanceToNext, currentSlideDuration * 1000);

        // 2. Toca vídeo parcial
        if (teaserUrl && videoElement && !isMobile && !playFullVideo) {
            initializeVideo(videoElement, teaserUrl, isMuted, VIDEO_START_TIME);
            videoElement.play().then(() => setIsPlayingVideo(true)).catch(() => setIsPlayingVideo(false));
        } else if (!teaserUrl || isMobile) {
            setIsPlayingVideo(false);
        }

        return () => {
            clearTimeout(slideTimer);
            if (videoElement) {
                videoElement.pause();
            }
        };
    }, [activeIndex, validAnimes, teaserUrl, VIDEO_START_TIME, currentSlideDuration, advanceToNext, isMobile, playFullVideo, dynamicVideoDuration]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = isMuted;
    }, [isMuted]);

    if (loading || validAnimes.length === 0 || !highlightAnime) {
        return (
            <div className="hero-container loading-state">
                <div className="loader-ring"></div>
            </div>
        );
    }

    const backgroundImageUrl = (isMobile && highlightAnime.posterUrl) ? highlightAnime.posterUrl : highlightAnime.backdropUrl;
    const animeId = highlightAnime.id;

    const findFirstEpisode = () => {
        const episodes = episodesByAnime[animeId];
        if (!episodes || episodes.length === 0) return null;
        return episodes.sort((a, b) => {
            if (a.temporada !== b.temporada) return a.temporada - b.temporada;
            return a.numeroEpisodio - b.numeroEpisodio;
        })[0];
    };

    return (
        <div className="hero-container">
            {/* VÍDEO */}
            {!isMobile && teaserUrl && (
                <video
                    key={animeId + activeIndex}
                    ref={videoRef}
                    className={`teaser-video ${!isPlayingVideo ? 'hidden' : ''}`}
                    muted={isMuted}
                    playsInline
                    onLoadedMetadata={(e) => {
                        // Assim que o vídeo carrega, ele avisa o React qual é a duração real dele
                        if (playFullVideo) {
                            setDynamicVideoDuration(e.target.duration);
                        }
                    }}
                    onEnded={() => {
                        // Garantia de segurança: se o vídeo chegar no final real, ele pula direto pro próximo
                        if (playFullVideo) {
                            advanceToNext();
                        }
                    }}
                >
                    <source src={teaserUrl} type={teaserUrl.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
                </video>
            )}

            {/* IMAGEM DE FUNDO */}
            <motion.div
                key={`bg-${backgroundImageUrl}`}
                className="hero-background-image"
                style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: (isPlayingVideo && !isMobile) ? 0 : 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />

            <div className="gradient-overlay" />

            {/* CONTEÚDO */}
            <AnimatePresence mode="wait">
                <motion.div key={animeId} className="hero-content" variants={containerVariants} initial="hidden" animate="show" exit="exit">
                    <motion.h1 variants={itemVariants} className="hero-title">{highlightAnime.titulo}</motion.h1>
                    <motion.p variants={itemVariants} className="hero-synopsis">{highlightAnime.sinopse}</motion.p>
                    <motion.div variants={itemVariants} className="button-group">
                        <button className="btn-starlink-primary" onClick={() => {
                            const ep = findFirstEpisode();
                            navigate(ep ? `/watch/${animeId}/${ep.id}` : `/details/${animeId}`);
                        }}>
                            <FaPlay className="btn-icon" /> ASSISTIR
                        </button>
                        <button className="btn-starlink-secondary" onClick={() => navigate(`/details/${animeId}`)}>
                            SOBRE
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* CONTROLES DE VOLUME */}
            {!isMobile && teaserUrl && (
                <div className="hero-controls-right">
                    <button className="volume-button-square" onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                </div>
            )}

            {/* INDICADORES (A animação vai usar o tempo real do vídeo se playFullVideo for true) */}
            <div className="hero-indicators-bottom">
                <div className="indicator-container">
                    {validAnimes.map((_, index) => (
                        <div
                            key={index}
                            className="indicator-item"
                            onClick={() => {
                                setActiveIndex(index);
                                setIsPlayingVideo(false);
                                setDynamicVideoDuration(null);
                            }}
                        >
                            {index === activeIndex && (!playFullVideo || dynamicVideoDuration) ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" className="progress-square">
                                    <rect x="2" y="2" width="20" height="20" className="bg-rect" />
                                    <rect 
                                        x="2" y="2" 
                                        width="20" height="20" 
                                        className="progress-rect" 
                                        style={{ animationDuration: `${currentSlideDuration}s` }} 
                                    />
                                </svg>
                            ) : (
                                <div className="simple-square"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;