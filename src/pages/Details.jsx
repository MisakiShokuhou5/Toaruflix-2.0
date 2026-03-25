import React, { useState, useEffect, useMemo } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaClock, FaStar, FaRegPlayCircle, FaPlus, FaCheck, FaInfoCircle } from 'react-icons/fa'; 

// IMPORTAÇÕES DO FIREBASE
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config'; 

// IMPORTAÇÃO DO DATA SERVICE
import { getMediaById } from '../services/dataService'; 

import Spinner from '../components/shared/Spinner'; 
import './Details.css'; // SEU NOVO ARQUIVO CSS AQUI

// --- CONFIGURAÇÃO ---
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; 
const DEFAULT_RUNTIME = 24; 
const MINIMUM_DELAY_MS = 1000; 

// --- FUNÇÕES AUXILIARES ---
const formatRuntime = (minutes) => (minutes && minutes > 0 ? `${minutes} min` : 'N/D');
const formatRating = (rating) => (rating && typeof rating === 'number' ? rating.toFixed(1) : 'N/D');

// --- HOOK DE DADOS (Mantido Intacto) ---
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
                console.warn(`[Details] Falha Firestore:`, fbError.message);
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
                     console.error(`[Details] Falha API:`, apiError.message);
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
const Details = () => {
    const { slug } = useParams(); 
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;
    
    const { seriesData, groupedEpisodes, loading, error, source } = useUnifiedMediaDetails(slug);
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
    if (error || !seriesData) return <div className="details-error-screen">{error || "Título não encontrado."}</div>;

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
    
    const isWatchable = source === 'firebase';

    const handleWatch = (episode) => {
        if (!isWatchable) return; 
        const seriesSlug = seriesData.id; 
        navigate(`/watch/${seriesSlug}/${episode.id}`); 
    };
    
    return (
        <div className="details-page">
            
            {/* 1. HERO / CAPA PRINCIPAL */}
            <section className="details-hero">
                <div 
                    className="hero-background" 
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                ></div>
                <div className="hero-vignette-bottom"></div>
                <div className="hero-vignette-side"></div>
                
                <div className="hero-content">
                    <h1 className="hero-title">{titleDisplayName}</h1>
                    
                    <div className="hero-meta">
                        <span className="meta-year">{releaseYear}</span>
                        <span className="meta-rating">
                            <FaStar className="icon-star" /> {formatRating(voteAverage)}
                        </span>
                        <span className="meta-duration">
                            {seasonOptions.length > 0 ? `${seasonOptions.length} Temporada(s)` : formatRuntime(runtime)}
                        </span>
                        <span className="meta-badge">HD</span>
                    </div>
                    
                    <p className="hero-synopsis">{synopse}</p>
                    
                    <div className="hero-buttons">
                        {isWatchable && currentEpisodes.length > 0 && (
                            <button 
                                className="btn-primary" 
                                onClick={() => handleWatch(currentEpisodes[0])}
                            >
                                <FaPlay /> Assistir
                            </button>
                        )}

                        <button 
                            className={`btn-secondary ${isInMyList ? 'in-list' : ''}`} 
                            onClick={handleToggleList}
                            disabled={listLoading}
                        >
                            {isInMyList ? <FaCheck /> : <FaPlus />} 
                            {isInMyList ? 'Na Lista' : 'Minha Lista'}
                        </button>
                    </div>

                    {!isWatchable && (
                        <div className="partner-notice">
                            <FaInfoCircle className="icon-info" />
                            <p><strong>Conteúdo de Parceria:</strong> Disponível no serviço original.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CONTAINER CENTRALIZADO PARA O CONTEÚDO INFERIOR */}
            <div className="details-container">
                
                {/* 3. ÁREA DE INFORMAÇÕES DETALHADAS */}
                <section className="info-section">
                    <div className="info-main">
                        <h3>Sinopse Completa</h3>
                        <p>{synopse}</p>
                    </div>
                    <div className="info-sidebar">
                        <div className="info-block">
                            <span>Elenco Principal:</span>
                            <p>N/D (Adicione dados da API aqui)</p>
                        </div>
                        <div className="info-block">
                            <span>Gêneros:</span>
                            <p>{seriesData.genres ? seriesData.genres.map(g => g.name).join(', ') : 'N/D'}</p>
                        </div>
                        <div className="info-block">
                            <span>Status:</span>
                            <p>{seriesData.status || 'Finalizado'}</p>
                        </div>
                    </div>
                </section>

                {/* 4. SEÇÃO DE EPISÓDIOS */}
                {currentEpisodes.length > 0 && (
                    <section className="episodes-section">
                        <div className="episodes-header">
                            <h2>Episódios</h2>
                            
                            {seasonOptions.length > 1 && (
                                <div className="season-select-wrapper">
                                    <select 
                                        className="season-select"
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

                        <div className="episodes-list">
                            {currentEpisodes.map((ep, index) => {
                                const epImage = ep.stillPathTmdb || ep.still_path 
                                    ? (ep.stillPathTmdb || ep.still_path).startsWith('http') ? (ep.stillPathTmdb || ep.still_path) : `${IMAGE_BASE_URL}w300${(ep.stillPathTmdb || ep.still_path)}`
                                    : seriesData.backdropUrl || 'https://via.placeholder.com/300x170/1a1a1a/FFFFFF?text=Sem+Imagem';

                                return (
                                    <div 
                                        key={ep.id} 
                                        onClick={() => isWatchable && handleWatch(ep)}
                                        className={`episode-card ${isWatchable ? 'watchable' : 'locked'}`}
                                    >
                                        <div className="episode-number">
                                            {ep.numeroEpisodio || ep.ep_number || (index + 1)}
                                        </div>
                                        
                                        <div className="episode-thumb-container">
                                            <img 
                                                src={epImage} 
                                                alt={`Episódio ${ep.numeroEpisodio || ep.ep_number}`}
                                                className="episode-thumb"
                                            />
                                            {isWatchable && (
                                                <div className="episode-play-overlay">
                                                    <FaRegPlayCircle className="icon-play-overlay" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="episode-details">
                                            <div className="episode-title-row">
                                                <h3 className="episode-title">
                                                    {ep.tituloEpisodio || ep.name || `Episódio ${ep.numeroEpisodio || ep.ep_number}`}
                                                </h3>
                                                <span className="episode-runtime">
                                                    {formatRuntime(ep.runtime || DEFAULT_RUNTIME)}
                                                </span>
                                            </div>
                                            <p className="episode-desc">
                                                {ep.descricao || ep.overview || 'Nenhuma descrição disponível para este episódio no momento.'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 5. SEÇÃO "MAIS COMO ISSO" (Placeholder Visual) */}
                <section className="similar-section">
                    <h2>Títulos Semelhantes</h2>
                    <div className="similar-grid">
                        {[1, 2, 3, 4, 5, 6].map(item => (
                            <div key={item} className="similar-card">
                                <img 
                                    src={`https://via.placeholder.com/300x450/111111/333333?text=Recomendado`} 
                                    alt="Recomendado" 
                                />
                                <div className="similar-overlay">
                                    <FaRegPlayCircle className="icon-play-similar" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Details;