import React, { useRef, useState, useEffect } from 'react';
import AnimeCard from './AnimeCard';
import './AnimeRow.css'; 

const AnimeRow = ({ title, animes }) => {
    const cardsContainerRef = useRef(null);
    
    // Inicie com a seta direita visível para garantir (se houver animes)
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(animes && animes.length > 0);

    if (!animes || animes.length === 0) return null;

    const checkScrollPosition = () => {
        if (cardsContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = cardsContainerRef.current;
            
            setShowLeftArrow(scrollLeft > 5);
            // Tolerância maior (10px) para compensar arredondamentos de tela
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (cardsContainerRef.current) {
            const container = cardsContainerRef.current;
            const containerWidth = container.clientWidth;
            const scrollAmount = containerWidth * 0.8; 
            const scrollTo = direction === 'left' ? -scrollAmount : scrollAmount;

            container.scrollBy({ left: scrollTo, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const container = cardsContainerRef.current;
        if (!container) return;

        // Verifica a posição inicial
        checkScrollPosition();
        
        // Timeout para garantir que recheque após o render inicial
        const initialCheck = setTimeout(checkScrollPosition, 800);

        container.addEventListener('scroll', checkScrollPosition);
        window.addEventListener('resize', checkScrollPosition);

        // Usar ResizeObserver garante que se os cards mudarem de tamanho, as setas atualizam
        const resizeObserver = new ResizeObserver(() => checkScrollPosition());
        resizeObserver.observe(container);

        return () => {
            clearTimeout(initialCheck);
            container.removeEventListener('scroll', checkScrollPosition);
            window.removeEventListener('resize', checkScrollPosition);
            resizeObserver.disconnect();
        };
    }, [animes]);

    return (
        <div className="row-container">
            <h2 className="anime-row-title">{title}</h2>
            
            <div className="row-relative-wrapper">
                <button 
                    className={`sl-nav-arrow left ${showLeftArrow ? 'visible' : 'disabled'}`} 
                    onClick={() => scroll('left')}
                    aria-label="Rolar para esquerda"
                >
                    <div className="sl-chevron"></div>
                </button>

                <div className="cards-container" ref={cardsContainerRef}>
                    {animes.map((anime, index) => (
                        <AnimeCard 
                            key={anime.id || index} 
                            anime={anime} 
                        />
                    ))}
                </div>

                <button 
                    className={`sl-nav-arrow right ${showRightArrow ? 'visible' : 'disabled'}`} 
                    onClick={() => scroll('right')}
                    aria-label="Rolar para direita"
                >
                    <div className="sl-chevron"></div>
                </button>
            </div>
        </div>
    );
};

export default AnimeRow;