// ARQUIVO: src/pages/Landing.jsx
// DESCRIÇÃO: Página inicial (landing page) antes do login, estilo Netflix/Toaru, com TEMA BLUEVIOLET.
// -------------------------------------------------------------------------------
import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';

// Import MOCK para simular os dados de fundo
const ANIME_JSON = {
    "Toaru Majutsu no Index": [
        { "FundoImagem": "https://wallpapercave.com/wp/wp6098235.jpg" },
        { "FundoImagem": "https://animoon-publishing.de/cdn/shop/files/07-18.jpg?v=1711547533&width=1500" },
        { "FundoImagem": "https://i.ytimg.com/vi/6dOsskwHifU/maxresdefault.jpg" },
        { "FundoImagem": "https://upload.wikimedia.org/wikipedia/it/4/43/A_Certain_Magical_Index_The_Movie_%EF%BC%8DThe_Miracle_of_Endymion.png" }
    ],
    "Toaru Kagaku no Railgun": {
        "Toaru Kagaku no Railgun": { "FundoImagem": "https://image.tmdb.org/t/p/original/l7DzITtnEkiyp5CfSNhYbeCXjZZ.jpg" },
        "Toaru Kagaku no Railgun S": { "FundoImagem": "https://wallpapercave.com/wp/wp7799065.jpg" },
        "Toaru Kagaku no Railgun T": { "FundoImagem": "https://image.tmdb.org/t/p/original/7x5e1g89giH5PjK0ACpsXcj2whz.jpg" },
        "Upcoming": { "FundoImagem": "https://images6.alphacoders.com/750/thumb-1920-750466.png" }
    },
    "Toaru Kagaku no Accelerator": {
        "Toaru Kagaku no Accelerator": { "FundoImagem": "https://image.tmdb.org/t/p/original/szik5Kiquh9PO3dJhzFJNCpbxcG.jpg" }
    },
    "Toaru Anbu no ITEM": {
        "Toaru Anbu no ITEM": { "FundoImagem": "https://i.ytimg.com/vi/wvZaljkzKQc/maxresdefault.jpg" }
    }
};

// --- Variáveis de Tema (Atualizadas) ---
const COLOR_PRIMARY = '#8a2be2'; // Blueviolet (Para botões e destaque)
const COLOR_DARK = '#000000';    // Preto Sólido (Fundo principal)
const COLOR_CTA_BUTTON = COLOR_PRIMARY; // Usando Blueviolet no CTA
const COLOR_TEXT_LIGHT = '#ffffff'; // Branco
const COLOR_INPUT_BG = 'rgba(45, 45, 45, 0.7)'; // Fundo do Input escuro semi-transparente

// --- ESTILOS DE FUNDO ---
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const PageWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: ${COLOR_DARK}; 
    font-family: 'Inter', sans-serif;
    color: ${COLOR_TEXT_LIGHT};
    overflow: hidden;
`;

const BackgroundGrid = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 10px;
    opacity: 0.2;
    filter: brightness(0.6);
    animation: ${fadeIn} 1.5s ease-in-out;

    @media (max-width: 768px) {
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(6, 1fr);
        gap: 5px;
    }
`;

const BackgroundCard = styled.div`
    background-image: url(${props => props.$bgUrl});
    background-size: cover;
    background-position: center;
    width: 100%;
    height: 100%;
`;

const DarkOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Gradiente forte para garantir que o texto principal apareça */
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.9) 100%);
    z-index: 1;
`;

// --- COMPONENTES DE CONTEÚDO ---

const ContentWrapper = styled.div`
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 40px;
    max-width: 950px;
`;

const MainTitle = styled.h1`
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900;
    margin-bottom: 20px;
    line-height: 1.1;
`;

const Subtitle = styled.h2`
    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
    font-weight: 400;
    margin-bottom: 30px;
`;

const CTAText = styled.p`
    font-size: 1.2rem;
    margin-bottom: 20px;
`;

const CTAForm = styled.form`
    display: flex;
    gap: 10px;
    width: 100%;
    max-width: 700px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
    }
`;

const EmailInput = styled.input`
    flex-grow: 1;
    padding: 15px 18px;
    font-size: 1rem;
    border: 1px solid #888;
    border-radius: 4px;
    background: ${COLOR_INPUT_BG};
    color: ${COLOR_TEXT_LIGHT};
    min-width: 250px;

    &::placeholder {
        color: #bbb;
    }
`;

const CTAButton = styled.button`
    background-color: ${COLOR_CTA_BUTTON}; /* BLUEVIOLET */
    color: ${COLOR_TEXT_LIGHT};
    border: none;
    border-radius: 4px;
    padding: 15px 30px;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 10px;
    
    &:hover {
        background-color: #7c25d3; /* BLUEVIOLET MAIS ESCURO NO HOVER */
    }

    @media (max-width: 768px) {
        width: 100%;
        font-size: 1.2rem;
    }
`;

// --- HEADER SIMPLES PARA A LANDING PAGE ---
const LandingHeader = styled.header`
    position: absolute;
    top: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    z-index: 20;
`;

const LandingLogo = styled.h1`
    font-size: 2.5rem;
    font-weight: 700;
    color: ${COLOR_TEXT_LIGHT};
    
    span {
        color: ${COLOR_PRIMARY}; 
        text-shadow: 0 0 10px rgba(138, 43, 226, 0.4);
    }
`;

const SignInButton = styled(Link)`
    background-color: ${COLOR_CTA_BUTTON}; /* BLUEVIOLET */
    color: ${COLOR_TEXT_LIGHT};
    text-decoration: none;
    padding: 8px 18px;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 4px;
    transition: background-color 0.2s;
    
    &:hover {
        background-color: #7c25d3;
    }
`;


// Hook para carregar e achatar as imagens
const useBackgroundImages = (animeJson) => {
    return useMemo(() => {
        const images = [];
        Object.values(animeJson).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(item => images.push(item.FundoImagem));
            } else {
                Object.values(category).forEach(item => {
                    if (item.FundoImagem) images.push(item.FundoImagem);
                });
            }
        });
        return images.filter(Boolean);
    }, [animeJson]);
};


const Landing = () => {
    const navigate = useNavigate();
    const backgroundImages = useBackgroundImages(ANIME_JSON);
    const [email, setEmail] = useState('');

    const handleCtaSubmit = (e) => {
        e.preventDefault();
        // Leva o email preenchido para a tela de login/cadastro
        navigate('/login', { state: { emailPreFilled: email } });
    };

    return (
        <PageWrapper>
            {/* 1. GRADE DE FUNDO DINÂMICA */}
            <BackgroundGrid>
                {Array(24).fill().map((_, index) => (
                    <BackgroundCard 
                        key={index}
                        $bgUrl={backgroundImages[index % backgroundImages.length]}
                    />
                ))}
            </BackgroundGrid>

            {/* 2. OVERLAY ESCURO */}
            <DarkOverlay />
            
            <LandingHeader>
                <LandingLogo>Toaru<span>Flix</span></LandingLogo>
                <SignInButton to="/login">Entrar</SignInButton>
            </LandingHeader>

            <ContentWrapper>
                <MainTitle>
                    O Poder da Imaginação. 
                </MainTitle>
                
                
                <CTAText>
                    Pronto para assistir? Informe seu e-mail para criar a sua conta.
                </CTAText>

                <CTAForm onSubmit={handleCtaSubmit}>
                    <EmailInput 
                        type="email"
                        placeholder="Informe seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <CTAButton type="submit">
                        Vamos lá 
                    </CTAButton>
                </CTAForm>
            </ContentWrapper>
        </PageWrapper>
    );
};

export default Landing;