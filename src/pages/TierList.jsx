import React, { useState, useRef, useMemo, useEffect, useReducer } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
import { FaCog, FaTrash, FaArrowUp, FaArrowDown, FaUndo, FaPlus, FaImage, FaList, FaThList, FaSearch, FaFilter, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import ARC_DATA from '../json/Characters.json';
import ARC_ORDER from '../json/Arcs.json';

const TIERS_CONFIG = {
    tier: [
        { id: 1, title: 'S', color: '#e50914', characters: [] },
        { id: 2, title: 'A', color: '#e98a2b', characters: [] },
        { id: 3, title: 'B', color: '#ffb366', characters: [] },
        { id: 4, title: 'C', color: '#ffdb66', characters: [] },
        { id: 5, title: 'D', color: '#66ff99', characters: [] },
        { id: 6, title: 'E', color: '#0a8332', characters: [] },
        { id: 7, title: '?', color: '#b6bbb8', characters: [] }
    ],
    mote: [
        { id: 1, title: 'Grau Especial', color: '#e50914', characters: [] },
        { id: 2, title: 'Grau 1', color: '#e98a2b', characters: [] },
        { id: 3, title: 'Grau 2', color: '#ffb366', characters: [] },
        { id: 4, title: 'Grau 3', color: '#ffdb66', characters: [] },
        { id: 5, title: 'Grau 4', color: '#66ff99', characters: [] },
        { id: 6, title: 'Grau 5', color: '#0a8332', characters: [] },
        { id: 7, title: '?', color: '#b6bbb8', characters: [] }
    ]
};

const CHARACTER_ORDER_MAP = Object.keys(ARC_DATA);

const COLORS = {
    primary: '#e50914',
    secondary: '#b80000',
    darkBg: '#000000ff',
    tierBg: '#1e1e1e',
    poolBg: '#181818',
    textLight: '#ffffff',
    textMuted: '#999999',
    warning: '#f39c12',
    success: '#16a085'
};

const GlobalStyle = createGlobalStyle`
    body { 
        font-family: 'Inter', sans-serif; 
        margin: 0; 
        background: ${COLORS.darkBg}; 
        color: white; 
    }
`;

const TierListContainer = styled.div`
    padding-bottom: ${props => props.$isPoolVisible ? '280px' : '4rem'};
    min-height: 100vh; 
    transition: padding-bottom 0.4s ease;
`;

const TierRowContainer = styled(motion.div)`
    display: flex; 
    margin: 8px 4rem; 
    background: ${COLORS.tierBg}; 
    min-height: 90px; 
    border: 1px solid #222; 
    border-radius: 12px; 
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    &:hover .tier-actions { opacity: 1; transform: translateX(0); }
`;

const TierLabel = styled.div`
    min-width: ${props => props.$isLarge ? '160px' : '100px'}; 
    background: linear-gradient(135deg, ${props => props.color} 0%, rgba(0,0,0,0.4) 100%), ${props => props.color};
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: ${props => props.$isLarge ? '0.9rem' : '1.5rem'};
    font-weight: 900; 
    color: #fff; 
    flex-shrink: 0; 
    text-align: center; 
    padding: 10px; 
    text-shadow: 0 2px 5px rgba(0,0,0,0.8);
    text-transform: uppercase; 
    letter-spacing: 1px;
    border-right: 1px solid rgba(255,255,255,0.05);
`;

const DropZone = styled.div` 
    flex: 1; 
    display: flex; 
    flex-wrap: wrap; 
    padding: 10px; 
    gap: 8px; // Gap reduzido para maior densidade
`;

const CharacterItemStyled = styled(motion.div)`
    cursor: grab; 
    position: relative;
    border-radius: 10px; // Mudança: de 50% para 10px (Yuyae Preference)
    overflow: hidden; 
    background-color: #1a1a1a;
    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    border: 2px solid ${props =>
        props.$gender?.toLowerCase() === 'feminino' ? 'rgba(233, 30, 99, 0.5)' :
        (props.$gender?.toLowerCase() === 'masculino' ? 'rgba(33, 150, 243, 0.5)' : '#333')};
    background-image: url(${props => props.$imgUrl});
    background-size: cover; 
    background-position: center; 
    background-repeat: no-repeat;
    transition: all 0.2s ease;

    &:hover { 
        transform: translateY(-5px); 
        z-index: 10; 
        border-color: ${COLORS.primary}; 
        box-shadow: 0 8px 15px rgba(0,0,0,0.8);
    }
`;

const CharacterNameLabel = styled.div`
    position: absolute; 
    bottom: 0; 
    left: 0; 
    width: 100%;
    height: 40%; 
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%); 
    color: white; 
    display: ${props => props.$isVisible ? 'flex' : 'none'}; 
    align-items: flex-end; 
    justify-content: center; 
    text-align: center;
    font-size: 10px; 
    font-weight: 700;
    padding: 0 4px 4px 4px; 
    z-index: 5;
    pointer-events: none;
`;

const ControlsContainer = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 4rem; border-bottom: 1px solid #333;
    position: sticky; top: 68px; z-index: 100; background: ${COLORS.darkBg};
`;

const ControlGroup = styled.div` display: flex; align-items: center; gap: 0.8rem; `;

const ControlButton = styled.button`
    background: ${props => props.$active ? COLORS.primary : '#2a2a2a'};
    color: white; border: 1px solid #444; padding: 8px 15px; border-radius: 6px;
    cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
    &:hover { background: #333; border-color: ${COLORS.primary}; }
`;

const TierActions = styled.div`
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    background-color: #111; padding: 0 10px; flex-shrink: 0; opacity: 0;
    transform: translateX(100%); transition: 0.3s;
    button { background: none; border: none; color: ${COLORS.textMuted}; cursor: pointer; padding: 8px; &:hover { color: ${COLORS.primary}; } }
`;

const CharacterTooltip = styled.div`
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.9); color: white; padding: 4px 8px; border-radius: 4px;
    font-size: 10px; white-space: nowrap; pointer-events: none; opacity: 0;
    transition: opacity 0.2s; z-index: 200; border: 1px solid ${COLORS.primary};
`;

const CharacterPoolContainer = styled(motion.div)`
    padding: 1rem 2rem; background: ${COLORS.poolBg};
    position: fixed; bottom: 0; width: 100%; z-index: 100;
    border-top: 3px solid ${COLORS.primary}; max-height: 280px; overflow-y: auto;
`;

const FloatingToggleButton = styled.button`
    position: fixed; bottom: ${props => props.$isVisible ? '290px' : '20px'};
    right: 40px; z-index: 110; background-color: ${COLORS.primary};
    color: white; border: none; border-radius: 50%; width: 50px; height: 50px; cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const SpoilerToggleContainer = styled.div`
    display: flex; align-items: center; gap: 10px; cursor: pointer;
    span { font-size: 12px; font-weight: bold; color: ${props => props.$active ? COLORS.textLight : COLORS.textMuted}; }
`;

const Switch = styled.div`
    width: 40px; height: 20px; background: ${props => props.$active ? COLORS.primary : '#444'};
    border-radius: 20px; position: relative; transition: 0.3s;
    &::after { content: ''; position: absolute; width: 16px; height: 16px; background: white; border-radius: 50%; top: 2px; left: ${props => props.$active ? '22px' : '2px'}; transition: 0.3s; }
`;

const ModalOverlay = styled(motion.div)`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000;
`;

const ModalContent = styled(motion.div)`
    background: ${COLORS.tierBg}; padding: 2rem; border-radius: 8px; width: 400px;
    max-height: 80vh; overflow-y: auto; border-top: 5px solid ${COLORS.primary};
`;

function tierReducer(state, action) {
    switch (action.type) {
        case 'SET_TIERS': return action.payload;
        case 'ADD_TIER': return [...state, { id: Date.now(), title: 'NOVO', color: '#8a8a8a', characters: [] }];
        case 'REMOVE_TIER': return state.filter(t => t.id !== action.payload);
        case 'UPDATE_TIER': return state.map(t => t.id === action.payload.id ? action.payload : t);
        case 'MOVE_TIER': {
            const { id, direction } = action.payload;
            const idx = state.findIndex(t => t.id === id);
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= state.length) return state;
            const newTiers = [...state];
            [newTiers[idx], newTiers[newIdx]] = [newTiers[newIdx], newTiers[idx]];
            return newTiers;
        }
        case 'DRAG_DROP': {
            const { character, originId, targetId } = action.payload;
            if (originId === targetId) return state;
            let newTiers = state.map(t => ({ ...t, characters: [...t.characters] }));
            if (originId !== 'pool') {
                const origin = newTiers.find(t => t.id === originId);
                if (origin) origin.characters = origin.characters.filter(c => c.id !== character.id);
            }
            if (targetId !== 'pool') {
                const target = newTiers.find(t => t.id === targetId);
                if (target && !target.characters.some(c => c.id === character.id)) target.characters.push(character);
            }
            return newTiers;
        }
        case 'RESET': return state.map(t => ({ ...t, characters: [] }));
        default: return state;
    }
}

const TierList = () => {
    const [currentMode, setCurrentMode] = useState('tier');
    const [tiers, dispatch] = useReducer(tierReducer, TIERS_CONFIG.tier);
    const [allCharacters, setAllCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSpoilers, setShowSpoilers] = useState(false);
    const [selectedArcs, setSelectedArcs] = useState([]);
    const [genderFilter, setGenderFilter] = useState('All');
    const [isArcModalOpen, setArcModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPoolVisible, setIsPoolVisible] = useState(true);
    const tierListRef = useRef(null);

    useEffect(() => {
        const q = query(collection(db, 'characters'));
        return onSnapshot(q, (snap) => {
            setAllCharacters(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            setLoading(false);
        });
    }, []);

    const totalPlaced = useMemo(() => tiers.reduce((acc, t) => acc + t.characters.length, 0), [tiers]);
    const isCompact = totalPlaced > 50;
    const charSize = isCompact ? '80px' : '120px';

    const formatName = (name) => {
        if (!name) return "";
        if (name.includes("Misaka #10032") || name.includes("Misaka Worst")) return "Misaka";
        if (name.includes("Tokiwadai Dorm Supervisor")) return "Tokiwadai";
        const titles = ["Princess", "Queen", "Archangel"];
        if (titles.some(t => name.includes(t))) return name;
        return name;
    };

    const filteredPool = useMemo(() => {
        const placedIds = new Set(tiers.flatMap(t => t.characters.map(c => c.id)));
        return allCharacters.filter(c => {
            if (placedIds.has(c.id)) return false;
            const charNameNorm = (c.name || "").trim().toLowerCase();
            const charGenNorm = (c.gender || "").trim().toLowerCase();
            if (genderFilter !== 'All' && !charGenNorm.startsWith(genderFilter.toLowerCase().slice(0, 3))) return false;
            if (searchTerm && !charNameNorm.includes(searchTerm.toLowerCase())) return false;
            if (showSpoilers) return true;
            if (selectedArcs.length > 0) {
                const jsonKey = Object.keys(ARC_DATA).find(k => k.trim().toLowerCase() === charNameNorm);
                if (jsonKey) {
                    const charArcs = ARC_DATA[jsonKey] || [];
                    return selectedArcs.some(arc => charArcs.includes(arc));
                }
                return false;
            }
            return false;
        }).sort((a, b) => {
            const idxA = CHARACTER_ORDER_MAP.findIndex(n => n.toLowerCase() === a.name.toLowerCase());
            const idxB = CHARACTER_ORDER_MAP.findIndex(n => n.toLowerCase() === b.name.toLowerCase());
            return (idxA === -1 ? 9999 : idxA) - (idxB === -1 ? 9999 : idxB);
        });
    }, [allCharacters, tiers, showSpoilers, selectedArcs, searchTerm, genderFilter]);

    const handleDragStart = (e, char, originId) => {
        e.dataTransfer.setData('char', JSON.stringify(char));
        e.dataTransfer.setData('origin', originId);
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        const character = JSON.parse(e.dataTransfer.getData('char'));
        const originId = e.dataTransfer.getData('origin') === 'pool' ? 'pool' : Number(e.dataTransfer.getData('origin'));
        dispatch({ type: 'DRAG_DROP', payload: { character, originId, targetId: targetId === 'pool' ? 'pool' : Number(targetId) } });
    };

    if (loading) return <Spinner />;

    return (
        <>
            <GlobalStyle /><Header />
            <TierListContainer $isPoolVisible={isPoolVisible}>
                <ControlsContainer>
                    <ControlGroup>
                        <div style={{ display: 'flex', background: '#222', padding: '4px', borderRadius: '6px', border: '1px solid #444' }}>
                            <ControlButton $active={currentMode === 'tier'} onClick={() => { setCurrentMode('tier'); dispatch({ type: 'SET_TIERS', payload: TIERS_CONFIG.tier }) }}><FaThList /> Tier</ControlButton>
                            <ControlButton $active={currentMode === 'mote'} onClick={() => { setCurrentMode('mote'); dispatch({ type: 'SET_TIERS', payload: TIERS_CONFIG.mote }) }}><FaList /> Mote</ControlButton>
                        </div>
                    </ControlGroup>
                    <ControlGroup>
                        <SpoilerToggleContainer $active={showSpoilers} onClick={() => setShowSpoilers(!showSpoilers)}>
                            <span>Spoilers</span>
                            <Switch $active={showSpoilers} />
                        </SpoilerToggleContainer>
                        <ControlButton onClick={() => setArcModalOpen(true)}><FaFilter /> Arcos ({selectedArcs.length})</ControlButton>
                        <ControlButton onClick={() => dispatch({ type: 'ADD_TIER' })}><FaPlus /> Add</ControlButton>
                        <ControlButton onClick={() => {
                            html2canvas(tierListRef.current, {
                                backgroundColor: '#050505',
                                useCORS: true, // <--- ISSO AQUI É OBRIGATÓRIO
                                allowTaint: false,
                                scale: 2,
                                ignoreElements: (el) => el.classList.contains('tier-actions')
                            })
                        .then(canvas => {
                                const link = document.createElement('a'); link.download = 'tierlist.png'; link.href = canvas.toDataURL(); link.click();
                            });
                        }} style={{ background: COLORS.success }}><FaImage /> PNG</ControlButton>
                    <ControlButton onClick={() => dispatch({ type: 'RESET' })} style={{ background: COLORS.warning }}><FaUndo /></ControlButton>
                </ControlGroup>
            </ControlsContainer>

            <div ref={tierListRef}>
                <AnimatePresence>
                    {tiers.map((tier, index) => (
                        <TierRowContainer key={tier.id} layout>
                            <TierLabel color={tier.color} $isLarge={currentMode === 'mote'}>{tier.title}</TierLabel>
                            <DropZone onDrop={(e) => handleDrop(e, tier.id)} onDragOver={(e) => e.preventDefault()}>
                                <AnimatePresence>
                                    {tier.characters.map(c => (
                                        <CharacterItemStyled
                                            key={c.id}
                                            $gender={c.gender}
                                            $imgUrl={c.imageUrl}
                                            style={{ width: charSize, height: charSize }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, c, tier.id)}
                                        >
                                            <CharacterTooltip>{c.name}</CharacterTooltip>
                                            <CharacterNameLabel $isVisible={!isCompact}>
                                                {formatName(c.name)}
                                            </CharacterNameLabel>
                                        </CharacterItemStyled>
                                    ))}
                                </AnimatePresence>
                            </DropZone>
                            <TierActions className="tier-actions">
                                <button onClick={() => setEditingTier(tier)}><FaCog /></button>
                                <button onClick={() => dispatch({ type: 'MOVE_TIER', payload: { id: tier.id, direction: -1 } })} disabled={index === 0}><FaArrowUp /></button>
                                <button onClick={() => dispatch({ type: 'MOVE_TIER', payload: { id: tier.id, direction: 1 } })} disabled={index === tiers.length - 1}><FaArrowDown /></button>
                            </TierActions>
                        </TierRowContainer>
                    ))}
                </AnimatePresence>
            </div>

            <FloatingToggleButton $isVisible={isPoolVisible} onClick={() => setIsPoolVisible(!isPoolVisible)}>
                {isPoolVisible ? <FaArrowDown /> : <FaPlus />}
            </FloatingToggleButton>

            <CharacterPoolContainer animate={{ y: isPoolVisible ? 0 : '100%' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <FaSearch color={COLORS.primary} />
                    <input style={{ flex: 1, padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }} placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <div style={{ display: 'flex', background: '#222', borderRadius: '4px', border: '1px solid #444', overflow: 'hidden' }}>
                        {['All', 'Masculino', 'Feminino'].map(g => (
                            <button key={g} onClick={() => setGenderFilter(g)} style={{ background: genderFilter === g ? COLORS.primary : 'transparent', border: 'none', color: 'white', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>{g === 'All' ? 'Todos' : g.slice(0, 4)}</button>
                        ))}
                    </div>
                </div>
                <DropZone onDrop={(e) => handleDrop(e, 'pool')} onDragOver={(e) => e.preventDefault()} style={{ justifyContent: 'center' }}>
                    <AnimatePresence>
                        {filteredPool.map(c => (
                            <CharacterItemStyled
                                key={c.id}
                                $gender={c.gender}
                                $imgUrl={c.imageUrl}
                                style={{ width: '120px', height: '120px' }}
                                draggable
                                onDragStart={(e) => handleDragStart(e, c, 'pool')}
                            >
                                <CharacterTooltip>{c.name}</CharacterTooltip>
                                <CharacterNameLabel $isVisible={true}>
                                    {formatName(c.name)}
                                </CharacterNameLabel>
                                {c.isSpoiler && <div style={{ position: 'absolute', top: 0, right: 0, background: COLORS.warning, padding: '2px', zIndex: 5 }}><FaExclamationTriangle color="black" size={10} /></div>}
                            </CharacterItemStyled>
                        ))}
                    </AnimatePresence>
                </DropZone>
            </CharacterPoolContainer>
        </TierListContainer >

            <AnimatePresence>
                {editingTier && (
                    <ModalOverlay onClick={() => setEditingTier(null)}>
                        <ModalContent onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginTop: 0 }}>Editar Tier</h3>
                            <input type="text" value={editingTier.title} onChange={e => setEditingTier({ ...editingTier, title: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: 'white' }} />
                            <input type="color" value={editingTier.color} onChange={e => setEditingTier({ ...editingTier, color: e.target.value })} style={{ width: '100%', height: '40px', marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <ControlButton onClick={() => { dispatch({ type: 'UPDATE_TIER', payload: editingTier }); setEditingTier(null); }}>Salvar</ControlButton>
                                <ControlButton onClick={() => { dispatch({ type: 'REMOVE_TIER', payload: editingTier.id }); setEditingTier(null); }} style={{ background: COLORS.primary }}><FaTrash /> Excluir</ControlButton>
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )}
                {isArcModalOpen && (
                    <ModalOverlay onClick={() => setArcModalOpen(false)}>
                        <ModalContent onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginTop: 0 }}>Selecionar Arcos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '400px', overflowY: 'auto' }}>
                                <ControlButton onClick={() => setSelectedArcs([])} style={{ background: '#444', justifyContent: 'center' }}>Limpar Seleção</ControlButton>
                                {ARC_ORDER.map(arc => (
                                    <ControlButton key={arc} $active={selectedArcs.includes(arc)} onClick={() => setSelectedArcs(prev => prev.includes(arc) ? prev.filter(a => a !== arc) : [...prev, arc])} style={{ justifyContent: 'space-between', fontSize: '13px' }}>{arc} {selectedArcs.includes(arc) && <FaCheck />}</ControlButton>
                                ))}
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </>
    );
};

export default TierList;