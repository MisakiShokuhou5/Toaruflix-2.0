import React, { useState, useEffect, useMemo } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaClock, FaStar, FaRegPlayCircle, FaPlus, FaCheck } from 'react-icons/fa'; 

// ✅ IMPORTAÇÕES DO FIREBASE
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config'; 

// ✅ IMPORTAÇÃO DO DATA SERVICE
import { getMediaById } from '../services/dataService'; 

import Spinner from '../components/shared/Spinner'; 
import '../pages/Details.css'; 

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

            // TENTATIVA 1: BUSCAR NO FIRESTORE
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
            
            // TENTATIVA 2: FALLBACK API EXTERNA
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
    
    // Estado para Minha Lista
    const [isInMyList, setIsInMyList] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    
    // Verifica se está na lista
    useEffect(() => {
        if (!user || !seriesData) return;
        
        const itemRef = doc(db, 'users', user.uid, 'mylist', seriesData.id.toString());
        const unsubscribe = onSnapshot(itemRef, (docSnap) => {
            setIsInMyList(docSnap.exists());
        });

        return () => unsubscribe();
    }, [user, seriesData]);

    // Função para Adicionar/Remover da Lista (CORRIGIDA)
    const handleToggleList = async () => {
        if (!user || !seriesData) return alert("Faça login para salvar na lista.");
        
        setListLoading(true);
        const itemRef = doc(db, 'users', user.uid, 'mylist', seriesData.id.toString());

        try {
            if (isInMyList) {
                await deleteDoc(itemRef);
            } else {
                // ✅ CORREÇÃO AQUI: Previne valores 'undefined'
                const imageToSave = seriesData.poster_path || seriesData.imageUrl || seriesData.backdropUrl || null;
                const titleToSave = seriesData.titulo || seriesData.title || seriesData.name || 'Sem Título';

                await setDoc(itemRef, {
                    id: seriesData.id,
                    title: titleToSave,
                    poster_path: imageToSave, // Garante que nunca seja undefined
                    imageUrl: imageToSave,    // Garante que nunca seja undefined
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
    if (error || !seriesData) return <h1 className="error-message" style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>{error || "Título não encontrado."}</h1>;

    // --- Dados para Renderização ---
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
        <div className="details-wrapper">
            
            {/* HERÓI PRINCIPAL (BACKDROP) */}
            <div className="hero-details" style={{ backgroundImage: `url(${backdropUrl})` }}>
                <div className="hero-gradient-overlay"></div> 
                
                <div className="hero-content">
                    <h1 className="hero-title">{titleDisplayName}</h1>
                    
                    <div className="hero-metadata">
                        <span className="metadata-item">{releaseYear}</span>
                        <span className="metadata-item rating">
                            <FaStar className="rating-star" /> {formatRating(voteAverage)}
                        </span>
                        <span className="metadata-item">
                            <FaClock /> {formatRuntime(runtime)}
                        </span>
                    </div>
                    
                    <div className="hero-actions" style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
                        {/* BOTÃO PLAY */}
                        {isWatchable && currentEpisodes.length > 0 && (
                            <button className="hero-btn play-btn-detail" onClick={() => handleWatch(currentEpisodes[0])}>
                                <FaPlay /> Assistir
                            </button>
                        )}

                        {/* BOTÃO MINHA LISTA */}
                        <button 
                            className={`hero-btn list-btn ${isInMyList ? 'active' : ''}`} 
                            onClick={handleToggleList}
                            disabled={listLoading}
                        >
                            {isInMyList ? <FaCheck /> : <FaPlus />} 
                            {isInMyList ? 'Na Lista' : 'Minha Lista'}
                        </button>
                    </div>

                    <p className="hero-overview">{synopse}</p>
                    
                    {!isWatchable && (
                        <div className="partner-notice-box">
                            <p><strong>Conteúdo de Parceria:</strong> Disponível para consulta. A reprodução é feita no serviço de streaming original.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SEÇÃO DE EPISÓDIOS */}
            {currentEpisodes.length > 0 && (
                <div className="episodes-section">
                    <div className="episodes-header">
                        <h2 className="episodes-title">Episódios</h2>
                        {seasonOptions.length > 1 && (
                            <div className="custom-select-wrapper">
                                <select 
                                    className="season-selector"
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
                        {currentEpisodes.map(ep => (
                            <div 
                                key={ep.id} 
                                className={`episode-card ${isWatchable ? 'watchable' : 'partner-locked'}`} 
                                onClick={() => isWatchable && handleWatch(ep)}
                            >
                                <div className="episode-number">{ep.numeroEpisodio || ep.ep_number}</div>
                                
                                <div className="episode-thumbnail">
                                    <img 
                                        src={ep.stillPathTmdb || ep.still_path 
                                            ? (ep.stillPathTmdb || ep.still_path).startsWith('http') ? (ep.stillPathTmdb || ep.still_path) : `${IMAGE_BASE_URL}w300${(ep.stillPathTmdb || ep.still_path)}`
                                            : seriesData.backdropUrl 
                                            || 'https://via.placeholder.com/250x140/1a1a1a/FFFFFF?text=SEM+IMAGEM'} 
                                        alt={`Episódio ${ep.numeroEpisodio || ep.ep_number}`}
                                    />
                                    {isWatchable && (
                                        <div className="play-overlay">
                                            <FaRegPlayCircle className="play-icon" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="episode-info">
                                    <div className="episode-title-meta">
                                        <h3>{ep.tituloEpisodio || ep.name}</h3>
                                        <span className="runtime">{formatRuntime(ep.runtime || DEFAULT_RUNTIME)}</span>
                                    </div>
                                    <p className="episode-overview">
                                        {ep.descricao || ep.overview ? (ep.descricao || ep.overview).substring(0, 140) + '...' : 'Descrição indisponível.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default Details;