// ARQUIVO: src/components/Browse/Hero.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaVolumeMute, FaVolumeUp, FaDatabase } from 'react-icons/fa'; 
import { motion } from 'framer-motion'; 
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'; 
import { db } from '../../firebase/config'; 
import './Hero.css'; 

// --- HOOK: Busca Destaques do Hero no Firestore ---
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

// --- FUNÇÃO DE INICIALIZAÇÃO DE VÍDEO ---
const initializeVideo = (videoElement, teaserUrl, isMuted, VIDEO_START_TIME) => {
    if (!videoElement || !teaserUrl) return;
    videoElement.muted = isMuted; 
    videoElement.currentTime = VIDEO_START_TIME; 
    videoElement.load(); 
    videoElement.play();
    return null; 
};

const Hero = () => {
    const navigate = useNavigate();
    const { heroItems, loading, episodesByAnime } = useHeroHighlights(); 
    
    const [activeIndex, setActiveIndex] = useState(0); 
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true); 
    const videoRef = useRef(null);
    
    const validAnimes = useMemo(() => {
        return heroItems.filter(a => a.titulo && a.backdropUrl);
    }, [heroItems]);

    const advanceToNext = useCallback(() => {
        setActiveIndex(prevIndex => (prevIndex + 1) % validAnimes.length);
        setIsPlayingVideo(false); 
    }, [validAnimes.length]);

    const highlightAnime = validAnimes[activeIndex];
    const teaserUrl = highlightAnime?.heroTeaserUrl;
    const VIDEO_START_TIME = highlightAnime?.heroVideoStartTime || 15;
    const VIDEO_DURATION_LIMIT = highlightAnime?.heroVideoDuration || 30;
    const ROTATION_DURATION_SECONDS = 15; 
    
    useEffect(() => {
        if (validAnimes.length === 0 || !highlightAnime) return;

        let rotationTimer;
        let videoStopTimer;
        
        const startRotation = () => {
            rotationTimer = setTimeout(advanceToNext, ROTATION_DURATION_SECONDS * 1000); 
        };

        const videoElement = videoRef.current;
        
        if (teaserUrl && videoElement) {
            initializeVideo(videoElement, teaserUrl, isMuted, VIDEO_START_TIME);
            
            videoElement.play().then(() => {
                setIsPlayingVideo(true);
            }).catch(e => {
                console.warn("Autoplay falhou. Usando imagem.", e);
                setIsPlayingVideo(false);
                startRotation(); 
            });
            
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
        };
    }, [activeIndex, validAnimes, teaserUrl, VIDEO_START_TIME, VIDEO_DURATION_LIMIT, advanceToNext]); 

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]); 
    
    const handleVolumeToggle = () => setIsMuted(prev => !prev);
    
    const handleIndicatorClick = (index) => {
        if (index !== activeIndex) {
            setActiveIndex(index);
            setIsPlayingVideo(false); 
        }
    };
    
    if (loading || validAnimes.length === 0 || !highlightAnime) {
        return (
            <div className="hero-container loading-state">
                <div className="status-blink">[SISTEMA] INTERCEPTANDO SINAL DE VÍDEO...</div>
            </div>
        );
    }

    const animeId = highlightAnime.id; 

    const findFirstEpisode = () => {
        const episodes = episodesByAnime[animeId];
        if (!episodes || episodes.length === 0) return null;
        return episodes.sort((a, b) => {
            if (a.temporada !== b.temporada) return a.temporada - b.temporada;
            return a.numeroEpisodio - b.numeroEpisodio;
        })[0];
    };

    const handleWatch = () => {
        const firstEpisode = findFirstEpisode();
        if (firstEpisode) {
            navigate(`/watch/${animeId}/${firstEpisode.id}`); 
        } else {
            navigate(`/details/${animeId}`); 
        }
    };

    const handleInfo = () => navigate(`/details/${animeId}`); 

    return (
        <div className="hero-container">
            {/* VÍDEO TEASER */}
            {teaserUrl && (
                <video
                    key={animeId + activeIndex} 
                    ref={videoRef}
                    className={`teaser-video ${!isPlayingVideo ? 'hidden' : ''}`}
                    muted={isMuted} 
                    loop={false} 
                    playsInline 
                >
                    <source src={teaserUrl} type={teaserUrl.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
                </video>
            )}
            
            {/* IMAGEM DE FUNDO */}
            <motion.div
                className="hero-background-image"
                style={{ backgroundImage: `url(${highlightAnime.backdropUrl})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isPlayingVideo ? 0 : 1 }}
                transition={{ duration: 1 }}
            />

            {/* VIGNETTE GRADIENTE / RADAR MESH */}
            <div className="gradient-overlay" />
            
            <div className="hero-content">
                <div className="system-tag">DESTAQUE LOCAL</div>
                <h1 className="hero-title">
                    {highlightAnime.titulo || 'ARQUIVO CLASSIFICADO'}
                </h1>
                
                <p className="hero-synopsis">
                    {highlightAnime.sinopse || "DADOS DO RELATÓRIO INDISPONÍVEIS. ACESSE O DIRETÓRIO PARA MAIS DETALHES."}
                </p>
                
                <div className="button-group">
                    <button className="hero-button play-button" onClick={handleWatch}>
                        <FaPlay className="btn-icon" /> Assitir
                    </button>
                    <button className="hero-button info-button" onClick={handleInfo}>
                        Sobre
                    </button>
                </div>
            </div>

            {/* CONTROLES À DIREITA (Volume e Indicadores) */}
            <div className="hero-controls-right">
                {teaserUrl && (
                    <button className="volume-button" onClick={handleVolumeToggle}>
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                )}
                
                <div className="indicator-container">
                    {validAnimes.map((_, index) => (
                        <div 
                            key={index}
                            className={`indicator-bar ${index === activeIndex ? 'active' : 'inactive'}`}
                            onClick={() => handleIndicatorClick(index)}
                        >
                            <div className="indicator-progress" style={{
                                animation: index === activeIndex ? `indicator-fill ${ROTATION_DURATION_SECONDS}s linear forwards` : 'none'
                            }}/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;