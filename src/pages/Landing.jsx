// ARQUIVO: src/pages/Landing.jsx
// DESCRIÇÃO: Landing Page com fundo dinâmico colorido, Carrossel de Pôsteres e Info de Privacidade.
// -------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { 
    FaPlayCircle, FaBookOpen, FaBook, 
    FaMusic, FaListOl, FaUsers, FaDatabase, FaShieldAlt 
} from 'react-icons/fa';

import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const ANIME_JSON_BACKUP = [
    "https://wallpapercave.com/wp/wp6098235.jpg",
    "https://animoon-publishing.de/cdn/shop/files/07-18.jpg?v=1711547533&width=1500",
    "https://i.ytimg.com/vi/6dOsskwHifU/maxresdefault.jpg",
    "https://upload.wikimedia.org/wikipedia/it/4/43/A_Certain_Magical_Index_The_Movie_%EF%BC%8DThe_Miracle_of_Endymion.png",
    "https://image.tmdb.org/t/p/original/l7DzITtnEkiyp5CfSNhYbeCXjZZ.jpg",
    "https://wallpapercave.com/wp/wp7799065.jpg",
    "https://image.tmdb.org/t/p/original/7x5e1g89giH5PjK0ACpsXcj2whz.jpg",
    "https://images6.alphacoders.com/750/thumb-1920-750466.png",
    "https://image.tmdb.org/t/p/original/szik5Kiquh9PO3dJhzFJNCpbxcG.jpg",
    "https://i.ytimg.com/vi/wvZaljkzKQc/maxresdefault.jpg"
];

// --- Variáveis de Tema (Starlink/Telemetria) ---
const THEME = {
    bgDark: '#000000',
    border: '#1a1a1a',
    borderFocus: '#ffffff',
    textPrimary: '#ffffff',
    textMuted: '#9aa0a6',
    accent: '#00ffaa',
    danger: '#ff3333',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
};

// --- ESTILOS ---
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const scrollAnimation = keyframes`
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
`;

const PageWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: ${THEME.bgDark}; 
    font-family: ${THEME.fontFamily};
    color: ${THEME.textPrimary};
    overflow-x: hidden;
`;

/* --- BACKGROUND DINÂMICO --- */
const BackgroundGrid = styled.div`
    position: fixed;
    top: -5%; left: -5%;
    width: 110%; height: 110%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 4px;
    background-color: #000;
    opacity: 0.6; /* Devolve a visibilidade do fundo */
    animation: ${fadeIn} 1.5s ease-in-out;
    z-index: 0;

    @media (max-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(8, 1fr);
    }
`;

const BackgroundCard = styled.div`
    background-image: url(${props => props.$bgUrl});
    background-size: cover;
    background-position: center;
    width: 100%; height: 100%;
    /* Removemos o grayscale para mostrar as cores, apenas escurecemos */
    filter: brightness(0.35);
    transition: filter 0.5s ease, transform 0.5s ease;

    &:hover {
        filter: brightness(0.8);
        transform: scale(1.05);
        z-index: 2;
    }
`;

const DarkOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    /* Degradê suave que deixa o topo e centro visíveis, e escurece a base */
    background: radial-gradient(circle at top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 80%);
    
    /* Grade estilo terminal super fina */
    background-image: 
        radial-gradient(circle at top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 80%),
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 100% 100%, 40px 40px, 40px 40px;
    z-index: 1;
`;

/* --- HEADER --- */
const LandingHeader = styled.header`
    position: relative;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 50px;
    z-index: 20;

    @media (max-width: 768px) {
        padding: 20px;
        flex-direction: column;
        gap: 20px;
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
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);

    span { font-weight: 700; }
`;

const SignInButton = styled(Link)`
    background-color: transparent;
    color: ${THEME.textPrimary};
    border: 1px solid ${THEME.textPrimary};
    text-decoration: none;
    padding: 10px 24px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    transition: all 0.2s;
    backdrop-filter: blur(5px);
    
    &:hover {
        background-color: ${THEME.textPrimary};
        color: ${THEME.bgDark};
    }
`;

/* --- MAIN CONTENT --- */
const MainSection = styled.main`
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    width: 100%;
`;

const HeroContainer = styled.div`
    max-width: 800px;
    text-align: center;
    margin-bottom: 50px;
`;

const InfoBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid ${THEME.border};
    padding: 8px 16px;
    margin-bottom: 25px;
    font-size: 0.70rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${THEME.accent};
    backdrop-filter: blur(4px);

    span { color: ${THEME.textPrimary}; font-weight: 700; }
`;

const MainTitle = styled.h1`
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 300;
    margin-bottom: 20px;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 4px;
    text-shadow: 0 4px 20px rgba(0,0,0,0.9);
`;

const CTAText = styled.p`
    font-size: 1rem;
    margin-bottom: 40px;
    font-weight: 400;
    color: #e0e0e0;
    letter-spacing: 1px;
    line-height: 1.6;
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
`;

const CTAForm = styled.form`
    display: flex;
    gap: 10px;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;

    @media (max-width: 600px) { flex-direction: column; }
`;

const EmailInput = styled.input`
    flex-grow: 1;
    padding: 18px 20px;
    font-size: 0.9rem;
    border: 1px solid ${THEME.textPrimary};
    background: rgba(0,0,0,0.8);
    color: ${THEME.textPrimary};
    font-family: ${THEME.fontFamily};
    letter-spacing: 1px;
    transition: 0.3s;

    &::placeholder { color: #888; text-transform: uppercase; letter-spacing: 2px; }
    &:focus { outline: none; background: #000; box-shadow: 0 0 15px rgba(255,255,255,0.2); }
`;

const CTAButton = styled.button`
    background-color: ${THEME.textPrimary};
    color: ${THEME.bgDark};
    border: 1px solid ${THEME.textPrimary};
    padding: 18px 30px;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 3px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    
    &:hover { background-color: transparent; color: ${THEME.textPrimary}; }
    @media (max-width: 600px) { width: 100%; }
`;

/* --- ACERVO / PÔSTERES CAROUSEL --- */
const ShowcaseWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
    margin: 20px 0 60px 0;
    overflow: hidden;
    position: relative;
    
    &::before, &::after {
        content: ''; position: absolute; top: 0; width: 100px; height: 100%; z-index: 5;
    }
    &::before { left: 0; background: linear-gradient(to right, ${THEME.bgDark}, transparent); }
    &::after { right: 0; background: linear-gradient(to left, ${THEME.bgDark}, transparent); }
`;

const ShowcaseTitle = styled.h3`
    font-size: 0.75rem;
    color: ${THEME.textMuted};
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-bottom: 20px;
    text-align: left;
    padding-left: 20px;
    display: flex; align-items: center; gap: 10px;
`;

const MarqueeTrack = styled.div`
    display: flex;
    gap: 15px;
    width: max-content;
    animation: ${scrollAnimation} 40s linear infinite;
    
    &:hover { animation-play-state: paused; }
`;

const PosterImg = styled.img`
    width: 140px;
    height: 200px;
    object-fit: cover;
    border: 1px solid ${THEME.border};
    opacity: 0.8;
    transition: all 0.3s ease;
    cursor: default;

    &:hover {
        opacity: 1;
        transform: scale(1.05);
        border-color: ${THEME.textPrimary};
        box-shadow: 0 10px 20px rgba(0,0,0,0.8);
    }

    @media (max-width: 768px) { width: 110px; height: 160px; }
`;

/* --- MÓDULOS / FEATURES GRID --- */
const ModulesWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
`;

const ModulesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 0 20px;
`;

const ModuleCard = styled.div`
    background: rgba(10, 10, 10, 0.6);
    border: 1px solid ${THEME.border};
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    .icon-wrapper {
        font-size: 1.8rem;
        color: ${THEME.textPrimary};
        margin-bottom: 20px;
    }

    h4 {
        font-size: 0.9rem;
        font-weight: 500;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: ${THEME.textPrimary};
    }

    p {
        font-size: 0.8rem;
        color: ${THEME.textMuted};
        line-height: 1.6;
        letter-spacing: 1px;
        margin: 0;
    }

    &:hover {
        border-color: ${THEME.textPrimary};
        background: rgba(20, 20, 20, 0.9);
        .icon-wrapper { color: ${THEME.accent}; }
    }
`;

const PrivacyDisclaimer = styled.div`
    margin-top: 60px;
    max-width: 800px;
    text-align: center;
    padding: 30px;
    border-top: 1px dashed ${THEME.border};
    
    h4 { color: ${THEME.textPrimary}; font-size: 0.9rem; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    p { color: ${THEME.textMuted}; font-size: 0.8rem; line-height: 1.6; letter-spacing: 1px; }
`;

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
    const [backgroundImages, setBackgroundImages] = useState(ANIME_JSON_BACKUP);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const fetchBackgrounds = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "animes"));
                const dbImages = querySnapshot.docs
                    .map(doc => doc.data().backdropUrl || doc.data().posterUrl) // Pega backdrop ou poster
                    .filter(url => url && url.startsWith('http'));

                const combined = [...ANIME_JSON_BACKUP, ...dbImages];
                const shuffled = shuffleArray(combined);
                
                if (shuffled.length > 0) {
                    setBackgroundImages(shuffled);
                }
            } catch (err) {
                console.error("Erro ao carregar imagens:", err);
            }
        };

        fetchBackgrounds();
    }, []);

    const handleCtaSubmit = (e) => {
        e.preventDefault();
        navigate('/login', { state: { emailPreFilled: email } });
    };

    // Duplicamos o array de imagens para fazer o scroll infinito perfeito
    const marqueeImages = [...backgroundImages, ...backgroundImages];

    return (
        <PageWrapper>
            {/* FUNDO DINÂMICO GRID */}
            <BackgroundGrid>
                {Array(24).fill().map((_, index) => (
                    <BackgroundCard 
                        key={index}
                        $bgUrl={backgroundImages[index % backgroundImages.length]}
                    />
                ))}
            </BackgroundGrid>

            {/* OVERLAY TIPO RADAR E DEGRADÊ */}
            <DarkOverlay />
            
            <LandingHeader>
                <LandingLogo><FaDatabase size={20} color={THEME.textMuted}/> TOARU<span>FLIX</span></LandingLogo>
                <SignInButton to="/login">Acessar Sistema</SignInButton>
            </LandingHeader>

            <MainSection>
                <HeroContainer>
                    <InfoBadge><FaShieldAlt /> STATUS: <span>100% GRATUITO & PRIVADO</span></InfoBadge>
                    <MainTitle>
                        ACERVO GLOBAL<br/>TOARU PROJECT
                    </MainTitle>
                    <CTAText>
                        Transmissão de alta qualidade, sem anúncios. Uma plataforma privada desenvolvida para concentrar todos os arquivos da Cidade Acadêmica em um único servidor restrito.
                    </CTAText>

                    <CTAForm onSubmit={handleCtaSubmit}>
                        <EmailInput 
                            type="email"
                            placeholder="ENDEREÇO DE E-MAIL PARA CADASTRO"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <CTAButton type="submit">Solicitar Acesso</CTAButton>
                    </CTAForm>
                </HeroContainer>

                {/* CARROSSEL DE PÔSTERES (O QUE TEM NA PLATAFORMA) */}
                <ShowcaseWrapper>
                    <ShowcaseTitle><FaPlayCircle /> Registros em Destaque no Banco de Dados</ShowcaseTitle>
                    <MarqueeTrack>
                        {marqueeImages.map((imgUrl, idx) => (
                            <PosterImg key={idx} src={imgUrl} alt="Capa" loading="lazy" />
                        ))}
                    </MarqueeTrack>
                </ShowcaseWrapper>

                {/* DIRETÓRIOS E MÓDULOS */}
                <ModulesWrapper>
                    <ModulesGrid>
                        <ModuleCard>
                            <div className="icon-wrapper"><FaPlayCircle /></div>
                            <h4>[VÍDEO] Animes & Filmes</h4>
                            <p>Assista Index, Railgun, Accelerator e todas as produções cinematográficas com players rápidos e legendas em PT-BR.</p>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaBookOpen /></div>
                            <h4>[TEXTO] Mangás</h4>
                            <p>Leitor integrado no sistema. Acesse os arquivos visuais e acompanhe as adaptações das rotas científicas e mágicas.</p>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaBook /></div>
                            <h4>[ARQUIVO] Light Novels</h4>
                            <p>Biblioteca completa contendo os volumes oficiais e traduções de Old, New e Genesis Testament.</p>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaMusic /></div>
                            <h4>[ÁUDIO] Frequências (OSTs)</h4>
                            <p>Reprodutor de áudio interno com aberturas, encerramentos, trilhas sonoras originais e webrádio local.</p>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaListOl /></div>
                            <h4>[DADOS] Tier List Global</h4>
                            <p>Painel de classificação interativo. Crie rankings atualizados de Espers Nível 5 e Magos Classe Santo.</p>
                        </ModuleCard>

                        <ModuleCard>
                            <div className="icon-wrapper"><FaUsers /></div>
                            <h4>[REDE] Comunidade Restrita</h4>
                            <p>Interaja com outros pesquisadores através da nossa rede linkada aos servidores oficias no Discord.</p>
                        </ModuleCard>
                    </ModulesGrid>
                </ModulesWrapper>

                {/* AVISO FINAL SOBRE PRIVACIDADE E CUSTO */}
                <PrivacyDisclaimer>
                    <h4><FaShieldAlt /> PROTOCOLO DE ACESSO E PRIVACIDADE</h4>
                    <p>O ToaruFlix é um projeto feito de fã para fã, <strong>estritamente sem fins lucrativos e 100% gratuito</strong>. Não cobramos mensalidade nem exibimos anúncios. Devido à natureza do nosso acervo, o servidor é fechado e opera sob um sistema privado de contas para garantir a estabilidade e segurança da comunidade acadêmica.</p>
                </PrivacyDisclaimer>

            </MainSection>
        </PageWrapper>
    );
};

export default Landing;