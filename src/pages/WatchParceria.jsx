import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimeFromMyApi, getTmdbShowDetails, getNextEpisodeDetails } from '../services/tmdb'; // Imports atualizados
import { FaArrowLeft, FaPlay, FaBookmark, FaGem, FaExclamationTriangle } from 'react-icons/fa';
import './WatchParceria.css';

const WatchParceria = () => {
    // "slug" aqui na verdade é o ID do firebase (ex: ipu8Vq2qgIe0Jbk77cTt)
    const { slug, episodeId } = useParams(); 
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [episodeData, setEpisodeData] = useState(null);
    const [embedUrl, setEmbedUrl] = useState(null);
    const [nextEpInfo, setNextEpInfo] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                // 1. IDENTIFICA O NÚMERO DO EPISÓDIO ATUAL
                let currentEp = 1;
                // Tenta pegar da URL se for número, senão assume 1
                if (!isNaN(episodeId)) {
                    currentEp = parseInt(episodeId);
                }

                // 🔒 REGRA DE BLOQUEIO (> EP 3)
                if (currentEp > 3) {
                    alert("Episódio exclusivo para assinantes Premium.");
                    navigate(`/details-parceria/${slug}`);
                    return;
                }

                // 2. BUSCA NA SUA API PRIMEIRO (Para pegar o tmdbId correto)
                const myApiData = await getAnimeFromMyApi(slug); // slug = ipu8Vq2qgIe0Jbk77cTt
                
                let tmdbId = null;
                let showTitle = "Carregando...";
                let backdrop = "https://image.tmdb.org/t/p/original/bQLrHIRq9161x37Zc2E0N75L62.jpg"; // Fallback genérico bonito

                if (myApiData) {
                    tmdbId = myApiData.tmdbId;
                    showTitle = myApiData.title;
                    // Se sua API tiver poster/backdrop, use aqui se quiser
                } else {
                    console.error("Anime não encontrado na base de dados.");
                    // Se não achar na sua API, não temos como achar no TMDB
                }

                // 3. SE TIVER TMDB ID, BUSCA DETALHES VISUAIS (Backdrop e Títulos)
                let currentTitle = `Episódio ${currentEp}`;
                let season = 1; // Assumindo temporada 1 por padrão baseada na sua API

                if (tmdbId) {
                    // Pega detalhes da Série (para o fundo/backdrop)
                    const showDetails = await getTmdbShowDetails(tmdbId);
                    if (showDetails) {
                        if (showDetails.backdrop_path) {
                            backdrop = `https://image.tmdb.org/t/p/original${showDetails.backdrop_path}`;
                        }
                    }

                    // Pega detalhes do Episódio Atual (Título e Imagem)
                    const epDetails = await getNextEpisodeDetails(tmdbId, season, currentEp);
                    if (epDetails) {
                        currentTitle = epDetails.titulo || `Episódio ${currentEp}`;
                    }
                }

                // 4. SETA DADOS NA TELA
                setEpisodeData({
                    tituloEpisodio: currentTitle,
                    tituloSerie: showTitle,
                    temporada: season,
                    numeroEpisodio: currentEp,
                    backdrop: backdrop
                });

                // 5. GERA URL DO PLAYER
                // Usando o ID do firebase na URL do player como você fazia antes
                const generatedUrl = `https://maxplay.vercel.app/embed/anime/${slug}?season=1&ep=${currentEp}&autoplay=1`;
                setEmbedUrl(generatedUrl);


                // --- 6. LÓGICA DO PRÓXIMO EPISÓDIO ---
                const nextEpNum = currentEp + 1;
                const isLocked = nextEpNum > 3;
                let nextThumb = backdrop; // Começa com o backdrop como garantia
                let nextTitle = `Episódio ${nextEpNum}`;

                // Verifica se existe link para o próximo episódio na sua API (opcional, mas bom pra saber se acabou)
                const hasNextLink = myApiData?.links?.["1"]?.[String(nextEpNum)];

                // Se houver próximo episódio (baseado na sua lista ou lógica TMDB)
                if (hasNextLink || tmdbId) {
                    
                    // Tenta buscar imagem real no TMDB
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
                        title: nextTitle,
                        thumb: nextThumb,
                        locked: isLocked
                    });
                } else {
                    setNextEpInfo(null); // Fim da lista
                }

            } catch (error) {
                console.error("Erro geral:", error);
            }
            setLoading(false);
        };

        if (slug) fetchContent();
    }, [slug, episodeId, navigate]);

    return (
        <div className="watch-parceria-container">
            {/* GLOW DE FUNDO */}
            {episodeData?.backdrop && (
                <div className="wp-ambient-glow" ></div>
            )}

            {/* HEADER */}
            <div className="wp-header">
                <button className="wp-back-btn" onClick={() => navigate(`/MAXPLAY`)}>
                    <FaArrowLeft /> VOLTAR
                </button>
            </div>

            {/* PLAYER SECTION */}
            <section className="wp-player-section">
                <div className="wp-video-container">
                    {loading && <div className="wp-loader-overlay"><div className="wp-spinner"></div></div>}
                    
                    {!loading && embedUrl ? (
                        <iframe 
                            src={embedUrl}
                            title="Player"
                            className="wp-iframe"
                            allowFullScreen
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    ) : !loading && (
                        <div className="wp-loader-overlay"><FaExclamationTriangle size={40} color="#e74c3c" /></div>
                    )}
                </div>
            </section>

            {/* INFO BAR */}
            <section className="wp-info-bar">
                <div className="wp-info-grid">
                    {/* ESQUERDA: INFO ATUAL */}
                    <div className="wp-info-left">
                        <h4 className="wp-anime-title" onClick={() => navigate(`/details-parceria/${slug}`)}>
                            {episodeData?.tituloSerie}
                        </h4>

                        <div className="wp-ep-title-row">
                            <h1>{episodeData?.tituloEpisodio}</h1>
                            <button className="wp-bookmark-btn"><FaBookmark /></button>
                        </div>

                        <div className="wp-metadata-row">
                            <span className="rating-l">L</span>
                            <span className="meta-divider">▪</span>
                            <span className="meta-text">Leg | Dub</span>
                            <span className="meta-divider">▪</span>
                            <span className="meta-text">T{episodeData?.temporada} E{episodeData?.numeroEpisodio}</span>
                        </div>
                    </div>

                    {/* DIREITA: PRÓXIMO EPISÓDIO */}
                    <div className="wp-next-column">
                        {nextEpInfo ? (
                            <>
                                <h5 className="wp-next-header">A SEGUIR</h5>
                                <div 
                                    className={`wp-next-card ${nextEpInfo.locked ? 'locked' : ''}`}
                                    onClick={() => !nextEpInfo.locked && navigate(`/watch-parceria/${slug}/${nextEpInfo.num}`)}
                                >
                                    <div className="wp-next-thumb">
                                        <img src={nextEpInfo.thumb} alt="Próximo" onError={(e) => e.target.src = episodeData.backdrop} />
                                        <div className="wp-duration-badge">24m</div>
                                        {!nextEpInfo.locked && <div className="wp-play-overlay"><FaPlay /></div>}
                                    </div>
                                    
                                    <div className="wp-next-info">
                                        <span className="next-ep-number">
                                            E{nextEpInfo.num} - {nextEpInfo.locked ? 'Premium' : 'Dublado'}
                                        </span>
                                        <span className="next-ep-title">
                                            {nextEpInfo.locked ? 'Assine para continuar assistindo' : nextEpInfo.title}
                                        </span>
                                    </div>

                                    {nextEpInfo.locked && <div className="wp-lock-icon"><FaGem /></div>}
                                </div>
                            </>
                        ) : (
                            <div className="wp-next-empty">
                                <h5 className="wp-next-header">FIM DA LISTA</h5>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WatchParceria;