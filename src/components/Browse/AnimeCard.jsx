import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';

// Função auxiliar para calcular o progresso
const calculateProgress = (history) => {
    if (!history || typeof history.duration !== 'number' || typeof history.currentTime !== 'number' || history.duration <= 0) {
        return 0;
    }
    return (history.currentTime / history.duration) * 100;
};

// --- COMPONENTE AnimeCard ---
const AnimeCard = ({ anime, isPoster = false }) => { 
    const navigate = useNavigate();
    
    // Usa o ID do Firestore (slug)
    const animeSlug = anime.id || (anime.titulo ? anime.titulo.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') : 'unknown');

    const watchHistory = anime.watchHistory || {}; 
    const progressPercent = calculateProgress(watchHistory);
    
    // Consideramos "continuando" se o progresso for entre 1% e 97%
    const isContinuing = progressPercent > 1 && progressPercent < 97; 

    const handleCardClick = () => {
        navigate(`/details/${animeSlug}`);
    };

    // Determina a URL da imagem
    const imageUrl = isPoster ? anime.posterUrl : anime.backdropUrl;

    const fallbackImage = isPoster 
        ? "https://via.placeholder.com/200x300/141414/FFFFFF?text=ToaruFlix+Poster" 
        : "https://via.placeholder.com/300x168/141414/FFFFFF?text=ToaruFlix+Card";

    return (
        <div 
            className={`anime-card-container ${isPoster ? 'poster' : 'standard'}`}
            onClick={handleCardClick}
            role="button"
            aria-label={`Ver detalhes de ${anime.titulo}`}
        >
            <img 
                src={imageUrl || fallbackImage}
                alt={`Capa de ${anime.titulo}`}
                className="anime-card-image"
                loading="lazy"
            />
            
            {/* CONTAINER DE CONTEÚDO INFERIOR COM GRADIENTE E TÍTULO */}
            <div className="card-content-overlay">
                <p className="card-title-text">{anime.titulo}</p>
            </div>
            
            {/* BARRA DE PROGRESSO (Apenas para Continuar Assistindo) */}
            {isContinuing && (
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
            )}
        </div>
    );
};

export default AnimeCard;