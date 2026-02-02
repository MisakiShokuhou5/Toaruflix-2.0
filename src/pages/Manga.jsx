import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import Header from '../components/Header';
import {
    FaArrowLeft, FaFilter, FaScroll, FaFileAlt, FaChevronDown, FaChevronLeft, FaChevronRight, FaImage
} from 'react-icons/fa';

const GlobalStyle = createGlobalStyle`
    body { background: #000; color: #fff; margin: 0; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: #0076a8; border-radius: 10px; }
`;

// --- Utilitário de URL (Limpeza Robusta) ---
const getUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url === "null") return null;
    const cleanUrl = url.trim();
    const match = cleanUrl.match(/(?:id=|\/d\/|\/file\/d\/)([a-zA-Z0-9_-]{25,})/);
    const id = match ? match[1] : (cleanUrl.length >= 25 ? cleanUrl : null);
    // Adicionado sz=s1000 para melhor qualidade
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=s1000` : cleanUrl;
};

// --- Componente de Imagem Inteligente (Tamanho Fixo e Tratamento de Erro) ---
const SmartImage = ({ src, alt = "" }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setError(false);
    }, [src]);

    // Mostra placeholder se não tiver src OU se deu erro no carregamento
    const showPlaceholder = !src || error;

    return (
        <ImageWrapper>
            {/* Spinner só aparece se tem src e ainda não carregou nem deu erro */}
            {!loaded && !showPlaceholder && <LoadingSpinner />}
            
            {showPlaceholder ? (
                <div className="placeholder">
                    {/* Ícone sutil para indicar falta de imagem */}
                    <FaImage size={50} style={{ opacity: 0.1, color: '#0076a8' }} />
                </div>
            ) : (
                <img
                    src={src}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)} // Captura links quebrados do Drive
                    referrerPolicy="no-referrer" // Essencial para o Drive
                    style={{ 
                        opacity: loaded ? 1 : 0, 
                        display: loaded ? 'block' : 'none', 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                    }}
                    alt={alt}
                />
            )}
        </ImageWrapper>
    );
};

const Manga = () => {
    const [mangas, setMangas] = useState([]);
    const [view, setView] = useState('catalog');
    const [displayMode, setDisplayMode] = useState('scroll');
    const [currentPage, setCurrentPage] = useState(0);
    const [selection, setSelection] = useState({ manga: null, lang: 'Português', arc: 'Todos', vol: null, cap: null });

    useEffect(() => {
        return onSnapshot(collection(db, 'mangas'), (snap) => {
            setMangas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    const sortedChapters = useMemo(() => {
        if (!selection.vol || !selection.vol.chapters) return [];
        const caps = Object.entries(selection.vol.chapters).map(([id, data]) => ({ ...data, id }));
        return caps.sort((a, b) => parseFloat(a.c) - parseFloat(b.c));
    }, [selection.vol]);

    // --- LEITOR (READER) ---
    if (view === 'reader' && selection.cap) {
        const pages = selection.cap.pages || [];
        return (
            <ReaderContainer>
                <GlobalStyle />
                <ReaderHeader>
                    <div className="left">
                        <FaArrowLeft onClick={() => { setView('chapters'); setCurrentPage(0); }} />
                        <div className="info">
                            <strong>{selection.manga?.title}</strong>
                            <span>Cap. {selection.cap.c} — {selection.lang === 'Português' ? 'PT' : 'EN'}</span>
                        </div>
                    </div>
                    <ModeControls>
                        {displayMode === 'single' && (
                            <div className="page-nav">
                                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}><FaChevronLeft /></button>
                                <span>{currentPage + 1} / {pages.length}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                        <ModeBtn onClick={() => setDisplayMode('scroll')} $active={displayMode === 'scroll'}><FaScroll /></ModeBtn>
                        <ModeBtn onClick={() => setDisplayMode('single')} $active={displayMode === 'single'}><FaFileAlt /></ModeBtn>
                    </ModeControls>
                </ReaderHeader>

                <PagesBox>
                    <AnimatePresence mode="wait">
                        <motion.div key={displayMode === 'scroll' ? 'scroll' : `page-${currentPage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {pages.length > 0 ? (
                                displayMode === 'scroll' 
                                    ? pages.map((p, i) => <img key={i} src={getUrl(p)} alt="" loading="lazy" referrerPolicy="no-referrer" />)
                                    : <SmartImage src={getUrl(pages[currentPage])} />
                            ) : <div className="empty-msg">Nenhuma página na Rede Misaka para este capítulo.</div>}
                        </motion.div>
                    </AnimatePresence>
                </PagesBox>
            </ReaderContainer>
        );
    }

    // --- CATÁLOGO / VOLUMES / CAPÍTULOS ---
    return (
        <>
            <GlobalStyle /><Header />
            <Main>
                <FilterBar>
                    <div className="back" onClick={() => {
                        if (view === 'volumes') setView('catalog');
                        else if (view === 'chapters') setView('volumes');
                    }}>
                        {view !== 'catalog' && <><FaArrowLeft /> Voltar</>}
                    </div>

                    <div style={{display: 'flex', gap: '15px'}}>
                        <LangSwitch>
                            {['Português', 'English'].map(l => (
                                <button key={l} className={selection.lang === l ? 'active' : ''} onClick={() => setSelection({ ...selection, lang: l, arc: 'Todos' })}>
                                    {l === 'Português' ? 'PT' : 'EN'}
                                </button>
                            ))}
                        </LangSwitch>

                        {view === 'volumes' && (
                            <CustomSelectWrapper>
                                <FaFilter className="filter-icon" />
                                <select value={selection.arc} onChange={e => setSelection({ ...selection, arc: e.target.value })}>
                                    <option value="Todos">Todos os Arcos</option>
                                    {selection.manga && Object.keys(selection.manga.data_organizada?.[selection.lang] || {}).map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="arrow-icon" />
                            </CustomSelectWrapper>
                        )}
                    </div>
                </FilterBar>

                <GridContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {view === 'catalog' && mangas.map(m => (
                        <Card key={m.id} onClick={() => { setSelection({ ...selection, manga: m }); setView('volumes'); }}>
                            <SmartImage src={getUrl(m.cover)} alt={m.title} />
                            <Label>{m.title}</Label>
                        </Card>
                    ))}

                    {view === 'volumes' && (() => {
                        const data = selection.manga?.data_organizada?.[selection.lang] || {};
                        let list = [];
                        if (selection.arc === 'Todos') {
                            const unifiedMap = {};
                            Object.entries(data).forEach(([arc, vols]) => {
                                Object.entries(vols).forEach(([id, v]) => {
                                    if (!unifiedMap[v.v]) unifiedMap[v.v] = { ...v, id, arcRef: 'Todos' };
                                });
                            });
                            list = Object.values(unifiedMap);
                        } else {
                            Object.entries(data[selection.arc] || {}).forEach(([id, v]) => list.push({ ...v, id, arcRef: selection.arc }));
                        }
                        return list.sort((a, b) => parseFloat(a.v) - parseFloat(b.v)).map((v, i) => (
                            <Card key={i} onClick={() => { setSelection({ ...selection, vol: v, arc: v.arcRef }); setView('chapters'); }}>
                                <SmartImage src={getUrl(v.cover || v.cover_jp)} alt={v.v} />
                                <Label>Vol. {v.v}</Label>
                            </Card>
                        ));
                    })()}

                    {view === 'chapters' && sortedChapters.map((c, i) => (
                        <Card key={i} onClick={() => { setSelection({ ...selection, cap: c }); setView('reader'); }}>
                            <SmartImage src={getUrl(c.cover || c.pages?.[0])} alt={c.c} />
                            <Label>Capítulo {c.c}</Label>
                        </Card>
                    ))}
                </GridContainer>
            </Main>
        </>
    );
};

// --- ESTILOS CORRIGIDOS ---
const Main = styled.main` padding: 100px 2rem; min-height: 100vh; `;
const GridContainer = styled(motion.div)` display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 2rem; `;

const Card = styled.div`
    background: #0a0a0f; border-radius: 12px; cursor: pointer; position: relative; border: 1px solid #1a1a2e; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden;
    display: flex; flex-direction: column; // Mantém a label no rodapé
    &:hover { transform: translateY(-8px); border-color: #0076a8; box-shadow: 0 10px 25px rgba(0, 118, 168, 0.4); }
`;

const ImageWrapper = styled.div`
    width: 100%;
    aspect-ratio: 1 / 1.45; // PROPORÇÃO FIXA
    position: relative; display: flex; align-items: center; justify-content: center; background: #0a0a0f; overflow: hidden;
    // Estilo do placeholder interno
    .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a0f 0%, #12121c 100%); }
`;

const Label = styled.div` padding: 15px 10px; color: #fff; text-align: center; font-size: 0.75rem; font-weight: bold; background: #1e1e2f; min-height: 50px; display: flex; align-items: center; justify-content: center; border-top: 1px solid rgba(255,255,255,0.05); `;

// ... (Restante dos estilos do Leitor e Filtros permanecem iguais)
const FilterBar = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; .back { cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 0.85rem; color: #0076a8; } `;
const LangSwitch = styled.div` display: flex; gap: 5px; background: #111; padding: 4px; border-radius: 20px; border: 1px solid #222; button { padding: 6px 20px; background: transparent; color: #444; border: none; cursor: pointer; border-radius: 15px; font-size: 0.7rem; font-weight: bold; &.active { background: #0076a8; color: #fff; } } `;
const CustomSelectWrapper = styled.div` position: relative; display: flex; align-items: center; background: #111; border-radius: 20px; padding: 0 15px; height: 34px; border: 1px solid #222; select { background: none; border: none; color: #fff; font-size: 0.75rem; font-weight: bold; outline: none; cursor: pointer; appearance: none; padding-right: 20px; } .filter-icon { color: #0076a8; font-size: 0.8rem; margin-right: 8px; } .arrow-icon { color: #444; font-size: 0.7rem; position: absolute; right: 12px; pointer-events: none; } `;
const ReaderContainer = styled.div` min-height: 100vh; `;
const ReaderHeader = styled.div` padding: 0.8rem 2rem; background: rgba(5, 5, 5, 0.95); backdrop-filter: blur(10px); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #111; .left { display: flex; align-items: center; gap: 20px; svg { cursor: pointer; color: #0076a8; } } .info { display: flex; flex-direction: column; strong { font-size: 0.9rem; } span { font-size: 0.7rem; color: #0076a8; } } `;
const ModeControls = styled.div` display: flex; gap: 12px; align-items: center; .page-nav { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; color: #444; button { background: none; border: none; color: #0076a8; cursor: pointer; } } `;
const ModeBtn = styled.button` background: ${props => props.$active ? '#0076a8' : '#111'}; color: #fff; border: none; padding: 8px; border-radius: 6px; cursor: pointer; `;
const PagesBox = styled.div` display: flex; flex-direction: column; align-items: center; img { width: 100%; max-width: 850px; margin-bottom: 4px; } .empty-msg { padding: 100px; color: #333; } `;
const LoadingSpinner = styled.div` width: 30px; height: 30px; border: 3px solid #111; border-top: 3px solid #0076a8; border-radius: 50%; animation: spin 1s linear infinite; @keyframes spin { 100% { transform: rotate(360deg); } } `;

export default Manga;