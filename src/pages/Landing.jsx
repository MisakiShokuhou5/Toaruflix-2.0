import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { 
    FaPlayCircle, FaBookOpen, FaBook, 
    FaMusic, FaListOl, FaUsers, FaDatabase, FaShieldAlt 
} from 'react-icons/fa';

import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// --- FONTES (Inter para leitura, JetBrains Mono para botões/dados) ---
const FONTS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
`;

// --- TEMA STARLINK / BRUTALISTA ---
const THEME = {
    bgDark: '#000000',
    border: 'rgba(255, 255, 255, 0.2)',
    borderFocus: '#ffffff',
    textPrimary: '#ffffff',
    textMuted: '#8c8c8c',
    fontMain: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace"
};

// --- ANIMAÇÕES ---
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const scrollAnimation = keyframes`
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
`;

const blinkCursor = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
`;

// --- ESTILOS PRINCIPAIS ---
const PageWrapper = styled.div`
    ${FONTS}
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: ${THEME.bgDark}; 
    font-family: ${THEME.fontMain};
    color: ${THEME.textPrimary};
    overflow-x: hidden;
`;

/* --- BACKGROUND DINÂMICO --- */
const BackgroundGrid = styled.div`
    position: fixed;
    top: -5%; left: -5%;
    width: 110%; height: 110%;
    display: grid;
    /* No PC exibe os backdrops largos, no mobile vira grid de posters apertados */
    grid-template-columns: repeat(auto-fill, minmax(${props => props.$isMobile ? '120px' : '300px'}, 1fr));
    gap: 4px;
    background-color: ${THEME.bgDark};
    animation: ${fadeIn} 2s ease-in-out;
    z-index: 0;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(8, 1fr);
        gap: 2px;
    }
`;

const BackgroundCard = styled.div`
    background-image: url(${props => props.$bgUrl});
    background-size: cover;
    background-position: center;
    width: 100%; 
    height: ${props => props.$isMobile ? '180px' : '200px'};
    filter: brightness(0.2) grayscale(0.5);
    transition: filter 0.5s ease;

    &:hover { filter: brightness(0.4) grayscale(0); }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        height: 160px;
        filter: brightness(0.2) grayscale(0.2);
    }
`;

const DarkOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: 
        linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%),
        radial-gradient(circle at center, transparent 0%, #000000 100%);
    
    /* Malha Técnica (Radar/Terminal) */
    background-image: 
        linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, #000000 100%),
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 100% 100%, 40px 40px, 40px 40px;
    z-index: 1;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.98) 60%);
    }
`;

/* --- HEADER --- */
const LandingHeader = styled.header`
    position: relative;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 5%;
    z-index: 20;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        flex-direction: column;
        padding: 25px 15px;
        gap: 20px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
    }
`;

const LandingLogo = styled.h1`
    font-size: 1.5rem;
    font-weight: 300;
    color: ${THEME.textPrimary};
    letter-spacing: 6px;
    text-transform: uppercase;
    margin: 0;
    display: flex; align-items: center; gap: 15px;

    span { font-weight: 800; }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        font-size: 1.3rem;
        letter-spacing: 4px;
        justify-content: center;
    }
`;

const SignInButton = styled(Link)`
    background-color: transparent;
    color: ${THEME.textPrimary};
    border: 1px solid ${THEME.border};
    text-decoration: none;
    padding: 12px 24px;
    font-family: ${THEME.fontMono};
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    transition: all 0.2s linear;
    
    &:hover {
        border-color: ${THEME.textPrimary};
        background-color: rgba(255, 255, 255, 0.1);
    }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        width: 100%;
        text-align: center;
        padding: 14px;
        font-size: 0.85rem;
        background-color: rgba(255, 255, 255, 0.05);
    }
`;

/* --- MAIN CONTENT / HERO --- */
const MainSection = styled.main`
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 20px 40px 20px;
    width: 100%;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        padding: 40px 15px 30px 15px;
    }
`;

const HeroContainer = styled.div`
    max-width: 800px;
    text-align: center;
    margin-bottom: 60px;
`;

const SystemTag = styled.div`
    font-family: ${THEME.fontMono};
    font-size: 0.75rem;
    color: ${THEME.textMuted};
    letter-spacing: 3px;
    margin-bottom: 20px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid ${THEME.border};
    padding-bottom: 4px;

    .cursor {
        display: inline-block;
        width: 8px; height: 12px;
        background-color: ${THEME.textPrimary};
        animation: ${blinkCursor} 1s step-end infinite;
    }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        font-size: 0.65rem;
        letter-spacing: 2px;
        margin-bottom: 15px;
    }
`;

const MainTitle = styled.h1`
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 800;
    margin-bottom: 20px;
    line-height: 1.05;
    text-transform: uppercase;
    letter-spacing: -1px;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        font-size: 2.2rem;
        letter-spacing: 0px;
        line-height: 1.1;
        text-shadow: 0 4px 15px rgba(0,0,0,1);
    }
`;

const CTAText = styled.p`
    font-size: 1.1rem;
    margin-bottom: 40px;
    font-weight: 400;
    color: ${THEME.textMuted};
    line-height: 1.6;
    max-width: 650px;
    margin-left: auto; margin-right: auto;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 30px;
        padding: 0 10px;
        color: #b3b3b3;
    }
`;

const CTAForm = styled.form`
    display: flex;
    width: 100%;
    max-width: 550px;
    margin: 0 auto;

    /* Otimização Mobile embutida */
    @media (max-width: 600px) { 
        flex-direction: column; 
        gap: 12px; 
    }
`;

const EmailInput = styled.input`
    flex-grow: 1;
    padding: 16px 20px;
    font-size: 0.9rem;
    border: 1px solid ${THEME.border};
    border-right: none;
    background: rgba(0,0,0,0.6);
    color: ${THEME.textPrimary};
    font-family: ${THEME.fontMono};
    letter-spacing: 1px;
    transition: 0.2s;
    backdrop-filter: blur(5px);

    &::placeholder { color: #555; text-transform: uppercase; }
    &:focus { outline: none; border-color: ${THEME.textPrimary}; background: rgba(0,0,0,0.9); }

    /* Otimização Mobile embutida */
    @media (max-width: 600px) { 
        border-right: 1px solid ${THEME.border}; 
        text-align: center;
        padding: 16px;
        font-size: 0.85rem;
        &::placeholder {
            font-size: 0.75rem;
            letter-spacing: 1px;
        }
    }
`;

const CTAButton = styled.button`
    background-color: ${THEME.textPrimary};
    color: ${THEME.bgDark};
    border: 1px solid ${THEME.textPrimary};
    padding: 16px 32px;
    font-family: ${THEME.fontMono};
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.1s linear;
    white-space: nowrap;
    
    &:hover { background-color: #e6e6e6; }
    &:active { transform: scale(0.98); }

    /* Otimização Mobile embutida */
    @media (max-width: 600px) { 
        width: 100%; 
        padding: 16px;
        font-size: 0.9rem;
    }
`;

/* --- ACERVO / PÔSTERES CAROUSEL --- */
const ShowcaseWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
    margin: 20px 0 80px 0;
    overflow: hidden;
    position: relative;
    
    &::before, &::after {
        content: ''; position: absolute; top: 0; width: 150px; height: 100%; z-index: 5; pointer-events: none;
    }
    &::before { left: 0; background: linear-gradient(to right, ${THEME.bgDark}, transparent); }
    &::after { right: 0; background: linear-gradient(to left, ${THEME.bgDark}, transparent); }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        margin: 10px 0 50px 0;
        &::before, &::after { width: 40px; }
    }
`;

const ShowcaseTitle = styled.h3`
    font-family: ${THEME.fontMono};
    font-size: 0.75rem;
    color: ${THEME.textMuted};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 20px;
    text-align: left;
    padding-left: 20px;
    display: flex; align-items: center; gap: 10px;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        font-size: 0.65rem;
        justify-content: center;
        padding-left: 0;
        margin-bottom: 15px;
    }
`;

const MarqueeTrack = styled.div`
    display: flex;
    gap: 15px;
    width: max-content;
    animation: ${scrollAnimation} 40s linear infinite;
    
    &:hover { animation-play-state: paused; }
`;

const PosterImg = styled.img`
    width: 150px;
    height: 225px; /* Proporção clássica de poster 2:3 */
    object-fit: cover;
    border: 1px solid ${THEME.border};
    opacity: 0.7;
    transition: all 0.2s ease;
    cursor: crosshair; /* Detalhe técnico */

    &:hover {
        opacity: 1;
        border-color: ${THEME.textPrimary};
        box-shadow: 0 0 15px rgba(255,255,255,0.1);
    }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) { 
        width: 110px; 
        height: 165px; 
    }
`;

/* --- MÓDULOS / FEATURES GRID --- */
const ModulesWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
    margin-bottom: 40px;
`;

const ModulesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    padding: 0 20px;

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 15px;
        padding: 0;
    }
`;

const ModuleCard = styled.div`
    background: rgba(15, 15, 15, 0.8);
    border: 1px solid ${THEME.border};
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: all 0.2s linear;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 3px; height: 100%;
        background-color: ${THEME.border};
        transition: background-color 0.2s;
    }

    .icon-wrapper {
        font-size: 1.5rem;
        color: ${THEME.textPrimary};
        margin-bottom: 20px;
    }

    .content-wrapper {
        display: flex;
        flex-direction: column;
    }

    h4 {
        font-family: ${THEME.fontMono};
        font-size: 0.9rem;
        font-weight: 700;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: ${THEME.textPrimary};
    }

    p {
        font-size: 0.9rem;
        color: ${THEME.textMuted};
        line-height: 1.6;
        margin: 0;
    }

    &:hover {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(25, 25, 25, 1);
        &::before { background-color: ${THEME.textPrimary}; }
    }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        padding: 20px;
        flex-direction: row;
        align-items: center;
        gap: 15px;

        .icon-wrapper {
            margin-bottom: 0;
            font-size: 1.8rem;
        }

        h4 {
            font-size: 0.85rem;
            margin-bottom: 5px;
        }

        p {
            font-size: 0.8rem;
            line-height: 1.4;
            -webkit-line-clamp: 2;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
`;

const PrivacyDisclaimer = styled.div`
    margin-top: 60px;
    max-width: 800px;
    text-align: center;
    padding: 30px;
    border-top: 1px dashed ${THEME.border};
    
    h4 { 
        font-family: ${THEME.fontMono};
        color: ${THEME.textMuted}; 
        font-size: 0.8rem; 
        letter-spacing: 2px; 
        text-transform: uppercase; 
        margin-bottom: 15px; 
        display: flex; align-items: center; justify-content: center; gap: 10px; 
    }
    p { 
        color: #777; 
        font-size: 0.85rem; 
        line-height: 1.6; 
        strong { color: #aaa; font-weight: 600; }
    }

    /* Otimização Mobile embutida */
    @media (max-width: 768px) {
        padding: 20px 10px;
        margin-top: 40px;

        h4 {
            font-size: 0.75rem;
            flex-direction: column;
            gap: 5px;
        }

        p {
            font-size: 0.75rem;
            text-align: justify;
        }
    }
`;

// Função auxiliar para embaralhar o array
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const Landing = () => {
    const navigate = useNavigate();
    const [imagesData, setImagesData] = useState([]);
    const [email, setEmail] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchBackgrounds = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "animes"));
                const dbImages = querySnapshot.docs.map(doc => ({
                    poster: doc.data().posterUrl,
                    backdrop: doc.data().backdropUrl
                })).filter(img => img.poster || img.backdrop);

                const shuffled = shuffleArray(dbImages);
                setImagesData(shuffled);
            } catch (err) {
                console.error("Erro ao carregar telemetria de imagens:", err);
            }
        };
        fetchBackgrounds();
    }, []);

    const handleCtaSubmit = (e) => {
        e.preventDefault();
        navigate('/login', { state: { emailPreFilled: email } });
    };

    // Para o Carousel sempre usamos Poster. Para o Fundo, depende da tela.
    const carouselImages = imagesData.map(data => data.poster || data.backdrop).filter(Boolean);
    const marqueeImages = [...carouselImages, ...carouselImages]; // Duplica para scroll infinito

    // Imagens para o Grid de Fundo
    const gridImages = imagesData.map(data => isMobile ? (data.poster || data.backdrop) : (data.backdrop || data.poster)).filter(Boolean);
    // Preenche com repetições caso haja poucos animes cadastrados
    const filledGridImages = [...gridImages, ...gridImages, ...gridImages].slice(0, 24);

    return (
        <PageWrapper>
            {/* FUNDO DINÂMICO (Backdrop no PC, Poster no Mobile) */}
            <BackgroundGrid $isMobile={isMobile}>
                {filledGridImages.map((imgUrl, index) => (
                    <BackgroundCard 
                        key={index}
                        $bgUrl={imgUrl}
                        $isMobile={isMobile}
                    />
                ))}
            </BackgroundGrid>

            {/* OVERLAY ESCURO E TÉCNICO */}
            <DarkOverlay />
            
            <LandingHeader>
                <LandingLogo><FaDatabase size={20} color={THEME.textPrimary}/> TOARU<span>FLIX</span></LandingLogo>
                <SignInButton to="/login">ACESSAR SISTEMA</SignInButton>
            </LandingHeader>

            <MainSection>
                <HeroContainer>
                    <SystemTag>
                        STATUS: ONLINE // REDE PRIVADA <span className="cursor"></span>
                    </SystemTag>
                    <MainTitle>
                        ACERVO GLOBAL<br/>TOARU PROJECT
                    </MainTitle>
                    <CTAText>
                        Transmissão de dados em alta fidelidade. Uma plataforma restrita e descentralizada, desenvolvida para indexar todos os arquivos da Cidade Acadêmica em um único servidor.
                    </CTAText>

                    <CTAForm onSubmit={handleCtaSubmit}>
                        <EmailInput 
                            type="email"
                            placeholder="INSERIR CREDENCIAL DE E-MAIL..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <CTAButton type="submit">SOLICITAR UPLINK</CTAButton>
                    </CTAForm>
                </HeroContainer>

                {/* CARROSSEL DE PÔSTERES (SEMPRE POSTER) */}
                {marqueeImages.length > 0 && (
                    <ShowcaseWrapper>
                        <ShowcaseTitle><FaPlayCircle /> ARQUIVOS INDEXADOS RECENTEMENTE</ShowcaseTitle>
                        <MarqueeTrack>
                            {marqueeImages.map((imgUrl, idx) => (
                                <PosterImg key={idx} src={imgUrl} alt="Registro de Arquivo" loading="lazy" />
                            ))}
                        </MarqueeTrack>
                    </ShowcaseWrapper>
                )}

                {/* PAINÉIS DE MÓDULOS */}
                <ModulesWrapper>
                    <ModulesGrid>
                        <ModuleCard>
                            <div className="icon-wrapper"><FaPlayCircle /></div>
                            <div className="content-wrapper">
                                <h4>[MOD_01] VÍDEO</h4>
                                <p>Assista Index, Railgun, Accelerator e produções cinematográficas com player otimizado e legendas em PT-BR.</p>
                            </div>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaBookOpen /></div>
                            <div className="content-wrapper">
                                <h4>[MOD_02] MANGÁS</h4>
                                <p>Leitor integrado ao sistema central. Acesse os arquivos visuais das rotas científicas e mágicas diretamente.</p>
                            </div>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaBook /></div>
                            <div className="content-wrapper">
                                <h4>[MOD_03] LIGHT NOVELS</h4>
                                <p>Biblioteca contendo os volumes oficiais e traduções de Old, New e Genesis Testament. Dados descriptografados.</p>
                            </div>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaMusic /></div>
                            <div className="content-wrapper">
                                <h4>[MOD_04] ÁUDIO</h4>
                                <p>Reprodutor de frequências com aberturas, encerramentos, trilhas sonoras originais e acesso à webrádio local.</p>
                            </div>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaListOl /></div>
                            <div className="content-wrapper">
                                <h4>[MOD_05] TIER LIST</h4>
                                <p>Painel de classificação interativo. Crie rankings atualizados de Espers Nível 5 e Magos Classe Santo.</p>
                            </div>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaUsers /></div>
                            <div className="content-wrapper">
                                <h4>[MOD_06] COMUNIDADE</h4>
                                <p>Interaja com outros pesquisadores através da nossa rede sincronizada com os servidores oficiais no Discord.</p>
                            </div>
                        </ModuleCard>
                    </ModulesGrid>
                </ModulesWrapper>

                {/* AVISO FINAL */}
                <PrivacyDisclaimer>
                    <h4><FaShieldAlt /> PROTOCOLO DE SEGURANÇA</h4>
                    <p>O ToaruFlix é um projeto de código aberto mantido por pesquisadores, <strong>estritamente sem fins lucrativos e gratuito</strong>. Não cobramos mensalidade nem exibimos anúncios comerciais. Operamos sob um sistema privado para garantir estabilidade da rede da Cidade Acadêmica.</p>
                </PrivacyDisclaimer>

            </MainSection>
        </PageWrapper>
    );
};

export default Landing;