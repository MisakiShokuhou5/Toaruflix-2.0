// ARQUIVO: src/pages/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js'; 
import { FaPlay, FaInfoCircle, FaVolumeMute, FaVolumeUp, FaDatabase, FaShieldAlt } from 'react-icons/fa'; 
import { getAllMedia, TMDB_IMAGE_BASE_URL } from '../../services/dataService'; 
import './LandingPage.css';

const LandingPage = () => { 
    const navigate = useNavigate();
    const videoRef = useRef(null);

    // Estados
    const [catalog, setCatalog] = useState([]);
    const [heroItem, setHeroItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState('');
    const [isMuted, setIsMuted] = useState(true);
    const [showVideo, setShowVideo] = useState(false); 

    // ✅ NOVOS VÍDEOS DE FUNDO (Fallbacks mais estáveis)
    const safeBackgroundVideos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 
        "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4" 
    ];

    const features = [
        { icon: '🚀', title: 'PROTOCOLO VELOZ', desc: 'Streaming otimizado via CDN.' },
        { icon: '🇯🇵', title: 'ORIGINALIDADE', desc: 'Sincronização com o acervo nipônico.' },
        { icon: '📱', title: 'MOBILIDADE', desc: 'Acesso multiplataforma.' },
        { icon: '💎', title: 'ALTA DEFINIÇÃO', desc: 'Registros em 4K nativo.' },
    ];

    const extractVideoLink = (item) => {
        if (!item?.links) return null;
        try {
            const s1 = item.links['1'] || item.links[1];
            if (s1) {
                const ep1 = s1['1'] || s1[1];
                if (ep1 && (typeof ep1 === 'string') && (ep1.includes('.m3u8') || ep1.includes('.mp4'))) {
                    return ep1;
                }
                if (typeof ep1 === 'object') return Object.values(ep1)[0];
                return ep1;
            }
            const firstSeason = Object.values(item.links)[0];
            if (firstSeason) return Object.values(firstSeason)[0];
        } catch (e) { return null; }
        return null;
    };

    // --- FETCH DE DADOS (FILTRADO PARA ANIME) ---
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await getAllMedia();
                
                const allItems = [
                    ...(data.animes || []).map(i => ({...i, type: 'anime'}))
                ];

                // Normalização
                const normalized = allItems.map(item => ({
                    ...item,
                    uniqueId: item.id || item.tmdbId,
                    title: item.title || item.name || item.titulo,
                    overview: item.overview || item.sinopse || "Sem descrição disponível no banco de dados.",
                    poster: item.posterPath || item.poster_path 
                        ? (item.posterPath?.startsWith('http') ? item.posterPath : `${TMDB_IMAGE_BASE_URL}${item.posterPath}`)
                        : null,
                    backdrop: item.backdropPath || item.backdrop_path 
                        ? (item.backdropPath?.startsWith('http') ? item.backdropPath : `https://image.tmdb.org/t/p/original${item.backdropPath}`)
                        : null
                })).filter(i => i.poster);

                // Embaralhar
                const shuffled = normalized.sort(() => 0.5 - Math.random());

                // Escolher Hero (Destaque)
                const hero = shuffled.find(i => i.backdrop) || shuffled[0];

                setCatalog(shuffled.slice(0, 12)); 
                setHeroItem(hero);

                // Tenta pegar o video do Hero, se não der, pega o fallback
                const vLink = extractVideoLink(hero);
                
                // Se achou link no anime sorteado, usa ele. Senão usa o fallback seguro.
                setVideoUrl(vLink || safeBackgroundVideos[0]);

                setLoading(false);
            } catch (err) {
                console.error("Erro ao carregar:", err);
                setVideoUrl(safeBackgroundVideos[0]);
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    // --- PLAYER HLS / MP4 (Apenas Desktop) ---
    useEffect(() => {
        // Detecção básica de mobile para não iniciar o player
        const isMobile = window.innerWidth <= 768;
        if (isMobile || !videoUrl || !videoRef.current) return;
        
        const video = videoRef.current;
        let hls;

        const initPlayer = () => {
            // Se for M3U8 usa HLS
            if (Hls.isSupported() && videoUrl.includes('.m3u8')) {
                hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.log("Autoplay bloqueado pelo navegador", e));
                    setShowVideo(true);
                });
            } else {
                // Se for MP4 normal
                video.src = videoUrl;
                video.play().catch(e => console.log("Autoplay bloqueado pelo navegador", e));
                setShowVideo(true);
            }
        };
        initPlayer();
        return () => { if (hls) hls.destroy(); };
    }, [videoUrl]);

    const toggleMute = () => setIsMuted(!isMuted);

    if (loading) return <div className="lp-loader"><div className="lp-spinner"></div></div>;

    return (
        <div className="lp-container">
            <nav className="lp-navbar">
                <div className="lp-logo">TOARU<span>FLIX</span></div>
                <div className="lp-nav-actions">
                    <button className="lp-btn-text" onClick={() => navigate('/login')}>AUTENTICAR</button>
                    <button className="lp-btn-primary small" onClick={() => navigate('/login')}>CRIAR CONTA</button>
                </div>
            </nav>

            <header className="lp-hero">
                <div className="lp-video-wrapper">
                    <video 
                        ref={videoRef}
                        muted={isMuted}
                        loop
                        playsInline
                        className={`lp-hero-video ${showVideo ? 'visible' : ''}`}
                        poster={heroItem?.backdrop}
                    />
                    <div className="lp-video-overlay"></div>
                </div>

                <div className="lp-hero-content">
                    <div className="lp-status-tag"><FaDatabase /> REGISTRO DE ALTA PRIORIDADE</div>
                    <h1 className="lp-title">{heroItem?.title}</h1>
                    <p className="lp-desc">{heroItem?.overview}</p>
                    
                    <div className="lp-actions">
                        <button className="lp-btn-primary" onClick={() => navigate('/login')}>
                            <FaPlay /> INICIAR PROTOCOLO
                        </button>
                        
                        <button className="lp-btn-secondary" onClick={() => navigate(`/details-parceria/${heroItem?.uniqueId}`)}>
                            <FaInfoCircle /> ESPECIFICAÇÕES
                        </button>
                    </div>
                </div>
                <button className="lp-mute-btn" onClick={toggleMute}>
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
            </header>

            <section className="lp-section">
                <div className="lp-section-header">
                    <h3><FaShieldAlt /> ARQUIVOS EM DESTAQUE</h3>
                    <div className="lp-line"></div>
                </div>

                <div className="lp-grid">
                    {catalog.map((item) => (
                        <div 
                            key={item.uniqueId} 
                            className="lp-card"
                            onClick={() => navigate(`/details-parceria/${item.uniqueId}`)}
                        >
                            <div className="lp-card-image">
                                <img src={item.poster} alt={item.title} loading="lazy" />
                                <div className="lp-card-hover">
                                    <FaPlay className="lp-play-icon" />
                                </div>
                            </div>
                            <div className="lp-card-meta">
                                <h4>{item.title}</h4>
                                <span>TIPO: ANIME_DATA</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="lp-features">
                {features.map((f, i) => (
                    <div key={i} className="lp-feature-box">
                        <span className="lp-f-icon">{f.icon}</span>
                        <h4>{f.title}</h4>
                        <p>{f.desc}</p>
                    </div>
                ))}
            </section>

            <footer className="lp-footer">
                <div className="lp-logo muted">TOARU<span>FLIX</span></div>
                <p>TERMINAL DE ACESSO AO BANCO DE DADOS DA CIDADE ACADÊMICA.</p>
                <div className="lp-copy">© 2026 ACADEMIA_CITY_NETWORK. TODOS OS DIREITOS RESERVADOS.</div>
            </footer>
        </div>
    );
};

export default LandingPage;