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
import '../pages/Details.css'; 
import '../pages/detailPArceria.css'; 

// --- CONFIGURAÇÃO ---
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; 
const DEFAULT_RUNTIME = 24; 
const MINIMUM_DELAY_MS = 1000; 

// --- FUNÇÕES AUXILIARES ---
const formatRuntime = (minutes) => (minutes && minutes > 0 ? `${minutes} min` : 'N/D');
const formatRating = (rating) => (rating && typeof rating === 'number' ? rating.toFixed(1) : 'N/D');

// --- HOOK DE DADOS (IDÊNTICO AO ORIGINAL) ---
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
                console.warn(`[DetailsParceria] Falha Firestore:`, fbError.message);
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


// --- COMPONENTE PRINCIPAL (ADAPTADO PARA PARCERIA) ---
const DetailsParceria = () => {
    const { slug } = useParams(); 
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;
    
    // Usa o mesmo hook, garantindo consistência de dados
    const { seriesData, groupedEpisodes, loading, error } = useUnifiedMediaDetails(slug);
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

    // Função para Adicionar/Remover da Lista
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
    if (error || !seriesData) return <h1 className="error-message" style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>{error || "Título não encontrado."}</h1>;

    // --- DADOS PARA RENDERIZAÇÃO ---
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
        // 1. Se estiver bloqueado, avisa
        if (isLocked) {
             alert("🔒 Episódio exclusivo para assinantes Premium. Assine para liberar a temporada completa!");
             return;
        }

        // 2. Se estiver livre, vai para a rota de WatchParceria
        const seriesSlug = seriesData.id; 
        navigate(`/watch-parceria/${seriesSlug}/${episode.id}`); 
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
                        <span className="metadata-item quality">HD</span>
                    </div>
                    
                    <div className="hero-actions" style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
                        {/* BOTÃO PLAY - Sempre tenta tocar o ep 1 */}
                        {currentEpisodes.length > 0 && (
                            <button className="hero-btn play-btn-detail" onClick={() => handleWatch(currentEpisodes[0], false)}>
                                <FaPlay /> Assistir Ep. 1
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
                    
                    {/* AVISO DE PARCERIA (Única diferença visual no Hero) */}
                    <div className="partner-notice-box" style={{ 
                        background: 'rgba(46, 204, 113, 0.15)', 
                        borderLeft: '4px solid #2ecc71',
                        padding: '15px',
                        borderRadius: '4px',
                        marginTop: '20px',
                        backdropFilter: 'blur(5px)'
                    }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#e0e0e0' }}>
                            <FaCrown style={{ color: '#f1c40f' }} />
                            <strong>Degustação Gratuita:</strong> Assista aos 3 primeiros episódios da 1ª Temporada.
                        </p>
                    </div>
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
                        {currentEpisodes.map((ep, index) => {
                            // 🔥 LÓGICA DE CADEADO
                            // Grátis se: Temporada for 1 E índice for menor que 3 (0, 1, 2)
                            const isSeasonOne = selectedSeason === 1;
                            const isFree = isSeasonOne && index < 3;
                            const isLocked = !isFree;

                            return (
                                <div 
                                    key={ep.id} 
                                    className={`episode-card ${isLocked ? 'locked-content' : 'watchable'}`} 
                                    onClick={() => handleWatch(ep, isLocked)}
                                    // Adicionamos estilos inline para reforçar o visual de bloqueio sem precisar criar CSS novo
                                    style={{ 
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        opacity: isLocked ? 0.6 : 1,
                                        position: 'relative'
                                    }}
                                >
                                    <div className="episode-number">{ep.numeroEpisodio || ep.ep_number}</div>
                                    
                                    <div className="episode-thumbnail">
                                        <img 
                                            src={ep.stillPathTmdb || ep.still_path 
                                                ? (ep.stillPathTmdb || ep.still_path).startsWith('http') 
                                                    ? (ep.stillPathTmdb || ep.still_path) 
                                                    : `${IMAGE_BASE_URL}w300${(ep.stillPathTmdb || ep.still_path)}`
                                                : seriesData.backdropUrl 
                                                || 'https://via.placeholder.com/250x140/1a1a1a/FFFFFF?text=SEM+IMAGEM'} 
                                            alt={`Episódio ${ep.numeroEpisodio || ep.ep_number}`}
                                            // Se bloqueado, deixa a imagem preto e branco
                                            style={{ filter: isLocked ? 'grayscale(90%)' : 'none' }}
                                        />
                                        
                                        <div className="play-overlay">
                                            {/* Troca o ícone de Play pelo Cadeado se bloqueado */}
                                            {isLocked ? (
                                                <FaLock className="play-icon" style={{color: '#e74c3c'}} />
                                            ) : (
                                                <FaRegPlayCircle className="play-icon" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="episode-info">
                                        <div className="episode-title-meta">
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLocked ? '#999' : 'white' }}>
                                                {ep.tituloEpisodio || ep.name}
                                                {isLocked && <span style={{fontSize:'0.7rem', background:'#e74c3c', padding:'2px 6px', borderRadius:'4px', color:'white'}}>Premium</span>}
                                            </h3>
                                            <span className="runtime">{formatRuntime(ep.runtime || DEFAULT_RUNTIME)}</span>
                                        </div>
                                        <p className="episode-overview">
                                            {ep.descricao || ep.overview ? (ep.descricao || ep.overview).substring(0, 140) + '...' : 'Descrição indisponível.'}
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