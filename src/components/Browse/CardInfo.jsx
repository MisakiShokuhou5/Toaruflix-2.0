import React from 'react';
import styled from 'styled-components';
import { FaPlay, FaPlus, FaInfo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// --- TEMA STARLINK MINIMALISTA ---
const THEME = {
    bgDark: '#000000',
    textPrimary: '#ffffff',
    textMuted: '#888888',
    border: '#333333',
    fontMain: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
};

// ============================================================================
// STYLED COMPONENTS (Lógica de Desktop apenas)
// ============================================================================

const InfoWrapper = styled.div`
    /* Esconde completamente no Mobile */
    display: none;

    /* Só ativa em monitores (Desktop/Notebook) */
    @media (min-width: 769px) {
        display: flex;
        flex-direction: column;
        background-color: ${THEME.bgDark};
        border: 1px solid ${THEME.border};
        border-top: none;
        padding: 16px;
        
        /* Oculto por padrão, revelado via CSS do elemento pai no AnimeCard */
        opacity: 0;
        visibility: hidden;
        position: absolute;
        top: 100%; 
        left: 0;
        width: 100%;
        box-sizing: border-box;
        box-shadow: 0 20px 40px rgba(0,0,0,0.9);
        transition: opacity 0.3s ease, visibility 0.3s ease;
        z-index: 20;
    }
`;

const ActionRow = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
`;

const IconButton = styled.button`
    background-color: ${props => props.$primary ? THEME.textPrimary : 'transparent'};
    color: ${props => props.$primary ? THEME.bgDark : THEME.textPrimary};
    border: 1px solid ${props => props.$primary ? THEME.textPrimary : THEME.textMuted};
    border-radius: 0; /* Starlink style: cantos retos */
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
        background-color: ${props => props.$primary ? 'transparent' : THEME.textPrimary};
        color: ${props => props.$primary ? THEME.textPrimary : THEME.bgDark};
        border-color: ${THEME.textPrimary};
    }
`;

const MetaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: ${THEME.fontMono};
    font-size: 0.75rem;
    margin-bottom: 10px;
`;

const MatchText = styled.span`
    color: #4ade80; /* Verde matrix suave */
    font-weight: 700;
`;

const AgeTag = styled.span`
    border: 1px solid ${THEME.textMuted};
    padding: 2px 6px;
    color: ${THEME.textPrimary};
`;

const DurationText = styled.span`
    color: ${THEME.textMuted};
`;

const TagsRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-family: ${THEME.fontMain};
    font-size: 0.8rem;
    color: ${THEME.textPrimary};
    
    span {
        &::after {
            content: '•';
            color: ${THEME.textMuted};
            margin-left: 6px;
        }
        &:last-child::after {
            content: '';
        }
    }
`;

// ============================================================================
// COMPONENTE CARD INFO
// ============================================================================

const CardInfo = ({ anime, animeSlug }) => {
    const navigate = useNavigate();

    const handlePlayClick = (e) => {
        e.stopPropagation(); // Impede que o clique dispare o click do card inteiro
        navigate(`/player/${animeSlug}`); // Adapte para a sua rota de player
    };

    const handleInfoClick = (e) => {
        e.stopPropagation();
        navigate(`/details/${animeSlug}`);
    };

    // Fallbacks para dados que talvez não existam no seu JSON ainda
    const year = anime.ano || '2024';
    const ageRating = anime.classificacao || '14+';
    const duration = anime.duracao || '24m';
    const tags = anime.generos ? anime.generos.slice(0, 3) : ['Ação', 'Ficção'];

    return (
        <InfoWrapper className="starlink-card-info">
            <ActionRow>
                <IconButton $primary onClick={handlePlayClick} title="Assistir">
                    <FaPlay style={{ marginLeft: '3px' }} /> 
                </IconButton>
                <IconButton onClick={(e) => { e.stopPropagation(); console.log("Adicionado à lista"); }} title="Adicionar à Lista">
                    <FaPlus />
                </IconButton>
                <div style={{ flexGrow: 1 }} /> {/* Espaçador para jogar o botão info pra direita */}
                <IconButton onClick={handleInfoClick} title="Mais Informações">
                    <FaInfo />
                </IconButton>
            </ActionRow>

            <MetaRow>
                <MatchText>98% Match</MatchText>
                <AgeTag>{ageRating}</AgeTag>
                <DurationText>{year}</DurationText>
                <DurationText>{duration}</DurationText>
            </MetaRow>

            <TagsRow>
                {tags.map((tag, index) => (
                    <span key={index}>{tag}</span>
                ))}
            </TagsRow>
        </InfoWrapper>
    );
};

export default CardInfo;