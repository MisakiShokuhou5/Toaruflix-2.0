// ----------------------------------------------------------------
// ARQUIVO FINAL: src/pages/LightNovel.jsx (SUPORTE A CONTEÚDO EN)
// ----------------------------------------------------------------
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
import { FaCog, FaTimes, FaArrowUp, FaArrowLeft, FaArrowRight, FaBookOpen } from 'react-icons/fa';

// --- TRADUÇÕES DE INTERFACE ---
const TRANSLATIONS = {
    pt: {
        title: 'Light Novels',
        continueReading: 'Continuar (Cap. {chap})',
        loading: 'Carregando...',
        noChapter: 'Nenhum capítulo encontrado.',
        prevChapter: 'Capítulo Anterior',
        nextChapter: 'Próximo Capítulo',
        settingsTitle: 'Configurações',
        theme: 'Tema',
        fontSize: 'Tamanho da Fonte',
        textWidth: 'Largura do Texto',
        lineHeight: 'Altura da Linha',
        alignment: 'Alinhamento',
        alignLeft: 'Esquerda',
        alignJustify: 'Justificado',
        language: 'Idioma / Language',
        themes: { light: 'Claro', sepia: 'Sépia', dark: 'Escuro' },
        chapterPrefix: 'Cap.',
        close: 'Fechar'
    },
    en: {
        title: 'Light Novels',
        continueReading: 'Continue (Ch. {chap})',
        loading: 'Loading...',
        noChapter: 'No chapters found.',
        prevChapter: 'Previous Chapter',
        nextChapter: 'Next Chapter',
        settingsTitle: 'Settings',
        theme: 'Theme',
        fontSize: 'Font Size',
        textWidth: 'Text Width',
        lineHeight: 'Line Height',
        alignment: 'Alignment',
        alignLeft: 'Left',
        alignJustify: 'Justified',
        language: 'Language / Idioma',
        themes: { light: 'Light', sepia: 'Sepia', dark: 'Dark' },
        chapterPrefix: 'Ch.',
        close: 'Close'
    }
};

// --- CORES & STYLES (Mantidos) ---
const MAX_COLORS = {
    primary: '#0076a8', darkBg: '#000000ff', midBg: '#020202ff',
    textLight: '#f0f0f0', textMuted: '#a0a0a0', hover: '#0090c0', accent: '#8a2be2',
};

const fadeIn = keyframes` from { opacity: 0; } to { opacity: 1; } `;
const slideIn = keyframes` from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } `;

const MainContent = styled.main` padding: 100px 4rem 4rem 4rem; background-color: ${MAX_COLORS.darkBg}; min-height: 100vh; `;
const SeriesGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 2rem; `;
const SeriesCard = styled.div` background-color: ${MAX_COLORS.midBg}; border-radius: 8px;  text-align: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; border: 1px solid #333; &:hover { transform: translateY(-3px); box-shadow: 0 10px 30px ${MAX_COLORS.primary}50; border-color: ${MAX_COLORS.primary}; } `;
const SeriesCover = styled.img` width: 100%; height: 280px; object-fit: cover; flex-shrink: 0; `;
const SeriesTitle = styled.span` padding: 1rem 0.8rem; font-weight: 600; font-size: 1rem; color: ${MAX_COLORS.textLight}; flex-grow: 1; display: flex; align-items: center; justify-content: center; `;
const ReaderOverlay = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: ${MAX_COLORS.darkBg}; z-index: 2000; display: flex; flex-direction: column; user-select: text; animation: ${fadeIn} 0.3s ease; `;
const ReaderHeader = styled.header` display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 2rem; background-color: ${MAX_COLORS.midBg}; flex-shrink: 0; z-index: 2010; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.98); border-bottom: 1px solid #333; `;
const ReaderTitle = styled.h2` font-size: 1.4rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 1rem; color: ${MAX_COLORS.primary}; `;
const ReaderControls = styled.div` display: flex; align-items: center; gap: 1.5rem; position: relative; `;
const ReaderIconBtn = styled.button` background: none; border: none; color: ${MAX_COLORS.textLight}; font-size: 1.8rem; cursor: pointer; transition: color 0.2s, transform 0.2s; padding: 0; &:hover { color: ${MAX_COLORS.primary}; transform: scale(1.1); } `;
const ChapterSelector = styled.select` background-color: #2a2a2a; color: ${MAX_COLORS.textLight}; border: 1px solid #444; border-radius: 4px; padding: 0.6rem 1rem; font-size: 1rem; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f0f0f0'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; min-width: 250px; `;
const themes = { light: { bg: '#ffffff', text: '#121212' }, sepia: { bg: '#fbf0d9', text: '#5b4636' }, dark: { bg: '#1c1c1c', text: '#e5e5e5' } };
const ReaderBody = styled.div` flex-grow: 1; overflow-y: auto; padding: 3rem 0; display: flex; justify-content: center; position: relative; transition: background-color 0.3s ease; background-color: ${props => themes[props.theme].bg}; &::-webkit-scrollbar { width: 10px; } &::-webkit-scrollbar-track { background: ${MAX_COLORS.darkBg}; } &::-webkit-scrollbar-thumb { background: ${MAX_COLORS.primary}; border-radius: 5px; } `;
const ChapterContent = styled.div` font-family: 'Georgia', serif; white-space: pre-wrap; width: 100%; transition: all 0.3s ease; padding: 3rem 4rem; max-width: ${props => props.textWidth}px; font-size: ${props => props.fontSize}px; line-height: ${props => props.lineHeight}; text-align: ${props => props.textAlign}; color: ${props => themes[props.theme].text}; min-height: 100%; box-sizing: border-box; `;
const ChapterTitle = styled.h3` font-size: 2.5em; font-weight: 800; margin-bottom: 2.5rem; text-align: center; `;
const ReaderFooter = styled.footer` display: flex; justify-content: center; align-items: center; padding: 0.8rem 2rem; background-color: ${MAX_COLORS.midBg}; flex-shrink: 0; z-index: 2010; gap: 4rem; border-top: 1px solid #333; `;
const NavButton = styled.button` background-color: ${MAX_COLORS.midBg}; border: 1px solid ${MAX_COLORS.primary}80; color: ${MAX_COLORS.textLight}; font-size: 1rem; padding: 0.8rem 2rem; border-radius: 5px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; &:hover:not(:disabled) { background-color: ${MAX_COLORS.primary}; border-color: ${MAX_COLORS.primary}; } &:disabled { opacity: 0.3; cursor: not-allowed; } `;
const SettingsPanel = styled.div` position: absolute; top: 110%; right: 0; background-color: ${MAX_COLORS.midBg}; border-radius: 8px; padding: 1.5rem; z-index: 2100; box-shadow: 0 5px 15px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 1.5rem; width: 320px; animation: ${slideIn} 0.2s ease-out; border: 1px solid ${MAX_COLORS.primary}50; `;
const SettingRow = styled.div` display: flex; flex-direction: column; gap: 0.8rem; `;
const SettingLabel = styled.label` font-size: 1rem; color: ${MAX_COLORS.textMuted}; display: flex; justify-content: space-between; align-items: center; & > span { font-weight: bold; color: ${MAX_COLORS.textLight}; } `;
const SettingControl = styled.div` display: flex; align-items: center; gap: 0.8rem; `;
const ThemeButton = styled.button` width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${props => props.isActive ? MAX_COLORS.primary : '#555'}; cursor: pointer; background-color: ${props => props.color}; transition: border-color 0.2s, transform 0.2s; &:hover { transform: scale(1.1); } &::after { content: '${props => props.name.slice(0, 1)}'; color: ${props => props.color === themes.dark.bg ? MAX_COLORS.textLight : '#333'}; font-size: 1rem; font-weight: bold; line-height: 40px; display: block; } `;
const CustomSlider = styled.input.attrs({ type: 'range' })` -webkit-appearance: none; width: 100%; height: 8px; background: #444; border-radius: 5px; outline: none; &::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: ${MAX_COLORS.primary}; cursor: pointer; border-radius: 50%; } `;
const ToggleButtonGroup = styled.div` display: flex; border: 1px solid #555; border-radius: 5px; overflow: hidden; width: 100%; `;
const ToggleButton = styled.button` flex: 1; padding: 0.6rem; background-color: ${props => props.isActive ? MAX_COLORS.primary : '#333'}; color: white; border: none; cursor: pointer; transition: background-color 0.2s; &:not(:last-child) { border-right: 1px solid #555; } `;
const ScrollToTopButton = styled.button` position: fixed; bottom: 100px; right: 30px; z-index: 2020; background-color: ${MAX_COLORS.primary}; color: white; border: none; border-radius: 50%; width: 50px; height: 50px; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6); opacity: ${props => props.visible ? 1 : 0}; transform: ${props => props.visible ? 'scale(1)' : 'scale(0.5)'}; pointer-events: ${props => props.visible ? 'auto' : 'none'}; transition: all 0.3s; &:hover { background-color: ${MAX_COLORS.hover}; transform: scale(1.1); } `;

// --- PERSISTÊNCIA ---
const PROGRESS_STORAGE_KEY = 'lightNovelProgress';
const SETTINGS_STORAGE_KEY = 'lightNovelReaderSettings';
const saveProgress = (id, idx) => localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}'), [id]: idx }));
const loadProgress = (id) => (JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}')[id] || 0);
const getInitialSettings = () => {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        return { fontSize: 18, theme: 'dark', textWidth: 800, lineHeight: 1.8, textAlign: 'left', language: 'pt', ...parsed };
    } catch { return { fontSize: 18, theme: 'dark', textWidth: 800, lineHeight: 1.8, textAlign: 'left', language: 'pt' }; }
};

// --- COMPONENTE READER ---
const LightNovelReader = ({ lightNovel, onClose }) => {
    const [chapters, setChapters] = useState([]);
    const [loadingChapters, setLoadingChapters] = useState(true);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(() => loadProgress(lightNovel.id));
    const [settings, setSettings] = useState(getInitialSettings);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const readerBodyRef = useRef(null);
    const settingsPanelRef = useRef(null);

    // Tradução da interface
    const t = TRANSLATIONS[settings.language] || TRANSLATIONS['pt'];
    const isEn = settings.language === 'en';

    useEffect(() => { if (!loadingChapters) saveProgress(lightNovel.id, currentChapterIndex); }, [currentChapterIndex, lightNovel.id, loadingChapters]);
    useEffect(() => { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); }, [settings]);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'lightnovels', lightNovel.id, 'chapters'), orderBy('chapterNumber')), snapshot => {
            setChapters(snapshot.docs.map(doc => doc.data()));
            setLoadingChapters(false);
        });
        return () => unsubscribe();
    }, [lightNovel.id]);

    useEffect(() => { if (readerBodyRef.current) readerBodyRef.current.scrollTop = 0; }, [currentChapterIndex]);

    useEffect(() => {
        const body = readerBodyRef.current;
        const handleScroll = () => setShowScrollTop(body?.scrollTop > 400);
        body?.addEventListener('scroll', handleScroll);
        return () => body?.removeEventListener('scroll', handleScroll);
    }, [loadingChapters]);

    // Lógica de conteúdo multilíngue
    const currentChapter = chapters[currentChapterIndex];
    // Se estiver em inglês e tiver título em inglês, usa. Senão, usa português.
    const displayTitle = currentChapter ? (isEn && currentChapter.title_en ? currentChapter.title_en : currentChapter.title) : '';
    // Se estiver em inglês e tiver conteúdo em inglês, usa. Senão, usa português.
    const displayContent = currentChapter ? (isEn && currentChapter.content_en ? currentChapter.content_en : currentChapter.content) : '';
    const novelDisplayTitle = isEn && lightNovel.title_en ? lightNovel.title_en : lightNovel.title;

    return (
        <ReaderOverlay>
            <ReaderHeader>
                <ReaderTitle>{novelDisplayTitle}</ReaderTitle>
                <ReaderControls>
                    {chapters.length > 0 && (
                        <ChapterSelector value={currentChapterIndex} onChange={(e) => setCurrentChapterIndex(parseInt(e.target.value, 10))}>
                            {chapters.map((chap, index) => {
                                // Título do select também muda
                                const chapTitle = isEn && chap.title_en ? chap.title_en : chap.title;
                                return (
                                    <option key={chap.chapterNumber} value={index}>
                                        {t.chapterPrefix} {chap.chapterNumber}: {chapTitle}
                                    </option>
                                );
                            })}
                        </ChapterSelector>
                    )}
                    <div ref={settingsPanelRef}>
                        <ReaderIconBtn onClick={() => setSettingsOpen(p => !p)} title={t.settingsTitle}><FaCog /></ReaderIconBtn>
                        {isSettingsOpen && (
                            <SettingsPanel>
                                <SettingRow>
                                    <SettingLabel>{t.language}</SettingLabel>
                                    <ToggleButtonGroup>
                                        <ToggleButton isActive={settings.language === 'pt'} onClick={() => setSettings(p => ({ ...p, language: 'pt' }))}>Português</ToggleButton>
                                        <ToggleButton isActive={settings.language === 'en'} onClick={() => setSettings(p => ({ ...p, language: 'en' }))}>English</ToggleButton>
                                    </ToggleButtonGroup>
                                </SettingRow>
                                <SettingRow>
                                    <SettingLabel>{t.theme}</SettingLabel>
                                    <SettingControl>
                                        {Object.keys(themes).map(key => (
                                            <ThemeButton key={key} name={t.themes[key]} color={themes[key].bg} isActive={settings.theme === key} onClick={() => setSettings(p => ({ ...p, theme: key }))} />
                                        ))}
                                    </SettingControl>
                                </SettingRow>
                                <SettingRow>
                                    <SettingLabel>{t.fontSize}: <span>{settings.fontSize}px</span></SettingLabel>
                                    <CustomSlider min="14" max="36" value={settings.fontSize} onChange={(e) => setSettings(p => ({ ...p, fontSize: parseInt(e.target.value, 10) }))} />
                                </SettingRow>
                                <SettingRow>
                                    <SettingLabel>{t.textWidth}: <span>{settings.textWidth}px</span></SettingLabel>
                                    <CustomSlider min="600" max="1200" step="50" value={settings.textWidth} onChange={(e) => setSettings(p => ({ ...p, textWidth: parseInt(e.target.value, 10) }))} />
                                </SettingRow>
                                <SettingRow>
                                    <SettingLabel>{t.lineHeight}: <span>{settings.lineHeight.toFixed(1)}</span></SettingLabel>
                                    <CustomSlider min="1.4" max="2.4" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings(p => ({ ...p, lineHeight: parseFloat(e.target.value) }))} />
                                </SettingRow>
                                <SettingRow>
                                    <SettingLabel>{t.alignment}</SettingLabel>
                                    <ToggleButtonGroup>
                                        <ToggleButton isActive={settings.textAlign === 'left'} onClick={() => setSettings(p => ({ ...p, textAlign: 'left' }))}>{t.alignLeft}</ToggleButton>
                                        <ToggleButton isActive={settings.textAlign === 'justify'} onClick={() => setSettings(p => ({ ...p, textAlign: 'justify' }))}>{t.alignJustify}</ToggleButton>
                                    </ToggleButtonGroup>
                                </SettingRow>
                            </SettingsPanel>
                        )}
                    </div>
                    <ReaderIconBtn onClick={onClose} title={t.close}><FaTimes /></ReaderIconBtn>
                </ReaderControls>
            </ReaderHeader>

            <ReaderBody ref={readerBodyRef} theme={settings.theme}>
                {loadingChapters ? <Spinner /> : !currentChapter ? (
                    <p style={{ color: themes[settings.theme].text }}>{t.noChapter}</p>
                ) : (
                    <ChapterContent {...settings} theme={settings.theme}>
                        <ChapterTitle>{displayTitle}</ChapterTitle>
                        {displayContent}
                    </ChapterContent>
                )}
                <ScrollToTopButton visible={showScrollTop} onClick={() => readerBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}><FaArrowUp /></ScrollToTopButton>
            </ReaderBody>

            <ReaderFooter>
                <NavButton onClick={() => setCurrentChapterIndex(p => p - 1)} disabled={currentChapterIndex === 0}><FaArrowLeft /> {t.prevChapter}</NavButton>
                <NavButton onClick={() => setCurrentChapterIndex(p => p + 1)} disabled={currentChapterIndex >= chapters.length - 1}>{t.nextChapter} <FaArrowRight /></NavButton>
            </ReaderFooter>
        </ReaderOverlay>
    );
};

// --- COMPONENTE PRINCIPAL ---
const LightNovel = () => {
    const [novelList, setNovelList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReaderOpen, setReaderOpen] = useState(false);
    const [selectedNovel, setSelectedNovel] = useState(null);
    const [mainLang, setMainLang] = useState(getInitialSettings().language);

    const t = TRANSLATIONS[mainLang] || TRANSLATIONS['pt'];
    const isEn = mainLang === 'en';

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'lightnovels'), orderBy('title')), snapshot => {
            setNovelList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const closeReader = () => {
        setReaderOpen(false);
        setSelectedNovel(null);
        setMainLang(getInitialSettings().language);
    };

    if (loading) return <><Header /><MainContent style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)' }}><Spinner /></MainContent></>;
    const progressData = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');

    return (
        <>
            <Header />
            <MainContent>
                <h1 style={{ color: MAX_COLORS.textLight, marginBottom: '2rem', fontSize: '2.5rem' }}>{t.title}</h1>
                <SeriesGrid>
                    {novelList.map(novel => {
                        const lastChapterIndex = progressData[novel.id] || 0;
                        // Título do card também muda na lista principal
                        const cardTitle = isEn && novel.title_en ? novel.title_en : novel.title;

                        return (
                            <SeriesCard key={novel.id} onClick={() => { setSelectedNovel(novel); setReaderOpen(true); }}>
                                <SeriesCover src={novel.imageUrl || 'https://placehold.co/200x280/1e1e1e/fff?text=Capa'} alt={`Capa de ${cardTitle}`} />
                                <SeriesTitle>{cardTitle}</SeriesTitle>
                                {lastChapterIndex > 0 && (
                                    <div style={{ padding: '0.5rem', backgroundColor: MAX_COLORS.primary, color: 'white', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                        <FaBookOpen /> {t.continueReading.replace('{chap}', lastChapterIndex + 1)}
                                    </div>
                                )}
                            </SeriesCard>
                        );
                    })}
                </SeriesGrid>
            </MainContent>
            {isReaderOpen && <LightNovelReader lightNovel={selectedNovel} onClose={closeReader} />}
        </>
    );
};

export default LightNovel;