// ARQUIVO: src/pages/TierList.jsx
import React, { useState, useRef, useMemo, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { db } from '../firebase/config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
import { FaCog, FaTrash, FaArrowUp, FaArrowDown, FaUndo, FaPlus, FaImage, FaList, FaThList, FaSearch, FaFilter, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import ARC_DATA from '../json/Characters.json';
import ARC_ORDER from '../json/Arcs.json';
import './Tierlist.css'; // <--- IMPORTAÇÃO DO NOVO CSS

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

    // Usa um matchMedia pra saber se tá no mobile pra reduzir os cards dinamicamente
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'characters'));
        return onSnapshot(q, (snap) => {
            setAllCharacters(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            setLoading(false);
        });
    }, []);

    const totalPlaced = useMemo(() => tiers.reduce((acc, t) => acc + t.characters.length, 0), [tiers]);
    const isCompact = totalPlaced > 50;
    
    // Tamanhos calculados
    const baseCharSize = isCompact ? '80px' : '120px';
    const mobileCharSize = isCompact ? '50px' : '70px';
    const charSize = isMobile ? mobileCharSize : baseCharSize;
    
    const basePoolCharSize = '120px';
    const mobilePoolCharSize = '70px';
    const poolCharSize = isMobile ? mobilePoolCharSize : basePoolCharSize;

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
            <Header />
            <div className="tier-list-wrapper" style={{ paddingBottom: isPoolVisible ? (isMobile ? '350px' : '280px') : (isMobile ? '2rem' : '4rem') }}>
                <div className="controls-container">
                    <div className="control-group">
                        <div style={{ display: 'flex', background: '#222', padding: '4px', borderRadius: '6px', border: '1px solid #444' }}>
                            <button className={`control-btn ${currentMode === 'tier' ? 'active' : ''}`} onClick={() => { setCurrentMode('tier'); dispatch({ type: 'SET_TIERS', payload: TIERS_CONFIG.tier }) }}>
                                <FaThList /> Tier
                            </button>
                            <button className={`control-btn ${currentMode === 'mote' ? 'active' : ''}`} onClick={() => { setCurrentMode('mote'); dispatch({ type: 'SET_TIERS', payload: TIERS_CONFIG.mote }) }}>
                                <FaList /> Mote
                            </button>
                        </div>
                    </div>
                    
                    <div className="control-group">
                        <div className={`spoiler-toggle ${showSpoilers ? 'active' : ''}`} onClick={() => setShowSpoilers(!showSpoilers)}>
                            <span>Spoilers</span>
                            <div className={`switch ${showSpoilers ? 'active' : ''}`} />
                        </div>
                        
                        <button className="control-btn" onClick={() => setArcModalOpen(true)}>
                            <FaFilter /> Arcos ({selectedArcs.length})
                        </button>
                        
                        <button className="control-btn" onClick={() => dispatch({ type: 'ADD_TIER' })}>
                            <FaPlus /> Add
                        </button>
                        
                        <button className="control-btn" style={{ background: '#16a085', borderColor: '#16a085' }} onClick={() => {
                            html2canvas(tierListRef.current, {
                                backgroundColor: '#050505',
                                useCORS: true, 
                                allowTaint: false,
                                scale: 2,
                                ignoreElements: (el) => el.classList.contains('tier-actions')
                            }).then(canvas => {
                                const link = document.createElement('a'); link.download = 'tierlist.png'; link.href = canvas.toDataURL(); link.click();
                            });
                        }}>
                            <FaImage /> PNG
                        </button>
                        
                        <button className="control-btn" style={{ background: '#f39c12', borderColor: '#f39c12' }} onClick={() => dispatch({ type: 'RESET' })}>
                            <FaUndo />
                        </button>
                    </div>
                </div>

                <div ref={tierListRef}>
                    <AnimatePresence>
                        {tiers.map((tier, index) => (
                            <motion.div key={tier.id} layout className="tier-row">
                                <div 
                                    className={`tier-label ${currentMode === 'mote' ? 'large' : 'normal'}`} 
                                    style={{ background: `linear-gradient(135deg, ${tier.color} 0%, rgba(0,0,0,0.4) 100%), ${tier.color}` }}
                                >
                                    {tier.title}
                                </div>
                                
                                <div className="drop-zone" onDrop={(e) => handleDrop(e, tier.id)} onDragOver={(e) => e.preventDefault()}>
                                    <AnimatePresence>
                                        {tier.characters.map(c => {
                                            const borderColor = c.gender?.toLowerCase() === 'feminino' ? 'rgba(233, 30, 99, 0.5)' : (c.gender?.toLowerCase() === 'masculino' ? 'rgba(33, 150, 243, 0.5)' : '#333');
                                            
                                            return (
                                                <motion.div
                                                    key={c.id}
                                                    className="character-item"
                                                    style={{ 
                                                        width: charSize, 
                                                        height: charSize, 
                                                        backgroundImage: `url(${c.imageUrl})`,
                                                        borderColor: borderColor
                                                    }}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, c, tier.id)}
                                                >
                                                    <div className="character-tooltip">{c.name}</div>
                                                    <div className="character-name-label" style={{ display: !isCompact ? 'flex' : 'none' }}>
                                                        {formatName(c.name)}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                                
                                <div className="tier-actions">
                                    <button onClick={() => setEditingTier(tier)}><FaCog /></button>
                                    <button onClick={() => dispatch({ type: 'MOVE_TIER', payload: { id: tier.id, direction: -1 } })} disabled={index === 0}><FaArrowUp /></button>
                                    <button onClick={() => dispatch({ type: 'MOVE_TIER', payload: { id: tier.id, direction: 1 } })} disabled={index === tiers.length - 1}><FaArrowDown /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <button 
                    className="floating-toggle-btn" 
                    style={{ bottom: isPoolVisible ? (isMobile ? '360px' : '290px') : '20px' }} 
                    onClick={() => setIsPoolVisible(!isPoolVisible)}
                >
                    {isPoolVisible ? <FaArrowDown /> : <FaPlus />}
                </button>

                <motion.div className="character-pool-container" animate={{ y: isPoolVisible ? 0 : '100%' }}>
                    <div className="pool-controls-wrapper">
                        <div className="search-input-wrapper">
                            <FaSearch color="#e50914" />
                            <input placeholder="Buscar personagem..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        
                        <div style={{ display: 'flex', background: '#222', borderRadius: '4px', border: '1px solid #444', overflow: 'hidden' }}>
                            {['All', 'Masculino', 'Feminino'].map(g => (
                                <button 
                                    key={g} 
                                    onClick={() => setGenderFilter(g)} 
                                    style={{ 
                                        background: genderFilter === g ? '#e50914' : 'transparent', 
                                        border: 'none', color: 'white', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' 
                                    }}
                                >
                                    {g === 'All' ? 'Todos' : g.slice(0, 4)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="drop-zone" onDrop={(e) => handleDrop(e, 'pool')} onDragOver={(e) => e.preventDefault()} style={{ justifyContent: 'center' }}>
                        <AnimatePresence>
                            {filteredPool.map(c => {
                                const borderColor = c.gender?.toLowerCase() === 'feminino' ? 'rgba(233, 30, 99, 0.5)' : (c.gender?.toLowerCase() === 'masculino' ? 'rgba(33, 150, 243, 0.5)' : '#333');
                                
                                return (
                                    <motion.div
                                        key={c.id}
                                        className="character-item"
                                        style={{ 
                                            width: poolCharSize, 
                                            height: poolCharSize, 
                                            backgroundImage: `url(${c.imageUrl})`,
                                            borderColor: borderColor
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, c, 'pool')}
                                    >
                                        <div className="character-tooltip">{c.name}</div>
                                        <div className="character-name-label" style={{ display: 'flex' }}>
                                            {formatName(c.name)}
                                        </div>
                                        {c.isSpoiler && (
                                            <div style={{ position: 'absolute', top: 0, right: 0, background: '#f39c12', padding: '2px', zIndex: 5 }}>
                                                <FaExclamationTriangle color="black" size={10} />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {editingTier && (
                    <motion.div className="modal-overlay" onClick={() => setEditingTier(null)}>
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginTop: 0 }}>Editar Tier</h3>
                            <input 
                                type="text" 
                                value={editingTier.title} 
                                onChange={e => setEditingTier({ ...editingTier, title: e.target.value })} 
                                style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#222', border: '1px solid #444', color: 'white', boxSizing: 'border-box' }} 
                            />
                            <input 
                                type="color" 
                                value={editingTier.color} 
                                onChange={e => setEditingTier({ ...editingTier, color: e.target.value })} 
                                style={{ width: '100%', height: '40px', marginBottom: '10px', cursor: 'pointer', border: 'none', padding: '0' }} 
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="control-btn" onClick={() => { dispatch({ type: 'UPDATE_TIER', payload: editingTier }); setEditingTier(null); }} style={{ flex: 1, justifyContent: 'center' }}>
                                    Salvar
                                </button>
                                <button className="control-btn" onClick={() => { dispatch({ type: 'REMOVE_TIER', payload: editingTier.id }); setEditingTier(null); }} style={{ background: '#e50914', borderColor: '#e50914', flex: 1, justifyContent: 'center' }}>
                                    <FaTrash /> Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                
                {isArcModalOpen && (
                    <motion.div className="modal-overlay" onClick={() => setArcModalOpen(false)}>
                        <motion.div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginTop: 0 }}>Selecionar Arcos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '400px', overflowY: 'auto' }}>
                                <button className="control-btn" onClick={() => setSelectedArcs([])} style={{ background: '#444', borderColor: '#444', justifyContent: 'center' }}>
                                    Limpar Seleção
                                </button>
                                {ARC_ORDER.map(arc => (
                                    <button 
                                        key={arc} 
                                        className={`control-btn ${selectedArcs.includes(arc) ? 'active' : ''}`}
                                        onClick={() => setSelectedArcs(prev => prev.includes(arc) ? prev.filter(a => a !== arc) : [...prev, arc])} 
                                        style={{ justifyContent: 'space-between', fontSize: '13px', background: selectedArcs.includes(arc) ? '#e50914' : '#2a2a2a' }}
                                    >
                                        {arc} {selectedArcs.includes(arc) && <FaCheck />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default TierList;