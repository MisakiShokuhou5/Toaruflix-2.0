import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getMediaById, TMDB_IMAGE_BASE_URL } from '../services/dataService';
import { FaArrowLeft, FaStepBackward, FaStepForward, FaLock, FaCrown, FaExclamationTriangle, FaTv } from 'react-icons/fa';
import './WatchParceria.css';

const WatchParceria = () => {
    const { slug, episodeId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [episodeData, setEpisodeData] = useState(null);
    const [embedUrl, setEmbedUrl] = useState(null);
    const [nextEpId, setNextEpId] = useState(null);
    const [prevEpId, setPrevEpId] = useState(null);

    // --- BUSCA E VALIDAÇÃO ---
    useEffect(() => {
        const fetchEpisodeDetails = async () => {
            setLoading(true);
            try {
                let currentEpData = null;
                let backdrop = null;
                let season = 1;
                let epNumber = 1;
                let source = 'firebase';

                // 1. TENTA NO FIREBASE
                const epRef = doc(db, 'episodes', episodeId);
                const epSnap = await getDoc(epRef);

                if (epSnap.exists()) {
                    currentEpData = { id: epSnap.id, ...epSnap.data() };
                    // Tenta pegar o backdrop do anime no firebase
                    const animeRef = doc(db, 'animes', slug);
                    const animeSnap = await getDoc(animeRef);
                    if (animeSnap.exists()) backdrop = animeSnap.data().backdropUrl;
                } else {
                    // 2. FALLBACK API (Se não achar no Firebase)
                    source = 'api';
                    let mediaData = await getMediaById('series', slug);
                    if (!mediaData) mediaData = await getMediaById('anime', slug);

                    if (mediaData) {
                        backdrop = mediaData.backdrop_path 
                            ? `${TMDB_IMAGE_BASE_URL}original${mediaData.backdrop_path}` 
                            : null;
                        
                        if (mediaData.episodes) {
                            // Converte IDs para String para garantir comparação correta
                            const foundEp = mediaData.episodes.find(ep => String(ep.id) === String(episodeId));
                            if (foundEp) {
                                currentEpData = foundEp;
                            }
                        }
                    }
                }

                // 3. PROCESSA OS DADOS
                if (currentEpData) {
                    // --- CORREÇÃO DO NaN (Sanitização Agressiva) ---
                    
                    // Tenta pegar a temporada de todas as formas possíveis
                    let rawSeason = currentEpData.temporada || currentEpData.season_number || 1;
                    // Tenta pegar o episódio de todas as formas possíveis
                    let rawEp = currentEpData.numeroEpisodio || currentEpData.episode_number || currentEpData.ep_number || 1;

                    // Converte para número
                    season = parseInt(rawSeason);
                    epNumber = parseInt(rawEp);

                    // BLINDAGEM: Se a conversão der errado (NaN), força ser 1
                    if (isNaN(season) || season < 1) season = 1;
                    if (isNaN(epNumber) || epNumber < 1) epNumber = 1;

                    // 🔒 TRAVA DE SEGURANÇA (Regra de Negócio)
                    if (season !== 1 || epNumber > 3) {
                        alert("Este episódio é exclusivo para assinantes.");
                        navigate(`/details-parceria/${slug}`);
                        return;
                    }

                    // Define dados para a tela
                    setEpisodeData({
                        ...currentEpData,
                        tituloEpisodio: currentEpData.tituloEpisodio || currentEpData.name || `Episódio ${epNumber}`,
                        numeroEpisodio: epNumber,
                        temporada: season,
                        backdrop: backdrop 
                    });

                    // Monta a URL corrigida
                    const generatedUrl = `https://maxplay.vercel.app/embed/anime/${slug}?season=${season}&ep=${epNumber}&autoplay=1`;
                    console.log("Player URL Gerada:", generatedUrl); // Debug
                    setEmbedUrl(generatedUrl);

                    // Busca vizinhos (Anterior/Próximo)
                    await findNeighbors(slug, season, epNumber, source, episodeId);
                } else {
                    console.error("Episódio não encontrado na lista.");
                    setEmbedUrl(null);
                }

            } catch (error) {
                console.error("Erro fatal:", error);
            }
            setLoading(false);
        };

        if (episodeId && slug) fetchEpisodeDetails();
    }, [episodeId, slug, navigate]);

    // --- LÓGICA DE VIZINHOS (NEXT/PREV) ---
    const findNeighbors = async (animeSlug, currentSeason, currentEp, source, currentId) => {
        try {
            let allEps = [];
            if (source === 'firebase') {
                const q = query(collection(db, 'episodes'), where('animeSlug', '==', animeSlug));
                const snap = await getDocs(q);
                allEps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } else {
                let mediaData = await getMediaById('anime', animeSlug);
                if (mediaData?.episodes) {
                    allEps = mediaData.episodes.map(e => ({
                        id: e.id,
                        temporada: e.season_number,
                        numeroEpisodio: e.episode_number
                    }));
                }
            }
            
            // Ordenação Segura
            const cleanEps = allEps.map(ep => ({
                id: ep.id,
                temp: Number(ep.temporada || ep.season_number || 1),
                num: Number(ep.numeroEpisodio || ep.numeroEpisodio || 1)
            })).sort((a, b) => (a.temp - b.temp) || (a.num - b.num));

            // Achar índice atual comparando String
            const idx = cleanEps.findIndex(e => String(e.id) === String(currentId));
            
            // Set Anterior
            setPrevEpId(idx > 0 ? cleanEps[idx - 1].id : null);

            // Set Próximo (Com Lógica de Cadeado)
            if (idx < cleanEps.length - 1) {
                const next = cleanEps[idx + 1];
                // Só libera se for Temp 1 e Ep <= 3
                if (next.temp === 1 && next.num <= 3) {
                    setNextEpId(next.id);
                } else {
                    setNextEpId('LOCKED'); 
                }
            } else {
                setNextEpId(null);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="watch-parceria-container">
            {/* AMBIENT GLOW */}
            {episodeData?.backdrop && (
                <div 
                    className="wp-ambient-glow" 
                    style={{ backgroundImage: `url(${episodeData.backdrop})` }}
                ></div>
            )}

            {/* HEADER */}
            <div className="wp-header">
                <button className="wp-back-btn" onClick={() => navigate(`/MAXPLAY`)}>
                    <FaArrowLeft /> Voltar
                </button>
                {/* <div className="wp-badge-group">
                    <span className="badge-hd">1080p</span>
                    <span className="badge-free">GRÁTIS</span>
                </div> */}
            </div>

            {/* PLAYER SECTION */}
            <section className="wp-player-section">
                <div className="wp-video-container">
                    {loading && (
                        <div className="wp-loader-overlay">
                            <div className="wp-spinner"></div>
                            <p style={{marginTop: '15px', color: '#ccc', fontWeight: 500}}>Carregando Anime...</p>
                        </div>
                    )}

                    {!loading && embedUrl ? (
                        <iframe 
                            src={embedUrl}
                            title="Anime Player"
                            className="wp-iframe"
                            frameBorder="0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    ) : !loading && (
                        <div className="wp-loader-overlay">
                            <FaExclamationTriangle size={40} color="#e74c3c" />
                            <p style={{marginTop: '10px', color: '#fff'}}>Episódio indisponível no momento.</p>
                            <button className="wp-nav-btn" onClick={() => navigate(`/MAXPLAY`)} style={{marginTop:'10px'}}>
                                Voltar para Menu
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* INFO BAR */}
            <section className="wp-info-bar">
                <div className="wp-title-row">
                    <div className="wp-ep-info">
                        <h2>{episodeData ? episodeData.tituloEpisodio : '...'}</h2>
                        <span className="wp-season-tag">
                            <FaTv /> Temporada {episodeData?.temporada} • Episódio {episodeData?.numeroEpisodio}
                        </span>
                    </div>

                    <div className="wp-nav-buttons">
                        <button 
                            className="wp-nav-btn" 
                            disabled={!prevEpId} 
                            onClick={() => prevEpId && navigate(`/watch-parceria/${slug}/${prevEpId}`)}
                        >
                            <FaStepBackward /> Anterior
                        </button>

                        {nextEpId === 'LOCKED' ? (
                            <button className="wp-nav-btn locked-btn" onClick={() => navigate('/login')}>
                                Próximo (Premium) <FaLock />
                            </button>
                        ) : (
                            <button 
                                className="wp-nav-btn" 
                                disabled={!nextEpId} 
                                onClick={() => nextEpId && navigate(`/watch-parceria/${slug}/${nextEpId}`)}
                            >
                                Próximo <FaStepForward />
                            </button>
                        )}
                    </div>
                </div>

                <div className="wp-upsell-banner">
                    <div className="wp-upsell-content">
                        <h4>Experiência MaxPlay</h4>
                        <p>Assista em HD, sem anúncios e libere todos os episódios.</p>
                    </div>
                    <button className="wp-upgrade-btn" onClick={() => navigate('https://maxplay.vercel.app')}>
                        <FaCrown /> LIBERAR TUDO
                    </button>
                </div>
            </section>
        </div>
    );
};

export default WatchParceria;