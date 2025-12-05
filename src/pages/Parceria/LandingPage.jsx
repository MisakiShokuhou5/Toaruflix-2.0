import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js'; 
import { getAllMedia, TMDB_IMAGE_BASE_URL } from '../../services/dataService'; 
import './LandingPage.css';

const LandingPage = () => { 
    const [catalog, setCatalog] = useState([]);
    const [highlightItem, setHighlightItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState('');
    const videoRef = useRef(null);
    const navigate = useNavigate();

    // VÍDEOS DE SEGURANÇA (Fallback)
    // Caso o vídeo do anime dê erro (CORS ou offline), usamos estes para não quebrar o layout.
    const safeBackgroundVideos = [
        "https://cdn-s01.mywallpaper-4k-image.net/stream/d/dragon-ball-z-dublado/01.mp4/index.m3u8",
        "https://cdn-s01.mywallpaper-4k-image.net/stream/d/dragon-ball-z-dublado/02.mp4/index.m3u8",
        "https://cdn-s01.mywallpaper-4k-image.net/stream/d/dragon-ball-z-dublado/03.mp4/index.m3u8"
    ];

    const features = [
        { icon: '⚡', title: 'Rápido', description: 'Play instantâneo.' },
        { icon: '💎', title: 'HD', description: 'Alta definição.' },
        { icon: '🍿', title: 'Catálogo', description: 'Séries e Animes.' },
        { icon: '📱', title: 'Mobile', description: 'Responsivo.' },
    ];

    // --- FUNÇÃO AUXILIAR: Extrair Link de Vídeo do Item ---
    const extractVideoLink = (item) => {
        if (!item || !item.links) return null;

        try {
            // Tenta pegar Temporada 1, Episódio 1
            // A estrutura pode ser links['1']['1'] ou links[1][1]
            const s1 = item.links['1'] || item.links[1];
            if (s1) {
                const ep1 = s1['1'] || s1[1];
                if (ep1 && (ep1.includes('.m3u8') || ep1.includes('.mp4'))) {
                    return ep1;
                }
                // Se não achou o '1', pega o primeiro valor disponível na temporada
                const firstEpKey = Object.keys(s1)[0];
                return s1[firstEpKey];
            }
            
            // Se não achou Temp 1, pega a primeira temporada disponível
            const firstSeasonKey = Object.keys(item.links)[0];
            const firstSeason = item.links[firstSeasonKey];
            const firstEpKey = Object.keys(firstSeason)[0];
            return firstSeason[firstEpKey];

        } catch (error) {
            console.warn("Não foi possível extrair vídeo do item:", item.title);
            return null;
        }
    };

    // --- PLAYER DE VÍDEO INTELIGENTE ---
    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            
            // Limpeza anterior
            if (video.hls) {
                video.hls.destroy();
                delete video.hls;
            }

            const handlePlayError = () => {
                console.warn("Erro ao reproduzir vídeo do destaque. Alternando para vídeo seguro.");
                // Se der erro, troca para um vídeo aleatório seguro
                const safeVid = safeBackgroundVideos[Math.floor(Math.random() * safeBackgroundVideos.length)];
                if (videoUrl !== safeVid) setVideoUrl(safeVid);
            };

            // Detectar tipo de arquivo
            const isM3U8 = videoUrl.includes('.m3u8');

            if (isM3U8 && Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {}); // Autoplay pode ser bloqueado pelo browser
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        hls.destroy();
                        handlePlayError();
                    }
                });
                
                video.hls = hls; // Guardar referência
            } else {
                // MP4 ou Safari Nativo (HLS)
                video.src = videoUrl;
                video.load();
                video.play().catch(() => {});
                
                // Adiciona listener de erro nativo
                video.onerror = handlePlayError;
            }
        }
    }, [videoUrl]);

    // --- BUSCA DE DADOS ---
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await getAllMedia();
                
                const seriesList = (data.series || []).map(item => ({ ...item, _originType: 'series' }));
                const animeList = (data.animes || []).map(item => ({ ...item, _originType: 'anime' }));
                const rawList = [...seriesList, ...animeList];

                const normalizedList = rawList.map(item => {
                    const posterRaw = item.posterPath || item.poster_path;
                    const backdropRaw = item.backdropPath || item.backdrop_path;
                    const title = item.title || item.name || "Sem Título";
                    const overview = item.overview || item.sinopse || "Sinopse não disponível.";

                    // Imagens
                    const finalPoster = posterRaw ? (posterRaw.startsWith('http') ? posterRaw : `${TMDB_IMAGE_BASE_URL}${posterRaw}`) : null;
                    
                    let finalBackdrop = null;
                    const backdropSource = backdropRaw || posterRaw;
                    if (backdropSource) {
                        const tmdbOriginalBase = TMDB_IMAGE_BASE_URL.replace('w500', 'original');
                        finalBackdrop = backdropSource.startsWith('http') ? backdropSource : `${tmdbOriginalBase}${backdropSource}`;
                    }

                    return {
                        ...item,
                        uniqueId: item.id || item.tmdbId,
                        displayTitle: title,
                        displayPoster: finalPoster,
                        displayBackdrop: finalBackdrop,
                        displayOverview: overview,
                        mediaType: item._originType,
                    };
                }).filter(item => item.displayPoster);

                const shuffled = normalizedList.sort(() => 0.5 - Math.random());

                // Prioriza Destaques Famosos
                const highlight = shuffled.find(i => 
                    i.displayTitle.toLowerCase().includes('stone') || 
                    i.displayTitle.toLowerCase().includes('dragon') ||
                    i.displayTitle.toLowerCase().includes('jujutsu') ||
                    i.displayTitle.toLowerCase().includes('solo')
                ) || shuffled[0];

                setCatalog(shuffled.slice(0, 24));
                setHighlightItem(highlight);

                // --- LÓGICA DE DEFINIÇÃO DO VÍDEO ---
                const itemVideo = extractVideoLink(highlight);
                
                if (itemVideo) {
                    console.log(`Tentando reproduzir vídeo do destaque (${highlight.displayTitle}):`, itemVideo);
                    setVideoUrl(itemVideo);
                } else {
                    console.log("Destaque sem vídeo. Usando vídeo seguro.");
                    setVideoUrl(safeBackgroundVideos[0]);
                }

                setLoading(false);

            } catch (error) {
                console.error("Erro geral:", error);
                setVideoUrl(safeBackgroundVideos[0]);
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    return (
        <div className="max-lp-container">
            
            {/* HERO SECTION */}
            <header className="max-lp-hero-section">
                <div className="max-lp-video-background">
                    <video 
                        ref={videoRef} 
                        muted 
                        loop 
                        autoPlay 
                        playsInline 
                        className="the-video"
                        // Fallback de imagem caso o vídeo demore a carregar
                        poster={highlightItem?.displayBackdrop}
                    />
                    <div className="video-overlay-gradient"></div>
                </div>

                <nav className="max-lp-navbar">
                    <div className="max-lp-logo">MAXPLAY</div>
                    <button className="max-lp-btn-login" onClick={() => navigate('https://maxplay.vercel.app/login')}>Entrar</button>
                </nav>

                <div className="max-lp-hero-content">
                    <h1>Entretenimento sem limites.</h1>
                    <p>
                        {highlightItem 
                            ? `Assista a ${highlightItem.displayTitle} e milhares de outros títulos.` 
                            : "Séries, Animes e Filmes gratuitos em um só lugar."}
                    </p>
                    <div className="max-lp-hero-actions">
                        <button className="max-lp-btn-primary" onClick={() => navigate('https://maxplay.vercel.app/login')}>
                            Explorar Catálogo
                        </button>
                        {highlightItem && (
                            <button className="max-lp-btn-secondary" onClick={() => navigate(`/details/${highlightItem.uniqueId}`)}>
                                Ver Detalhes
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* DESTAQUE PRINCIPAL INFO */}
            {highlightItem && (
                <section className="max-lp-highlight-section">
                    <div 
                        className="max-lp-highlight-bg"
                        style={{ backgroundImage: `url('${highlightItem.displayBackdrop}')` }}
                    >
                        <div className="max-lp-highlight-content">
                            <span className="max-lp-highlight-label">
                                {highlightItem.mediaType === 'anime' ? 'ANIME EM DESTAQUE' : 'SÉRIE POPULAR'}
                            </span>
                            <h2>{highlightItem.displayTitle}</h2>
                            <p className="max-lp-synopsis">
                                {highlightItem.displayOverview}
                            </p>
                            <button className="max-lp-btn-primary" onClick={() => navigate(`/details/${highlightItem.uniqueId}`)}>
                                Assistir Agora
                            </button>
                        </div>
                        <div className="max-lp-highlight-fade"></div>
                    </div>
                </section>
            )}

            {/* GRID DE CATÁLOGO */}
            <section className="max-lp-catalog-section">
                <div className="max-lp-section-header">
                    <h3>Tendências</h3>
                </div>

                {loading ? (
                    <div className="max-lp-loader"><div className="spinner"></div></div>
                ) : (
                    <div className="max-lp-grid">
                        {catalog.map((item) => (
                            <div 
                                key={item.uniqueId} 
                                className="max-lp-card" 
                                onClick={() => navigate(`/details/${item.uniqueId}`)}
                            >
                                <div className="card-image-wrapper">
                                    <img src={item.displayPoster} alt={item.displayTitle} loading="lazy" />
                                    <div className="card-overlay"><span>▶</span></div>
                                </div>
                                <div className="card-info">
                                    <h4>{item.displayTitle}</h4>
                                    <span className="card-badge">
                                        {item.mediaType === 'anime' ? 'Anime' : 'Série'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* FEATURES */}
            <section className="max-lp-features">
                {features.map((f, i) => (
                    <div key={i} className="feature-box">
                        <span className="f-icon">{f.icon}</span>
                        <h3>{f.title}</h3>
                        <p>{f.description}</p>
                    </div>
                ))}
            </section>

            <footer className="max-lp-footer">
                <p>MAXPLAY © 2025</p>
            </footer>
        </div>
    );
};

export default LandingPage;