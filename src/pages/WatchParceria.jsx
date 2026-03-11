// ARQUIVO: src/pages/WatchParceria.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimeFromMyApi, getTmdbShowDetails, getNextEpisodeDetails } from '../services/tmdb'; 
import { FaArrowLeft, FaPlay, FaBookmark, FaGem, FaExclamationTriangle, FaShieldAlt, FaDatabase } from 'react-icons/fa';
import './WatchParceria.css';

const WatchParceria = () => {
    const { slug, episodeId } = useParams(); 
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [episodeData, setEpisodeData] = useState(null);
    const [embedUrl, setEmbedUrl] = useState(null);
    const [nextEpInfo, setNextEpInfo] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                let currentEp = 1;
                if (!isNaN(episodeId)) {
                    currentEp = parseInt(episodeId);
                }

                if (currentEp > 3) {
                    alert("PROTOCOLO DE SEGURANÇA: Episódio exclusivo para assinantes Premium.");
                    navigate(`/details-parceria/${slug}`);
                    return;
                }

                const myApiData = await getAnimeFromMyApi(slug); 
                
                let tmdbId = null;
                let showTitle = "CARREGANDO...";
                let backdrop = ""; 

                if (myApiData) {
                    tmdbId = myApiData.tmdbId;
                    showTitle = myApiData.title;
                }

                let currentTitle = `ARQUIVO EP. ${currentEp}`;
                let season = 1; 

                if (tmdbId) {
                    const showDetails = await getTmdbShowDetails(tmdbId);
                    if (showDetails && showDetails.backdrop_path) {
                        backdrop = `https://image.tmdb.org/t/p/original${showDetails.backdrop_path}`;
                    }

                    const epDetails = await getNextEpisodeDetails(tmdbId, season, currentEp);
                    if (epDetails) {
                        currentTitle = epDetails.titulo || `EPISÓDIO ${currentEp}`;
                    }
                }

                setEpisodeData({
                    tituloEpisodio: currentTitle.toUpperCase(),
                    tituloSerie: showTitle.toUpperCase(),
                    temporada: season,
                    numeroEpisodio: currentEp,
                    backdrop: backdrop
                });

                const generatedUrl = `https://maxplay.vercel.app/embed/anime/${slug}?season=1&ep=${currentEp}&autoplay=1`;
                setEmbedUrl(generatedUrl);

                const nextEpNum = currentEp + 1;
                const isLocked = nextEpNum > 3;
                let nextThumb = backdrop; 
                let nextTitle = `ARQUIVO EP. ${nextEpNum}`;

                const hasNextLink = myApiData?.links?.["1"]?.[String(nextEpNum)];

                if (hasNextLink || tmdbId) {
                    if (tmdbId) {
                        const nextTmdbData = await getNextEpisodeDetails(tmdbId, season, nextEpNum);
                        if (nextTmdbData) {
                            if (nextTmdbData.titulo) nextTitle = nextTmdbData.titulo;
                            if (nextTmdbData.thumb) nextThumb = nextTmdbData.thumb;
                        }
                    }

                    setNextEpInfo({
                        id: String(nextEpNum),
                        num: nextEpNum,
                        title: nextTitle.toUpperCase(),
                        thumb: nextThumb,
                        locked: isLocked
                    });
                } else {
                    setNextEpInfo(null);
                }

            } catch (error) {
                console.error("Erro geral no terminal:", error);
            }
            setLoading(false);
        };

        if (slug) fetchContent();
    }, [slug, episodeId, navigate]);

    return (
        <div className="watch-parceria-container">
            {/* GRID DE FUNDO (STARLINK MESH) */}
            <div className="wp-system-mesh"></div>

            {/* HEADER */}
            <div className="wp-header">
                <button className="wp-back-btn" onClick={() => navigate(`/MAXPLAY`)}>
                    <FaArrowLeft /> VOLTAR AO DIRETÓRIO
                </button>
            </div>

            {/* PLAYER SECTION */}
            <section className="wp-player-section">
                <div className="wp-video-container">
                    {loading && (
                        <div className="wp-loader-overlay">
                            <div className="wp-spinner"></div>
                            <span className="wp-status-text">Sincronizando Sinal...</span>
                        </div>
                    )}
                    
                    {!loading && embedUrl ? (
                        <iframe 
                            src={embedUrl}
                            title="Terminal Player"
                            className="wp-iframe"
                            allowFullScreen
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    ) : !loading && (
                        <div className="wp-loader-overlay">
                            <FaExclamationTriangle size={40} color="#ff3333" />
                            <span className="wp-status-text" style={{color: '#ff3333'}}>Falha de Conexão</span>
                        </div>
                    )}
                </div>
            </section>

            {/* INFO BAR */}
            <section className="wp-info-bar">
                <div className="wp-info-grid">
                    <div className="wp-info-left">
                        <div className="wp-status-badge">
                            <FaShieldAlt /> SINAL EXTERNO VERIFICADO
                        </div>
                        
                        <h4 className="wp-anime-title" onClick={() => navigate(`/details-parceria/${slug}`)}>
                            {episodeData?.tituloSerie}
                        </h4>

                        <div className="wp-ep-title-row">
                            <h1>{episodeData?.tituloEpisodio}</h1>
                            <button className="wp-bookmark-btn"><FaBookmark /></button>
                        </div>

                        <div className="wp-metadata-row">
                            <span className="rating-l">ID: CLASSIFICADO</span>
                            <span className="meta-divider">|</span>
                            <span className="meta-text">TEMP_{episodeData?.temporada}</span>
                            <span className="meta-divider">|</span>
                            <span className="meta-text">ARQUIVO_{episodeData?.numeroEpisodio}</span>
                        </div>
                    </div>

                    {/* DIREITA: PRÓXIMO EPISÓDIO */}
                    <div className="wp-next-column">
                        {nextEpInfo ? (
                            <>
                                <h5 className="wp-next-header"><FaDatabase /> SEQUÊNCIA DETECTADA</h5>
                                <div 
                                    className={`wp-next-card ${nextEpInfo.locked ? 'locked' : ''}`}
                                    onClick={() => !nextEpInfo.locked && navigate(`/watch-parceria/${slug}/${nextEpInfo.num}`)}
                                >
                                    <div className="wp-next-thumb">
                                        <img src={nextEpInfo.thumb} alt="Próximo" onError={(e) => e.target.src = episodeData.backdrop} />
                                        <div className="wp-duration-badge">24M</div>
                                        {!nextEpInfo.locked && <div className="wp-play-overlay"><FaPlay /></div>}
                                    </div>
                                    
                                    <div className="wp-next-info">
                                        <span className="next-ep-number">
                                            ARQUIVO_{nextEpInfo.num} {nextEpInfo.locked ? '// BLOQUEADO' : ''}
                                        </span>
                                        <span className="next-ep-title">
                                            {nextEpInfo.locked ? 'ADQUIRIR ACESSO PREMIUM' : nextEpInfo.title}
                                        </span>
                                    </div>

                                    {nextEpInfo.locked && <div className="wp-lock-icon"><FaGem /></div>}
                                </div>
                            </>
                        ) : (
                            <div className="wp-next-empty">
                                <h5 className="wp-next-header">FIM DO DIRETÓRIO</h5>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WatchParceria;