import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FaShieldAlt, FaExclamationTriangle, FaMicrochip } from 'react-icons/fa';

// --- TEMA ESTILO PRETO E BRANCO MINIMALISTA ---
const THEME = {
    bgDark: '#000000',
    textPrimary: '#ffffff',
    textMuted: '#888888',
    fontMain: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace"
};

const GlobalStyle = createGlobalStyle`
    body {
        background-color: ${THEME.bgDark};
        color: ${THEME.textPrimary};
        font-family: ${THEME.fontMain};
        margin: 0;
        padding: 0;
    }
`;

const PageWrapper = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 120px 20px 50px 20px; 
    position: relative;

    /* FUNDO DINÂMICO DO JSON */
    background-image: url('${props => props.$bgImage}'); 
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    transition: background-image 0.5s ease-in-out;

    /* Overlay escuro para destacar o texto branco */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.98) 100%);
        z-index: 1;
    }

    @media (max-width: 768px) {
        padding: 100px 15px 30px 15px;
    }
`;

// Container totalmente sem bordas laterais
const PrivacyContainer = styled.div`
    width: 100%;
    max-width: 800px;
    line-height: 1.8;
    background: transparent;
    border: none;
    padding: 20px 0; /* Apenas respiro em cima e embaixo, lados livres */
    position: relative;
    z-index: 2; 

    @media (max-width: 768px) {
        padding: 10px;
    }
`;

const HeaderSection = styled.div`
    border-bottom: 1px solid #333333;
    padding-bottom: 30px;
    margin-bottom: 40px;
`;

const SystemTag = styled.div`
    font-family: ${THEME.fontMono};
    font-size: 0.75rem;
    color: ${THEME.textMuted};
    letter-spacing: 2px;
    margin-bottom: 15px;
    text-transform: uppercase;
`;

const Title = styled.h1`
    font-size: 2.2rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: -1px;
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 768px) {
        font-size: 1.6rem;
    }
`;

const Subtitle = styled.h2`
    font-family: ${THEME.fontMono};
    font-size: 1.1rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    margin-top: 50px;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const Section = styled.section`
    margin-bottom: 40px;
    
    p { margin-bottom: 15px; color: #bbbbbb; font-size: 1rem; }
    ul { list-style: none; margin-left: 0; padding-left: 0; color: #bbbbbb; }
    
    li { 
        margin-bottom: 12px; 
        font-size: 1rem; 
        line-height: 1.6; 
        position: relative;
        padding-left: 20px;
    }
    
    /* Marcador de lista minimalista branco */
    li::before {
        content: '■';
        position: absolute;
        left: 0;
        color: #ffffff;
        font-size: 0.6rem;
        top: 6px;
    }

    strong { color: ${THEME.textPrimary}; font-weight: 600; }
`;

// Caixa de aviso adaptada para Preto e Branco
const Warning = styled.div`
    background-color: rgba(255, 255, 255, 0.03);
    color: ${THEME.textPrimary};
    padding: 25px;
    border: none;
    // border-left: 3px solid #ffffff;
    font-family: ${THEME.fontMono};
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 50px;
    display: flex;
    gap: 20px;
    align-items: flex-start;

    .icon { font-size: 1.4rem; flex-shrink: 0; margin-top: 2px; color: #ffffff; }

    @media (max-width: 768px) {
        padding: 20px;
        flex-direction: column;
        gap: 15px;
    }
`;

// Créditos adaptados para Preto e Branco
const DevCredit = styled.div`
    background: transparent;
    border: 1px solid #ffffff;
    color: ${THEME.textPrimary};
    padding: 20px;
    font-family: ${THEME.fontMono};
    font-size: 0.9rem;
    margin-top: 25px;
    display: inline-block;
    letter-spacing: 1px;
`;

const Privacy = () => {
    const currentYear = new Date().getFullYear();
    
    // Estado do fundo dinâmico
    const [backgroundImage, setBackgroundImage] = useState('https://image.tmdb.org/t/p/original/8Z2NOJ1X5Dq2NuuWk9A1h6Zf4S.jpg');

    useEffect(() => {
        const fetchBackgroundFromJSON = async () => {
            try {
                const response = await fetch('https://a-certain-digital-database.netlify.app/src/json/Anime.json');
                const data = await response.json();
                
                let allImages = [];

                Object.values(data).forEach(franchise => {
                    if (Array.isArray(franchise)) {
                        franchise.forEach(anime => {
                            if (anime.FundoImagem) allImages.push(anime.FundoImagem);
                        });
                    } else {
                        Object.values(franchise).forEach(anime => {
                            if (anime.FundoImagem) allImages.push(anime.FundoImagem);
                        });
                    }
                });

                if (allImages.length > 0) {
                    const randomImg = allImages[Math.floor(Math.random() * allImages.length)];
                    setBackgroundImage(randomImg);
                }
            } catch (error) {
                console.error("Erro ao puxar imagem de fundo do JSON:", error);
            }
        };

        fetchBackgroundFromJSON();
    }, []);

    return (
        <PageWrapper $bgImage={backgroundImage}>
            <GlobalStyle />
            {/* INJEÇÃO SEGURA DAS FONTES */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');`}
            </style>
            
            <PrivacyContainer>
                <HeaderSection>
                    <SystemTag>SISTEMA WEB NEXORA {currentYear}</SystemTag>
                    <Title><FaShieldAlt /> Termos de Uso</Title>
                    <p style={{ color: '#ffffff', fontFamily: THEME.fontMono, fontSize: '0.85rem', margin: 0, letterSpacing: '1px' }}>
                        STATUS DO SITE: ONLINE E OTIMIZADO
                    </p>
                </HeaderSection>

                <Warning>
                    <FaExclamationTriangle className="icon" />
                    <div>
                        <strong>AVISO:</strong> A ToaruFlix é um projeto independente feito por fãs, sem fins lucrativos e sem vínculo oficial com os criadores da obra original.
                    </div>
                </Warning>

                <Section>
                    <Subtitle><FaMicrochip /> ARMAZENAMENTO LOCAL</Subtitle>
                    <p>
                        Este site utiliza tecnologias simples do navegador como <strong>LocalStorage</strong> para salvar algumas informações básicas no seu dispositivo.
                    </p>
                    <p>
                        Esses dados são usados apenas para melhorar sua experiência no site, como por exemplo:
                    </p>

                    <ul>
                        <li>Guardar preferências do usuário.</li>
                        <li>Lembrar algumas configurações do site.</li>
                        <li>Manter sua sessão ativa enquanto navega.</li>
                    </ul>

                    <p>
                        Nenhuma informação sensível é coletada ou compartilhada com terceiros. O foco é total no desempenho.
                    </p>
                </Section>

                <Section>
                    <Subtitle>DESENVOLVIMENTO</Subtitle>
                    <p>
                        Este projeto foi desenvolvido de forma independente como parte de estudos e experimentos com desenvolvimento web, focado em entregar a melhor performance para a comunidade.
                    </p>

                    <DevCredit>
                        &gt; DESENVOLVIDO POR: <strong>back-end-nexora</strong>
                    </DevCredit>
                </Section>

                <div style={{ marginTop: '80px', borderTop: `1px solid #333333`, paddingTop: '30px', textAlign: 'center' }}>
                    <p style={{ fontFamily: THEME.fontMono, fontSize: '0.8rem', color: THEME.textMuted, margin: 0, letterSpacing: '2px' }}>
                        TOARUFLIX &copy; {currentYear}
                    </p>
                </div>

            </PrivacyContainer>
        </PageWrapper>
    );
};

export default Privacy;