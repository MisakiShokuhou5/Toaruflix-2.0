import React, { useState, useEffect, useMemo } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaClock, FaStar, FaRegPlayCircle, FaPlus, FaCheck, FaLock, FaCrown } from 'react-icons/fa'; 

// ✅ IMPORTAÇÕES DO FIREBASE
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config'; 

// ✅ IMPORTAÇÃO DO DATA SERVICE
import { getMediaById } from '../services/dataService'; 

import Spinner from '../components/shared/Spinner'; 
import './detailPArceria.css'; // Importando apenas o CSS desta página

// --- CONFIGURAÇÃO ---
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; 
const DEFAULT_RUNTIME = 24; 
const MINIMUM_DELAY_MS = 1000; 

// --- FUNÇÕES AUXILIARES ---
const formatRuntime = (minutes) => (minutes && minutes > 0 ? `${minutes} min` : 'N/D');
const formatRating = (rating) => (rating && typeof rating === 'number' ? rating.toFixed(1) : 'N/D');

// --- HOOK DE DADOS ---
const useUnifiedMediaDetails = (slug) => {
    const [seriesData, setSeriesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [source, setSource] = useState(null);

    useEffect(() => {
        if (!slug) return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            let foundMedia = null;
            let currentSource = null;

            try {
                const seriesRef = doc(db, 'animes', slug);
                const seriesSnap = await getDoc(seriesRef);
                
                if (seriesSnap.exists()) {
                    const series = { id: seriesSnap.id, ...seriesSnap.data() };
                    const episodesRef = collection(db, 'episodes');
                    const qEpisodes = query(episodesRef, where('animeSlug', '==', slug));
                    const episodesSnap = await getDocs(qEpisodes);
                    const episodesList = episodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    episodesList.sort((a, b) => (a.temporada !== b.temporada) ? a.temporada - b.temporada : a.numeroEpisodio - b.numeroEpisodio);
                    
                    foundMedia = { 
                        ...series, 
                        episodes: episodesList, 
                        voteAverage: series.voteAverage || 8.0, 
                        releaseYear: series.anoLancamento || 'N/D'
                    };
                    currentSource = 'firebase'; 
                }
            } catch (fbError) {
                console.warn(`[DetailsParceria] Falha Firestore:`, fbError.message);
            }
            
            if (!foundMedia) {
                try {
                    let mediaFallback = await getMediaById('series', slug);
                    if (!mediaFallback) mediaFallback = await getMediaById('anime', slug);

                    if (mediaFallback) {
                        foundMedia = {
                            ...mediaFallback,
                            id: mediaFallback.id,
                            titulo: mediaFallback.title || mediaFallback.name,
                            backdropUrl: mediaFallback.backdrop_path ? `${IMAGE_BASE_URL}original${mediaFallback.backdrop_path}` : mediaFallback.backdrop_path,
                            sinopse: mediaFallback.overview || mediaFallback.sinopse,
                            voteAverage: mediaFallback.vote_average || mediaFallback.voteAverage,
                            releaseYear: mediaFallback.first_air_date ? new Date(mediaFallback.first_air_date).getFullYear() : 'N/D',
                        };
                        currentSource = 'apiservice'; 
                    }
                } catch (apiError) {
                      console.error(`[DetailsParceria] Falha API:`, apiError.message);
                }
            }

            if (foundMedia) {
                setSeriesData(foundMedia);
                setSource(currentSource);
            } else {
                setError(`Mídia "${slug}" não encontrada.`);
                setSource(null);
            }
            setLoading(false);
        };

        fetchData();
    }, [slug]);

    const groupedEpisodes = useMemo(() => {
        if (!seriesData || !seriesData.episodes) return {};
        return seriesData.episodes.reduce((acc, ep) => {
            const temp = ep.temporada || ep.season_number || 1; 
            if (!acc[temp]) acc[temp] = [];
            acc[temp].push(ep);
            return acc;
        }, {});
    }, [seriesData]);

    return { seriesData, groupedEpisodes, loading, error, source };
};

// --- COMPONENTE PRINCIPAL ---
const DetailsParceria = () => {
    const { slug } = useParams(); 
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;
    
    const { seriesData, groupedEpisodes, loading, error } = useUnifiedMediaDetails(slug);
    const [selectedSeason, setSelectedSeason] = useState(1); 
    const [minimumDelayPassed, setMinimumDelayPassed] = useState(false);
    
    const [isInMyList, setIsInMyList] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    
    useEffect(() => {
        if (!user || !seriesData) return;
        const itemRef = doc(db, 'users', user.uid, 'mylist', seriesData.id.toString());
        const unsubscribe = onSnapshot(itemRef, (docSnap) => {
            setIsInMyList(docSnap.exists());
        });
        return () => unsubscribe();
    }, [user, seriesData]);

    const handleToggleList = async () => {
        if (!user || !seriesData) return alert("Faça login para salvar na lista.");
        
        setListLoading(true);
        const itemRef = doc(db, 'users', user.uid, 'mylist', seriesData.id.toString());

        try {
            if (isInMyList) {
                await deleteDoc(itemRef);
            } else {
                const imageToSave = seriesData.poster_path || seriesData.imageUrl || seriesData.backdropUrl || null;
                const titleToSave = seriesData.titulo || seriesData.title || seriesData.name || 'Sem Título';

                await setDoc(itemRef, {
                    id: seriesData.id,
                    title: titleToSave,
                    poster_path: imageToSave,
                    imageUrl: imageToSave,
                    type: 'anime', 
                    addedAt: new Date()
                });
            }
        } catch (err) {
            console.error("Erro ao atualizar lista:", err);
            alert("Erro ao salvar: " + err.message);
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && seriesData && Object.keys(groupedEpisodes).length > 0) {
            const availableSeasons = Object.keys(groupedEpisodes).map(Number).sort((a, b) => a - b);
            if (!groupedEpisodes[selectedSeason]) {
                setSelectedSeason(availableSeasons[0] || 1);
            }
        }
    }, [loading, seriesData, groupedEpisodes, selectedSeason]);

    useEffect(() => {
        const timer = setTimeout(() => setMinimumDelayPassed(true), MINIMUM_DELAY_MS); 
        return () => clearTimeout(timer);
    }, []); 

    if (loading || !minimumDelayPassed) return <Spinner />; 
    if (error || !seriesData) return <div className="error-screen-parceria">{error || "Título não encontrado."}</div>;

    const currentEpisodes = groupedEpisodes[selectedSeason] || [];
    const titleDisplayName = seriesData.titulo || seriesData.title || seriesData.name || 'Título Indisponível';
    const backdropPath = seriesData.backdropUrl || seriesData.backdrop_path;
    const backdropUrl = backdropPath?.startsWith('http') ? backdropPath : `${IMAGE_BASE_URL}original${backdropPath}` || 'https://via.placeholder.com/1920x1080/1a1a1a/FFFFFF?text=SEM+BACKDROP';
    const synopse = seriesData.sinopse || seriesData.overview || 'Sinopse não disponível.';
    const voteAverage = seriesData.voteAverage || seriesData.vote_average; 
    const releaseYear = seriesData.releaseYear || (seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : 'N/D');
    const runtime = currentEpisodes[0]?.runtime || seriesData.episode_run_time?.[0] || DEFAULT_RUNTIME; 

    const seasonOptions = Object.keys(groupedEpisodes).map(key => {
        const num = Number(key);
        const tmdbSeason = seriesData.seasons?.find(s => s.season_number === num);
        const name = tmdbSeason?.name || `Temporada ${num}`; 
        return { number: num, name: name, count: groupedEpisodes[num].length };
    });
    
    // --- 🔥 LÓGICA DE ASSISTIR COM TRAVA DE PARCERIA ---
    const handleWatch = (episode, isLocked) => {
        if (isLocked) {
             alert("Episódio exclusivo para assinantes Premium. Assine para liberar a temporada completa!");
             return;
        }
        const seriesSlug = seriesData.id; 
        navigate(`/watch-parceria/${seriesSlug}/${episode.id}`); 
    };
    
    return (
        <div className="details-wrapper-parceria">
            
            {/* HERÓI PRINCIPAL (BACKDROP) */}
            <section className="hero-section-parceria">
                <div 
                    className="hero-background-parceria" 
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                ></div>
                <div className="hero-vignette-bottom-parceria"></div>
                <div className="hero-vignette-side-parceria"></div>
                
                <div className="hero-content-parceria">
                    <h1 className="hero-title-parceria">{titleDisplayName}</h1>
                    
                    <div className="hero-metadata-parceria">
                        <span className="metadata-item-parceria">{releaseYear}</span>
                        <span className="metadata-item-parceria rating-parceria">
                            <FaStar className="rating-star-parceria" /> {formatRating(voteAverage)}
                        </span>
                        <span className="metadata-item-parceria">
                            <FaClock /> {formatRuntime(runtime)}
                        </span>
                        <span className="metadata-badge-parceria">HD</span>
                    </div>
                    
                    <p className="hero-overview-parceria">{synopse}</p>
                    
                    <div className="hero-actions-parceria">
                        {currentEpisodes.length > 0 && (
                            <button className="hero-btn-parceria play-btn-parceria" onClick={() => handleWatch(currentEpisodes[0], false)}>
                                <FaPlay /> Assistir Ep. 1
                            </button>
                        )}

                        <button 
                            className={`hero-btn-parceria list-btn-parceria ${isInMyList ? 'active-parceria' : ''}`} 
                            onClick={handleToggleList}
                            disabled={listLoading}
                        >
                            {isInMyList ? <FaCheck /> : <FaPlus />} 
                            {isInMyList ? 'Na Lista' : 'Minha Lista'}
                        </button>
                    </div>

                    {/* AVISO DE PARCERIA */}
                    <div className="partner-notice-box-parceria">
                        <p className="partner-notice-text-parceria">
                            <FaCrown className="crown-icon-parceria" />
                            <strong>Degustação Gratuita:</strong> Assista aos 3 primeiros episódios da 1ª Temporada.
                        </p>
                    </div>
                </div>
            </section>

            {/* SEÇÃO DE EPISÓDIOS */}
            {currentEpisodes.length > 0 && (
                <div className="episodes-container-parceria">
                    <div className="episodes-header-parceria">
                        <h2 className="episodes-title-parceria">Episódios</h2>
                        {seasonOptions.length > 1 && (
                            <div className="custom-select-wrapper-parceria">
                                <select 
                                    className="season-selector-parceria"
                                    value={selectedSeason} 
                                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                >
                                    {seasonOptions.map(s => (
                                        <option key={s.number} value={s.number}>
                                            {s.name} ({s.count} eps)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="episodes-list-parceria">
                        {currentEpisodes.map((ep, index) => {
                            // LÓGICA DE CADEADO
                            const isSeasonOne = selectedSeason === 1;
                            const isFree = isSeasonOne && index < 3;
                            const isLocked = !isFree;

                            const epImage = ep.stillPathTmdb || ep.still_path 
                                ? (ep.stillPathTmdb || ep.still_path).startsWith('http') ? (ep.stillPathTmdb || ep.still_path) : `${IMAGE_BASE_URL}w300${(ep.stillPathTmdb || ep.still_path)}`
                                : seriesData.backdropUrl || 'https://via.placeholder.com/300x170/1a1a1a/FFFFFF?text=SEM+IMAGEM';

                            return (
                                <div 
                                    key={ep.id} 
                                    className={`episode-card-parceria ${isLocked ? 'locked-content-parceria' : 'watchable-parceria'}`} 
                                    onClick={() => handleWatch(ep, isLocked)}
                                >
                                    <div className="episode-number-parceria">
                                        {ep.numeroEpisodio || ep.ep_number || (index + 1)}
                                    </div>
                                    
                                    <div className="episode-thumbnail-container-parceria">
                                        <img 
                                            src={epImage} 
                                            alt={`Episódio ${ep.numeroEpisodio || ep.ep_number}`}
                                            className="episode-thumbnail-parceria"
                                        />
                                        
                                        <div className="play-overlay-parceria">
                                            {isLocked ? (
                                                <FaLock className="play-icon-parceria lock-icon-parceria" />
                                            ) : (
                                                <FaRegPlayCircle className="play-icon-parceria" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="episode-info-parceria">
                                        <div className="episode-title-meta-parceria">
                                            <h3 className="episode-name-parceria">
                                                {ep.tituloEpisodio || ep.name || `Episódio ${ep.numeroEpisodio || ep.ep_number}`}
                                                {isLocked && <span className="premium-badge-parceria">Premium</span>}
                                            </h3>
                                            <span className="runtime-parceria">{formatRuntime(ep.runtime || DEFAULT_RUNTIME)}</span>
                                        </div>
                                        <p className="episode-overview-parceria">
                                            {ep.descricao || ep.overview ? (ep.descricao || ep.overview).substring(0, 140) + '...' : 'Descrição indisponível no momento.'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default DetailsParceria;