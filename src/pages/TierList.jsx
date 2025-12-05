// ARQUIVO: src/pages/TierList.jsx
// VERSÃO FINAL: Correção do Bug de Imagem (CORS) + Limites + Múltiplos Arcos.

// --- IMPORTS ---
import React, { useState, useRef, useMemo, useEffect, useReducer } from 'react'; 
import styled, { createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas'; 
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
import { FaCog, FaTrash, FaArrowUp, FaArrowDown, FaUndo, FaPlus, FaImage, FaList, FaThList, FaSearch, FaFilter, FaExclamationTriangle } from 'react-icons/fa';

// --- CONFIGURAÇÃO ---
const MAX_TIER_SIZE = 15; // Limite de personagens por Tier

const COLORS = {
    primary: '#e50914', 
    secondary: '#b80000',
    darkBg: '#000000ff', 
    tierBg: '#1e1e1e', 
    poolBg: '#181818', 
    textLight: '#ffffff',
    textMuted: '#999999', 
    tierLabelText: '#000000', 
    warning: '#f39c12', // Laranja para avisos
};

// --- GLOBAL STYLES ---
const GlobalStyle = createGlobalStyle`
    body {
        font-family: 'Inter', sans-serif;
    }
`;

// --- STYLED COMPONENTS ---

const TierListContainer = styled.div`
    background: ${COLORS.darkBg};
    color: ${COLORS.textLight};
    padding-bottom: 4rem; 
    min-height: 100vh;
    z-index: 3;
`;

const ControlsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 4rem;
    flex-wrap: wrap;
    gap: 1.5rem;
    border-bottom: 1px solid #333;
    background-color: ${COLORS.darkBg};
    position: sticky;
    top: 68px;
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.7);
`;

const ControlGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
`;

const CharacterPoolContainer = styled.div`
    padding: 2rem 4rem;
    background-color: ${COLORS.darkBg};
    margin: 2rem 4rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

const TierRowContainer = styled(motion.div)`
    display: flex;
    align-items: stretch;
    min-height: ${props => props.$mode === 'list' ? '65px' : '120px'}; 
    background-color: ${COLORS.tierBg};
    margin: 6px 4rem; 
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.4);
    transition: all 0.2s;
    &:hover {
        border-color: ${COLORS.primary};
        box-shadow: 0 2px 15px ${COLORS.primary}40;
    }
    &:hover .tier-actions {
        opacity: 1;
        transform: translateX(0);
    }
`;

const TierLabel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${props => props.$mode === 'list' ? '250px' : '140px'}; 
    word-break: break-word; 
    padding: 5px 5px; 
    box-sizing: border-box; 
    background-color: ${props => props.color || '#333'};
    color: ${props => props.color === '#ffffff' ? COLORS.tierLabelText : COLORS.textLight}; 
    font-size: ${props => props.$mode === 'list' ? '1.3rem' : '2.5rem'}; 
    font-weight: ${props => props.$mode === 'list' ? '700' : '800'};
    text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
    flex-shrink: 0;
    border-right: 2px solid rgba(0,0,0,0.3);
    text-align: center;
    text-transform: uppercase; 
`;

const DropZone = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: ${props => props.$mode === 'list' ? 'column' : 'row'};
    flex-wrap: ${props => props.$mode === 'list' ? 'nowrap' : 'wrap'};
    align-content: flex-start;
    padding: 10px;
    background-color: ${props => props.$isOver ? `${COLORS.primary}33` : 'transparent'};
    transition: background-color 0.2s ease-in-out;
    min-height: ${props => props.$mode === 'list' ? '65px' : '120px'};
`;

const TierActions = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #111;
    padding: 0 10px;
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(100%);
    transition: opacity 0.3s, transform 0.3s;
    button {
        background: none; border: none; color: ${COLORS.textMuted};
        cursor: pointer; font-size: 1.2rem; padding: 10px;
        transition: color 0.2s, transform 0.2s;
        &:hover { color: ${COLORS.primary}; transform: scale(1.1); }
        &:disabled { color: #444; cursor: not-allowed; transform: scale(1); }
    }
`;

const CharacterPool = styled(DropZone)`
    min-height: 150px;
    background-color: black;
    border-radius: 8px;
    flex-direction: row; 
    flex-wrap: wrap;
`;

const ListItemWrapper = styled(motion.div)`
    display: flex;
    align-items: center;
    padding: 10px 0; 
    margin: 2px 0;
    border-bottom: 1px dashed #333;
    width: 100%;
    cursor: grab;
    transition: background-color 0.1s;
    &:hover {
        background-color: #2a2a2a;
    }
    &:last-child {
        border-bottom: none;
    }
    
    .list-thumbnail {
        width: 45px; 
        height: 45px;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 20px; 
        flex-shrink: 0;
        border: 2px solid ${props => props.$gender === 'Feminino' ? '#e91e63' : (props.$gender === 'Masculino' ? '#2196f3' : COLORS.textMuted)};
    }

    .list-info {
        flex-grow: 1;
        font-size: 1.2rem; 
        font-weight: 600; 
        color: ${COLORS.textLight};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;


const CharacterItemStyled = styled(motion.div)`
    width: 100px;
    height: 100px;
    margin: 5px;
    cursor: grab;
    position: relative;
    overflow: hidden;
    border: 1px solid ${props => props.$gender === 'Feminino' ? '#e91e63' : (props.$gender === 'Masculino' ? '#2196f3' : COLORS.textMuted)};
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
    
    &:hover > div {
        opacity: 0; 
        visibility: hidden;
    }

    &:active {
        cursor: grabbing;
        transform: scale(1.05);
        box-shadow: 0 6px 20px ${COLORS.primary}80;
    }
    img {
        width: 100%; height: 100%;
        object-fit: cover; pointer-events: none;
    }
`;

const CharacterTooltip = styled.div`
    position: absolute;
    bottom: 0; left: 0;
    width: 100%;
    background-color: ${COLORS.darkBg}d0;
    backdrop-filter: blur(3px);
    color: ${COLORS.textLight};
    padding: 8px;
    transition: opacity 0.2s, visibility 0.2s;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    h4 { margin: 0 0 4px 0; font-size: 12px; font-weight: bold; }
    p { margin: 0; font-size: 10px; color: ${COLORS.textMuted}; }
`;

const ControlButton = styled(motion.button)`
    background-color: ${COLORS.primary};
    color: white; border: none;
    padding: 10px 15px; border-radius: 5px;
    cursor: pointer; font-weight: bold;
    display: flex; align-items: center; gap: 0.5rem;
    transition: background-color 0.2s, transform 0.1s;
    &:hover { background-color: ${COLORS.secondary}; }
`;

const ModeButton = styled(ControlButton)`
    background-color: ${props => props.$active ? COLORS.primary : COLORS.tierBg};
    color: ${props => props.$active ? COLORS.textLight : COLORS.textMuted};
    border: 1px solid ${props => props.$active ? 'transparent' : '#333'};
    &:hover { background-color: ${props => props.$active ? COLORS.secondary : '#333333'}; }
`;

const SearchInput = styled.input`
    padding: 10px;
    background-color: ${COLORS.tierBg};
    border: 1px solid ${COLORS.textMuted}50;
    color: ${COLORS.textLight}; border-radius: 5px;
    font-size: 1rem; flex-grow: 1; min-width: 200px;
    &:focus {
        border-color: ${COLORS.primary};
        outline: none;
    }
`;

const FilterButtonGroup = styled.div`
    display: flex;
    background-color: ${COLORS.tierBg};
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid #333;
`;

const FilterButton = styled.button`
    padding: 10px 15px;
    border: none;
    background-color: ${props => props.$active ? COLORS.primary : 'transparent'};
    color: ${props => props.$active ? COLORS.textLight : COLORS.textMuted};
    cursor: pointer; font-weight: 600;
    transition: background-color 0.2s;
    &:not(:last-child) {
        border-right: 1px solid #333;
    }
    &:hover:not([disabled]):not([$active]) {
        background-color: #2a2a2a;
    }
`;

const ModalOverlay = styled(motion.div)`
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000;
`;

const ModalContent = styled(motion.div)`
    background-color: ${COLORS.tierBg}; padding: 2rem;
    border-radius: 8px; display: flex;
    flex-direction: column; gap: 1rem; min-width: 350px;
    max-height: 80vh;
    overflow-y: auto;
    border-top: 4px solid ${COLORS.primary};
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8);
`;

const ModalTitle = styled.h2` margin: 0; text-align: center; color: ${COLORS.textLight}; `;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 0.5rem;
    label { font-weight: bold; color: ${COLORS.textMuted}; }
    input {
        padding: 10px; border-radius: 4px; border: 1px solid #555;
        background-color: #333; color: #fff;
    }
    input[type="color"] { padding: 0; height: 40px; cursor: pointer; }
`;

const ModalActions = styled.div` display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; `;

const LimitWarning = styled(motion.div)`
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${COLORS.warning};
    color: ${COLORS.tierLabelText};
    padding: 15px 30px;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    z-index: 60;
    display: flex;
    align-items: center;
    gap: 10px;
`;


// --- REDUCER ---
const initialTierState = { tiers: [] };

function tierListReducer(state, action) {
    switch (action.type) {
        case 'SET_TIERS':
            return { ...state, tiers: action.payload };

        case 'DRAG_AND_DROP': {
            const { character, originId, targetId } = action.payload;
            if (originId === targetId) return state;

            const newTiers = state.tiers.map(t => ({
                ...t,
                characters: [...t.characters]
            }));

            // 1. Remove da origem
            if (originId !== 'pool') {
                const originTier = newTiers.find(t => t.id === originId);
                if (originTier) {
                    originTier.characters = originTier.characters.filter(c => c.id !== character.id);
                }
            }

            // 2. Adiciona ao destino
            if (targetId !== 'pool') {
                const targetTier = newTiers.find(t => t.id === targetId);
                if (targetTier) {
                    if (!targetTier.characters.some(c => c.id === character.id)) {
                        targetTier.characters.push(character);
                    }
                }
            }
            
            return { ...state, tiers: newTiers };
        }
        
        case 'ADD_TIER':
            const newTier = { id: Date.now(), title: 'NOVO', color: '#8a8a8a', characters: [] };
            return { ...state, tiers: [...state.tiers, newTier] };
        
        case 'UPDATE_TIER':
            return { ...state, tiers: state.tiers.map(t => t.id === action.payload.id ? action.payload : t) };
        
        case 'REMOVE_TIER':
            return { ...state, tiers: state.tiers.filter(t => t.id !== action.payload.id) };
        
        case 'MOVE_TIER': {
            const { tierId, direction } = action.payload;
            const index = state.tiers.findIndex(t => t.id === tierId);
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= state.tiers.length) return state;
            const newTiers = [...state.tiers];
            [newTiers[index], newTiers[newIndex]] = [newTiers[newIndex], newTiers[index]];
            return { ...state, tiers: newTiers };
        }
        
        case 'RESET_TIERS':
            return { ...state, tiers: state.tiers.map(tier => ({ ...tier, characters: [] })) };
        
        default:
            throw new Error(`Ação desconhecida: ${action.type}`);
    }
}

// --- ITEM COMPONENT (CORRIGIDO PARA CORS) ---

const ListCharacterItem = React.memo(({ character, originId, onDragStart }) => (
    <ListItemWrapper
        layoutId={character.id}
        $gender={character.gender}
        title={character.name}
        draggable
        onDragStart={(e) => onDragStart(e, character, originId)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }} >
        
        <div className="list-thumbnail">
            {/* CORREÇÃO AQUI: crossOrigin="anonymous" */}
            <img 
                src={character.imageUrl} 
                alt={character.name} 
                crossOrigin="anonymous" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
        </div>
        
        <div className="list-info">
            {character.name} 
        </div>

        <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, flexShrink: 0, marginLeft: '10px' }}>
            {character.gender || 'N/A'}
        </div>
    </ListItemWrapper>
));

// --- MODALS ---

const TierSettingsModal = ({ tier, onSave, onDelete, onClose }) => {
    const [title, setTitle] = useState(tier.title);
    const [color, setColor] = useState(tier.color);
    const handleSave = () => onSave({ ...tier, title, color });

    return (
        <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <ModalContent initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <ModalTitle>Editar Tier</ModalTitle>
                <InputGroup> <label>Nome do Tier</label> <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /> </InputGroup>
                <InputGroup> <label>Cor</label> <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /> </InputGroup>
                <ModalActions>
                    <ControlButton onClick={() => onDelete(tier.id)} style={{backgroundColor: '#e74c3c'}} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> <FaTrash /> Remover </ControlButton>
                    <ControlButton onClick={handleSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Salvar</ControlButton>
                </ModalActions>
            </ModalContent>
        </ModalOverlay>
    );
};

const ArcSelectorModal = ({ arcs, onSelect, onClose, selectedArc }) => {
    const [localSearch, setLocalSearch] = useState('');
    
    const filteredArcs = arcs.filter(arc => arc.toLowerCase().includes(localSearch.toLowerCase()));

    return (
        <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <ModalContent initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <ModalTitle>Filtrar por Arco</ModalTitle>
                <SearchInput type="text" placeholder="Buscar Arcos..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ModeButton onClick={() => onSelect('All')} $active={selectedArc === 'All'}>Todos os Arcos</ModeButton>
                    {filteredArcs.map(arc => ( 
                        <ModeButton key={arc} onClick={() => onSelect(arc)} $active={selectedArc === arc}>
                            {arc}
                        </ModeButton> 
                    ))}
                </div>
                <ControlButton onClick={onClose} style={{backgroundColor: '#555'}}>Fechar</ControlButton>
            </ModalContent>
        </ModalOverlay>
    );
};

const CharacterItem = React.memo(({ character, originId, onDragStart }) => (
    <CharacterItemStyled
        layoutId={character.id}
        $gender={character.gender}
        title={character.name}
        draggable
        onDragStart={(e) => onDragStart(e, character, originId)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }} >
        {/* CORREÇÃO AQUI: crossOrigin="anonymous" */}
        <img src={character.imageUrl} alt={character.name} crossOrigin="anonymous" />
        <CharacterTooltip> <h4>{character.name}</h4> <p>Gênero: {character.gender || 'N/A'}</p> </CharacterTooltip> 
    </CharacterItemStyled>
));


// --- COMPONENTE PRINCIPAL ---
const TierList = () => {
    const [state, dispatch] = useReducer(tierListReducer, initialTierState);
    const { tiers } = state;
    
    const [allCharacters, setAllCharacters] = useState([]);

    const [mode, setMode] = useState('tier');
    const [loading, setLoading] = useState(true);
    const [dragOverTier, setDragOverTier] = useState(null);
    const [editingTier, setEditingTier] = useState(null);
    const [showSpoilers, setShowSpoilers] = useState(false);
    const [selectedArc, setSelectedArc] = useState('All');
    const [isArcModalOpen, setArcModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [warningMessage, setWarningMessage] = useState(null);
    
    const tierListRef = useRef(null);

    useEffect(() => {
        if (warningMessage) {
            const timer = setTimeout(() => setWarningMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [warningMessage]);

    const defaultTiers = useMemo(() => ({
        tier: [
            { id: 1, title: 'S', color: '#e50914', characters: [] }, 
            { id: 2, title: 'A', color: '#ffb366', characters: [] },
            { id: 3, title: 'B', color: '#ffdb66', characters: [] }, 
            { id: 4, title: 'C', color: '#66ff99', characters: [] },
            { id: 5, title: 'D', color: '#66c2ff', characters: [] },
        ],
        list: [
            { id: 7, title: 'LEVEL 5', color: '#4b0082', characters: [] }, 
            { id: 8, title: 'SKILL-OUT', color: '#3f78cc', characters: [] },
            { id: 9, title: 'MÁGICO', color: '#34c759', characters: [] },
        ]
    }), []);

    // Fetch Characters
    useEffect(() => {
        const q = query(collection(db, 'characters'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const charactersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAllCharacters(charactersData);
            dispatch({ type: 'SET_TIERS', payload: defaultTiers.tier });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [defaultTiers.tier]);

    // Lógica de Filtros
    const unplacedCharacters = useMemo(() => {
        const placedCharacterIds = new Set(tiers.flatMap(tier => tier.characters.map(c => c.id)));
        return allCharacters.filter(c => !placedCharacterIds.has(c.id));
    }, [tiers, allCharacters]);

    const filteredPool = useMemo(() => {
        return unplacedCharacters.filter(c => {
            if (!showSpoilers && c.isSpoiler) return false;
            if (genderFilter !== 'All' && c.gender !== genderFilter) return false;
            if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            // Lógica de filtro de Arco (suporta Array e String)
            if (selectedArc !== 'All') {
                const hasArrayArc = Array.isArray(c.arcs) && c.arcs.includes(selectedArc);
                const hasStringArc = c.arc === selectedArc;
                if (!hasArrayArc && !hasStringArc) return false;
            }

            return true;
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [unplacedCharacters, showSpoilers, selectedArc, genderFilter, searchTerm]);

    const allArcs = useMemo(() => {
        if (allCharacters.length === 0) return [];
        const arcsSet = new Set();
        allCharacters.forEach(c => {
            if (Array.isArray(c.arcs)) c.arcs.forEach(a => arcsSet.add(a));
            if (c.arc) arcsSet.add(c.arc);
        });
        return Array.from(arcsSet).sort();
    }, [allCharacters]);

    const handleDragStart = (e, character, originId) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        e.dataTransfer.setData('character', JSON.stringify(character));
        e.dataTransfer.setData('originId', originId.toString());
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        setDragOverTier(null);
        
        const character = JSON.parse(e.dataTransfer.getData('character'));
        const originId = e.dataTransfer.getData('originId') === 'pool' ? 'pool' : Number(e.dataTransfer.getData('originId'));
        const numericTargetId = targetId === 'pool' ? 'pool' : Number(targetId);

        if (numericTargetId !== 'pool') {
            const targetTier = tiers.find(t => t.id === numericTargetId);
            if (targetTier && targetTier.characters.length >= MAX_TIER_SIZE && originId === 'pool') {
                setWarningMessage(`A Tier "${targetTier.title}" atingiu o limite de ${MAX_TIER_SIZE} personagens!`);
                return; 
            }
        }
        
        dispatch({ type: 'DRAG_AND_DROP', payload: { character, originId, targetId: numericTargetId } });
    };

    const handleSwitchMode = (newMode) => {
        if (mode === newMode) return;
        setMode(newMode);
        dispatch({ type: 'SET_TIERS', payload: defaultTiers[newMode] });
    };
    
    // CORREÇÃO AQUI: handleSaveImage com CORS habilitado
    const handleSaveImage = () => {
        if (tierListRef.current) {
            const originalMargin = tierListRef.current.style.margin;
            tierListRef.current.style.margin = '0'; 

            html2canvas(tierListRef.current, { 
                backgroundColor: COLORS.darkBg, 
                scale: 2,
                useCORS: true, // Habilita carregamento de imagens externas
                allowTaint: true 
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `maxplay-tierlist-${mode}-${new Date().toLocaleDateString()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                tierListRef.current.style.margin = originalMargin; 
            });
        }
    };
    
    if (loading) return <><Header /><Spinner /></>;

    const ItemComponent = mode === 'list' ? ListCharacterItem : CharacterItem;

    return (
        <>
            <GlobalStyle />
            <Header />
            <TierListContainer>

                <AnimatePresence>
                    {warningMessage && (
                        <LimitWarning
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                        >
                            <FaExclamationTriangle /> {warningMessage}
                        </LimitWarning>
                    )}
                </AnimatePresence>
                
                <ControlsContainer>
                    <ControlGroup>
                        <ModeButton onClick={() => handleSwitchMode('tier')} $active={mode === 'tier'}><FaThList /> Tier List</ModeButton>
                        <ModeButton onClick={() => handleSwitchMode('list')} $active={mode === 'list'}><FaList /> Modo Lista</ModeButton>
                    </ControlGroup>
                    <ControlGroup>
                         <label style={{ color: COLORS.textMuted }}><input type="checkbox" checked={showSpoilers} onChange={(e) => setShowSpoilers(e.target.checked)} /> Mostrar Spoilers</label>
                        <ControlButton onClick={() => setArcModalOpen(true)}><FaFilter /> Filtrar Arco: {selectedArc === 'All' ? 'Todos' : selectedArc}</ControlButton>
                        <ControlButton onClick={() => dispatch({ type: 'ADD_TIER' })}><FaPlus /> Add Tier</ControlButton>
                        <ControlButton onClick={() => dispatch({ type: 'RESET_TIERS' })} style={{backgroundColor: '#f39c12'}} whileHover={{ scale: 1.05 }}><FaUndo /> Limpar</ControlButton>
                        <ControlButton onClick={handleSaveImage} style={{backgroundColor: '#16a085'}} whileHover={{ scale: 1.05 }}><FaImage /> Salvar Imagem</ControlButton>
                    </ControlGroup>
                </ControlsContainer>
                
                <div ref={tierListRef}>
                    <AnimatePresence>
                        {tiers.map((tier, index) => (
                            <TierRowContainer key={tier.id} layout $mode={mode}>
                                <TierLabel color={tier.color} $mode={mode}>{tier.title}</TierLabel>
                                <DropZone
                                    onDrop={(e) => handleDrop(e, tier.id)}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverTier(tier.id); }}
                                    onDragLeave={() => setDragOverTier(null)}
                                    $isOver={dragOverTier === tier.id}
                                    $mode={mode}
                                >
                                    <AnimatePresence>
                                        {tier.characters.map(char => <ItemComponent key={char.id} character={char} originId={tier.id} onDragStart={handleDragStart} />)}
                                    </AnimatePresence>
                                </DropZone>
                                <TierActions className="tier-actions">
                                    <button onClick={() => setEditingTier(tier)}><FaCog /></button>
                                    <button onClick={() => dispatch({ type: 'MOVE_TIER', payload: { tierId: tier.id, direction: -1 }})} disabled={index === 0}><FaArrowUp /></button>
                                    <button onClick={() => dispatch({ type: 'MOVE_TIER', payload: { tierId: tier.id, direction: 1 }})} disabled={index === tiers.length - 1}><FaArrowDown /></button>
                                </TierActions>
                            </TierRowContainer>
                        ))}
                    </AnimatePresence>
                </div>

                <CharacterPoolContainer>
                    <h3 style={{ color: COLORS.textLight, marginBottom: '1.5rem' }}>Personagens Disponíveis ({filteredPool.length})</h3>
                    <ControlGroup style={{ marginBottom: '1rem', gap: '15px' }}>
                        <FaSearch style={{ color: COLORS.textMuted }}/> 
                        <SearchInput type="text" placeholder="Buscar personagem..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        
                        <FilterButtonGroup>
                            <FilterButton onClick={() => setGenderFilter('All')} $active={genderFilter === 'All'}>Todos</FilterButton>
                            <FilterButton onClick={() => setGenderFilter('Masculino')} $active={genderFilter === 'Masculino'}>Masc.</FilterButton>
                            <FilterButton onClick={() => setGenderFilter('Feminino')} $active={genderFilter === 'Feminino'}>Fem.</FilterButton>
                        </FilterButtonGroup>
                    </ControlGroup>
                    <CharacterPool
                        onDrop={(e) => handleDrop(e, 'pool')}
                        onDragOver={(e) => { e.preventDefault(); setDragOverTier('pool'); }}
                        onDragLeave={() => setDragOverTier(null)}
                        $isOver={dragOverTier === 'pool'}
                    >
                        {filteredPool.length === 0 && <p style={{ color: COLORS.textMuted, margin: 'auto' }}>Nenhum personagem disponível ou correspondente aos filtros.</p>}
                        <AnimatePresence>
                           {filteredPool.map(char => <CharacterItem key={char.id} character={char} originId={'pool'} onDragStart={handleDragStart} />)}
                        </AnimatePresence>
                    </CharacterPool>
                </CharacterPoolContainer>
            </TierListContainer>

            <AnimatePresence>
                {editingTier && (
                    <TierSettingsModal 
                        tier={editingTier}
                        onSave={(updatedTier) => { dispatch({ type: 'UPDATE_TIER', payload: updatedTier }); setEditingTier(null); }}
                        onDelete={(tierId) => { dispatch({ type: 'REMOVE_TIER', payload: { id: tierId } }); setEditingTier(null); }}
                        onClose={() => setEditingTier(null)}
                    />
                )}
                {isArcModalOpen && (
                    <ArcSelectorModal 
                        arcs={allArcs}
                        selectedArc={selectedArc}
                        onSelect={(arc) => { setSelectedArc(arc); setArcModalOpen(false); }}
                        onClose={() => setArcModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default TierList;