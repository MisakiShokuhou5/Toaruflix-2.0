import React from 'react';
import { useNavigate } from 'react-router-dom';

const calculateProgress = (history) => {
    if (!history || typeof history.duration !== 'number' || typeof history.currentTime !== 'number' || history.duration <= 0) {
        return 0;
    }
    return (history.currentTime / history.duration) * 100;
};

const AnimeCard = ({ anime }) => { 
    const navigate = useNavigate();
    
    const animeSlug = anime.id || (anime.titulo ? anime.titulo.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') : 'unknown');

    const watchHistory = anime.watchHistory || {}; 
    const progressPercent = calculateProgress(watchHistory);
    const isContinuing = progressPercent > 1 && progressPercent < 97; 

    const handleCardClick = () => {
        navigate(`/details/${animeSlug}`);
    };

    const fallbackPoster = "https://via.placeholder.com/200x300/141414/FFFFFF?text=Poster";
    const fallbackBackdrop = "https://via.placeholder.com/300x168/141414/FFFFFF?text=Backdrop";

    return (
        <div 
            className="anime-card-container"
            onClick={handleCardClick}
            role="button"
            aria-label={`Ver detalhes de ${anime.titulo}`}
        >
            <picture>
                {/* 1. SE FOR CELULAR (até 768px), usa o Poster (Vertical) */}
                <source media="(max-width: 768px)" srcSet={anime.posterUrl || fallbackPoster} />
                
                {/* 2. PADRÃO/COMPUTADOR, usa o Backdrop (Horizontal) */}
                <img 
                    src={anime.backdropUrl || fallbackBackdrop}
                    alt={`Capa de ${anime.titulo}`}
                    className="anime-card-image"
                    loading="lazy"
                />
            </picture>
            
            <div className="card-content-overlay">
                <p className="card-title-text">{anime.titulo}</p>
            </div>
            
            {isContinuing && (
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
            )}
        </div>
    );
};

export default AnimeCard;