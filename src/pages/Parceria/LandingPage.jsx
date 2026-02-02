import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js'; 
import { FaPlay, FaInfoCircle, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'; 
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
    // Se o anime sorteado não tiver link, usa um desses:
    const safeBackgroundVideos = [
        // Demon Slayer (Exemplo MP4 - Mais estável para background)
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 
        // Você pode trocar esses links por links diretos .mp4 de animes que você tenha
        // Vou deixar um genérico aqui para garantir que mude o vídeo do Naruto
        "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4" 
    ];

    // DICA: Para colocar um anime específico, procure um link .mp4 direto de um trailer
    // Exemplo: Trailer de Solo Leveling ou One Piece

    const features = [
        { icon: '🚀', title: 'Anime Rápido', desc: 'Streaming otimizado.' },
        { icon: '🇯🇵', title: '100% Anime', desc: 'Focado em animação.' },
        { icon: '📱', title: 'Mobile', desc: 'Assista onde quiser.' },
        { icon: '💎', title: 'HD', desc: 'Qualidade máxima.' },
    ];

    const extractVideoLink = (item) => {
        if (!item?.links) return null;
        try {
            // Tenta achar links na estrutura padrão
            const s1 = item.links['1'] || item.links[1];
            if (s1) {
                const ep1 = s1['1'] || s1[1];
                // Prioriza m3u8 ou mp4
                if (ep1 && (typeof ep1 === 'string') && (ep1.includes('.m3u8') || ep1.includes('.mp4'))) {
                    return ep1;
                }
                // Se for objeto, tenta pegar valor
                if (typeof ep1 === 'object') return Object.values(ep1)[0];
                return ep1;
            }
            // Fallback genérico profundo
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
                    overview: item.overview || item.sinopse || "Sem descrição.",
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

    // --- PLAYER HLS / MP4 ---
    useEffect(() => {
        if (!videoUrl || !videoRef.current) return;
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
                <div className="lp-logo">MAX<span>ANIME</span></div>
                <div className="lp-nav-actions">
                    <button className="lp-btn-text" onClick={() => navigate('/login')}>Entrar</button>
                    <button className="lp-btn-primary small" onClick={() => navigate('/login')}>Assinar</button>
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
                    <span className="lp-tag">Anime em Destaque</span>
                    <h1 className="lp-title">{heroItem?.title}</h1>
                    <p className="lp-desc">{heroItem?.overview}</p>
                    
                    <div className="lp-actions">
                        <button className="lp-btn-primary" onClick={() => navigate('/login')}>
                            <FaPlay /> Começar a Assistir
                        </button>
                        
                        {/* Link para details-parceria */}
                        <button className="lp-btn-secondary" onClick={() => navigate(`/details-parceria/${heroItem?.uniqueId}`)}>
                            <FaInfoCircle /> Mais Informações
                        </button>
                    </div>
                </div>
                <button className="lp-mute-btn" onClick={toggleMute}>
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
            </header>

            <section className="lp-section">
                <div className="lp-section-header">
                    <h3>Animes em Alta</h3>
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
                                <span>Anime</span>
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
                <div className="lp-logo muted">MAX<span>ANIME</span></div>
                <p>O melhor do mundo anime está aqui.</p>
                <div className="lp-copy">© 2025 MaxAnime. Todos os direitos reservados.</div>
            </footer>
        </div>
    );
};

export default LandingPage;