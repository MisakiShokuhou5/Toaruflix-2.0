// ----------------------------------------------------------------
// ARQUIVO FINAL: src/pages/Manga.jsx (VERSÃO MAX PREMIUM)
// Leitor de mangá robusto com múltiplos modos, zoom, pan e UI refinada.
// ----------------------------------------------------------------
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
// Importação de Ícones React
import { 
    FaTimes, FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, 
    FaExpand, FaCompress, FaFile, FaBookOpen, FaStream
} from 'react-icons/fa';

// --- CONFIGURAÇÃO DE CORES (Paleta Max/HBO Max) ---
const MAX_COLORS = {
    primary: '#0076a8', // Azul principal da Max
    darkBg: '#000000ff', // Fundo Principal
    midBg: '#1a1a1a', // Headers, Footers e Painéis
    textLight: '#f0f0f0',
    textMuted: '#a0a0a0',
    hover: '#0090c0',
};

// --- Styled Components (Componentes de Estilo) ---

const MainContent = styled.main`
    padding: 100px 4rem 4rem 4rem; /* Maior espaçamento */
    background-color: ${MAX_COLORS.darkBg};
    min-height: 100vh;
    color: ${MAX_COLORS.textLight};
`;

const SeriesGrid = styled.div`
    display: grid;
    /* Cards maiores */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
    gap: 2rem; 
`;

const SeriesCard = styled.div`
    background-color: ${MAX_COLORS.midBg};
    border-radius: 8px;
    overflow: hidden;
    text-align: center;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    display: flex;
    flex-direction: column;
    border: 1px solid #333;

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px ${MAX_COLORS.primary}50;
        border-color: ${MAX_COLORS.primary};
    }
`;

const SeriesCover = styled.img`
    width: 100%;
    height: 280px; /* Capas mais altas */
    object-fit: cover;
    flex-shrink: 0;
`;

const SeriesTitle = styled.span`
    padding: 1rem 0.8rem;
    font-weight: 600;
    font-size: 1rem;
    color: ${MAX_COLORS.textLight};
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ReaderOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${MAX_COLORS.darkBg};
    z-index: 2000;
    display: flex;
    flex-direction: column;
    user-select: none;
`;

const ReaderHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 2rem;
    background-color: ${MAX_COLORS.midBg};
    flex-shrink: 0;
    z-index: 20;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    border-bottom: 1px solid #333;
`;

const ReaderTitle = styled.h2`
    font-size: 1.4rem;
    font-weight: 700;
    color: ${MAX_COLORS.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 1rem;
`;

const ReaderControls = styled.div`
    display: flex;
    align-items: center;
    gap: 1.5rem;
    color: ${MAX_COLORS.textLight};
`;

// Otimizando o componente de ícone para usar FaX
const ReaderIconButton = styled.button`
    background: none;
    border: none;
    color: ${MAX_COLORS.textLight};
    font-size: 1.8rem;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    padding: 0;
    display: flex;
    align-items: center;

    &:hover {
        color: ${MAX_COLORS.hover};
        transform: scale(1.1);
    }
`;

const ReaderBody = styled.div`
    flex-grow: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; 
    /* Adiciona um background sutil para o corpo do leitor */
    background-color: #151515; 
`;

const NavButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    ${props => props.position === 'left' ? 'left: 20px;' : 'right: 20px;'}
    
    /* Estilo Premium */
    background-color: ${MAX_COLORS.primary}90; /* Azul semi-transparente */
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    transition: all 0.2s;
    opacity: ${props => props.isInteracting ? 0 : 0.8}; 

    &:hover:not(:disabled) {
        background-color: ${MAX_COLORS.hover};
        transform: scale(1.1) translateY(-50%);
    }

    &:disabled {
        opacity: 0.2;
        cursor: not-allowed;
        background-color: #333;
    }
`;

const PageContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem; /* Mais espaçamento entre páginas duplas */
    transition: transform 0.1s ease-out; /* Transição mais rápida para o pan */
    cursor: ${props => props.isZoomed ? 'grab' : 'default'};
    cursor: ${props => props.isPanning ? 'grabbing' : (props.isZoomed ? 'grab' : 'default')};
    transform: ${props => `translate(${props.pan.x}px, ${props.pan.y}px) scale(${props.zoom})`};
`;

const PageImage = styled.img`
    max-width: ${props => props.isDoublePage ? 'calc(50vw - 3rem)' : 'calc(95vw - 4rem)'};
    max-height: calc(95vh - 100px); /* Ajuste de altura */
    object-fit: contain;
    background-color: #000;
    box-shadow: 0 0 15px rgba(0,0,0,0.7);
    -webkit-user-drag: none;
    border-radius: 4px;
`;

const VerticalPageContainer = styled.div`
    height: 100%;
    width: 100%;
    overflow-y: auto;
    text-align: center;
    padding: 1rem 0;
    &::-webkit-scrollbar { width: 10px; }
    &::-webkit-scrollbar-track { background: ${MAX_COLORS.darkBg}; }
    &::-webkit-scrollbar-thumb { background: ${MAX_COLORS.primary}; border-radius: 5px; }
    &::-webkit-scrollbar-thumb:hover { background: ${MAX_COLORS.hover}; }
`;

const VerticalPageImage = styled.img`
    max-width: 90%;
    width: auto;
    height: auto;
    margin: 10px auto;
    display: block;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    border-radius: 4px;
    -webkit-user-drag: none;
`;

const ReaderFooter = styled.footer`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 2rem;
    background-color: ${MAX_COLORS.midBg};
    flex-shrink: 0;
    z-index: 20;
    border-top: 1px solid #333;
`;

const PageIndicator = styled.span`
    font-size: 1rem;
    font-weight: 500;
    color: ${MAX_COLORS.textMuted};
`;

const CurrentChapterTitle = styled.span`
    font-size: 1rem;
    font-weight: 600;
    color: ${MAX_COLORS.primary};
`;

// --- Leitor de Mangá Aprimorado (Lógica) ---
const MangaReader = ({ manga, onClose }) => {
    // Estado do conteúdo
    const [pages, setPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentChapter, setCurrentChapter] = useState(null); // Para mostrar o nome do capítulo
    
    // Estado da interface e interação
    const [viewMode, setViewMode] = useState('single'); // 'single', 'double', 'vertical'
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Estado do Zoom e Pan
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });

    // Referência ao container para cálculos
    const readerBodyRef = useRef(null);

    // --- CARREGAMENTO DE DADOS ---
    useEffect(() => {
        // Esta é uma simplificação. Em um sistema real, você carregaria capítulos primeiro,
        // e depois as páginas do capítulo selecionado. Aqui, tratamos 'manga' como o container
        // de todas as páginas para simplificar a demonstração de leitura.
        const pagesCollectionRef = collection(db, 'mangas', manga.id, 'pages');
        const q = query(pagesCollectionRef, orderBy('pageNumber'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pagesData = snapshot.docs.map(doc => doc.data());
            setPages(pagesData);
            setLoadingPages(false);
            setCurrentPage(0);
            // Simulação de nome de capítulo (Ajuste conforme sua estrutura de dados real)
            setCurrentChapter(manga.title);
        });
        return () => unsubscribe();
    }, [manga.id, manga.title]);

    // Pré-carregamento de imagens
    useEffect(() => {
        if (pages.length === 0 || viewMode === 'vertical') return;
        const pageIncrement = viewMode === 'double' && currentPage > 0 ? 2 : 1;
        const indicesToPreload = [];
        
        // Pré-carrega a(s) próxima(s) página(s)
        if (currentPage + pageIncrement < pages.length) {
            indicesToPreload.push(currentPage + pageIncrement);
        }
        if (viewMode === 'double' && currentPage + 2 < pages.length) {
             indicesToPreload.push(currentPage + 2);
        }

        indicesToPreload.forEach(index => {
            if (pages[index]) new Image().src = pages[index].imageUrl;
        });
    }, [currentPage, pages, viewMode]);
    
    // --- FUNÇÕES DE CONTROLE ---
    const resetZoomAndPan = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const pageIncrement = viewMode === 'double' && currentPage > 0 ? 2 : 1;

    const goToNextPage = useCallback(() => {
        if (currentPage + pageIncrement < pages.length) {
            setCurrentPage(prev => prev + pageIncrement);
            resetZoomAndPan();
        }
    }, [currentPage, pageIncrement, pages.length, resetZoomAndPan]);

    const goToPrevPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(prev => Math.max(0, prev - pageIncrement));
            resetZoomAndPan();
        }
    }, [currentPage, pageIncrement, resetZoomAndPan]);

    const toggleViewMode = useCallback(() => {
        const modes = ['single', 'double', 'vertical'];
        const nextMode = modes[(modes.indexOf(viewMode) + 1) % modes.length];
        setViewMode(nextMode);
        resetZoomAndPan();
    }, [viewMode, resetZoomAndPan]);

    const handleZoom = useCallback((factor) => {
        setZoom(prev => {
            const newZoom = Math.max(1, Math.min(prev * factor, 5)); // Zoom mínimo 1x, máximo 5x
            if (newZoom === 1) resetZoomAndPan();
            return newZoom;
        });
    }, [resetZoomAndPan]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    // --- LÓGICA DE PAN (ARRASTAR) ---
    const onPanStart = useCallback((e) => {
        if (zoom <= 1 || viewMode === 'vertical') return;
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }, [zoom, pan.x, pan.y, viewMode]);

    const onPanMove = useCallback((e) => {
        if (!isPanning) return;
        e.preventDefault();
        const newX = e.clientX - panStart.current.x;
        const newY = e.clientY - panStart.current.y;
        setPan({ x: newX, y: newY });
    }, [isPanning]);

    const onPanEnd = useCallback(() => {
        setIsPanning(false);
    }, []);

    // --- ATALHOS DE TECLADO E EVENTOS GLOBAIS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (viewMode !== 'vertical') {
                if (e.key === 'ArrowRight') goToNextPage();
                if (e.key === 'ArrowLeft') goToPrevPage();
            }
            if (e.key === 'm' || e.key === 'M') toggleViewMode();
            if (e.key === 'f' || e.key === 'F') toggleFullscreen();
        };
        const handleWheel = (e) => {
            if (e.ctrlKey) { // Zoom com Ctrl + Roda do Mouse
                e.preventDefault();
                handleZoom(e.deltaY > 0 ? 0.9 : 1.1);
            }
        };

        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [onClose, goToNextPage, goToPrevPage, toggleViewMode, toggleFullscreen, handleZoom, viewMode]);

    // --- RENDERIZAÇÃO ---

    const renderPageIndicator = () => {
        const total = pages.length;
        if (viewMode === 'double' && currentPage > 0 && currentPage + 1 < total) {
            return `Páginas ${currentPage + 1}-${currentPage + 2} / ${total}`;
        }
        return `Página ${currentPage + 1} / ${total}`;
    };

    const getModeIcon = () => {
        if (viewMode === 'single') return { icon: <FaBookOpen />, title: 'Modo Duplo (M)' };
        if (viewMode === 'double') return { icon: <FaStream />, title: 'Modo Vertical (M)' };
        return { icon: <FaFile />, title: 'Modo Página Única (M)' };
    };

    const isDoubleView = viewMode === 'double' && currentPage > 0 && currentPage + 1 < pages.length;

    return (
        <ReaderOverlay onMouseMove={onPanMove} onMouseUp={onPanEnd} onMouseLeave={onPanEnd}>
            <ReaderHeader>
                <ReaderTitle>{currentChapter || manga.title}</ReaderTitle>
                <ReaderControls>
                    {viewMode !== 'vertical' && (
                        <>
                           <ReaderIconButton onClick={() => handleZoom(1.25)} title="Aumentar Zoom (Ctrl+Scroll)">
                                <FaSearchPlus />
                           </ReaderIconButton>
                           <ReaderIconButton onClick={() => handleZoom(0.8)} title="Diminuir Zoom (Ctrl+Scroll)">
                                <FaSearchMinus />
                           </ReaderIconButton>
                        </>
                    )}
                    {zoom > 1 && (
                         <ReaderIconButton onClick={resetZoomAndPan} title="Redefinir Zoom">
                             <FaTimes style={{fontSize: '1.4rem'}}/>
                         </ReaderIconButton>
                    )}
                    
                    <ReaderIconButton onClick={toggleViewMode} title={getModeIcon().title}>
                        {getModeIcon().icon}
                    </ReaderIconButton>
                    <ReaderIconButton onClick={toggleFullscreen} title="Tela Cheia (F)">
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </ReaderIconButton>
                    <ReaderIconButton onClick={onClose} title="Fechar (Esc)">
                        <FaTimes />
                    </ReaderIconButton>
                </ReaderControls>
            </ReaderHeader>

            <ReaderBody ref={readerBodyRef}>
                {loadingPages ? <Spinner /> : pages.length === 0 ? (
                    <PageIndicator>Nenhuma página encontrada.</PageIndicator>
                ) : viewMode === 'vertical' ? (
                    <VerticalPageContainer>
                        {pages.map(page => (
                            <VerticalPageImage key={page.pageNumber} src={page.imageUrl} alt={`Página ${page.pageNumber}`} />
                        ))}
                    </VerticalPageContainer>
                ) : (
                    <>
                        <NavButton onClick={goToPrevPage} disabled={currentPage === 0} position="left" isInteracting={isPanning}>
                            <FaChevronLeft />
                        </NavButton>

                        <PageContainer
                            onMouseDown={onPanStart}
                            zoom={zoom}
                            pan={pan}
                            isZoomed={zoom > 1}
                            isPanning={isPanning}
                        >
                            {isDoubleView ? (
                                <>
                                    {/* Páginas são mostradas em ordem decrescente para mangás (direita para esquerda) */}
                                    <PageImage key={pages[currentPage+1].pageNumber} src={pages[currentPage+1].imageUrl} alt={`Página ${currentPage + 2}`} isDoublePage />
                                    <PageImage key={pages[currentPage].pageNumber} src={pages[currentPage].imageUrl} alt={`Página ${currentPage + 1}`} isDoublePage />
                                </>
                            ) : (
                                <PageImage key={pages[currentPage].pageNumber} src={pages[currentPage].imageUrl} alt={`Página ${currentPage + 1}`} />
                            )}
                        </PageContainer>
                        
                        <NavButton onClick={goToNextPage} disabled={currentPage + pageIncrement >= pages.length} position="right" isInteracting={isPanning}>
                            <FaChevronRight />
                        </NavButton>
                    </>
                )}
            </ReaderBody>

            <ReaderFooter>
                <CurrentChapterTitle>{currentChapter || manga.title}</CurrentChapterTitle>
                {pages.length > 0 && !loadingPages && viewMode !== 'vertical' && (
                    <PageIndicator>{renderPageIndicator()}</PageIndicator>
                )}
                <span style={{width: '200px'}}> {/* Espaçador */}</span>
            </ReaderFooter>
        </ReaderOverlay>
    );
};


// --- Página Principal de Mangás (Estilo Max Premium) ---
const Manga = () => {
    const [mangaList, setMangaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReaderOpen, setReaderOpen] = useState(false);
    const [selectedManga, setSelectedManga] = useState(null);

    useEffect(() => {
        const mangasCollectionRef = collection(db, 'mangas');
        const q = query(mangasCollectionRef, orderBy('title'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mangasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMangaList(mangasData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        document.body.style.overflow = isReaderOpen ? 'hidden' : 'auto';
    }, [isReaderOpen]);

    const openReader = (manga) => {
        setSelectedManga(manga);
        setReaderOpen(true);
    };

    const closeReader = () => {
        setReaderOpen(false);
        setSelectedManga(null);
    };

    if (loading) {
        return (
            <>
                <Header />
                <MainContent style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)' }}>
                    <Spinner />
                </MainContent>
            </>
        );
    }

    return (
        <>
            <Header />
            <MainContent>
                <h1 style={{ color: MAX_COLORS.textLight, marginBottom: '2rem', fontSize: '2.5rem' }}>Mangás</h1>
                <SeriesGrid>
                    {mangaList.map(manga => (
                        <SeriesCard key={manga.id} onClick={() => openReader(manga)}>
                            <SeriesCover src={manga.imageUrl || 'https://placehold.co/200x280/1a1a1a/fff?text=Capa'} alt={`Capa de ${manga.title}`} />
                            <SeriesTitle>{manga.title}</SeriesTitle>
                        </SeriesCard>
                    ))}
                </SeriesGrid>
            </MainContent>
            {isReaderOpen && <MangaReader manga={selectedManga} onClose={closeReader} />}
        </>
    );
};

export default Manga;