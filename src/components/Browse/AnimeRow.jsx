// ARQUIVO: src/components/Browse/AnimeRow.jsx (VERIFICADO E MANTIDO)
import React from 'react';
import AnimeCard from './AnimeCard';

// Importa os estilos da linha
import './AnimeRow.css'; 

const AnimeRow = ({ title, animes, isLargeRow = false }) => {
    if (!animes || animes.length === 0) return null;

    // LÓGICA DE DETECÇÃO DO FORMATO POSTER:
    // Linhas que incluem o nome específico usam o formato POSTER (vertical).
    const isPosterRow = title.includes("Toaru Majutsu no Index"); 
    const isContinueWatching = title.includes("Continuar Assistindo");
    
    return (
        <div className="row-container">
            <h2 className="anime-row-title">{title}</h2>
            
            <div className="cards-container">
                {animes.map((anime, index) => (
                    <AnimeCard 
                        key={anime.id || index} 
                        anime={anime} 
                        // isPoster é true apenas se for a linha específica E não for Continuar Assistindo
                        isPoster={isPosterRow && !isContinueWatching} 
                    />
                ))}
            </div>
        </div>
    );
};

export default AnimeRow;