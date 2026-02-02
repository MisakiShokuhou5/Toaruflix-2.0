import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// --- CORREÇÃO DE IMPORTS (Apenas 1 nível acima) ---
import { db } from '../firebase/config';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
    FaArrowLeft, FaFilter, FaChevronDown, FaGlobe, FaTimes 
} from 'react-icons/fa';

const MAX_COLORS = {
    primary: '#0076a8',
    darkBg: '#000000',
    midBg: '#12121c',
};

// --- Utilitários ---
const getUrl = (url, isPdf = false) => {
    if (!url || typeof url !== 'string' || url.trim() === "" || url === "null") return null;
    // Aceita formatos comuns de link do Drive
    const match = url.match(/(?:id=|\/d\/|\/file\/d\/)([a-zA-Z0-9_-]{25,})/);
    const id = match ? match[1] : (url.length >= 25 ? url : null);
    
    if (!id) return url; // Se não achar ID, tenta usar a URL original
    if (isPdf) return `https://drive.google.com/file/d/${id}/preview`;
    // Usa thumbnail grande (s1000) para qualidade
    return `https://drive.google.com/thumbnail?id=${id}&sz=s1000`;
};

// Ordenação Natural (22r após 22)
const sortVolumes = (list) => {
    return [...list].sort((a, b) => {
        const score = (v) => {
            if (!v) return 9999;
            // Pega só a parte numérica
            const match = v.toString().match(/^(\d+)/);
            if (!match) return 9998;
            const n = parseInt(match[0], 10);
            // Se tiver 'r', soma 0.5 para ficar depois do número inteiro
            return v.toString().toLowerCase().includes('r') ? n + 0.5 : n;
        };
        return score(a.volNumber) - score(b.volNumber);
    });
};

// --- ESTILOS UNIFICADOS (Padrão Visual Academy City) ---

const MainContent = styled.main`
    padding: 120px 2rem 4rem 2rem; background-color: #000; min-height: 100vh;
`;

// Grid padronizado para Main e Gallery
const SeriesGrid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
    gap: 2.5rem; max-width: 1400px; margin: 0 auto;
`;

// Card padronizado
const Card = styled.div`
    background-color: #0a0a0f; border-radius: 12px; overflow: hidden; cursor: pointer;
    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #1a1a2e;
    display: flex; flex-direction: column;
    &:hover { transform: translateY(-8px); border-color: ${MAX_COLORS.primary}; box-shadow: 0 10px 25px rgba(0, 118, 168, 0.4); }
`;

// Wrapper de imagem com proporção TRAVADA
const ImageWrapper = styled.div`
    width: 100%;
    aspect-ratio: 1 / 1.45; // Padrão capa de livro
    overflow: hidden; background-color: #1a1a2e;
    img { width: 100%; height: 100%; object-fit: cover; } // Garante que preencha sem esticar
`;

// Label com altura mínima para alinhamento
const Label = styled.div`
    padding: 15px 10px; color: #fff; text-align: center; font-size: 0.8rem; font-weight: 700;
    background-color: #1e1e2f; border-top: 1px solid rgba(255, 255, 255, 0.05);
    min-height: 55px; // Altura mínima para alinhar cards com títulos diferentes
    display: flex; align-items: center; justify-content: center;
`;

// --- Estilos do Filtro e Leitor ---
const FilterBar = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 0 1rem; `;
const LangSwitch = styled.div` display: flex; gap: 5px; background: #111; padding: 4px; border-radius: 20px; border: 1px solid #222; button { padding: 6px 20px; background: transparent; color: #444; border: none; cursor: pointer; border-radius: 15px; font-size: 0.7rem; font-weight: bold; transition: 0.3s; &.active { background: ${MAX_COLORS.primary}; color: #fff; } } `;
const CustomSelectWrapper = styled.div` position: relative; display: flex; align-items: center; background: #111; border-radius: 20px; padding: 0 15px; height: 34px; border: 1px solid #222; select { background: none; border: none; color: #fff; font-size: 0.75rem; font-weight: bold; outline: none; cursor: pointer; appearance: none; padding-right: 20px; } .filter-icon { color: ${MAX_COLORS.primary}; font-size: 0.8rem; margin-right: 8px; } .arrow-icon { color: #444; font-size: 0.7rem; position: absolute; right: 12px; pointer-events: none; } `;
const ReaderOverlay = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #000; z-index: 9999; display: flex; flex-direction: column; `;
const ReaderHeader = styled.header` display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: rgba(5,5,5,0.95); border-bottom: 1px solid #111; backdrop-filter: blur(10px); `;

// --- COMPONENTES AUXILIARES ---

const LightNovelReader = ({ volume, onBack, allVolumes, initialLang }) => {
    const [lang, setLang] = useState(initialLang);
    const [currentVol, setCurrentVol] = useState(volume);

    const pdfSource = lang === 'PT' ? (currentVol.pdfUrlPT || currentVol.pdfUrlEN) : currentVol.pdfUrlEN;
    const finalUrl = getUrl(pdfSource, true);

    const getTitle = (v) => (lang === 'PT' ? v.customTitlePT : v.customTitleEN) || `Volume ${v.volNumber}`;

    return (
        <ReaderOverlay>
            <ReaderHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <FaArrowLeft onClick={onBack} style={{cursor: 'pointer', color: MAX_COLORS.primary}} />
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <strong style={{fontSize: '0.9rem', color: '#fff'}}>{getTitle(currentVol)}</strong>
                        <span style={{fontSize: '0.7rem', color: MAX_COLORS.primary}}>{currentVol.arco || 'Geral'}</span>
                    </div>
                </div>
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <select value={currentVol.id} onChange={(e) => setCurrentVol(allVolumes.find(v => v.id === e.target.value))} style={{background: '#111', color: '#fff', border: '1px solid #222', borderRadius: '5px', padding: '5px'}}>
                        {allVolumes.map(v => <option key={v.id} value={v.id}>{getTitle(v)}</option>)}
                    </select>
                    <LangSwitch>
                        <button className={lang === 'PT' ? 'active' : ''} onClick={() => setLang('PT')}>PT</button>
                        <button className={lang === 'EN' ? 'active' : ''} onClick={() => setLang('EN')}>EN</button>
                    </LangSwitch>
                </div>
            </ReaderHeader>
            <div style={{ flexGrow: 1 }}>
                <iframe src={finalUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Reader" referrerPolicy="no-referrer"></iframe>
            </div>
        </ReaderOverlay>
    );
};

const VolumeGallery = ({ ln, onClose }) => {
    const [volumes, setVolumes] = useState([]);
    const [selectedVol, setSelectedVol] = useState(null);
    const [activeArc, setActiveArc] = useState('Todos');
    const [lang, setLang] = useState('PT');

    useEffect(() => {
        const q = query(collection(db, 'lightnovels', ln.id, 'volumes'));
        return onSnapshot(q, s => {
            setVolumes(sortVolumes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        });
    }, [ln.id]);

    const arcs = ['Todos', ...new Set(volumes.map(v => v.arco).filter(Boolean))];
    const filteredVolumes = activeArc === 'Todos' ? volumes : volumes.filter(v => v.arco === activeArc);

    if (selectedVol) return <LightNovelReader volume={selectedVol} onBack={() => setSelectedVol(null)} allVolumes={volumes} initialLang={lang} />;

    return (
        <ReaderOverlay>
            <ReaderHeader>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <FaArrowLeft onClick={onClose} style={{cursor: 'pointer', color: MAX_COLORS.primary}} />
                    <h2 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>{ln.title}</h2>
                </div>
                <FaTimes onClick={onClose} style={{cursor: 'pointer', opacity: 0.5}} />
            </ReaderHeader>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, padding: '2rem 0' }}>
                <FilterBar>
                    <LangSwitch>
                        <button className={lang === 'PT' ? 'active' : ''} onClick={() => setLang('PT')}>PT</button>
                        <button className={lang === 'EN' ? 'active' : ''} onClick={() => setLang('EN')}>EN</button>
                    </LangSwitch>
                    <CustomSelectWrapper>
                        <FaFilter className="filter-icon" />
                        <select value={activeArc} onChange={e => setActiveArc(e.target.value)}>
                            {arcs.map(arc => <option key={arc} value={arc}>{arc === 'Todos' ? 'Todos os Arcos' : arc}</option>)}
                        </select>
                        <FaChevronDown className="arrow-icon" />
                    </CustomSelectWrapper>
                </FilterBar>

                {/* Usa o mesmo SeriesGrid e Card padronizados */}
                <SeriesGrid style={{padding: '0 2rem'}}>
                    {filteredVolumes.map(v => (
                        <Card key={v.id} onClick={() => setSelectedVol(v)}>
                            <ImageWrapper>
                                <img src={getUrl(v.coverUrl)} alt={v.volNumber} referrerPolicy="no-referrer" />
                            </ImageWrapper>
                            <Label>
                                {lang === 'PT' ? (v.customTitlePT || `Volume ${v.volNumber}`) : (v.customTitleEN || `Volume ${v.volNumber}`)}
                            </Label>
                        </Card>
                    ))}
                </SeriesGrid>
            </div>
        </ReaderOverlay>
    );
};

// --- COMPONENTE PRINCIPAL ---
const LightNovel = () => {
    const [list, setList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onSnapshot(collection(db, 'lightnovels'), s => {
            const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
            setList(data.sort((a, b) => a.title.localeCompare(b.title)));
            setLoading(false);
        });
    }, []);

    if (loading) return <Spinner />;

    return (
        <>
            <Header />
            <MainContent>
                <h1 style={{ color: 'white', marginBottom: '3rem', fontSize: '2rem', textAlign: 'center', fontWeight: '800' }}>LIGHT NOVELS</h1>
                {/* Usa o mesmo SeriesGrid e Card padronizados */}
                <SeriesGrid>
                    {list.map(ln => (
                        <Card key={ln.id} onClick={() => setSelected(ln)}>
                            <ImageWrapper>
                                {/* Tenta 'capa' primeiro, se não tiver, usa 'imageUrl' */}
                                <img src={getUrl(ln.capa || ln.imageUrl)} alt={ln.title} referrerPolicy="no-referrer" />
                            </ImageWrapper>
                            <Label>{ln.title}</Label>
                        </Card>
                    ))}
                </SeriesGrid>
            </MainContent>
            {selected && <VolumeGallery ln={selected} onClose={() => setSelected(null)} />}
        </>
    );
};

export default LightNovel;