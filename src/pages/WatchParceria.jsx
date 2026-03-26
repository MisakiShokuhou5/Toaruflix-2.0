import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimeFromMyApi, getTmdbShowDetails, getNextEpisodeDetails } from '../services/tmdb'; 
import { FaArrowLeft, FaPlay, FaBookmark, FaGem, FaExclamationTriangle, FaShieldAlt, FaDatabase, FaLock } from 'react-icons/fa';
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
                    alert("Acesso Premium: Este episódio é exclusivo para assinantes.");
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

                let currentTitle = `EPISÓDIO ${currentEp}`;
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
                let nextTitle = `EPISÓDIO ${nextEpNum}`;

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
                console.error("Erro geral no player:", error);
            }
            setLoading(false);
        };

        if (slug) fetchContent();
    }, [slug, episodeId, navigate]);

    return (
        <div className="container-watch-parceria">
            
            {/* HEADER */}
            <div className="header-watch-parceria">
                <button className="back-btn-watch-parceria" onClick={() => navigate(`/MAXPLAY`)}>
                    <FaArrowLeft /> VOLTAR
                </button>
            </div>

            {/* PLAYER SECTION */}
            <section className="player-section-watch-parceria">
                <div className="video-wrapper-watch-parceria">
                    {loading && (
                        <div className="loader-overlay-watch-parceria">
                            <div className="spinner-watch-parceria"></div>
                            <span className="status-text-watch-parceria">Carregando player...</span>
                        </div>
                    )}
                    
                    {!loading && embedUrl ? (
                        <iframe 
                            src={embedUrl}
                            title="Terminal Player"
                            className="iframe-watch-parceria"
                            allowFullScreen
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    ) : !loading && (
                        <div className="loader-overlay-watch-parceria error-state-watch-parceria">
                            <FaExclamationTriangle size={40} className="error-icon-watch-parceria" />
                            <span className="status-text-watch-parceria error-text-watch-parceria">Falha na conexão do vídeo</span>
                        </div>
                    )}
                </div>
            </section>

            {/* INFO BAR */}
            <section className="info-bar-watch-parceria">
                <div className="info-grid-watch-parceria">
                    
                    {/* ESQUERDA: INFO DO EPISÓDIO ATUAL */}
                    <div className="info-left-watch-parceria">
                        <h4 className="anime-title-watch-parceria" onClick={() => navigate(`/details-parceria/${slug}`)}>
                            {episodeData?.tituloSerie}
                        </h4>

                        <div className="ep-title-row-watch-parceria">
                            <h1 className="ep-main-title-watch-parceria">{episodeData?.tituloEpisodio}</h1>
                            <button className="bookmark-btn-watch-parceria"><FaBookmark /></button>
                        </div>

                        <div className="metadata-row-watch-parceria">
                            <span className="meta-badge-watch-parceria"><FaShieldAlt /> VERIFICADO</span>
                            <span className="meta-divider-watch-parceria">|</span>
                            <span className="meta-text-watch-parceria">TEMP {episodeData?.temporada}</span>
                            <span className="meta-divider-watch-parceria">|</span>
                            <span className="meta-text-watch-parceria">EP {episodeData?.numeroEpisodio}</span>
                        </div>
                    </div>

                    {/* DIREITA: PRÓXIMO EPISÓDIO */}
                    <div className="next-column-watch-parceria">
                        {nextEpInfo ? (
                            <>
                                <h5 className="next-header-watch-parceria"><FaDatabase /> PRÓXIMO EPISÓDIO</h5>
                                <div 
                                    className={`next-card-watch-parceria ${nextEpInfo.locked ? 'locked-watch-parceria' : ''}`}
                                    onClick={() => !nextEpInfo.locked && navigate(`/watch-parceria/${slug}/${nextEpInfo.num}`)}
                                >
                                    <div className="next-thumb-container-watch-parceria">
                                        <img 
                                            src={nextEpInfo.thumb} 
                                            alt="Próximo" 
                                            className="next-thumb-img-watch-parceria"
                                            onError={(e) => e.target.src = episodeData.backdrop} 
                                        />
                                        <div className="duration-badge-watch-parceria">24m</div>
                                        
                                        <div className="play-overlay-watch-parceria">
                                            {nextEpInfo.locked ? <FaLock /> : <FaPlay />}
                                        </div>
                                    </div>
                                    
                                    <div className="next-info-watch-parceria">
                                        <span className="next-ep-number-watch-parceria">
                                            EPISÓDIO {nextEpInfo.num}
                                        </span>
                                        <span className="next-ep-title-watch-parceria">
                                            {nextEpInfo.locked ? 'ACESSO PREMIUM' : nextEpInfo.title}
                                        </span>
                                    </div>

                                    {nextEpInfo.locked && (
                                        <div className="lock-icon-watch-parceria">
                                            <FaGem />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="next-empty-watch-parceria">
                                <h5 className="next-header-watch-parceria">FIM DA TEMPORADA</h5>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WatchParceria;